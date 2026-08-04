/**
 * Reconcile bulk orchestration jobs (bounded, dry-run capable).
 *
 * Usage:
 *   npx tsx scripts/reconcile-bulk-jobs.ts [--dry-run] [--projectId=<uuid>]
 */
import {loadLocalEnvFiles} from "./load-local-env";

loadLocalEnvFiles();

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const projectArg = process.argv.find((arg) => arg.startsWith("--projectId="));
  const projectId = projectArg?.slice("--projectId=".length).trim() || undefined;

  const {reconcileAllProjectsBulk} = await import("../src/server/images/bulk-service");

  const reports = await reconcileAllProjectsBulk({dryRun, projectId});

  console.log(`dry-run=${dryRun} projects=${reports.length}`);
  for (const report of reports) {
    console.log(
      `project=${report.projectId} scanned=${report.scanned} findings=${report.findings.length} changed=${report.changed}`,
    );
    for (const finding of report.findings.slice(0, 20)) {
      console.log(`  ${finding}`);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "failed");
  process.exit(1);
});
