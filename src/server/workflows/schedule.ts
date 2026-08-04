/**
 * Prompt 30 — scheduled workflow claim + enqueue.
 */
import {and, eq, lte, sql} from "drizzle-orm";
import {getDb, getPostgresClient} from "@/db";
import {workflows, type Workflow} from "@/db/schema";
import {startRunsForTrigger} from "@/server/workflows/engine";
import {isScheduleInterval, nextScheduleDate} from "@/server/workflows/policy";

const SCHEDULE_CLAIM_BATCH = 10;

function mapWorkflowRow(row: Record<string, unknown>): Workflow {
  return {
    id: String(row.id),
    workspaceType: row.workspace_type as Workflow["workspaceType"],
    workspaceId: String(row.workspace_id),
    createdByUserId: String(row.created_by_user_id),
    name: String(row.name),
    description: (row.description as string | null) ?? null,
    status: row.status as Workflow["status"],
    triggerType: row.trigger_type as Workflow["triggerType"],
    triggerConfig: (row.trigger_config as Record<string, unknown> | null) ?? null,
    projectId: (row.project_id as string | null) ?? null,
    definitionVersion: Number(row.definition_version ?? 1),
    maxRetries: Number(row.max_retries ?? 3),
    stepTimeoutSeconds: Number(row.step_timeout_seconds ?? 3600),
    scheduleInterval: (row.schedule_interval as string | null) ?? null,
    nextScheduledAt: row.next_scheduled_at ? new Date(String(row.next_scheduled_at)) : null,
    enabledAt: row.enabled_at ? new Date(String(row.enabled_at)) : null,
    disabledAt: row.disabled_at ? new Date(String(row.disabled_at)) : null,
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  };
}

/** Claim enabled scheduled workflows whose next run is due. */
export async function claimDueScheduledWorkflows(params?: {
  limit?: number;
  now?: Date;
}): Promise<Workflow[]> {
  const limit = Math.min(params?.limit ?? SCHEDULE_CLAIM_BATCH, SCHEDULE_CLAIM_BATCH);
  const now = (params?.now ?? new Date()).toISOString();
  const sqlClient = getPostgresClient();

  const rows = await sqlClient<Record<string, unknown>[]>`
    UPDATE workflows AS w
    SET updated_at = now()
    WHERE w.id IN (
      SELECT id
      FROM workflows
      WHERE status = 'enabled'
        AND trigger_type = 'scheduled'
        AND next_scheduled_at IS NOT NULL
        AND next_scheduled_at <= ${now}::timestamp
      ORDER BY next_scheduled_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT ${limit}
    )
    RETURNING *
  `;

  return rows.map(mapWorkflowRow);
}

/** Enqueue scheduled runs and advance nextScheduledAt for each claimed workflow. */
export async function enqueueScheduledRuns(params?: {limit?: number}): Promise<number> {
  const claimed = await claimDueScheduledWorkflows(params);
  const db = getDb();
  let enqueued = 0;

  for (const wf of claimed) {
    const interval = wf.scheduleInterval;
    if (!interval || !isScheduleInterval(interval)) {
      await db
        .update(workflows)
        .set({nextScheduledAt: null, updatedAt: new Date()})
        .where(eq(workflows.id, wf.id));
      continue;
    }

    await startRunsForTrigger({
      triggerType: "scheduled",
      workspaceType: wf.workspaceType,
      workspaceId: wf.workspaceId,
      projectId: wf.projectId,
      imageId: null,
      context: {workspaceType: wf.workspaceType, workspaceId: wf.workspaceId, projectId: wf.projectId},
      actorUserId: wf.createdByUserId,
      dedupeKey: `scheduled:${wf.id}:${wf.nextScheduledAt?.toISOString() ?? "now"}`,
    });

    const nextAt = nextScheduleDate(interval, new Date());
    await db
      .update(workflows)
      .set({nextScheduledAt: nextAt, updatedAt: new Date()})
      .where(eq(workflows.id, wf.id));
    enqueued += 1;
  }

  return enqueued;
}

/** Read-only preview of due workflows (no claim). */
export async function listDueScheduledWorkflows(now = new Date()): Promise<Workflow[]> {
  const db = getDb();
  return db
    .select()
    .from(workflows)
    .where(
      and(
        eq(workflows.status, "enabled"),
        eq(workflows.triggerType, "scheduled"),
        lte(workflows.nextScheduledAt, now),
        sql`${workflows.nextScheduledAt} IS NOT NULL`,
      ),
    )
    .limit(SCHEDULE_CLAIM_BATCH);
}
