import {createHash} from "node:crypto";
import {and, eq} from "drizzle-orm";
import {getDb} from "@/db";
import {organizationInvitations} from "@/db/schema";

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export async function listPendingInvitations(organizationId: string) {
  const db = getDb();
  return db
    .select({
      id: organizationInvitations.id,
      emailNormalized: organizationInvitations.emailNormalized,
      role: organizationInvitations.role,
      expiresAt: organizationInvitations.expiresAt,
    })
    .from(organizationInvitations)
    .where(
      and(
        eq(organizationInvitations.organizationId, organizationId),
        eq(organizationInvitations.status, "pending"),
      ),
    );
}
