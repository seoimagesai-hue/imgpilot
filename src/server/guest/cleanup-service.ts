import {and, eq, lte, or, sql} from "drizzle-orm";
import {getDb} from "@/db";
import {
  guestCleanupQueue,
  guestJobs,
  guestSessions,
  guestUploads,
} from "@/db/schema";
import {isR2Configured} from "@/lib/env";
import {
  GUEST_CLEANUP_BATCH_SIZE,
  GUEST_CLEANUP_MAX_ATTEMPTS,
  nextGuestCleanupRetryAt,
} from "@/server/guest/cleanup-policy";
import {scrubExpiredGuestSession} from "@/server/guest/session-service";
import {enqueueGuestBulkCleanup} from "@/server/guest/bulk-service";
import {isValidGuestStorageKeyShape} from "@/server/storage/keys";
import {getObjectStorageProvider} from "@/server/storage/provider";

export async function enqueueGuestCleanup(params: {
  storageKey: string;
  sessionId?: string | null;
}): Promise<void> {
  if (!isValidGuestStorageKeyShape(params.storageKey)) return;
  const db = getDb();
  await db
    .insert(guestCleanupQueue)
    .values({
      storageKey: params.storageKey,
      sessionId: params.sessionId ?? null,
      status: "pending",
      attempts: 0,
      nextRetryAt: new Date(),
    })
    .onConflictDoNothing();
}

/**
 * Exact-key guest delete with post-delete HeadObject confirmation.
 * Returns `absent` only when the object is confirmed gone (never trusts DeleteObject alone).
 * Exported for focused tests — do not skip the post-delete existence check.
 */
export async function deleteExactKey(storageKey: string): Promise<"deleted" | "absent" | "error"> {
  if (!isR2Configured()) return "error";
  if (!isValidGuestStorageKeyShape(storageKey)) return "error";
  const provider = await getObjectStorageProvider();
  try {
    const existsBefore = await provider.objectExists(storageKey);
    if (existsBefore) {
      await provider.deleteObject(storageKey);
    }
    const existsAfter = await provider.objectExists(storageKey);
    // Confirmed absence required; `deleted` reserved if callers distinguish pre-existing keys.
    return existsAfter ? "error" : "absent";
  } catch {
    return "error";
  }
}

export async function processGuestCleanupBatch(limit = GUEST_CLEANUP_BATCH_SIZE): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const db = getDb();
  const now = new Date();
  const items = await db
    .select()
    .from(guestCleanupQueue)
    .where(
      and(
        or(
          eq(guestCleanupQueue.status, "pending"),
          eq(guestCleanupQueue.status, "failed"),
        ),
        lte(guestCleanupQueue.nextRetryAt, now),
        sql`${guestCleanupQueue.attempts} < ${GUEST_CLEANUP_MAX_ATTEMPTS}`,
      ),
    )
    .limit(limit);

  let succeeded = 0;
  let failed = 0;

  for (const item of items) {
    await db
      .update(guestCleanupQueue)
      .set({status: "in_progress"})
      .where(eq(guestCleanupQueue.id, item.id));

    const result = await deleteExactKey(item.storageKey);
    if (result === "absent" || result === "deleted") {
      await db
        .update(guestCleanupQueue)
        .set({
          status: "completed",
          completedAt: new Date(),
          attempts: item.attempts + 1,
          lastError: null,
        })
        .where(eq(guestCleanupQueue.id, item.id));
      succeeded++;
    } else {
      const attempts = item.attempts + 1;
      await db
        .update(guestCleanupQueue)
        .set({
          status: attempts >= GUEST_CLEANUP_MAX_ATTEMPTS ? "failed" : "pending",
          attempts,
          nextRetryAt: nextGuestCleanupRetryAt(attempts),
          lastError: "DELETE_FAILED",
        })
        .where(eq(guestCleanupQueue.id, item.id));
      failed++;
    }
  }

  return {processed: items.length, succeeded, failed};
}

/** Enqueue expired guest objects and scrub sensitive session fields. */
export async function reconcileExpiredGuestAssets(limit = 100): Promise<number> {
  const db = getDb();
  const now = new Date();

  const expiredSessions = await db
    .select()
    .from(guestSessions)
    .where(and(lte(guestSessions.expiresAt, now), sql`${guestSessions.scrubbedAt} is null`))
    .limit(limit);

  for (const session of expiredSessions) {
    const uploads = await db
      .select()
      .from(guestUploads)
      .where(eq(guestUploads.sessionId, session.id));
    for (const upload of uploads) {
      await enqueueGuestCleanup({storageKey: upload.storageKey, sessionId: session.id});
      await db
        .update(guestUploads)
        .set({status: "expired", originalFilename: null})
        .where(eq(guestUploads.id, upload.id));
    }
    const jobs = await db
      .select()
      .from(guestJobs)
      .where(eq(guestJobs.sessionId, session.id));
    for (const job of jobs) {
      if (job.outputStorageKey) {
        await enqueueGuestCleanup({
          storageKey: job.outputStorageKey,
          sessionId: session.id,
        });
      }
      await db
        .update(guestJobs)
        .set({status: "expired"})
        .where(eq(guestJobs.id, job.id));
    }
    await enqueueGuestBulkCleanup(session.id);
    await scrubExpiredGuestSession(session.id);
  }

  return expiredSessions.length;
}
