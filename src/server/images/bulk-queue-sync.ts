/**
 * Sync bulk item counters when a child processing job reaches a terminal state.
 * Keeps Prompt 15 bulk orchestration without inline execute.
 */
import {and, eq} from "drizzle-orm";
import {getDb} from "@/db";
import {bulkJobItems} from "@/db/schema";

/** Soft import recount via dynamic pattern avoided — duplicate minimal recount call. */
import {recountBulkJobByProcessingJobId} from "@/server/images/bulk-service";

export async function onProcessingJobTerminalForBulk(params: {
  processingJobId: string;
  projectId: string;
  status: string;
  errorCode?: string | null;
}): Promise<void> {
  const db = getDb();
  const itemStatus =
    params.status === "completed"
      ? "completed"
      : params.status === "cancelled"
        ? "cancelled"
        : params.status === "stale"
          ? "stale"
          : "failed";

  const [item] = await db
    .update(bulkJobItems)
    .set({
      status: itemStatus,
      lastErrorCode: itemStatus === "completed" ? null : (params.errorCode ?? params.status),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(bulkJobItems.processingJobId, params.processingJobId),
        eq(bulkJobItems.projectId, params.projectId),
      ),
    )
    .returning({bulkJobId: bulkJobItems.bulkJobId});

  if (item?.bulkJobId) {
    await recountBulkJobByProcessingJobId(item.bulkJobId, params.projectId);
  }
}
