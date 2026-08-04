/**
 * Prompt 25 — shared /api/v1 handlers (minimal Phase 1 restore).
 */
import {createHmac} from "node:crypto";
import type {Project} from "@/db/schema";
import type {ApiPrincipal} from "@/server/api/auth";
import {ApiError} from "@/server/api/errors";
import {errorJson, successJson} from "@/server/api/http";
import {requireAuthSecret} from "@/lib/env";
import type {EmitWebhookEventInput} from "@/server/webhooks/events";
import {emitWebhookEvent} from "@/server/webhooks/events";

export type PublicProjectDto = {
  id: string;
  workspaceType: "personal" | "organization";
  organizationId: string | null;
  name: string;
  websiteUrl: string | null;
  description: string | null;
  metadataLanguage: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type PublicImageDto = {
  id: string;
  originalFilename: string;
  mimeType: string;
  detectedMimeType: string | null;
  detectedFormat: string | null;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  status: string;
  isAnimated: boolean | null;
  failureCode: string | null;
  uploadedAt: string | null;
  validatedAt: string | null;
  createdAt: string;
  colourSpace?: string | null;
  hasAlpha?: boolean | null;
  validationVersion?: string | null;
  validationAttempts?: number;
};

export async function withApiHandler(handler: () => Promise<Response>): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof ApiError) return errorJson(error);
    console.error("[api/v1] unhandled", error instanceof Error ? error.message : "unknown");
    return errorJson(new ApiError("INTERNAL_ERROR", "Internal server error."));
  }
}

export async function withIdempotentWrite(params: {
  principal: ApiPrincipal;
  request: Request;
  routeKey: string;
  requestBody: unknown;
  run: (idempotencyKey: string) => Promise<{status: number; data: unknown}>;
}): Promise<Response> {
  void params.routeKey;
  void params.requestBody;
  const idempotencyKey = params.request.headers.get("Idempotency-Key");
  if (!idempotencyKey) {
    throw new ApiError("IDEMPOTENCY_KEY_REQUIRED", "Idempotency-Key header is required.");
  }
  const result = await params.run(idempotencyKey);
  return successJson(result.data, undefined, result.status, params.principal.requestId);
}

export function mapDomainError(error: string): ApiError {
  const map: Record<string, ApiError["code"]> = {
    PROJECT_NOT_FOUND: "RESOURCE_NOT_FOUND",
    IMAGE_NOT_FOUND: "RESOURCE_NOT_FOUND",
    UNAUTHORIZED: "UNAUTHORIZED",
    FORBIDDEN: "FORBIDDEN",
    INVALID_REQUEST: "INVALID_REQUEST",
    STORAGE_NOT_CONFIGURED: "INTERNAL_ERROR",
    STORAGE_UNAVAILABLE: "INTERNAL_ERROR",
    projectLimitReached: "RESOURCE_CONFLICT",
    FEATURE_NOT_INCLUDED: "FORBIDDEN",
  };
  return new ApiError(map[error] ?? "INVALID_REQUEST", error);
}

export function mapThrownError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof Error) return mapDomainError(error.message);
  return new ApiError("INTERNAL_ERROR", "Internal server error.");
}

export function toPublicProject(project: Project): PublicProjectDto {
  return {
    id: project.id,
    workspaceType: project.workspaceType === "organization" ? "organization" : "personal",
    organizationId: project.organizationId ?? null,
    name: project.name,
    websiteUrl: project.websiteUrl ?? null,
    description: project.description ?? null,
    metadataLanguage: project.metadataLanguage,
    status: project.status,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    archivedAt: project.archivedAt ? project.archivedAt.toISOString() : null,
  };
}

export function toPublicImage(image: {
  id: string;
  originalFilename: string;
  mimeType: string;
  detectedMimeType?: string | null;
  detectedFormat?: string | null;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  status: string;
  isAnimated?: boolean | null;
  failureCode?: string | null;
  uploadedAt?: Date | null;
  validatedAt?: Date | null;
  createdAt: Date;
  colourSpace?: string | null;
  hasAlpha?: boolean | null;
  validationVersion?: string | null;
  validationAttempts?: number;
}): PublicImageDto {
  return {
    id: image.id,
    originalFilename: image.originalFilename,
    mimeType: image.mimeType,
    detectedMimeType: image.detectedMimeType ?? null,
    detectedFormat: image.detectedFormat ?? null,
    sizeBytes: image.sizeBytes,
    width: image.width ?? null,
    height: image.height ?? null,
    status: image.status,
    isAnimated: image.isAnimated ?? null,
    failureCode: image.failureCode ?? null,
    uploadedAt: image.uploadedAt ? image.uploadedAt.toISOString() : null,
    validatedAt: image.validatedAt ? image.validatedAt.toISOString() : null,
    createdAt: image.createdAt.toISOString(),
    colourSpace: image.colourSpace ?? null,
    hasAlpha: image.hasAlpha ?? null,
    validationVersion: image.validationVersion ?? null,
    validationAttempts: image.validationAttempts,
  };
}

function cursorSecret(): string {
  return requireAuthSecret();
}

export function encodePageCursor(page: number, principal: ApiPrincipal): string {
  const payload = Buffer.from(JSON.stringify({p: page, w: principal.workspaceId}), "utf8").toString(
    "base64url",
  );
  const sig = createHmac("sha256", cursorSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function decodePageCursor(cursor: string, principal: ApiPrincipal): number {
  const [payload, sig] = cursor.split(".");
  if (!payload || !sig) throw new ApiError("INVALID_CURSOR", "Invalid cursor.");
  const expected = createHmac("sha256", cursorSecret()).update(payload).digest("base64url");
  if (sig !== expected) throw new ApiError("INVALID_CURSOR", "Invalid cursor.");
  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
    p?: number;
    w?: string;
  };
  if (parsed.w !== principal.workspaceId || typeof parsed.p !== "number" || parsed.p < 1) {
    throw new ApiError("INVALID_CURSOR", "Invalid cursor.");
  }
  return Math.floor(parsed.p);
}

export async function safeEmitWebhookEvent(input: EmitWebhookEventInput): Promise<void> {
  try {
    await emitWebhookEvent(input);
  } catch {
    // best-effort
  }
}
