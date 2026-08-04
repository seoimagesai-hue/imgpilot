/**
 * Prompt 32 — collaborative review comment threads (plain text, soft delete).
 */
import {and, desc, eq, isNull, or} from "drizzle-orm";
import {getDb} from "@/db";
import {
  commentMentions,
  commentThreads,
  comments,
  users,
  type CommentSubjectType,
  type Project,
} from "@/db/schema";
import {recordActivityEventSafe} from "@/server/collaboration/activity";
import {CollaborationError} from "@/server/collaboration/errors";
import {
  clampCommentsPageLimit,
  extractMentionTokens,
  isCommentSubjectType,
  sanitizeCommentBody,
} from "@/server/collaboration/policy";
import {writeIntegrationAudit} from "@/server/api/audit";
import {resolveActiveMembership} from "@/server/organizations/access";
import {listOrganizationMembers} from "@/server/organizations/members";
import {hasOrgPermission, personalOwnerHasPermission} from "@/server/organizations/permissions";
import {getOwnedProject} from "@/server/projects/queries";
import {workspaceFromProject} from "@/server/workflows/workspace";
import {emitWebhookEvent} from "@/server/webhooks/events";

export type CommentItemDto = {
  id: string;
  authorUserId: string;
  authorName: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  isDeleted: boolean;
};

export type ThreadWithCommentsDto = {
  thread: {
    id: string;
    status: string;
    subjectType: CommentSubjectType;
    subjectId: string;
    resolvedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  comments: CommentItemDto[];
  permissions: {
    canCreate: boolean;
    canResolve: boolean;
  };
};

export type MentionItemDto = {
  id: string;
  commentId: string;
  projectId: string;
  threadId: string;
  subjectType: CommentSubjectType;
  subjectId: string;
  authorName: string | null;
  bodyPreview: string;
  createdAt: string;
};

async function projectPermissions(
  userId: string,
  project: Project,
): Promise<{canCreate: boolean; canResolve: boolean}> {
  if (project.workspaceType === "personal" || !project.organizationId) {
    if (project.userId !== userId) {
      return {canCreate: false, canResolve: false};
    }
    return {
      canCreate: personalOwnerHasPermission("comments.create"),
      canResolve: personalOwnerHasPermission("comments.resolve"),
    };
  }
  const membership = await resolveActiveMembership(userId, project.organizationId);
  if (!membership) return {canCreate: false, canResolve: false};
  return {
    canCreate: hasOrgPermission(membership.role, "comments.create"),
    canResolve: hasOrgPermission(membership.role, "comments.resolve"),
  };
}

async function resolveMentionableUsers(project: Project): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (project.workspaceType === "organization" && project.organizationId) {
    const members = await listOrganizationMembers(project.organizationId);
    for (const member of members) {
      map.set(member.email.toLowerCase(), member.userId);
    }
    return map;
  }
  const db = getDb();
  const [owner] = await db
    .select({id: users.id, email: users.email})
    .from(users)
    .where(eq(users.id, project.userId))
    .limit(1);
  if (owner) map.set(owner.email.toLowerCase(), owner.id);
  return map;
}

function assertSubjectType(subjectType: string): CommentSubjectType {
  if (!isCommentSubjectType(subjectType)) {
    throw new CollaborationError("SUBJECT_INVALID");
  }
  return subjectType;
}

function toCommentDto(
  row: typeof comments.$inferSelect,
  authorName: string | null,
): CommentItemDto {
  const isDeleted = row.deletedAt != null;
  return {
    id: row.id,
    authorUserId: row.authorUserId,
    authorName,
    body: isDeleted ? "" : row.body,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
    isDeleted,
  };
}

