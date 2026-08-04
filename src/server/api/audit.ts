/**
 * Prompt 25 — audit trail for API keys / webhooks management.
 * Never write secrets (raw keys, webhook secrets) into audit summaries.
 */
import {and, desc, eq} from "drizzle-orm";
import {getDb} from "@/db";
import {integrationAuditLogs, type ApiWorkspaceType} from "@/db/schema";

export type IntegrationAuditAction =
  | "api_key.created"
  | "api_key.revoked"
  | "api_key.rotated"
  | "webhook_endpoint.created"
  | "webhook_endpoint.verified"
  | "webhook_endpoint.verification_failed"
  | "webhook_endpoint.secret_rotated"
  | "webhook_endpoint.disabled"
  | "webhook_endpoint.enabled"
  | "webhook_endpoint.deleted"
  | "webhook_endpoint.auto_disabled"
  | "webhook_event.emitted"
  | "webhook_delivery.test_sent"
  | "wordpress_connection.created"
  | "wordpress_connection.verified"
  | "wordpress_connection.verification_failed"
  | "wordpress_connection.credentials_updated"
  | "wordpress_connection.disabled"
  | "wordpress_connection.enabled"
  | "wordpress_connection.disconnected"
  | "wordpress_connection.auto_degraded"
  | "wordpress_publish_job.created"
  | "wordpress_publish_job.completed"
  | "wordpress_publish_job.partially_completed"
  | "wordpress_publish_job.failed"
  | "wordpress_publish_job.cancelled"
  | "wordpress_bulk_job.created"
  | "wordpress_bulk_job.cancelled"
  | "shopify_connection.created"
  | "shopify_connection.verified"
  | "shopify_connection.verification_failed"
  | "shopify_connection.credentials_updated"
  | "shopify_connection.disabled"
  | "shopify_connection.enabled"
  | "shopify_connection.disconnected"
  | "shopify_connection.auto_degraded"
  | "shopify_publish_job.created"
  | "shopify_publish_job.completed"
  | "shopify_publish_job.partially_completed"
  | "shopify_publish_job.failed"
  | "shopify_publish_job.cancelled"
  | "shopify_bulk_job.created"
  | "shopify_bulk_job.cancelled"
  | "webflow_connection.created"
  | "webflow_connection.verified"
  | "webflow_connection.verification_failed"
  | "webflow_connection.credentials_updated"
  | "webflow_connection.site_selected"
  | "webflow_connection.disabled"
  | "webflow_connection.enabled"
  | "webflow_connection.disconnected"
  | "webflow_connection.auto_degraded"
  | "webflow_field_mapping.created"
  | "webflow_field_mapping.updated"
  | "webflow_field_mapping.marked_stale"
  | "webflow_publish_job.created"
  | "webflow_publish_job.completed"
  | "webflow_publish_job.partially_completed"
  | "webflow_publish_job.failed"
  | "webflow_publish_job.cancelled"
  | "webflow_bulk_job.created"
  | "webflow_bulk_job.cancelled"
  | "cloudinary_connection.created"
  | "cloudinary_connection.verified"
  | "cloudinary_connection.verification_failed"
  | "cloudinary_connection.credentials_updated"
  | "cloudinary_connection.public_delivery_acknowledged"
  | "cloudinary_connection.disabled"
  | "cloudinary_connection.enabled"
  | "cloudinary_connection.disconnected"
  | "cloudinary_connection.auto_degraded"
  | "cloudinary_publish_job.created"
  | "cloudinary_publish_job.completed"
  | "cloudinary_publish_job.partially_completed"
  | "cloudinary_publish_job.failed"
  | "cloudinary_publish_job.cancelled"
  | "cloudinary_bulk_job.created"
  | "cloudinary_bulk_job.cancelled"
  | "ai_metadata_batch.created"
  | "ai_metadata_batch.cancelled"
  | "ai_metadata_batch.retry"
  | "workflow.created"
  | "workflow.updated"
  | "workflow.enabled"
  | "workflow.disabled"
  | "workflow.deleted"
  | "workflow.duplicated"
  | "workflow_run.started"
  | "workflow_run.completed"
  | "workflow_run.failed"
  | "workflow_run.cancelled"
  | "workflow_run.retried"
  | "workflow.notification"
  | "comment.created"
  | "thread.resolved";

const MAX_SUMMARY_LENGTH = 500;

function truncate(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.slice(0, MAX_SUMMARY_LENGTH);
}

export async function writeIntegrationAudit(input: {
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  actorUserId: string | null;
  action: IntegrationAuditAction | string;
  targetEntityType: string;
  targetEntityId?: string | null;
  beforeSummary?: string | null;
  afterSummary?: string | null;
}): Promise<void> {
  const db = getDb();
  await db.insert(integrationAuditLogs).values({
    workspaceType: input.workspaceType,
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: input.action,
    targetEntityType: input.targetEntityType,
    targetEntityId: input.targetEntityId ?? null,
    beforeSummary: truncate(input.beforeSummary),
    afterSummary: truncate(input.afterSummary),
  });
}

export async function listIntegrationAuditLogs(params: {
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  limit?: number;
}) {
  const db = getDb();
  const limit = Math.min(Math.max(params.limit ?? 50, 1), 200);
  return db
    .select()
    .from(integrationAuditLogs)
    .where(
      and(
        eq(integrationAuditLogs.workspaceType, params.workspaceType),
        eq(integrationAuditLogs.workspaceId, params.workspaceId),
      ),
    )
    .orderBy(desc(integrationAuditLogs.createdAt))
    .limit(limit);
}
