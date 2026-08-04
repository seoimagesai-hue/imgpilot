import {getDb} from "@/db";
import {adminAuditLogs} from "@/db/schema";
import {assertSafeAuditText} from "@/server/admin/redaction";

export type WriteAdminAuditLogInput = {
  adminUserId: string;
  action: string;
  targetEntityType: string;
  targetEntityId?: string;
  reason?: string;
  beforeSummary?: string;
  afterSummary?: string;
  correlationId?: string;
};

export async function writeAdminAuditLog(input: WriteAdminAuditLogInput): Promise<string> {
  assertSafeAuditText(input.reason, "reason");
  assertSafeAuditText(input.beforeSummary, "beforeSummary");
  assertSafeAuditText(input.afterSummary, "afterSummary");
  assertSafeAuditText(input.correlationId, "correlationId");

  const db = getDb();
  const [row] = await db
    .insert(adminAuditLogs)
    .values({
      adminUserId: input.adminUserId,
      action: input.action,
      targetEntityType: input.targetEntityType,
      targetEntityId: input.targetEntityId ?? null,
      reason: input.reason ?? null,
      beforeSummary: input.beforeSummary ?? null,
      afterSummary: input.afterSummary ?? null,
      correlationId: input.correlationId ?? null,
    })
    .returning({id: adminAuditLogs.id});

  return row.id;
}