export async function getOrCreateThread(params: {
  userId: string;
  projectId: string;
  subjectType: string;
  subjectId: string;
}): Promise<{threadId: string}> {
  const subjectType = assertSubjectType(params.subjectType);
  const project = await getOwnedProject(params.userId, params.projectId, "comments.view");
  if (!project) throw new CollaborationError("PROJECT_NOT_FOUND");

  const db = getDb();
  const [existing] = await db
    .select({id: commentThreads.id})
    .from(commentThreads)
    .where(
      and(
        eq(commentThreads.projectId, project.id),
        eq(commentThreads.subjectType, subjectType),
        eq(commentThreads.subjectId, params.subjectId),
      ),
    )
    .limit(1);
  if (existing) return {threadId: existing.id};

  const ws = workspaceFromProject(project);
  const threadId = crypto.randomUUID();
  await db.insert(commentThreads).values({
    id: threadId,
    workspaceType: ws.workspaceType,
    workspaceId: ws.workspaceId,
    projectId: project.id,
    subjectType,
    subjectId: params.subjectId,
    status: "open",
    createdByUserId: params.userId,
  });
  return {threadId};
}

export async function listThreadWithComments(params: {
  userId: string;
  projectId: string;
  subjectType: string;
  subjectId: string;
}): Promise<ThreadWithCommentsDto> {
  const subjectType = assertSubjectType(params.subjectType);
  const project = await getOwnedProject(params.userId, params.projectId, "comments.view");
  if (!project) throw new CollaborationError("PROJECT_NOT_FOUND");

  const perms = await projectPermissions(params.userId, project);
  const {threadId} = await getOrCreateThread({
    userId: params.userId,
    projectId: project.id,
    subjectType,
    subjectId: params.subjectId,
  });

  const db = getDb();
  const [thread] = await db
    .select()
    .from(commentThreads)
    .where(eq(commentThreads.id, threadId))
    .limit(1);
  if (!thread) throw new CollaborationError("THREAD_NOT_FOUND");

  const rows = await db
    .select()
    .from(comments)
    .where(eq(comments.threadId, thread.id))
    .orderBy(comments.createdAt)
    .limit(clampCommentsPageLimit());

  const authorIds = [...new Set(rows.map((r) => r.authorUserId))];
  const nameById = new Map<string, string>();
  if (authorIds.length) {
    const authors = await db
      .select({id: users.id, name: users.name})
      .from(users)
      .where(or(...authorIds.map((id) => eq(users.id, id))));
    for (const a of authors) nameById.set(a.id, a.name ?? "User");
  }

  return {
    thread: {
      id: thread.id,
      status: thread.status,
      subjectType: thread.subjectType,
      subjectId: thread.subjectId,
      resolvedAt: thread.resolvedAt?.toISOString() ?? null,
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
    },
    comments: rows.map((row) => toCommentDto(row, nameById.get(row.authorUserId) ?? null)),
    permissions: perms,
  };
}

