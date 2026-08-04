/**
 * Prompt 11 cutover schema inspection — no secrets printed.
 */
import {loadLocalEnvFiles} from "./load-local-env";

loadLocalEnvFiles();

async function main() {
  const {getPostgresClient} = await import("../src/db/index");
  const sql = getPostgresClient();

  const tables = await sql`
    select table_name
    from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
    order by table_name
  `;
  const names = tables.map((t: {table_name: string}) => t.table_name as string);
  const guest = names.filter((n) => n.includes("guest"));
  console.log(`guest_tables=${guest.join(",") || "(none)"}`);

  for (const t of [
    "users",
    "accounts",
    "sessions",
    "projects",
    "images",
    "bulk_jobs",
    "bulk_job_items",
    "processing_jobs",
    "guest_sessions",
    "guest_uploads",
    "guest_jobs",
    "guest_cleanup_queue",
    "guest_bulk_jobs",
    "guest_bulk_job_items",
    "guest_assets",
    "guest_usage_counters",
  ]) {
    console.log(`table_${t}=${names.includes(t) ? "yes" : "no"}`);
  }

  const migSchema = await sql`
    select schema_name from information_schema.schemata where schema_name = 'drizzle'
  `;
  console.log(`drizzle_schema=${migSchema.length > 0 ? "yes" : "no"}`);

  if (migSchema.length > 0) {
    const mig = await sql`
      select id, hash, created_at
      from drizzle.__drizzle_migrations
      order by created_at asc
    `;
    console.log(`migration_count=${mig.length}`);
    for (const m of mig as {id: number; hash: string; created_at: string | Date}[]) {
      const h = m.hash ? String(m.hash).slice(0, 16) : "";
      console.log(`migration id=${m.id} created_at=${String(m.created_at)} hash_prefix=${h}`);
    }
  }

  async function cols(table: string) {
    const rows = await sql`
      select column_name
      from information_schema.columns
      where table_schema = 'public' and table_name = ${table}
      order by ordinal_position
    `;
    return (rows as {column_name: string}[]).map((c) => c.column_name).join(",");
  }

  if (names.includes("guest_sessions")) {
    console.log(`guest_sessions_cols=${await cols("guest_sessions")}`);
    const cnt = await sql`select count(*)::int as c from guest_sessions`;
    const active =
      await sql`select count(*)::int as c from guest_sessions where expires_at > now()`;
    console.log(
      `guest_sessions_count=${(cnt[0] as {c: number}).c} active=${(active[0] as {c: number}).c}`,
    );
  }
  if (names.includes("guest_jobs")) {
    console.log(`guest_jobs_cols=${await cols("guest_jobs")}`);
    const jobs = await sql`select count(*)::int as c from guest_jobs`;
    console.log(`guest_jobs_count=${(jobs[0] as {c: number}).c}`);
  }
  if (names.includes("guest_uploads")) {
    console.log(`guest_uploads_cols=${await cols("guest_uploads")}`);
  }
  if (names.includes("guest_assets")) {
    const assets = await sql`select count(*)::int as c from guest_assets`;
    const activeAssets = await sql`
      select count(*)::int as c from guest_assets where expires_at > now()
    `.catch(async () => [{c: -1} as {c: number}]);
    console.log(
      `guest_assets_count=${(assets[0] as {c: number}).c} active=${(activeAssets[0] as {c: number}).c}`,
    );
  }
  if (names.includes("guest_usage_counters")) {
    const usage = await sql`select count(*)::int as c from guest_usage_counters`;
    console.log(`guest_usage_counters_count=${(usage[0] as {c: number}).c}`);
  }

  const enums = await sql`
    select t.typname, e.enumlabel
    from pg_type t
    join pg_enum e on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname like 'guest%'
    order by t.typname, e.enumsortorder
  `;
  let current = "";
  for (const row of enums as {typname: string; enumlabel: string}[]) {
    if (row.typname !== current) {
      current = row.typname;
      console.log(`ENUM ${current}`);
    }
    console.log(`  ${row.enumlabel}`);
  }

  const users = await sql`select count(*)::int as c from users`;
  const projects = await sql`select count(*)::int as c from projects`;
  console.log(
    `users_count=${(users[0] as {c: number}).c} projects_count=${(projects[0] as {c: number}).c}`,
  );

  const keys = [
    "DATABASE_URL",
    "AUTH_SECRET",
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET_NAME",
    "R2_ENDPOINT",
    "OPENAI_API_KEY",
    "GUEST_COOKIE_NAME",
    "GUEST_MAX_FILE_BYTES",
    "GUEST_MAX_OPS_PER_DAY",
  ];
  for (const k of keys) {
    const v = process.env[k];
    console.log(`env_${k}=${v && v.trim() ? "present" : "missing"}`);
  }
  console.log(`openai_key_len=${(process.env.OPENAI_API_KEY || "").trim().length}`);

  await sql.end({timeout: 5});
}

void main().catch((e) => {
  console.error("inspect_failed", e instanceof Error ? e.message : "unknown");
  process.exit(1);
});
