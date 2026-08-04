import {loadLocalEnvFiles} from "./load-local-env";
loadLocalEnvFiles();

async function main() {
  const {getPostgresClient} = await import("../src/db/index");
  const sql = getPostgresClient();
  const tables = await sql`
    select table_name from information_schema.tables
    where table_schema='public' and table_name like '%guest%'
    order by 1
  `;
  console.log(`tables=${tables.map((t: {table_name: string}) => t.table_name).join(",")}`);
  const idxs = await sql`
    select indexname from pg_indexes
    where schemaname='public' and indexname like '%guest%'
    order by 1
  `;
  console.log(`indexes=${idxs.map((i: {indexname: string}) => i.indexname).join(",")}`);
  const enums = await sql`
    select typname from pg_type where typname like '%guest%' order by 1
  `;
  console.log(`enums=${enums.map((e: {typname: string}) => e.typname).join(",")}`);
  const users = await sql`select count(*)::int as c from users`;
  const projects = await sql`select count(*)::int as c from projects`;
  const images = await sql`select count(*)::int as c from images`;
  console.log(
    `counts users=${(users[0] as {c: number}).c} projects=${(projects[0] as {c: number}).c} images=${(images[0] as {c: number}).c}`,
  );
  process.exit(0);
}
void main();