export async function addComment(params: {
  userId: string;
  projectId: string;
  subjectType: string;
  subjectId: string;
  body: string;
}): Promise<{comment: CommentItemDto; threadId: string}> {
  const subjectType = assertSubjectType(params.subjectType);
  const project = await getOwnedProject(params.userId, params.projectId, "comments.create");
  if (!project) throw new CollaborationError("COLLABORATION_PERMISSION_DENIED");

  const body = sanitizeCommentBody(params.body);
  if (!body) throw new CollaborationError("COMMENT_BODY_INVALID");

  const {threadId} = await getOrCreateThread({
    userId: params.userId,
    projectId: project.id,
    subjectType,
    subjectId: params.subjectId,
  });

  const db = getDb();
  const [thread] = await db
    .select()
    .from(commentThreads)
    .where(and(eq(commentThreads.id, threadId), eq(commentThreads.projectId, project.id)))
    .limit(1);
  if (!thread) throw new CollaborationError("THREAD_NOT_FOUND");
  if (thread.status === "resolved") {
    throw new CollaborationError("THREAD_ALREADY_RESOLVED");
  }

  const commentId = crypto.randomUUID();
  const now = new Date();
  await db.insert(comments).values({
    id: commentId,
    threadId: thread.id,
    projectId: project.id,
    authorUserId: params.userId,
    body,
    createdAt: now,
    updatedAt: now,
  });

  const mentionable = await resolveMentionableUsers(project);
  const tokens = extractMentionTokens(body);
  const mentionedUserIds = new Set<string>();
  for (const token of tokens) {
    const userId = mentionable.get(token);
    if (userId && userId !== params.userId) mentionedUserIds.add(userId);
  }
  if (mentionedUserIds.size) {
    await db.insert(commentMentions).values(
      [...mentionedUserIds].map((mentionedUserId) => ({
        id: crypto.randomUUID(),
        commentId,
        mentionedUserId,
      })),
    );
  }

  await db
    .update(commentThreads)
    .set({updatedAt: now})
    .where(eq(commentThreads.id, thread.id));

  const ws = workspaceFromProject(project);
  const summary = body.length > 120 ? `${body.slice(0, 117)}…` : body;
  recordActivityEventSafe({
    workspaceType: ws.workspaceType,
    workspaceId: ws.workspaceId,
    organizationId: project.organizationId,
    projectId: project.id,
    actorUserId: params.userId,
    verb: "comment.created",
    entityType: "comment",
    entityId: commentId,
    summarySafe: summary,
    metadataSafe: {
      threadId: thread.id,
      subjectType,
      subjectId: params.subjectId,
      mentionCount: mentionedUserIds.size,
    },
    idempotencyKey: `comment.created:${commentId}`,
  });

  void writeIntegrationAudit({
    workspaceType: ws.workspaceType,
    workspaceId: ws.workspaceId,
    actorUserId: params.userId,
    action: "comment.created",
    targetEntityType: "comment",
    targetEntityId: commentId,
    afterSummary: summary,
  }).catch(() => undefined);

  void emitWebhookEvent({
    workspaceType: ws.workspaceType,
    workspaceId: ws.workspaceId,
    eventType: "comment.created",
    entityType: "comment",
    entityId: commentId,
    deduplicationKey: `comment.created:${commentId}`,
    payload: {
      projectId: project.id,
      threadId: thread.id,
      subjectType,
      subjectId: params.subjectId,
      authorUserId: params.userId,
      bodyPreview: summary,
      mentionCount: mentionedUserIds.size,
    },
  }).catch(() => undefined);

  const [author] = await db
    .select({name: users.name})
    .from(users)
    .where(eq(users.id, params.userId))
    .limit(1);

  return {
    threadId: thread.id,
    comment: {
      id: commentId,
      authorUserId: params.userId,
      authorName: author?.name ?? null,
      body,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      deletedAt: null,
      isDeleted: false,
    },
  };
}

export async function softDeleteComment(params: {
  userId: string;
  projectId: string;
  commentId: string;
}): Promise<void> {
  const project = await getOwnedProject(params.userId, params.projectId, "comments.view");
  if (!project) throw new CollaborationError("PROJECT_NOT_FOUND");

  const db = getDb();
  const [row] = await db
    .select()
    .from(comments)
    .where(and(eq(comments.id, params.commentId), eq(comments.projectId, project.id)))
    .limit(1);
  if (!row) throw new CollaborationError("COMMENT_NOT_FOUND");
  if (row.deletedAt) return;

  const perms = await projectPermissions(params.userId, project);
  if (row.authorUserId !== params.userId && !perms.canResolve) {
    throw new CollaborationError("COLLABORATION_PERMISSION_DENIED");
  }

  await db
    .update(comments)
    .set({deletedAt: new Date(), updatedAt: new Date()})
    .where(eq(comments.id, row.id));
}

