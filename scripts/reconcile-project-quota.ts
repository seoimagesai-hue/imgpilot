/**
 * Reconcile project quota counters from images + replacements source rows.
 *
 * Usage:
 *   npx tsx scripts/reconcile-project-quota.ts [--dry-run] [--projectId=<uuid>]
 */
import {loadLocalEnvFiles} from "./load-local-env";

loadLocalEnvFiles();

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const projectArg = process.argv.find((arg) => arg.startsWith("--projectId="));
  const projectId = projectArg?.slice("--projectId=".length).trim() || undefined;

  const {reconcileAllProjectsQuota} = await import("../src/server/images/quota-service");

  const reports = await reconcileAllProjectsQuota({dryRun, projectId});

  console.log(`dry-run=${dryRun} projects=${reports.length}`);
  for (const report of reports) {
    console.log(
      `project=${report.projectId} changed=${report.changed} effectiveBefore=${report.previous.activeOriginalBytes + report.previous.reservedUploadBytes + report.previous.replacementCandidateBytes + report.previous.cleanupPendingBytes} effectiveAfter=${report.computed.activeOriginalBytes + report.computed.reservedUploadBytes + report.computed.replacementCandidateBytes + report.computed.cleanupPendingBytes}`,
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "failed");
  process.exit(1);
});
