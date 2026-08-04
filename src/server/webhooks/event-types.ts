/**
 * Prompt 25 — webhook event type constants.
 * Split out from `events.ts` so client components can import the fixed event
 * list without pulling `@/db` into the client bundle.
 */
export const WEBHOOK_EVENT_TYPES = [
  "image.uploaded",
  "image.validated",
  "image.validation_failed",
  "image.deleted",
  "image.replaced",
  "processing.completed",
  "bulk.processing.completed",
  "processing.failed",
  "metadata.draft_created",
  "metadata.approved",
  "metadata.failed",
  "metadata_batch.started",
  "metadata_batch.completed",
  "metadata_batch.partially_completed",
  "metadata_batch.failed",
  "metadata_batch.cancelled",
  "metadata_batch.review_ready",
  "export.completed",
  "export.failed",
  "project.created",
  "project.archived",
  "wordpress.publish.completed",
  "wordpress.publish.partially_completed",
  "wordpress.publish.failed",
  "wordpress.connection.degraded",
  "shopify.publish.completed",
  "shopify.publish.partially_completed",
  "shopify.publish.failed",
  "shopify.connection.degraded",
  "webflow.publish.completed",
  "webflow.publish.partially_completed",
  "webflow.publish.failed",
  "webflow.connection.degraded",
  "webflow.mapping.stale",
  "cloudinary.publish.completed",
  "cloudinary.publish.partially_completed",
  "cloudinary.publish.failed",
  "cloudinary.connection.degraded",
  "workflow.run.started",
  "workflow.run.completed",
  "workflow.run.failed",
  "workflow.run.step",
  "comment.created",
  "comment.thread_resolved",
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];

export function isValidWebhookEventType(value: string): value is WebhookEventType {
  return (WEBHOOK_EVENT_TYPES as readonly string[]).includes(value);
}
