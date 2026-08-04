/**
 * Reconcile processing jobs / derivatives (bounded, dry-run capable).
 *
 * Usage:
 *   npx tsx scripts/reconcile-processing-jobs.ts [--dry-run] [--projectId=<uuid>]
 */
import {loadLocalEnvFiles} from "./load-local-env";

loadLocalEnvFiles();

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const projectArg = process.argv.find((arg) => arg.startsWith("--projectId="));
  const projectId = projectArg?.slice("--projectId=".length).trim() || undefined;

  const {reconcileAllProjectsProcessing} = await import(
    "../src/server/images/processing-reconcile"
  );

  const reports = await reconcileAllProjectsProcessing({dryRun, projectId});

  console.log(`dry-run=${dryRun} projects=${reports.length}`);
  for (const report of reports) {
    console.log(
      `project=${report.projectId} scannedJobs=${report.scannedJobs} scannedDerivatives=${report.scannedDerivatives} findings=${report.findings.length} changed=${report.changed}`,
    );
    for (const finding of report.findings.slice(0, 20)) {
      console.log(`  kind=${finding.kind} action=${finding.action}`);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "failed");
  process.exit(1);
});
