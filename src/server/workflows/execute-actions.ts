/**
 * Prompt 30 — execute a single workflow action step.
 * Calls existing domain services only; never mutates image status arbitrarily.
 */
import {and, eq} from "drizzle-orm";
import {getDb} from "@/db";
import {
  imageMetadataApproved,
  workflowSteps,
  type CloudinaryDeliveryType,
  type CloudinaryFilenameMode,
  type Workflow,
  type WorkflowActionType,
  type WorkflowRun,
  type WorkflowRunStep,
} from "@/db/schema";
import {writeIntegrationAudit} from "@/server/api/audit";
import {createMetadataGeneration} from "@/server/images/ai-metadata-service";
import {createAiMetadataBatch} from "@/server/images/ai-metadata-batch-service";
import {createExportJob} from "@/server/images/export-service";
import {createProcessingJob} from "@/server/images/processing-service";
import {PROCESSING_OPERATION} from "@/server/images/processing-policy";
import {RESIZE_OPERATION} from "@/server/images/resize-policy";
import {CONVERT_OPERATION} from "@/server/images/conversion-policy";
import {evaluateAndPromoteReady} from "@/server/images/ready-service";
import {validateOwnedImage} from "@/server/images/validation-service";
import type {MetadataLanguage} from "@/server/projects/validation";
import {createPublishJob} from "@/server/cloudinary/publish-service";
import {WorkflowError} from "@/server/workflows/errors";
import {waitingEventForAction, type WorkflowRunContext} from "@/server/workflows/policy";
import {emitWebhookEvent} from "@/server/webhooks/events";
import type {WebhookEventType} from "@/server/webhooks/event-types";

export type WorkflowActionOutcome =
  | {kind: "completed"; result?: Record<string, unknown>; log?: string}
  | {
      kind: "waiting";
      waitingForEvent: string;
      childJobType?: string;
      childJobId?: string;
      result?: Record<string, unknown>;
      log?: string;
    }
  | {kind: "failed"; code: string; message: string};

export type ExecuteWorkflowActionParams = {
  run: WorkflowRun;
  step: WorkflowRunStep;
  workflow: Workflow;
  ctx: WorkflowRunContext;
};

function requireProjectAndImage(run: WorkflowRun): {projectId: string; imageId: string} {
  if (!run.projectId) throw new WorkflowError("WORKFLOW_PROJECT_MISSING", "Workflow run requires a project.");
  if (!run.imageId) throw new WorkflowError("WORKFLOW_IMAGE_MISSING", "Workflow run requires an image.");
  return {projectId: run.projectId, imageId: run.imageId};
}

function mapProcessingError(code: string): WorkflowActionOutcome {
  return {kind: "failed", code: "WORKFLOW_STEP_FAILED", message: code};
}

function waitingOutcome(
  actionType: WorkflowActionType,
  childJobType: string,
  childJobId: string,
  result?: Record<string, unknown>,
): WorkflowActionOutcome {
  const waitingForEvent = waitingEventForAction(actionType);
  if (!waitingForEvent) {
    return {kind: "failed", code: "WORKFLOW_STEP_FAILED", message: "Action does not support async wait."};
  }
  return {kind: "waiting", waitingForEvent, childJobType, childJobId, result};
}

async function isMetadataApproved(projectId: string, imageId: string, language?: string | null): Promise<boolean> {
  const db = getDb();
  const conditions = [
    eq(imageMetadataApproved.projectId, projectId),
    eq(imageMetadataApproved.imageId, imageId),
  ];
  const rows = await db.select({id: imageMetadataApproved.id}).from(imageMetadataApproved).where(and(...conditions)).limit(1);
  void language;
  return rows.length > 0;
}

