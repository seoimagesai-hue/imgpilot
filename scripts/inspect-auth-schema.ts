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

  const names = tables.map((t: {table_name: string}) => t.table_name);
  console.log(`tables=${names.join(",")}`);

  const expected = ["users", "accounts", "sessions", "verification_tokens", "authenticators"];
  console.log(`expected_ok=${expected.every((t) => names.includes(t))}`);

  const cols = await sql`
    select column_name
    from information_schema.columns
    where table_schema = 'public' and table_name = 'users'
    order by ordinal_position
  `;
  console.log(
    `users_columns=${cols.map((c: {column_name: string}) => c.column_name).join(",")}`,
  );

  const uniq = await sql`
    select 1 as ok
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'users'
      and constraint_type = 'UNIQUE'
      and constraint_name = 'users_email_unique'
  `;
  console.log(`users_email_unique=${uniq.length > 0}`);

  await sql.end({timeout: 5});
}

void main();
