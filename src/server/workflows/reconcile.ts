/**
 * Prompt 30 — bounded dry-run reconciliation for workflow runs and definitions.
 */
import {and, count, eq, inArray, lt, sql} from "drizzle-orm";
import {getDb} from "@/db";
import {workflowRunSteps, workflowRuns, workflowSteps, workflows} from "@/db/schema";
import {resolveWorkspaceEntitlementUserId} from "@/server/api/permissions";
import {resolveEntitlement} from "@/server/billing/entitlements";
import {recoverExpiredWorkflowLeases} from "@/server/workflows/engine";

export type WorkflowReconcileFinding = {
  code: string;
  workflowId?: string;
  runId?: string;
  detail: string;
};

export type WorkflowReconcileResult = {
  dryRun: boolean;
  findings: WorkflowReconcileFinding[];
  repaired: number;
};

const BATCH = 100;
const STALE_WAITING_MS = 24 * 60 * 60 * 1000;

export async function reconcileWorkflows(options?: {
  dryRun?: boolean;
  limit?: number;
}): Promise<WorkflowReconcileResult> {
  const dryRun = options?.dryRun !== false;
  const limit = Math.min(options?.limit ?? BATCH, 500);
  const db = getDb();
  const findings: WorkflowReconcileFinding[] = [];
  let repaired = 0;

  if (!dryRun) {
    repaired += await recoverExpiredWorkflowLeases({limit});
  } else {
    const now = new Date();
    const expired = await db
      .select({id: workflowRuns.id})
      .from(workflowRuns)
      .where(and(eq(workflowRuns.status, "leased"), lt(workflowRuns.leaseExpiresAt, now)))
      .limit(limit);
    for (const row of expired) {
      findings.push({code: "RUN_LEASE_EXPIRED", runId: row.id, detail: "worker lease expired"});
    }
  }

  const staleWaitingCutoff = new Date(Date.now() - STALE_WAITING_MS);
  const staleWaiting = await db
    .select({id: workflowRuns.id})
    .from(workflowRuns)
    .where(and(eq(workflowRuns.status, "waiting"), lt(workflowRuns.updatedAt, staleWaitingCutoff)))
    .limit(limit);
  for (const row of staleWaiting) {
    findings.push({code: "RUN_STALE_WAITING", runId: row.id, detail: "waiting for over 24 hours"});
  }

  const enabledWithoutSteps = await db
    .select({id: workflows.id, name: workflows.name})
    .from(workflows)
    .leftJoin(workflowSteps, eq(workflowSteps.workflowId, workflows.id))
    .where(eq(workflows.status, "enabled"))
    .groupBy(workflows.id, workflows.name)
    .having(sql`count(${workflowSteps.id}) = 0`)
    .limit(limit);
  for (const row of enabledWithoutSteps) {
    findings.push({
      code: "ENABLED_WITHOUT_STEPS",
      workflowId: row.id,
      detail: `workflow=${row.name}`,
    });
  }

  const workspaceCounts = await db
    .select({
      workspaceType: workflows.workspaceType,
      workspaceId: workflows.workspaceId,
      total: count(),
    })
    .from(workflows)
    .groupBy(workflows.workspaceType, workflows.workspaceId)
    .limit(limit);

  for (const row of workspaceCounts) {
    const entitlementUserId = await resolveWorkspaceEntitlementUserId(row.workspaceType, row.workspaceId);
    if (!entitlementUserId) continue;
    const entitlement = await resolveEntitlement(entitlementUserId);
    const total = Number(row.total ?? 0);
    if (total > entitlement.plan.maxWorkflows) {
      findings.push({
        code: "WORKSPACE_OVER_WORKFLOW_LIMIT",
        detail: `${row.workspaceType}:${row.workspaceId} count=${total} limit=${entitlement.plan.maxWorkflows}`,
      });
    }
  }

  const activeRuns = await db
    .select({
      workspaceType: workflowRuns.workspaceType,
      workspaceId: workflowRuns.workspaceId,
      total: count(),
    })
    .from(workflowRuns)
    .where(inArray(workflowRuns.status, ["queued", "leased", "running", "waiting"]))
    .groupBy(workflowRuns.workspaceType, workflowRuns.workspaceId)
    .limit(limit);

  for (const row of activeRuns) {
    const total = Number(row.total ?? 0);
    if (total > 50) {
      findings.push({
        code: "HIGH_ACTIVE_RUN_COUNT",
        detail: `${row.workspaceType}:${row.workspaceId} active=${total}`,
      });
    }
  }

  const orphanedWaitingSteps = await db
    .select({id: workflowRunSteps.id, runId: workflowRunSteps.runId})
    .from(workflowRunSteps)
    .innerJoin(workflowRuns, eq(workflowRuns.id, workflowRunSteps.runId))
    .where(
      and(
        eq(workflowRunSteps.status, "waiting"),
        inArray(workflowRuns.status, ["completed", "failed", "cancelled", "timed_out"]),
      ),
    )
    .limit(limit);
  for (const row of orphanedWaitingSteps) {
    findings.push({
      code: "ORPHANED_WAITING_STEP",
      runId: row.runId,
      detail: `step=${row.id}`,
    });
  }

  return {dryRun, findings, repaired};
}