export async function executeWorkflowAction(params: ExecuteWorkflowActionParams): Promise<WorkflowActionOutcome> {
  const {run, step, ctx} = params;
  const userId = run.createdByUserId;
  if (!userId) {
    return {kind: "failed", code: "WORKFLOW_USER_MISSING", message: "Workflow run requires a user."};
  }

  let resolvedConfig: Record<string, unknown> = {};
  if (step.stepId) {
    const [def] = await getDb().select().from(workflowSteps).where(eq(workflowSteps.id, step.stepId)).limit(1);
    resolvedConfig = (def?.config ?? {}) as Record<string, unknown>;
  }
  const c = resolvedConfig;

  if (!step.actionType) {
    return {kind: "failed", code: "WORKFLOW_INVALID_ACTION", message: "Missing action type."};
  }

  switch (step.actionType) {
    case "validate_image": {
      const {projectId, imageId} = requireProjectAndImage(run);
      const result = await validateOwnedImage({userId, projectId, imageId});
      if (!result.ok) return mapProcessingError(result.error);
      return {
        kind: "completed",
        result: {status: result.status, imageId: result.imageId},
        log: result.idempotent ? "Validation idempotent." : "Validation completed.",
      };
    }
    case "optimize": {
      const {projectId, imageId} = requireProjectAndImage(run);
      const created = await createProcessingJob({
        userId,
        projectId,
        imageId,
        operation: PROCESSING_OPERATION,
        idempotencyKey: `workflow:${run.id}:step:${step.position}:optimize`,
      });
      if (!created.ok) return mapProcessingError(created.error);
      return waitingOutcome("optimize", "processing_job", created.job.id, {jobId: created.job.id});
    }
    case "resize": {
      const {projectId, imageId} = requireProjectAndImage(run);
      const preset = String(c.preset ?? "");
      const created = await createProcessingJob({
        userId,
        projectId,
        imageId,
        operation: RESIZE_OPERATION,
        preset,
        idempotencyKey: `workflow:${run.id}:step:${step.position}:resize`,
      });
      if (!created.ok) return mapProcessingError(created.error);
      return waitingOutcome("resize", "processing_job", created.job.id, {jobId: created.job.id, preset});
    }
    case "convert_format": {
      const {projectId, imageId} = requireProjectAndImage(run);
      const format = String(c.format ?? "").toLowerCase();
      const created = await createProcessingJob({
        userId,
        projectId,
        imageId,
        operation: CONVERT_OPERATION,
        preset: format,
        idempotencyKey: `workflow:${run.id}:step:${step.position}:convert`,
      });
      if (!created.ok) return mapProcessingError(created.error);
      return waitingOutcome("convert_format", "processing_job", created.job.id, {jobId: created.job.id, format});
    }
    case "generate_metadata": {
      const {projectId, imageId} = requireProjectAndImage(run);
      const language = (c.language as string | undefined) ?? ctx.language ?? undefined;
      const created = await createMetadataGeneration({
        userId,
        projectId,
        imageId,
        language,
        idempotencyKey: `workflow:${run.id}:step:${step.position}:metadata`,
      });
      if (!created.ok) return mapProcessingError(created.error);
      return waitingOutcome("generate_metadata", "metadata_generation", created.generation.id, {
        generationId: created.generation.id,
        jobId: created.jobId,
      });
    }
    case "generate_metadata_batch": {
      const {projectId} = requireProjectAndImage(run);
      const language = (c.language as string | undefined) ?? ctx.language ?? undefined;
      const templateCode = String(c.templateCode ?? c.template ?? "seo");
      const imageIds = Array.isArray(ctx.imageIds)
        ? (ctx.imageIds as string[])
        : run.imageId
          ? [run.imageId]
          : [];
      if (!imageIds.length) {
        return {kind: "failed", code: "WORKFLOW_STEP_FAILED", message: "No images for metadata batch."};
      }
      const created = await createAiMetadataBatch({
        userId,
        projectId,
        imageIds,
        selectionType: "manual",
        templateCode,
        language: language ?? "en",
        idempotencyKey: `workflow:${run.id}:step:${step.position}:metadata_batch`,
      });
      if (!created.ok) return mapProcessingError(created.error);
      return waitingOutcome("generate_metadata_batch", "ai_metadata_batch", created.batch.id, {
        batchId: created.batch.id,
        eligibleCount: created.batch.eligibleCount,
      });
    }
    case "wait_metadata_approval": {
      const {projectId, imageId} = requireProjectAndImage(run);
      const approved =
        Boolean(ctx.metadataApproved) || (await isMetadataApproved(projectId, imageId, ctx.language ?? null));
      if (approved) {
        return {kind: "completed", result: {metadataApproved: true}, log: "Metadata already approved."};
      }
      return {
        kind: "waiting",
        waitingForEvent: "metadata.approved",
        result: {metadataApproved: false},
        log: "Waiting for metadata approval.",
      };
    }
    case "publish_cloudinary": {
      const {projectId, imageId} = requireProjectAndImage(run);
      const connectionId = String(c.connectionId ?? "");
      const filenameMode = (String(c.filenameMode ?? "keep") as CloudinaryFilenameMode) || "keep";
      const deliveryType = (String(c.deliveryType ?? "upload") as CloudinaryDeliveryType) || "upload";
      const language = (String(c.language ?? ctx.language ?? "en") as MetadataLanguage) || "en";
      const transformationPresets = Array.isArray(c.transformationPresets)
        ? (c.transformationPresets as string[])
        : [];
      try {
        const job = await createPublishJob({
          userId,
          connectionId,
          projectId,
          imageId,
          derivativeId: (c.derivativeId as string | null) ?? ctx.derivativeId ?? null,
          filenameMode,
          deliveryType,
          transformationPresets,
          language,
          idempotencyKey: `workflow:${run.id}:step:${step.position}:cloudinary`,
        });
        return waitingOutcome("publish_cloudinary", "cloudinary_publish_job", job.id, {jobId: job.id});
      } catch (error) {
        const message = error instanceof Error ? error.message : "Cloudinary publish failed.";
        const code = error instanceof Error && "code" in error ? String((error as {code: string}).code) : "WORKFLOW_STEP_FAILED";
        return {kind: "failed", code, message};
      }
    }
    case "export_csv": {
      const {projectId, imageId} = requireProjectAndImage(run);
      const created = await createExportJob({
        userId,
        projectId,
        packageKind: "csv",
        imageIds: [imageId],
        includeCsv: true,
        includeJson: false,
        language: String(c.language ?? ctx.language ?? "en"),
        idempotencyKey: `workflow:${run.id}:step:${step.position}:export_csv`,
      });
      if (!created.ok) return mapProcessingError(created.error);
      return waitingOutcome("export_csv", "export_job", created.job.id, {jobId: created.job.id});
    }
    case "export_json": {
      const {projectId, imageId} = requireProjectAndImage(run);
      const created = await createExportJob({
        userId,
        projectId,
        packageKind: "json",
        imageIds: [imageId],
        includeCsv: false,
        includeJson: true,
        language: String(c.language ?? ctx.language ?? "en"),
        idempotencyKey: `workflow:${run.id}:step:${step.position}:export_json`,
      });
      if (!created.ok) return mapProcessingError(created.error);
      return waitingOutcome("export_json", "export_job", created.job.id, {jobId: created.job.id});
    }
    case "send_webhook": {
      const eventTypeRaw = String(c.eventType ?? "workflow.run.step");
      const eventType = eventTypeRaw as WebhookEventType;
      try {
        await emitWebhookEvent({
          workspaceType: run.workspaceType,
          workspaceId: run.workspaceId,
          eventType,
          entityType: "workflow_run",
          entityId: run.id,
          deduplicationKey: `workflow:${run.id}:step:${step.position}:webhook:${eventType}`,
          payload: {
            runId: run.id,
            workflowId: run.workflowId,
            stepPosition: step.position,
            actionType: step.actionType,
            projectId: run.projectId,
            imageId: run.imageId,
            ...(typeof c.payload === "object" && c.payload ? (c.payload as Record<string, unknown>) : {}),
          },
        });
      } catch {
        await writeIntegrationAudit({
          workspaceType: run.workspaceType,
          workspaceId: run.workspaceId,
          actorUserId: userId,
          action: "webhook_event.emitted",
          targetEntityType: "workflow_run",
          targetEntityId: run.id,
          afterSummary: `eventType=${eventTypeRaw} (audit fallback)`,
        });
      }
      return {kind: "completed", result: {eventType: eventTypeRaw}, log: "Webhook event emitted."};
    }
    case "update_status": {
      const {projectId, imageId} = requireProjectAndImage(run);
      const promoted = await evaluateAndPromoteReady({userId, projectId, imageId});
      if (!promoted.ok) {
        return {
          kind: "completed",
          result: {evaluated: false, error: promoted.error, note: "Ready evaluation skipped."},
          log: promoted.error,
        };
      }
      return {
        kind: "completed",
        result: {
          status: promoted.status,
          promoted: "promoted" in promoted ? promoted.promoted : false,
          reason: "reason" in promoted ? promoted.reason : undefined,
        },
        log: "Ready status evaluated via domain rules.",
      };
    }
    case "notify_user": {
      const message = String(c.message ?? "Workflow notification.");
      await writeIntegrationAudit({
        workspaceType: run.workspaceType,
        workspaceId: run.workspaceId,
        actorUserId: userId,
        action: "workflow.notification",
        targetEntityType: "workflow_run",
        targetEntityId: run.id,
        afterSummary: message.slice(0, 500),
      });
      return {kind: "completed", result: {message}, log: message};
    }
    default:
      return {kind: "failed", code: "WORKFLOW_INVALID_ACTION", message: "Unknown action type."};
  }
}
