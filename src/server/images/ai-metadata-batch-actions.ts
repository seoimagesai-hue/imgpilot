"use server";

/**
 * Prompt 31 — dashboard server actions for AI metadata batches.
 */
import {revalidatePath} from "next/cache";
import {auth} from "@/auth";
import {projectIdSchema} from "@/server/projects/validation";
import {
  cancelAiMetadataBatch,
  createAiMetadataBatch,
  getAiMetadataBatchWithItems,
  listAiMetadataBatches,
  preflightAiMetadataBatch,
  retryFailedAiMetadataBatchItems,
  runAiMetadataBatch,
  type AiMetadataBatchDto,
  type AiMetadataBatchFilterSnapshot,
  type AiMetadataBatchItemDto,
  type PreflightAiMetadataBatchResult,
} from "@/server/images/ai-metadata-batch-service";
import type {SafeAiBatchErrorCode} from "@/server/images/ai-metadata-batch-errors";
import {
  bulkApproveBatchItems,
  bulkRejectBatchItems,
  listBatchReviewRows,
  type BatchReviewRow,
} from "@/server/images/ai-metadata-batch-review";
import type {AiMetadataBatchSelectionType} from "@/db/schema";

export type AiMetadataBatchActionState = {
  ok: boolean;
  error?: SafeAiBatchErrorCode | string;
  batch?: AiMetadataBatchDto;
  batches?: AiMetadataBatchDto[];
  items?: AiMetadataBatchItemDto[];
  preflight?: PreflightAiMetadataBatchResult;
  reviewRows?: BatchReviewRow[];
  attempted?: number;
  succeeded?: number;
  failed?: Array<{id: string; error: string}>;
  retried?: number;
};

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

function revalidateMetadata(projectId: string) {
  revalidatePath(`/dashboard/projects/${projectId}/metadata`);
  revalidatePath(`/dashboard/projects/${projectId}/ai-batches`);
}

export async function preflightMetadataBatchAction(
  _prev: AiMetadataBatchActionState,
  formData: FormData,
): Promise<AiMetadataBatchActionState> {
  const user = await requireUser();
  if (!user) return {ok: false, error: "UNAUTHORIZED"};
  const projectId = String(formData.get("projectId") ?? "");
  if (!projectIdSchema.safeParse(projectId).success) return {ok: false, error: "INVALID_REQUEST"};

  const imageIdsRaw = String(formData.get("imageIds") ?? "");
  const imageIds = imageIdsRaw ? imageIdsRaw.split(",").filter(Boolean) : undefined;
  const selectionType = (String(formData.get("selectionType") ?? "manual") ||
    "manual") as AiMetadataBatchSelectionType;
  const templateCode = String(formData.get("templateCode") ?? "seo");
  const language = String(formData.get("language") ?? "en");
  const filterSnapshot: AiMetadataBatchFilterSnapshot | undefined = formData.get("filterSnapshot")
    ? (JSON.parse(String(formData.get("filterSnapshot"))) as AiMetadataBatchFilterSnapshot)
    : undefined;

  const result = await preflightAiMetadataBatch({
    userId: user.id,
    projectId,
    imageIds,
    selectionType,
    filterSnapshot,
    templateCode,
    language,
    skipExistingDrafts: formData.get("skipExistingDrafts") === "true",
  });
  if (!result.ok) return {ok: false, error: result.error};
  return {ok: true, preflight: result.preflight};
}

export async function createMetadataBatchAction(
  _prev: AiMetadataBatchActionState,
  formData: FormData,
): Promise<AiMetadataBatchActionState> {
  const user = await requireUser();
  if (!user) return {ok: false, error: "UNAUTHORIZED"};
  const projectId = String(formData.get("projectId") ?? "");
  if (!projectIdSchema.safeParse(projectId).success) return {ok: false, error: "INVALID_REQUEST"};

  const imageIdsRaw = String(formData.get("imageIds") ?? "");
  const imageIds = imageIdsRaw ? imageIdsRaw.split(",").filter(Boolean) : undefined;
  const selectionType = (String(formData.get("selectionType") ?? "manual") ||
    "manual") as AiMetadataBatchSelectionType;
  const templateCode = String(formData.get("templateCode") ?? "seo");
  const language = String(formData.get("language") ?? "en");
  const idempotencyKey = String(formData.get("idempotencyKey") ?? "") || undefined;
  const filterSnapshot: AiMetadataBatchFilterSnapshot | undefined = formData.get("filterSnapshot")
    ? (JSON.parse(String(formData.get("filterSnapshot"))) as AiMetadataBatchFilterSnapshot)
    : undefined;

  const result = await createAiMetadataBatch({
    userId: user.id,
    projectId,
    imageIds,
    selectionType,
    filterSnapshot,
    templateCode,
    language,
    idempotencyKey,
    skipExistingDrafts: formData.get("skipExistingDrafts") === "true",
  });
  if (!result.ok) return {ok: false, error: result.error};
  revalidateMetadata(projectId);
  return {ok: true, batch: result.batch, items: result.items};
}

