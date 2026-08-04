/**
 * Prompt 30 — fixed allow-lists and pure helpers for the workflow engine.
 */
import type {WorkflowActionType, WorkflowTriggerType} from "@/db/schema";
import {WorkflowError} from "@/server/workflows/errors";
import {isResizePresetId} from "@/server/images/resize-policy";
import {isConversionTargetFormat} from "@/server/images/conversion-policy";

export const WORKFLOW_LEASE_TTL_MS = 2 * 60 * 1000;
export const WORKFLOW_CLAIM_BATCH = 5;
export const WORKFLOW_MAX_STEPS = 30;
export const WORKFLOW_NAME_MAX = 120;
export const WORKFLOW_MAX_CONCURRENT_DEFAULT = 2;

export const WORKFLOW_TRIGGER_TYPES = [
  "image.uploaded",
  "image.validated",
  "metadata.approved",
  "processing.completed",
  "bulk.processing.completed",
  "image.published",
  "manual",
  "scheduled",
] as const satisfies readonly WorkflowTriggerType[];

export const WORKFLOW_ACTION_TYPES = [
  "validate_image",
  "optimize",
  "resize",
  "convert_format",
  "generate_metadata",
  "generate_metadata_batch",
  "wait_metadata_approval",
  "publish_cloudinary",
  "export_csv",
  "export_json",
  "send_webhook",
  "update_status",
  "notify_user",
] as const satisfies readonly WorkflowActionType[];

export const SCHEDULE_INTERVALS = ["hourly", "daily", "weekly"] as const;
export type ScheduleInterval = (typeof SCHEDULE_INTERVALS)[number];

export function isWorkflowTriggerType(value: string): value is WorkflowTriggerType {
  return (WORKFLOW_TRIGGER_TYPES as readonly string[]).includes(value);
}

export function isWorkflowActionType(value: string): value is WorkflowActionType {
  return (WORKFLOW_ACTION_TYPES as readonly string[]).includes(value);
}

export function isScheduleInterval(value: string): value is ScheduleInterval {
  return (SCHEDULE_INTERVALS as readonly string[]).includes(value);
}

/** Maps inbound domain / webhook events onto workflow trigger types. */
export function mapDomainEventToTrigger(eventType: string): WorkflowTriggerType | null {
  switch (eventType) {
    case "image.uploaded":
      return "image.uploaded";
    case "image.validated":
      return "image.validated";
    case "metadata.approved":
      return "metadata.approved";
    case "processing.completed":
      return "processing.completed";
    case "bulk.processing.completed":
      return "bulk.processing.completed";
    case "cloudinary.publish.completed":
    case "wordpress.publish.completed":
    case "shopify.publish.completed":
    case "webflow.publish.completed":
    case "image.published":
      return "image.published";
    default:
      return null;
  }
}

export type ConditionConfig = {
  format?: string;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  maxBytes?: number;
  language?: string;
  processingStatus?: string;
  metadataApproved?: boolean;
  published?: boolean;
};

export type WorkflowRunContext = {
  projectId?: string | null;
  imageId?: string | null;
  language?: string | null;
  format?: string | null;
  width?: number | null;
  height?: number | null;
  byteSize?: number | null;
  processingStatus?: string | null;
  metadataApproved?: boolean;
  published?: boolean;
  workspaceType?: string;
  workspaceId?: string;
  organizationId?: string | null;
  derivativeId?: string | null;
  connectionId?: string | null;
  actorUserId?: string | null;
  [key: string]: unknown;
};

export function evaluateCondition(
  condition: ConditionConfig | null | undefined,
  ctx: WorkflowRunContext,
): boolean {
  if (!condition || Object.keys(condition).length === 0) return true;
  if (condition.format != null) {
    const fmt = (ctx.format ?? "").toLowerCase();
    if (fmt !== condition.format.toLowerCase()) return false;
  }
  if (condition.minWidth != null && (ctx.width == null || ctx.width < condition.minWidth)) return false;
  if (condition.maxWidth != null && (ctx.width == null || ctx.width > condition.maxWidth)) return false;
  if (condition.minHeight != null && (ctx.height == null || ctx.height < condition.minHeight)) return false;
  if (condition.maxHeight != null && (ctx.height == null || ctx.height > condition.maxHeight)) return false;
  if (condition.maxBytes != null && (ctx.byteSize == null || ctx.byteSize > condition.maxBytes)) return false;
  if (condition.language != null && (ctx.language ?? "") !== condition.language) return false;
  if (
    condition.processingStatus != null &&
    (ctx.processingStatus ?? "") !== condition.processingStatus
  ) {
    return false;
  }
  if (condition.metadataApproved != null && Boolean(ctx.metadataApproved) !== condition.metadataApproved) {
    return false;
  }
  if (condition.published != null && Boolean(ctx.published) !== condition.published) return false;
  return true;
}

export function assertActionConfig(actionType: WorkflowActionType, config: Record<string, unknown> | null | undefined) {
  const c = config ?? {};
  switch (actionType) {
    case "resize": {
      const preset = String(c.preset ?? "");
      if (!isResizePresetId(preset)) {
        throw new WorkflowError("WORKFLOW_INVALID_ACTION", "Resize requires a fixed preset (e.g. px_512).");
      }
      return;
    }
    case "convert_format": {
      const format = String(c.format ?? "").toLowerCase();
      if (!isConversionTargetFormat(format)) {
        throw new WorkflowError("WORKFLOW_INVALID_ACTION", "Convert requires an allowed target format.");
      }
      return;
    }
    case "publish_cloudinary": {
      if (!c.connectionId || typeof c.connectionId !== "string") {
        throw new WorkflowError("WORKFLOW_INVALID_ACTION", "Cloudinary publish requires connectionId.");
      }
      return;
    }
    case "generate_metadata_batch": {
      const templateCode = String(c.templateCode ?? c.template ?? "seo");
      if (!["seo", "accessibility", "ecommerce"].includes(templateCode)) {
        throw new WorkflowError("WORKFLOW_INVALID_ACTION", "Metadata batch requires a fixed template (seo, accessibility, ecommerce).");
      }
      const language = String(c.language ?? "en");
      if (language !== "en" && language !== "ur") {
        throw new WorkflowError("WORKFLOW_INVALID_ACTION", "Metadata batch language must be en or ur.");
      }
      return;
    }
    case "send_webhook": {
      // Uses workspace outbound webhooks — event type must be workflow.* or an existing safe type.
      return;
    }
    default:
      return;
  }
}

export function nextScheduleDate(interval: ScheduleInterval, from = new Date()): Date {
  const d = new Date(from.getTime());
  if (interval === "hourly") d.setHours(d.getHours() + 1);
  else if (interval === "daily") d.setDate(d.getDate() + 1);
  else d.setDate(d.getDate() + 7);
  return d;
}

/** Event an async step waits for after creating a child job. */
export function waitingEventForAction(actionType: WorkflowActionType): string | null {
  switch (actionType) {
    case "optimize":
    case "resize":
    case "convert_format":
      return "processing.completed";
    case "generate_metadata":
      return "metadata.draft_created";
    case "generate_metadata_batch":
      return "metadata_batch.completed";
    case "wait_metadata_approval":
      return "metadata.approved";
    case "publish_cloudinary":
      return "cloudinary.publish.completed";
    case "export_csv":
    case "export_json":
      return "export.completed";
    default:
      return null;
  }
}