export async function resolveThread(params: {
  userId: string;
  projectId: string;
  subjectType: string;
  subjectId: string;
}): Promise<void> {
  const subjectType = assertSubjectType(params.subjectType);
  const project = await getOwnedProject(params.userId, params.projectId, "comments.resolve");
  if (!project) throw new CollaborationError("COLLABORATION_PERMISSION_DENIED");

  const db = getDb();
  const [thread] = await db
    .select()
    .from(commentThreads)
    .where(
      and(
        eq(commentThreads.projectId, project.id),
        eq(commentThreads.subjectType, subjectType),
        eq(commentThreads.subjectId, params.subjectId),
      ),
    )
    .limit(1);
  if (!thread) throw new CollaborationError("THREAD_NOT_FOUND");
  if (thread.status === "resolved") throw new CollaborationError("THREAD_ALREADY_RESOLVED");

  const now = new Date();
  await db
    .update(commentThreads)
    .set({
      status: "resolved",
      resolvedByUserId: params.userId,
      resolvedAt: now,
      updatedAt: now,
    })
    .where(eq(commentThreads.id, thread.id));

  const ws = workspaceFromProject(project);
  recordActivityEventSafe({
    workspaceType: ws.workspaceType,
    workspaceId: ws.workspaceId,
    organizationId: project.organizationId,
    projectId: project.id,
    actorUserId: params.userId,
    verb: "thread.resolved",
    entityType: "comment_thread",
    entityId: thread.id,
    summarySafe: `Thread resolved on ${subjectType}`,
    metadataSafe: {subjectType, subjectId: params.subjectId},
    idempotencyKey: `thread.resolved:${thread.id}`,
  });

  void writeIntegrationAudit({
    workspaceType: ws.workspaceType,
    workspaceId: ws.workspaceId,
    actorUserId: params.userId,
    action: "thread.resolved",
    targetEntityType: "comment_thread",
    targetEntityId: thread.id,
    afterSummary: `${subjectType}:${params.subjectId}`,
  }).catch(() => undefined);

  void emitWebhookEvent({
    workspaceType: ws.workspaceType,
    workspaceId: ws.workspaceId,
    eventType: "comment.thread_resolved",
    entityType: "comment_thread",
    entityId: thread.id,
    deduplicationKey: `comment.thread_resolved:${thread.id}`,
    payload: {
      projectId: project.id,
      subjectType,
      subjectId: params.subjectId,
      resolvedByUserId: params.userId,
    },
  }).catch(() => undefined);
}

export async function reopenThread(params: {
  userId: string;
  projectId: string;
  subjectType: string;
  subjectId: string;
}): Promise<void> {
  const subjectType = assertSubjectType(params.subjectType);
  const project = await getOwnedProject(params.userId, params.projectId, "comments.resolve");
  if (!project) throw new CollaborationError("COLLABORATION_PERMISSION_DENIED");

  const db = getDb();
  const [thread] = await db
    .select()
    .from(commentThreads)
    .where(
      and(
        eq(commentThreads.projectId, project.id),
        eq(commentThreads.subjectType, subjectType),
        eq(commentThreads.subjectId, params.subjectId),
      ),
    )
    .limit(1);
  if (!thread) throw new CollaborationError("THREAD_NOT_FOUND");
  if (thread.status !== "resolved") throw new CollaborationError("THREAD_NOT_RESOLVED");

  const now = new Date();
  await db
    .update(commentThreads)
    .set({
      status: "open",
      resolvedByUserId: null,
      resolvedAt: null,
      updatedAt: now,
    })
    .where(eq(commentThreads.id, thread.id));
}

export async function listMyMentions(params: {
  userId: string;
  limit?: number;
}): Promise<MentionItemDto[]> {
  const limit = clampCommentsPageLimit(params.limit);
  const db = getDb();

  const rows = await db
    .select({
      mentionId: commentMentions.id,
      commentId: comments.id,
      projectId: comments.projectId,
      threadId: comments.threadId,
      body: comments.body,
      deletedAt: comments.deletedAt,
      createdAt: commentMentions.createdAt,
      subjectType: commentThreads.subjectType,
      subjectId: commentThreads.subjectId,
      authorName: users.name,
    })
    .from(commentMentions)
    .innerJoin(comments, eq(comments.id, commentMentions.commentId))
    .innerJoin(commentThreads, eq(commentThreads.id, comments.threadId))
    .innerJoin(users, eq(users.id, comments.authorUserId))
    .where(
      and(
        eq(commentMentions.mentionedUserId, params.userId),
        isNull(comments.deletedAt),
      ),
    )
    .orderBy(desc(commentMentions.createdAt))
    .limit(limit);

  const out: MentionItemDto[] = [];
  for (const row of rows) {
    const project = await getOwnedProject(params.userId, row.projectId, "comments.view");
    if (!project) continue;
    const preview = row.body.length > 160 ? `${row.body.slice(0, 157)}…` : row.body;
    out.push({
      id: row.mentionId,
      commentId: row.commentId,
      projectId: row.projectId,
      threadId: row.threadId,
      subjectType: row.subjectType,
      subjectId: row.subjectId,
      authorName: row.authorName,
      bodyPreview: preview,
      createdAt: row.createdAt.toISOString(),
    });
  }
  return out;
}
