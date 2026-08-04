/**
 * One-shot first super_admin bootstrap for an existing user.
 * Usage: npx tsx scripts/bootstrap-super-admin.ts <exact-email>
 *
 * - Backs up the affected user row (local file; password hash not printed)
 * - Promotes only that email to super_admin when currently role=user
 * - Writes admin_audit_logs bootstrap entry
 * - Does not print DATABASE_URL or password material
 */
import {mkdirSync, writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {and, eq, ne, sql} from "drizzle-orm";
import {loadLocalEnvFiles} from "./load-local-env";

loadLocalEnvFiles();

const emailRaw = process.argv[2]?.trim().toLowerCase();
if (!emailRaw || !emailRaw.includes("@") || emailRaw.includes("example.com")) {
  console.error("Usage: npx tsx scripts/bootstrap-super-admin.ts <exact-email>");
  process.exit(1);
}

async function main() {
  const {getDb} = await import("../src/db");
  const {users, adminAuditLogs} = await import("../src/db/schema");
  const db = getDb();

  const beforeRoles = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      accountStatus: users.accountStatus,
    })
    .from(users);

  const target = beforeRoles.find((u) => u.email.toLowerCase() === emailRaw);
  if (!target) {
    console.error(`FAIL target_user_missing email=${emailRaw}`);
    process.exit(1);
  }

  const [fullRow] = await db.select().from(users).where(eq(users.id, target.id)).limit(1);
  if (!fullRow) {
    console.error("FAIL target_row_missing");
    process.exit(1);
  }

  mkdirSync(resolve(".verify-tmp"), {recursive: true});
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = resolve(`.verify-tmp/user-backup-${stamp}.json`);
  writeFileSync(
    backupPath,
    JSON.stringify(
      {
        backedUpAt: new Date().toISOString(),
        purpose: "super_admin_bootstrap",
        row: {
          ...fullRow,
          createdAt: fullRow.createdAt?.toISOString?.() ?? fullRow.createdAt,
          updatedAt: fullRow.updatedAt?.toISOString?.() ?? fullRow.updatedAt,
          emailVerified: fullRow.emailVerified?.toISOString?.() ?? fullRow.emailVerified,
          suspendedAt: fullRow.suspendedAt?.toISOString?.() ?? fullRow.suspendedAt,
        },
      },
      null,
      2,
    ),
    "utf8",
  );
  console.log(`BACKUP ok path=.verify-tmp/user-backup-${stamp}.json (password hash retained in file only)`);

  console.log(
    `TARGET id=${target.id} email=${target.email} role=${target.role} status=${target.accountStatus}`,
  );

  if (target.role === "super_admin") {
    console.log("SKIP already_super_admin");
    console.log(`BACKUP_PATH ${backupPath}`);
    return;
  }

  if (target.role !== "user") {
    console.error(`FAIL unexpected_role role=${target.role}`);
    process.exit(1);
  }

  const superAdminCountBefore = beforeRoles.filter((u) => u.role === "super_admin").length;

  await db
    .update(users)
    .set({role: "super_admin", updatedAt: new Date()})
    .where(and(eq(users.id, target.id), eq(users.email, target.email), eq(users.role, "user")));

  const [after] = await db
    .select({id: users.id, email: users.email, role: users.role})
    .from(users)
    .where(eq(users.id, target.id))
    .limit(1);

  if (!after || after.role !== "super_admin") {
    console.error("FAIL promote_failed");
    process.exit(1);
  }

  const otherSuper = await db
    .select({id: users.id, email: users.email, role: users.role})
    .from(users)
    .where(and(eq(users.role, "super_admin"), ne(users.id, target.id)));

  const stillUserOthers = await db
    .select({count: sql<number>`count(*)::int`})
    .from(users)
    .where(and(eq(users.role, "user"), ne(users.id, target.id)));

  const afterRoles = await db.select({id: users.id, role: users.role}).from(users);
  const roleDrift = afterRoles.filter((u) => {
    const prior = beforeRoles.find((p) => p.id === u.id);
    if (!prior) return true;
    if (u.id === target.id) return u.role !== "super_admin";
    return u.role !== prior.role;
  });

  if (roleDrift.length > 0) {
    console.error(`FAIL role_safety_violations count=${roleDrift.length}`);
    process.exit(1);
  }

  const [audit] = await db
    .insert(adminAuditLogs)
    .values({
      adminUserId: target.id,
      action: "bootstrap.promote_super_admin",
      targetEntityType: "user",
      targetEntityId: target.id,
      reason: "First super_admin bootstrap for approved account/admin closure check",
      beforeSummary: `role=user email=${target.email}`,
      afterSummary: `role=super_admin email=${target.email}`,
      correlationId: `bootstrap-${stamp}`,
    })
    .returning({id: adminAuditLogs.id});

  console.log("BOOTSTRAP ok");
  console.log(`PROMOTED email=${after.email} role=${after.role}`);
  console.log(`OTHER_SUPER_ADMINS count=${otherSuper.length}`);
  console.log(`SUPER_ADMIN_BEFORE count=${superAdminCountBefore}`);
  console.log(`OTHER_USERS_STILL_USER count=${stillUserOthers[0]?.count ?? 0}`);
  console.log(`ROLE_SAFETY ok`);
  console.log(`AUDIT_ID ${audit?.id ?? "none"}`);
  console.log(`BACKUP_PATH ${backupPath}`);
}

main().catch((err) => {
  console.error("FAIL", err instanceof Error ? err.message : "unknown");
  process.exit(1);
});
