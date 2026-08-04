/**
 * Aggregate-only guest cleanup queue inspection — never prints keys.
 */
import {loadLocalEnvFiles} from "./load-local-env";

loadLocalEnvFiles();

async function main() {
  const postgres = (await import("postgres")).default;
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("NO_DATABASE_URL");
    process.exit(1);
  }
  const sql = postgres(url, {max: 1});
  try {
    const byStatus = await sql<{status: string; n: number}[]>`
      SELECT status::text AS status, count(*)::int AS n
      FROM guest_cleanup_queue
      GROUP BY status
      ORDER BY status
    `;
    console.log("cleanup_queue_by_status=" + JSON.stringify(byStatus));
    const inProgress = await sql<{n: number}[]>`
      SELECT count(*)::int AS n FROM guest_cleanup_queue WHERE status::text = 'in_progress'
    `;
    console.log("in_progress=" + inProgress[0]?.n);
    const openErr = await sql<{n: number}[]>`
      SELECT count(*)::int AS n
      FROM guest_cleanup_queue
      WHERE last_error IS NOT NULL AND status::text <> 'completed'
    `;
    console.log("open_with_last_error=" + openErr[0]?.n);
    const pending = await sql<{n: number}[]>`
      SELECT count(*)::int AS n FROM guest_cleanup_queue WHERE status::text = 'pending'
    `;
    console.log("pending=" + pending[0]?.n);
    const failed = await sql<{n: number}[]>`
      SELECT count(*)::int AS n FROM guest_cleanup_queue WHERE status::text = 'failed'
    `;
    console.log("failed=" + failed[0]?.n);
  } finally {
    await sql.end({timeout: 2});
  }
}

main().catch((e) => {
  console.error("ERR", e instanceof Error ? e.message : "unknown");
  process.exit(1);
});
