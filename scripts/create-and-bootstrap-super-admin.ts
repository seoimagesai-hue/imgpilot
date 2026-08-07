/**
 * Create confirmed admin email as normal user (if missing), backup, promote to super_admin.
 * Usage: npx tsx scripts/create-and-bootstrap-super-admin.ts <email> <password>
 */
import {randomBytes} from "node:crypto";
import {mkdirSync, writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {and, eq, ne, sql} from "drizzle-orm";
import {loadLocalEnvFiles} from "./load-local-env";

loadLocalEnvFiles();

const emailRaw = process.argv[2]?.trim().toLowerCase();
const passwordArg = process.argv[3];

if (!emailRaw || !emailRaw.includes("@") || emailRaw.includes("example.com")) {
  console.error("Usage: npx tsx scripts/create-and-bootstrap-super-admin.ts <email> <password>");
  process.exit(1);
}

async function main() {
  const password =
    passwordArg && passwordArg.length >= 12
      ? passwordArg
      : `Close-${randomBytes(9).toString("base64url")}!aA1`;

  const {getDb} = await import("../src/db");
  const {users, adminAuditLogs} = await import("../src/db/schema");
  const {hashPassword} = await import("../src/server/auth/password");
  const db = getDb();

  const beforeRoles = await db
    .select({id: users.id, email: users.email, role: users.role, accountStatus: users.accountStatus})
    .from(users);

  let target = beforeRoles.find((u) => u.email.toLowerCase() === emailRaw);
  let created = false;

  if (!target) {
    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(password);
    await db.insert(users).values({
      id,
      name: "Img Pilot Admin",
      email: emailRaw,
      passwordHash,
      role: "user",
      accountStatus: "active",
    });
    created = true;
    target = {id, email: emailRaw, role: "user", accountStatus: "active"};
    console.log(`CREATED_USER email=${emailRaw} role=user`);
    // Password printed once for operator closure login — not stored in repo.
    console.log(`ONE_TIME_PASSWORD ${password}`);
  } else {
    console.log(`EXISTING_USER email=${target.email} role=${target.role}`);
    if (passwordArg && passwordArg.length >= 12) {
      const passwordHash = await hashPassword(passwordArg);
      await db
        .update(users)
        .set({passwordHash, updatedAt: new Date()})
        .where(eq(users.id, target.id));
      console.log("PASSWORD_ROTATED for closure verification (operator-provided)");
      console.log(`ONE_TIME_PASSWORD ${passwordArg}`);
    } else if (!target) {
      /* unreachable */
    } else {
      console.log("PASSWORD unchanged (user already existed; pass password argv to rotate for live login)");
    }
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
  console.log(`BACKUP ok file=.verify-tmp/user-backup-${stamp}.json`);

  if (fullRow.role === "super_admin") {
    console.log("SKIP already_super_admin");
    console.log(`BACKUP_PATH ${backupPath}`);
    return;
  }
  if (fullRow.role !== "user") {
    console.error(`FAIL unexpected_role=${fullRow.role}`);
    process.exit(1);
  }

  // Refresh before snapshot after possible create
  const rolesBeforePromote = await db.select({id: users.id, role: users.role}).from(users);

  await db
    .update(users)
    .set({role: "super_admin", updatedAt: new Date()})
    .where(and(eq(users.id, target.id), eq(users.email, emailRaw), eq(users.role, "user")));

  const [after] = await db
    .select({id: users.id, email: users.email, role: users.role})
    .from(users)
    .where(eq(users.id, target.id))
    .limit(1);

  if (!after || after.role !== "super_admin") {
    console.error("FAIL promote_failed");
    process.exit(1);
  }

  const afterRoles = await db.select({id: users.id, role: users.role}).from(users);
  const drift = afterRoles.filter((u) => {
    const prior = rolesBeforePromote.find((p) => p.id === u.id);
    if (!prior) return u.id !== target!.id;
    if (u.id === target!.id) return u.role !== "super_admin";
    return u.role !== prior.role;
  });
  if (drift.length) {
    console.error(`FAIL role_safety count=${drift.length}`);
    process.exit(1);
  }

  const otherSuper = await db
    .select({email: users.email})
    .from(users)
    .where(and(eq(users.role, "super_admin"), ne(users.id, target.id)));

  const [audit] = await db
    .insert(adminAuditLogs)
    .values({
      adminUserId: target.id,
      action: "bootstrap.promote_super_admin",
      targetEntityType: "user",
      targetEntityId: target.id,
      reason: created
        ? "Created confirmed admin email as user then promoted (local closure bootstrap)"
        : "Promoted existing confirmed admin email (local closure bootstrap)",
      beforeSummary: "role=user",
      afterSummary: "role=super_admin",
      correlationId: `bootstrap-${stamp}`,
    })
    .returning({id: adminAuditLogs.id});

  const otherUsers = await db
    .select({count: sql<number>`count(*)::int`})
    .from(users)
    .where(and(eq(users.role, "user"), ne(users.id, target.id)));

  console.log("BOOTSTRAP ok");
  console.log(`PROMOTED email=${after.email} role=${after.role}`);
  console.log(`OTHER_SUPER_ADMINS ${otherSuper.length}`);
  console.log(`OTHER_USERS_STILL_USER ${otherUsers[0]?.count ?? 0}`);
  console.log("ROLE_SAFETY ok");
  console.log(`AUDIT_ID ${audit?.id ?? "none"}`);
  console.log(`BACKUP_PATH ${backupPath}`);
  console.log(`USER_ID ${after.id}`);
}

main().catch((err) => {
  console.error("FAIL", err instanceof Error ? err.message : "unknown");
  process.exit(1);
});
