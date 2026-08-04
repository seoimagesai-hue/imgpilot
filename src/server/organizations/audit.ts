import {desc, eq} from "drizzle-orm";
import {getDb} from "@/db";
import {organizationAuditLogs, type OrganizationAuditLog} from "@/db/schema";

export type WriteOrganizationAuditInput = {
  organizationId: string;
  actorUserId: string;
  action: string;
  targetEntityType: string;
  targetEntityId?: string | null;
  beforeSummary?: string | null;
  afterSummary?: string | null;
};

export async function writeOrganizationAudit(
  params: WriteOrganizationAuditInput,
): Promise<void> {
  const db = getDb();
  await db.insert(organizationAuditLogs).values({
    organizationId: params.organizationId,
    actorUserId: params.actorUserId,
    action: params.action,
    targetEntityType: params.targetEntityType,
    targetEntityId: params.targetEntityId ?? null,
    beforeSummary: params.beforeSummary ?? null,
    afterSummary: params.afterSummary ?? null,
  });
}

export async function listOrganizationAuditLogs(params: {
  actorUserId: string;
  organizationId: string;
  limit?: number;
}): Promise<OrganizationAuditLog[]> {
  void params.actorUserId;
  const db = getDb();
  return db
    .select()
    .from(organizationAuditLogs)
    .where(eq(organizationAuditLogs.organizationId, params.organizationId))
    .orderBy(desc(organizationAuditLogs.createdAt))
    .limit(params.limit ?? 100);
}
