/**
 * Controlled guest v2 cutover SQL apply.
 * - Archives incompatible legacy guest tables/enums
 * - Applies 0026, 0027, 0028
 * - Records drizzle migration hashes for those files
 * Never prints secrets, tokens, storage keys, or signed URLs.
 */
import {createHash} from "node:crypto";
import {readFileSync, mkdirSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {loadLocalEnvFiles} from "./load-local-env";

loadLocalEnvFiles();

const ROOT = process.cwd();
const BACKUP_DIR = join(ROOT, ".verify-tmp", "cutover-backups");

function splitSql(raw: string): string[] {
  return raw
    .split(/-->\s*statement-breakpoint\s*/g)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/;+\s*$/, ""));
}

function fileHash(path: string): string {
  const buf = readFileSync(path);
  return createHash("sha256").update(buf).digest("hex");
}

async function main() {
  const dry = process.argv.includes("--dry-run");
  const {getPostgresClient} = await import("../src/db/index");
  const sql = getPostgresClient();

  mkdirSync(BACKUP_DIR, {recursive: true});
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");

  // --- pre counts (authenticated + guest) ---
  const users = await sql`select count(*)::int as c from users`;
  const projects = await sql`select count(*)::int as c from projects`;
  const images = await sql`select count(*)::int as c from images`;
  console.log(
    `pre_counts users=${(users[0] as {c: number}).c} projects=${(projects[0] as {c: number}).c} images=${(images[0] as {c: number}).c}`,
  );

  // schema-only dump via information_schema (portable; no pg_dump dependency)
  const cols = await sql`
    select table_name, column_name, data_type, is_nullable
    from information_schema.columns
    where table_schema = 'public'
    order by table_name, ordinal_position
  `;
  writeFileSync(
    join(BACKUP_DIR, `schema-columns-${stamp}.json`),
    JSON.stringify(cols, null, 2),
    "utf8",
  );
  console.log(`schema_backup=schema-columns-${stamp}.json rows=${cols.length}`);

  // guest data backup (metadata only — no image bytes)
  for (const table of [
    "guest_sessions",
    "guest_jobs",
    "guest_assets",
    "guest_usage_counters",
  ]) {
    const exists = await sql`
      select 1 from information_schema.tables
      where table_schema='public' and table_name=${table}
      limit 1
    `;
    if (exists.length === 0) {
      console.log(`backup_skip_missing=${table}`);
      continue;
    }
    const rows = await sql.unsafe(`select * from ${table}`);
    // Scrub potentially sensitive text fields in backup file
    const scrubbed = (rows as Record<string, unknown>[]).map((row) => {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(row)) {
        if (/token|secret|key|coordinate|latitude|longitude|ip|user_agent|gps|raw/i.test(k)) {
          out[k] = v == null ? null : `[redacted:${typeof v}]`;
        } else if (typeof v === "string" && v.length > 200) {
          out[k] = `[truncated:${v.length}]`;
        } else {
          out[k] = v;
        }
      }
      return out;
    });
    writeFileSync(
      join(BACKUP_DIR, `${table}-${stamp}.json`),
      JSON.stringify({table, count: scrubbed.length, rows: scrubbed}, null, 2),
      "utf8",
    );
    console.log(`data_backup=${table} count=${scrubbed.length}`);
  }

  const archiveStatements = [
    `ALTER TABLE IF EXISTS guest_usage_counters RENAME TO guest_usage_counters_pre_v2_archive`,
    `ALTER TABLE IF EXISTS guest_assets RENAME TO guest_assets_pre_v2_archive`,
    `ALTER TABLE IF EXISTS guest_jobs RENAME TO guest_jobs_pre_v2_archive`,
    `ALTER TABLE IF EXISTS guest_sessions RENAME TO guest_sessions_pre_v2_archive`,
    // Preserve archive data while freeing default PK / index / constraint names for v2 CREATE TABLE.
    `DO $rename$
DECLARE
  r record;
  new_name text;
BEGIN
  FOR r IN
    SELECT c.conname, c.conrelid::regclass AS tbl
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname LIKE '%\\_pre\\_v2\\_archive' ESCAPE '\\'
  LOOP
    new_name := left(r.conname, 40) || '_pre_v2_arch';
    IF r.conname <> new_name THEN
      EXECUTE format('ALTER TABLE %s RENAME CONSTRAINT %I TO %I', r.tbl, r.conname, new_name);
    END IF;
  END LOOP;

  FOR r IN
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename LIKE '%\\_pre\\_v2\\_archive' ESCAPE '\\'
  LOOP
    new_name := left(r.indexname, 40) || '_pre_v2_arch';
    IF r.indexname <> new_name THEN
      EXECUTE format('ALTER INDEX %I RENAME TO %I', r.indexname, new_name);
    END IF;
  END LOOP;
END
$rename$`,
    `DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'guest_cleanup_status') THEN EXECUTE 'ALTER TYPE guest_cleanup_status RENAME TO guest_cleanup_status_pre_v2_archive'; END IF; END $$`,
    `DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'guest_job_status') THEN EXECUTE 'ALTER TYPE guest_job_status RENAME TO guest_job_status_pre_v2_archive'; END IF; END $$`,
    `DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'guest_session_status') THEN EXECUTE 'ALTER TYPE guest_session_status RENAME TO guest_session_status_pre_v2_archive'; END IF; END $$`,
    `DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'guest_asset_role') THEN EXECUTE 'ALTER TYPE guest_asset_role RENAME TO guest_asset_role_pre_v2_archive'; END IF; END $$`,
  ];

  const migrations = [
    "drizzle/0026_guest_foundation.sql",
    "drizzle/0027_guest_job_options.sql",
    "drizzle/0028_guest_bulk.sql",
  ];

  if (dry) {
    console.log("dry_run=1 archive_statements=" + archiveStatements.length);
    for (const m of migrations) {
      console.log(`dry_migration=${m} statements=${splitSql(readFileSync(m, "utf8")).length}`);
    }
    return;
  }

  await sql.begin(async (tx) => {
    for (const stmt of archiveStatements) {
      console.log(`exec_archive=${stmt.slice(0, 80)}`);
      await tx.unsafe(stmt);
    }

    for (const rel of migrations) {
      const abs = join(ROOT, rel);
      const statements = splitSql(readFileSync(abs, "utf8"));
      console.log(`exec_migration=${rel} statements=${statements.length}`);
      for (const stmt of statements) {
        await tx.unsafe(stmt);
      }
      const hash = fileHash(abs);
      const existing = await tx`
        select id from drizzle.__drizzle_migrations where hash = ${hash} limit 1
      `;
      if (existing.length === 0) {
        const when = Date.now();
        await tx`
          insert into drizzle.__drizzle_migrations (hash, created_at)
          values (${hash}, ${when})
        `;
        console.log(`migration_hash_recorded prefix=${hash.slice(0, 16)}`);
      } else {
        console.log(`migration_hash_exists prefix=${hash.slice(0, 16)}`);
      }
    }
  });

  // post verification
  const postUsers = await sql`select count(*)::int as c from users`;
  const postProjects = await sql`select count(*)::int as c from projects`;
  const postImages = await sql`select count(*)::int as c from images`;
  console.log(
    `post_counts users=${(postUsers[0] as {c: number}).c} projects=${(postProjects[0] as {c: number}).c} images=${(postImages[0] as {c: number}).c}`,
  );

  for (const t of [
    "guest_sessions",
    "guest_uploads",
    "guest_jobs",
    "guest_cleanup_queue",
    "guest_bulk_jobs",
    "guest_bulk_job_items",
    "guest_sessions_pre_v2_archive",
  ]) {
    const exists = await sql`
      select 1 from information_schema.tables
      where table_schema='public' and table_name=${t} limit 1
    `;
    console.log(`table_${t}=${exists.length ? "yes" : "no"}`);
  }

  const v2cols = await sql`
    select column_name from information_schema.columns
    where table_schema='public' and table_name='guest_sessions'
    order by ordinal_position
  `;
  console.log(
    `guest_sessions_v2_cols=${(v2cols as {column_name: string}[]).map((c) => c.column_name).join(",")}`,
  );
  console.log("cutover_sql=ok");
}

void main().catch((err) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`cutover_sql_failed=${msg.replace(/postgresql:\/\/[^\s]+/gi, "postgresql://[redacted]")}`);
  process.exitCode = 1;
});
