/**
 * Bounded recovery for delete/replace lifecycle orphans.
 *
 * Usage: npx tsx scripts/recover-image-lifecycle.ts [--dry-run]
 */
import {loadLocalEnvFiles} from "./load-local-env";

loadLocalEnvFiles();

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const {recoverImageLifecycle} = await import("../src/server/images/recovery-service");

  const report = await recoverImageLifecycle({dryRun});

  console.log(`dry-run=${report.dryRun}`);
  console.log(
    `scanned staleDeletions=${report.scanned.staleDeletions} deletionFailed=${report.scanned.deletionFailed} oldCleanupFailed=${report.scanned.oldCleanupFailed} cancelCleanupFailed=${report.scanned.cancelCleanupFailed} abandonedCandidates=${report.scanned.abandonedCandidates}`,
  );
  console.log(`actions=${report.actions.length}`);
  for (const action of report.actions) {
    console.log(action);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "failed");
  process.exit(1);
});
