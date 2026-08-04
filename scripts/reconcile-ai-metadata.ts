/**
 * Reconcile AI metadata generations (bounded, dry-run).
 * Usage: npx tsx scripts/reconcile-ai-metadata.ts [--dry-run] [--projectId=<uuid>]
 */
import {and, eq, inArray, lt} from "drizzle-orm";
import {loadLocalEnvFiles} from "./load-local-env";

loadLocalEnvFiles();

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const projectArg = process.argv.find((arg) => arg.startsWith("--projectId="));
  const projectId = projectArg?.slice("--projectId=".length).trim() || undefined;

  const {getDb} = await import("../src/db/index");
  const {metadataGenerations} = await import("../src/db/schema");

  const db = getDb();
  const cutoff = new Date(Date.now() - 30 * 60 * 1000);
  const conditions = [
    inArray(metadataGenerations.status, ["queued", "generating", "validating_output"]),
    lt(metadataGenerations.updatedAt, cutoff),
  ];
  if (projectId) conditions.push(eq(metadataGenerations.projectId, projectId));

  const stale = await db
    .select({id: metadataGenerations.id, status: metadataGenerations.status})
    .from(metadataGenerations)
    .where(and(...conditions))
    .limit(50);

  console.log(`dry-run=${dryRun} scanned=${stale.length}`);
  for (const row of stale.slice(0, 20)) {
    console.log(`  id=${row.id.slice(0, 8)} status=${row.status}`);
  }
  if (!dryRun && stale.length) {
    await db
      .update(metadataGenerations)
      .set({
        status: "failed",
        lastErrorCode: "AI_PROVIDER_UNAVAILABLE",
        lastErrorMessageSafe: "AI_PROVIDER_UNAVAILABLE",
        failedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        inArray(
          metadataGenerations.id,
          stale.map((r) => r.id),
        ),
      );
    console.log(`changed=${stale.length}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "failed");
  process.exit(1);
});
