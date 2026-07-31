/**
 * Reconcile Ready-for-processing statuses from validated / ready rows.
 *
 * Usage:
 *   npx tsx scripts/reconcile-ready-for-processing.ts [--dry-run] [--projectId=<uuid>]
 */
import {loadLocalEnvFiles} from "./load-local-env";

loadLocalEnvFiles();

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const projectArg = process.argv.find((arg) => arg.startsWith("--projectId="));
  const projectId = projectArg?.slice("--projectId=".length).trim() || undefined;

  const {reconcileAllProjectsReady} = await import("../src/server/images/ready-service");
  const reports = await reconcileAllProjectsReady({dryRun, projectId});

  console.log(`dry-run=${dryRun} projects=${reports.length}`);
  for (const report of reports) {
    console.log(
      `project=${report.projectId} promoted=${report.promoted} demoted=${report.demoted} scannedValidated=${report.scannedValidated} scannedReady=${report.scannedReady}`,
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "failed");
  process.exit(1);
});
