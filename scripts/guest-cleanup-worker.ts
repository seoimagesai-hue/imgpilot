/**
 * Guest cleanup worker — expire assets and exact-key R2 deletion with retries.
 *
 * Run: npm run worker:guest-cleanup
 * External cron may invoke this process periodically (scheduler is not in-process).
 */
import {loadLocalEnvFiles} from "./load-local-env";

loadLocalEnvFiles();

async function main() {
  const {processGuestCleanupBatch, reconcileExpiredGuestAssets} = await import(
    "@/server/guest/cleanup-service"
  );
  const reconciled = await reconcileExpiredGuestAssets(100);
  const batch = await processGuestCleanupBatch();
  console.log(
    JSON.stringify({
      ok: true,
      reconciled,
      cleanup: batch,
      at: new Date().toISOString(),
    }),
  );
}

main().catch((error) => {
  console.error("[guest-cleanup-worker] failed", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
