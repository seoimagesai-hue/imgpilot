"use server";

import {eq} from "drizzle-orm";
import {revalidatePath} from "next/cache";
import {getDb} from "@/db";
import {users} from "@/db/schema";
import {writeAdminAuditLog} from "@/server/admin/audit";
import {requireSuperAdmin} from "@/server/auth/session";
import {runAuthenticatedCleanupJob} from "@/server/ops/cleanup-scheduler";

import {
  ADMIN_CLEANUP_CONFIRM,
  ADMIN_RESTORE_CONFIRM,
  ADMIN_SUSPEND_CONFIRM,
} from "@/server/admin/constants";

export type AdminActionResult = {
  ok: boolean;
  error?: string;
};

export async function suspendUserAction(
  locale: string,
  userId: string,
  reason: string,
  confirmation: string,
): Promise<AdminActionResult> {
  const session = await requireSuperAdmin(locale);

  if (confirmation !== ADMIN_SUSPEND_CONFIRM) {
    return {ok: false, error: "Type SUSPEND to confirm."};
  }
  if (!reason.trim()) {
    return {ok: false, error: "Reason is required."};
  }
  if (userId === session.user.id) {
    return {ok: false, error: "You cannot suspend your own account."};
  }

  const db = getDb();
  const [existing] = await db
    .select({accountStatus: users.accountStatus})
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!existing) {
    return {ok: false, error: "User not found."};
  }
  if (existing.accountStatus === "suspended") {
    return {ok: false, error: "User is already suspended."};
  }

  await db
    .update(users)
    .set({
      accountStatus: "suspended",
      suspendedAt: new Date(),
      suspendedBy: session.user.id,
      suspensionReason: reason.trim(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  await writeAdminAuditLog({
    adminUserId: session.user.id,
    action: "user.suspend",
    targetEntityType: "user",
    targetEntityId: userId,
    reason: reason.trim(),
    beforeSummary: "active",
    afterSummary: "suspended",
  });

  revalidatePath(`/${locale}/admin/users`);
  revalidatePath(`/${locale}/admin/users/${userId}`);
  return {ok: true};
}

export async function restoreUserAction(
  locale: string,
  userId: string,
  reason: string,
  confirmation: string,
): Promise<AdminActionResult> {
  const session = await requireSuperAdmin(locale);

  if (confirmation !== ADMIN_RESTORE_CONFIRM) {
    return {ok: false, error: "Type RESTORE to confirm."};
  }
  if (!reason.trim()) {
    return {ok: false, error: "Reason is required."};
  }

  const db = getDb();
  const [existing] = await db
    .select({accountStatus: users.accountStatus})
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!existing) {
    return {ok: false, error: "User not found."};
  }
  if (existing.accountStatus === "active") {
    return {ok: false, error: "User is already active."};
  }

  await db
    .update(users)
    .set({
      accountStatus: "active",
      suspendedAt: null,
      suspendedBy: null,
      suspensionReason: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  await writeAdminAuditLog({
    adminUserId: session.user.id,
    action: "user.restore",
    targetEntityType: "user",
    targetEntityId: userId,
    reason: reason.trim(),
    beforeSummary: "suspended",
    afterSummary: "active",
  });

  revalidatePath(`/${locale}/admin/users`);
  revalidatePath(`/${locale}/admin/users/${userId}`);
  return {ok: true};
}

export async function triggerCleanupAction(
  locale: string,
  confirmation: string,
): Promise<AdminActionResult & {overlap?: boolean}> {
  const session = await requireSuperAdmin(locale);

  if (confirmation !== ADMIN_CLEANUP_CONFIRM) {
    return {ok: false, error: "Type RUN-CLEANUP to confirm."};
  }

  const result = await runAuthenticatedCleanupJob();

  await writeAdminAuditLog({
    adminUserId: session.user.id,
    action: "cleanup.trigger",
    targetEntityType: "system",
    reason: result.overlap ? "overlap_skipped" : "manual_admin_trigger",
    beforeSummary: undefined,
    afterSummary: result.overlap
      ? "skipped_overlap"
      : `reconciled:${result.reconciled};processed:${result.processed};ok:${result.succeeded};failed:${result.failed}`,
  });

  revalidatePath(`/${locale}/admin/cleanup`);
  revalidatePath(`/${locale}/admin`);

  if (result.overlap) {
    return {ok: false, error: "Cleanup job already in progress.", overlap: true};
  }

  return {ok: true};
}
