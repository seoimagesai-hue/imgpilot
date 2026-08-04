/**
 * Prompt 31 — dry-run reconciliation for AI metadata batches.
 */
import {and, eq, inArray, lt} from "drizzle-orm";
import {getDb} from "@/db";
import {aiMetadataBatchItems, aiMetadataBatches, metadataGenerations} from "@/db/schema";
import {recountAiMetadataBatch} from "@/server/images/ai-metadata-batch-service";

export type AiMetadataBatchReconcileFinding = {
  code: string;
  batchId?: string;
  itemId?: string;
  generationId?: string;
  detail: string;
};

export type AiMetadataBatchReconcileResult = {
  dryRun: boolean;
  findings: AiMetadataBatchReconcileFinding[];
  repaired: number;
};

const BATCH = 100;
const STALE_QUEUED_MS = 24 * 60 * 60 * 1000;

const TERMINAL_BATCH = ["completed", "partially_completed", "failed", "cancelled"] as const;
const ACTIVE_BATCH = ["preparing", "queued", "running", "cancelling"] as const;

export async function reconcileAiMetadataBatches(options?: {
  dryRun?: boolean;
  limit?: number;
}): Promise<AiMetadataBatchReconcileResult> {
  const dryRun = options?.dryRun !== false;
  const limit = Math.min(options?.limit ?? BATCH, 500);
  const db = getDb();
  const findings: AiMetadataBatchReconcileFinding[] = [];
  let repaired = 0;

  const staleCutoff = new Date(Date.now() - STALE_QUEUED_MS);
  const staleBatches = await db
    .select({id: aiMetadataBatches.id, projectId: aiMetadataBatches.projectId})
    .from(aiMetadataBatches)
    .where(
      and(
        inArray(aiMetadataBatches.status, [...ACTIVE_BATCH]),
        lt(aiMetadataBatches.updatedAt, staleCutoff),
      ),
    )
    .limit(limit);

  for (const row of staleBatches) {
    findings.push({
      code: "AI_BATCH_STALE_ACTIVE",
      batchId: row.id,
      detail: "batch active with no updates for over 24 hours",
    });
    if (!dryRun) {
      await recountAiMetadataBatch(row.id, row.projectId);
      repaired += 1;
    }
  }

  const orphanItems = await db
    .select({
      itemId: aiMetadataBatchItems.id,
      batchId: aiMetadataBatchItems.batchId,
      generationId: aiMetadataBatchItems.generationId,
      itemStatus: aiMetadataBatchItems.status,
      genStatus: metadataGenerations.status,
    })
    .from(aiMetadataBatchItems)
    .innerJoin(metadataGenerations, eq(aiMetadataBatchItems.generationId, metadataGenerations.id))
    .innerJoin(aiMetadataBatches, eq(aiMetadataBatchItems.batchId, aiMetadataBatches.id))
    .where(inArray(aiMetadataBatches.status, [...ACTIVE_BATCH]))
    .limit(limit);

  for (const row of orphanItems) {
    const mapped =
      row.genStatus === "generating" || row.genStatus === "validating_output"
        ? "running"
        : row.genStatus;
    if (mapped !== row.itemStatus) {
      findings.push({
        code: "AI_BATCH_ITEM_STATUS_DRIFT",
        batchId: row.batchId,
        itemId: row.itemId,
        generationId: row.generationId ?? undefined,
        detail: `item=${row.itemStatus} generation=${row.genStatus}`,
      });
      if (!dryRun && row.generationId) {
        const {syncAiMetadataBatchItemFromGeneration} = await import(
          "@/server/images/ai-metadata-batch-service"
        );
        await syncAiMetadataBatchItemFromGeneration(row.generationId);
        repaired += 1;
      }
    }
  }

  const counterDrift = await db
    .select({id: aiMetadataBatches.id, projectId: aiMetadataBatches.projectId, status: aiMetadataBatches.status})
    .from(aiMetadataBatches)
    .where(inArray(aiMetadataBatches.status, [...ACTIVE_BATCH, ...TERMINAL_BATCH]))
    .limit(limit);

  for (const batch of counterDrift) {
    findings.push({
      code: "AI_BATCH_RECOUNT_CANDIDATE",
      batchId: batch.id,
      detail: `status=${batch.status}`,
    });
    if (!dryRun) {
      await recountAiMetadataBatch(batch.id, batch.projectId);
      repaired += 1;
    }
  }

  return {dryRun, findings, repaired};
}
