/**
 * List users for bootstrap selection — emails/roles only. No password hashes.
 * Usage: npx tsx scripts/list-users-safe.ts
 */
import {loadLocalEnvFiles} from "./load-local-env";

loadLocalEnvFiles();

async function main() {
  const {getDb} = await import("../src/db");
  const {users} = await import("../src/db/schema");
  const db = getDb();
  const rows = await db
    .select({
      email: users.email,
      role: users.role,
      accountStatus: users.accountStatus,
      hasPassword: users.passwordHash,
    })
    .from(users)
    .orderBy(users.createdAt);

  console.log(`USER_COUNT ${rows.length}`);
  for (const row of rows) {
    console.log(
      `email=${row.email} role=${row.role} status=${row.accountStatus} credentials=${row.hasPassword ? "yes" : "oauth_or_none"}`,
    );
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
