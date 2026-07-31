/**
 * Marks expired pending_upload rows as upload_failed.
 * Does not delete R2 objects automatically (manual/operator cleanup for orphans).
 *
 * Usage: npx tsx scripts/cleanup-expired-pending-uploads.ts
 */
import {readFileSync, existsSync} from "node:fs";
import {resolve} from "node:path";
import {and, eq, lt, isNotNull} from "drizzle-orm";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i <= 0) continue;
    const key = trimmed.slice(0, i);
    let value = trimmed.slice(i + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

async function main() {
  const {getDb} = await import("../src/db");
  const {images} = await import("../src/db/schema");
  const db = getDb();
  const now = new Date();
  const updated = await db
    .update(images)
    .set({
      status: "upload_failed",
      failureCode: "UPLOAD_EXPIRED",
      updatedAt: now,
    })
    .where(
      and(
        eq(images.status, "pending_upload"),
        isNotNull(images.uploadExpiresAt),
        lt(images.uploadExpiresAt, now),
      ),
    )
    .returning({id: images.id});

  console.log(`expired-pending-marked-failed=${updated.length}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "failed");
  process.exit(1);
});
