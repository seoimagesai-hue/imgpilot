import {loadLocalEnvFiles} from "./load-local-env";
import {readFileSync, existsSync} from "node:fs";
import {join} from "node:path";

loadLocalEnvFiles();

async function main() {
  const {getPostgresClient} = await import("../src/db/index");
  const sql = getPostgresClient();
  const tables = await sql`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and (table_name like '%billing%' or table_name like 'stripe%')
    order by 1
  `;
  console.log(
    `billing_tables=${
      (tables as {table_name: string}[]).map((t) => t.table_name).join(",") || "(none)"
    }`,
  );
  for (const k of [
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    "STRIPE_PRICE_PRO_MONTHLY",
    "STRIPE_PRICE_PRO_ANNUAL",
    "STRIPE_PRICE_STARTER_MONTHLY",
    "CRON_SECRET",
    "CLEANUP_CRON_SECRET",
  ]) {
    const v = process.env[k];
    console.log(`${k}=${v && v.length > 0 ? "present" : "missing"}`);
  }
  for (const p of [".next/BUILD_ID", ".next-pre-v2-cutover/BUILD_ID"]) {
    const full = join(process.cwd(), p);
    console.log(
      `${p}=${existsSync(full) ? readFileSync(full, "utf8").trim() : "absent"}`,
    );
  }
  process.exit(0);
}

void main();
