/**
 * Prompt 32 — team activity feed (append-only, safe summaries).
 */
import {and, desc, eq, lt, or} from "drizzle-orm";
import {getDb} from "@/db";
import {
  activityEvents,
  projects,
  users,
  type ActivityEvent,
  type ApiWorkspaceType,
} from "@/db/schema";
import {CollaborationError} from "@/server/collaboration/errors";
import {clampActivityPageLimit} from "@/server/collaboration/policy";
import {getOwnedProject} from "@/server/projects/queries";

const FORBIDDEN_META_KEYS = new Set([
  "storageKey",
  "storage_key",
  "outputStorageKey",
  "sourceStorageKey",
  "signedUrl",
  "url",
  "leaseOwner",
  "leaseToken",
  "workerId",
  "apiKey",
  "password",
  "secret",
  "etag",
  "checksum",
]);

export type SafeActivityMetadata = Record<string, string | number | boolean | null>;

function sanitizeMetadataSafe(input: SafeActivityMetadata | undefined): Record<string, unknown> | null {
  if (!input) return null;
  const out: SafeActivityMetadata = {};
  for (const [key, value] of Object.entries(input)) {
    if (FORBIDDEN_META_KEYS.has(key)) continue;
    if (typeof value === "string") {
      if (/users\//i.test(value) || /^https?:\/\//i.test(value) || /sk-/i.test(value)) continue;
      out[key] = value.replace(/[<>]/g, "").slice(0, 200);
    } else if (typeof value === "number" || typeof value === "boolean" || value === null) {
      out[key] = value;
    }
  }
  return Object.keys(out).length ? out : null;
}

export type ActivityFeedItem = {
  id: string;
  projectId: string | null;
  actorUserId: string | null;
  actorName: string | null;
  verb: string;
  entityType: string;
  entityId: string;
  summarySafe: string;
  metadataSafe: Record<string, unknown> | null;
  occurredAt: string;
};

function toFeedItem(
  row: ActivityEvent,
  actorName: string | null,
): ActivityFeedItem {
  return {
    id: row.id,
    projectId: row.projectId,
    actorUserId: row.actorUserId,
    actorName,
    verb: row.verb,
    entityType: row.entityType,
    entityId: row.entityId,
    summarySafe: row.summarySafe,
    metadataSafe: (row.metadataSafe as Record<string, unknown> | null) ?? null,
    occurredAt: row.occurredAt.toISOString(),
  };
}

export async function recordActivityEvent(params: {
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  organizationId?: string | null;
  projectId?: string | null;
  actorUserId?: string | null;
  verb: string;
  entityType: string;
  entityId: string;
  summarySafe: string;
  metadataSafe?: SafeActivityMetadata;
  idempotencyKey?: string | null;
  occurredAt?: Date;
}): Promise<{ok: true; id: string; duplicate: boolean} | {ok: false}> {
  const db = getDb();
  const summary = params.summarySafe.replace(/[<>]/g, "").slice(0, 500);
  if (!summary) return {ok: false};

  try {
    const [row] = await db
      .insert(activityEvents)
      .values({
        workspaceType: params.workspaceType,
        workspaceId: params.workspaceId,
        organizationId: params.organizationId ?? null,
        projectId: params.projectId ?? null,
        actorUserId: params.actorUserId ?? null,
        verb: params.verb.slice(0, 80),
        entityType: params.entityType.slice(0, 80),
        entityId: params.entityId,
        summarySafe: summary,
        metadataSafe: sanitizeMetadataSafe(params.metadataSafe),
        idempotencyKey: params.idempotencyKey ?? null,
        occurredAt: params.occurredAt ?? new Date(),
      })
      .onConflictDoNothing()
      .returning({id: activityEvents.id});

    if (!row) return {ok: true, id: params.idempotencyKey ?? "", duplicate: true};
    return {ok: true, id: row.id, duplicate: false};
  } catch {
    return {ok: false};
  }
}

/** Fire-and-forget — never throws into caller lifecycle. */
export function recordActivityEventSafe(
  params: Parameters<typeof recordActivityEvent>[0],
): void {
  void recordActivityEvent(params).catch(() => undefined);
}

async function enrichWithActorNames(
  rows: ActivityEvent[],
): Promise<ActivityFeedItem[]> {
  if (rows.length === 0) return [];
  const actorIds = [...new Set(rows.map((r) => r.actorUserId).filter(Boolean))] as string[];
  const nameById = new Map<string, string>();
  if (actorIds.length) {
    const db = getDb();
    const actors = await db
      .select({id: users.id, name: users.name})
      .from(users)
      .where(or(...actorIds.map((id) => eq(users.id, id))));
    for (const a of actors) {
      nameById.set(a.id, a.name ?? "User");
    }
  }
  return rows.map((row) => toFeedItem(row, row.actorUserId ? nameById.get(row.actorUserId) ?? null : null));
}

export async function listProjectActivity(params: {
  userId: string;
  projectId: string;
  limit?: number;
  cursor?: string;
}): Promise<{items: ActivityFeedItem[]; hasMore: boolean}> {
  const project = await getOwnedProject(params.userId, params.projectId, "activity.view");
  if (!project) {
    throw new CollaborationError("PROJECT_NOT_FOUND");
  }

  const limit = clampActivityPageLimit(params.limit);
  const db = getDb();
  const conditions = [eq(activityEvents.projectId, project.id)];
  if (params.cursor) {
    const [cursorRow] = await db
      .select({occurredAt: activityEvents.occurredAt})
      .from(activityEvents)
      .where(and(eq(activityEvents.id, params.cursor), eq(activityEvents.projectId, project.id)))
      .limit(1);
    if (cursorRow) {
      conditions.push(lt(activityEvents.occurredAt, cursorRow.occurredAt));
    }
  }

  const rows = await db
    .select()
    .from(activityEvents)
    .where(and(...conditions))
    .orderBy(desc(activityEvents.occurredAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const slice = hasMore ? rows.slice(0, limit) : rows;
  const items = await enrichWithActorNames(slice);
  return {items, hasMore};
}

export async function listWorkspaceActivity(params: {
  userId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  organizationId?: string;
  limit?: number;
  cursor?: string;
}): Promise<{items: ActivityFeedItem[]; hasMore: boolean}> {
  if (params.workspaceType === "organization" && params.organizationId) {
    const {requireOrgPermission} = await import("@/server/organizations/access");
    await requireOrgPermission(params.userId, params.organizationId, "activity.view");
  } else if (params.workspaceType === "personal" && params.workspaceId !== params.userId) {
    throw new CollaborationError("COLLABORATION_PERMISSION_DENIED");
  }

  const limit = clampActivityPageLimit(params.limit);
  const db = getDb();
  const conditions = [
    eq(activityEvents.workspaceType, params.workspaceType),
    eq(activityEvents.workspaceId, params.workspaceId),
  ];
  if (params.cursor) {
    const [cursorRow] = await db
      .select({occurredAt: activityEvents.occurredAt})
      .from(activityEvents)
      .where(
        and(
          eq(activityEvents.id, params.cursor),
          eq(activityEvents.workspaceType, params.workspaceType),
          eq(activityEvents.workspaceId, params.workspaceId),
        ),
      )
      .limit(1);
    if (cursorRow) {
      conditions.push(lt(activityEvents.occurredAt, cursorRow.occurredAt));
    }
  }

  const rows = await db
    .select()
    .from(activityEvents)
    .where(and(...conditions))
    .orderBy(desc(activityEvents.occurredAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const slice = hasMore ? rows.slice(0, limit) : rows;
  const items = await enrichWithActorNames(slice);

  const projectIds = [...new Set(slice.map((r) => r.projectId).filter(Boolean))] as string[];
  if (projectIds.length) {
    const owned = await db
      .select({id: projects.id})
      .from(projects)
      .where(or(...projectIds.map((id) => eq(projects.id, id))));
    const allowed = new Set(owned.map((p) => p.id));
    return {
      items: items.filter((item) => !item.projectId || allowed.has(item.projectId)),
      hasMore,
    };
  }

  return {items, hasMore};
}

export {sanitizeMetadataSafe as sanitizeActivityMetadataForTest};