export async function listMetadataBatchesAction(projectId: string): Promise<AiMetadataBatchActionState> {
  const user = await requireUser();
  if (!user) return {ok: false, error: "UNAUTHORIZED"};
  if (!projectIdSchema.safeParse(projectId).success) return {ok: false, error: "INVALID_REQUEST"};
  const batches = await listAiMetadataBatches({userId: user.id, projectId});
  return {ok: true, batches};
}

export async function getMetadataBatchAction(
  projectId: string,
  batchId: string,
): Promise<AiMetadataBatchActionState> {
  const user = await requireUser();
  if (!user) return {ok: false, error: "UNAUTHORIZED"};
  const result = await getAiMetadataBatchWithItems({userId: user.id, projectId, batchId});
  if (!result.ok) return {ok: false, error: result.error};
  return {ok: true, batch: result.batch, items: result.items};
}

export async function cancelMetadataBatchAction(
  projectId: string,
  batchId: string,
): Promise<AiMetadataBatchActionState> {
  const user = await requireUser();
  if (!user) return {ok: false, error: "UNAUTHORIZED"};
  const result = await cancelAiMetadataBatch({userId: user.id, projectId, batchId});
  if (!result.ok) return {ok: false, error: result.error};
  revalidateMetadata(projectId);
  return {ok: true, batch: result.batch, items: result.items};
}

export async function retryMetadataBatchAction(
  projectId: string,
  batchId: string,
): Promise<AiMetadataBatchActionState> {
  const user = await requireUser();
  if (!user) return {ok: false, error: "UNAUTHORIZED"};
  const result = await retryFailedAiMetadataBatchItems({userId: user.id, projectId, batchId});
  if (!result.ok) return {ok: false, error: result.error};
  revalidateMetadata(projectId);
  return {ok: true, batch: result.batch, items: result.items, retried: result.retried};
}

export async function runMetadataBatchAction(
  projectId: string,
  batchId: string,
): Promise<AiMetadataBatchActionState> {
  const user = await requireUser();
  if (!user) return {ok: false, error: "UNAUTHORIZED"};
  const result = await runAiMetadataBatch({userId: user.id, projectId, batchId});
  if (!result.ok) return {ok: false, error: result.error};
  revalidateMetadata(projectId);
  return {ok: true, batch: result.batch, items: result.items};
}

export async function listBatchReviewRowsAction(
  projectId: string,
  batchId: string,
): Promise<AiMetadataBatchActionState> {
  const user = await requireUser();
  if (!user) return {ok: false, error: "UNAUTHORIZED"};
  const result = await listBatchReviewRows({userId: user.id, projectId, batchId});
  if (!result.ok) return {ok: false, error: result.error};
  return {ok: true, reviewRows: result.rows};
}

export async function bulkApproveBatchAction(
  projectId: string,
  batchId: string,
  generationIds: string[],
  confirmBulkApprove: true,
): Promise<AiMetadataBatchActionState> {
  const user = await requireUser();
  if (!user) return {ok: false, error: "UNAUTHORIZED"};
  const result = await bulkApproveBatchItems({
    userId: user.id,
    projectId,
    batchId,
    generationIds,
    confirmBulkApprove,
  });
  if (!result.ok) return {ok: false, error: result.error};
  revalidateMetadata(projectId);
  return {
    ok: true,
    attempted: result.attempted,
    succeeded: result.succeeded,
    failed: result.failed,
  };
}

export async function bulkRejectBatchAction(
  projectId: string,
  batchId: string,
  generationIds: string[],
  confirmBulkReject: true,
): Promise<AiMetadataBatchActionState> {
  const user = await requireUser();
  if (!user) return {ok: false, error: "UNAUTHORIZED"};
  const result = await bulkRejectBatchItems({
    userId: user.id,
    projectId,
    batchId,
    generationIds,
    confirmBulkReject,
  });
  if (!result.ok) return {ok: false, error: result.error};
  revalidateMetadata(projectId);
  return {
    ok: true,
    attempted: result.attempted,
    succeeded: result.succeeded,
    failed: result.failed,
  };
}

export type {
  AiMetadataBatchDto,
  AiMetadataBatchItemDto,
  PreflightAiMetadataBatchResult,
  BatchReviewRow,
  AiMetadataBatchFilterSnapshot,
};
