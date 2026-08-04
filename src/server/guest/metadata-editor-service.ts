/**
 * Guest Metadata Editor — op-free draft prepare/save/import + renamed download.
 * No OpenAI calls. No R2 rename / pixel rewrite / embedded SEO metadata.
 */

import {and, desc, eq, inArray} from "drizzle-orm";
import {getDb} from "@/db";
import {guestJobs, guestUploads, type GuestJob, type GuestSession, type GuestUpload} from "@/db/schema";
import {getR2SignedUrlTtlSeconds, isR2Configured} from "@/lib/env";
import {
  GUEST_AI_ALT_OPERATION,
  GUEST_AI_SCHEMA_VERSION,
  type GuestAiAltResultSummary,
} from "@/server/guest/ai-alt-policy";
import {GuestDomainError} from "@/server/guest/errors";
import {isGuestExpired} from "@/server/guest/guest-policy";
import {clampGuestDownloadTtl} from "@/server/guest/download-policy";
import {
  defaultGuestEditorDraft,
  GUEST_METADATA_EDIT_OPERATION,
  GUEST_METADATA_EDITOR_SCHEMA,
  mapAiResultToEditorDraft,
  parseGuestEditorDraft,
  suggestedFilenameWithExtension,
  validateGuestEditorDraft,
  type GuestEditorDraft,
  type GuestEditorSourceMode,
  type GuestEditorValidation,
} from "@/server/guest/metadata-editor-policy";
import {assertGuestStorageKeyOwned} from "@/server/storage/keys";
import {getObjectStorageProvider} from "@/server/storage/provider";

export type GuestMetadataEditorPrepareOptions = {
  sourceMode: GuestEditorSourceMode;
};

export type GuestMetadataEditorResultSummary = {
  schemaVersion: typeof GUEST_METADATA_EDITOR_SCHEMA;
  uploadId: string;
  image: {
    originalFilename: string | null;
    format: string;
    mimeType: string | null;
    width: number | null;
    height: number | null;
    byteSize: number | null;
  };
  draft: GuestEditorDraft;
  validation: GuestEditorValidation | null;
  aiImportAvailable: boolean;
  preparedAt: string;
};

function formatFromMime(mime: string | null | undefined): string {
  const m = (mime || "").toLowerCase();
  if (m === "image/png") return "png";
  if (m === "image/webp") return "webp";
  if (m === "image/jpeg" || m === "image/jpg") return "jpeg";
  return "unknown";
}

export function isGuestMetadataEditorMime(mime: string | null | undefined): boolean {
  const m = (mime || "").toLowerCase();
  return m === "image/jpeg" || m === "image/jpg" || m === "image/png" || m === "image/webp";
}

export function parseGuestMetadataEditorPrepareOptions(
  raw: unknown,
): GuestMetadataEditorPrepareOptions {
  if (!raw || typeof raw !== "object") {
    return {sourceMode: "blank"};
  }
  const obj = raw as Record<string, unknown>;
  for (const banned of ["storageKey", "signedUrl", "prompt", "scrubbed", "htmlRaw"]) {
    if (banned in obj) throw new GuestDomainError("INVALID_REQUEST");
  }
  return {
    sourceMode: obj.sourceMode === "ai_import" ? "ai_import" : "blank",
  };
}

function isValidAiSummary(raw: unknown): raw is GuestAiAltResultSummary {
  if (!raw || typeof raw !== "object") return false;
  const s = raw as GuestAiAltResultSummary;
  if (s.schemaVersion !== GUEST_AI_SCHEMA_VERSION) return false;
  if ("scrubbed" in (raw as object)) return false;
  if (!s.result || typeof s.result !== "object") return false;
  return typeof s.result.altText === "string";
}

export async function findImportableAiAltJob(params: {
  sessionId: string;
  uploadId: string;
}): Promise<GuestJob | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(guestJobs)
    .where(
      and(
        eq(guestJobs.sessionId, params.sessionId),
        eq(guestJobs.uploadId, params.uploadId),
        eq(guestJobs.operation, GUEST_AI_ALT_OPERATION),
        eq(guestJobs.status, "completed"),
      ),
    )
    .orderBy(desc(guestJobs.completedAt))
    .limit(5);

  for (const row of rows) {
    if (isGuestExpired(row.expiresAt)) continue;
    if (isValidAiSummary(row.resultSummary)) return row;
  }
  return null;
}

async function loadOwnedValidatedUpload(params: {
  session: GuestSession;
  uploadId: string;
}): Promise<GuestUpload> {
  if (isGuestExpired(params.session.expiresAt)) {
    throw new GuestDomainError("GUEST_SESSION_EXPIRED");
  }
  const db = getDb();
  const [upload] = await db
    .select()
    .from(guestUploads)
    .where(
      and(
        eq(guestUploads.id, params.uploadId),
        eq(guestUploads.sessionId, params.session.id),
        eq(guestUploads.status, "validated"),
      ),
    )
    .limit(1);
  if (!upload) throw new GuestDomainError("GUEST_METADATA_EDITOR_SOURCE_NOT_READY");
  if (isGuestExpired(upload.expiresAt)) {
    throw new GuestDomainError("GUEST_METADATA_EDITOR_SOURCE_EXPIRED");
  }
  const mime = upload.detectedMimeType ?? upload.declaredMimeType;
  if (!isGuestMetadataEditorMime(mime)) {
    throw new GuestDomainError("UNSUPPORTED_MEDIA_TYPE");
  }
  return upload;
}

function buildSummary(params: {
  upload: GuestUpload;
  draft: GuestEditorDraft;
  validation: GuestEditorValidation | null;
  aiImportAvailable: boolean;
}): GuestMetadataEditorResultSummary {
  const mime = params.upload.detectedMimeType ?? params.upload.declaredMimeType;
  return {
    schemaVersion: GUEST_METADATA_EDITOR_SCHEMA,
    uploadId: params.upload.id,
    image: {
      originalFilename: params.upload.originalFilename,
      format: formatFromMime(mime),
      mimeType: mime,
      width: params.upload.width,
      height: params.upload.height,
      byteSize: params.upload.sizeBytes,
    },
    draft: params.draft,
    validation: params.validation,
    aiImportAvailable: params.aiImportAvailable,
    preparedAt: new Date().toISOString(),
  };
}

/**
 * Prepare or replace editor draft. Does not increment guest operations.
 * Does not call OpenAI.
 */
export async function upsertGuestMetadataEditorJob(params: {
  session: GuestSession;
  upload: GuestUpload;
  options?: unknown;
}): Promise<GuestJob> {
  if (isGuestExpired(params.session.expiresAt)) {
    throw new GuestDomainError("GUEST_SESSION_EXPIRED");
  }
  const prepare = parseGuestMetadataEditorPrepareOptions(params.options);
  const mime = params.upload.detectedMimeType ?? params.upload.declaredMimeType;
  if (!isGuestMetadataEditorMime(mime)) {
    throw new GuestDomainError("UNSUPPORTED_MEDIA_TYPE");
  }

  const aiJob = await findImportableAiAltJob({
    sessionId: params.session.id,
    uploadId: params.upload.id,
  });
  const aiAvailable = Boolean(aiJob);

  let draft = defaultGuestEditorDraft();
  if (prepare.sourceMode === "ai_import") {
    if (!aiJob || !isValidAiSummary(aiJob.resultSummary)) {
      throw new GuestDomainError("GUEST_METADATA_EDITOR_AI_RESULT_NOT_FOUND");
    }
    draft = mapAiResultToEditorDraft(aiJob.resultSummary.result);
  }

  const summary = buildSummary({
    upload: params.upload,
    draft,
    validation: null,
    aiImportAvailable: aiAvailable,
  });

  const db = getDb();
  // Scrub prior drafts for this upload to avoid accumulation of metadata content.
  await db
    .update(guestJobs)
    .set({
      options: {scrubbed: true},
      resultSummary: {scrubbed: true},
    })
    .where(
      and(
        eq(guestJobs.sessionId, params.session.id),
        eq(guestJobs.uploadId, params.upload.id),
        eq(guestJobs.operation, GUEST_METADATA_EDIT_OPERATION),
        inArray(guestJobs.status, ["completed", "failed", "cancelled", "queued", "running"]),
      ),
    );

  const now = new Date();
  const [job] = await db
    .insert(guestJobs)
    .values({
      sessionId: params.session.id,
      uploadId: params.upload.id,
      operation: GUEST_METADATA_EDIT_OPERATION,
      status: "completed",
      options: {
        schemaVersion: GUEST_METADATA_EDITOR_SCHEMA,
        sourceMode: draft.sourceMode,
      },
      resultSummary: summary,
      outputStorageKey: null,
      startedAt: now,
      completedAt: now,
      expiresAt: params.session.expiresAt,
    })
    .returning();
  if (!job) throw new GuestDomainError("INTERNAL_ERROR");
  return job;
}

export async function saveGuestMetadataEditorDraft(params: {
  session: GuestSession;
  jobId: string;
  draft: unknown;
  validate?: boolean;
}): Promise<GuestJob> {
  if (isGuestExpired(params.session.expiresAt)) {
    throw new GuestDomainError("GUEST_SESSION_EXPIRED");
  }
  const db = getDb();
  const [job] = await db
    .select()
    .from(guestJobs)
    .where(
      and(
        eq(guestJobs.id, params.jobId),
        eq(guestJobs.sessionId, params.session.id),
        eq(guestJobs.operation, GUEST_METADATA_EDIT_OPERATION),
      ),
    )
    .limit(1);
  if (!job || !job.uploadId) throw new GuestDomainError("JOB_NOT_FOUND");
  if (job.status !== "completed") throw new GuestDomainError("JOB_NOT_READY");
  if (isGuestExpired(job.expiresAt)) throw new GuestDomainError("GUEST_SESSION_EXPIRED");

  const upload = await loadOwnedValidatedUpload({
    session: params.session,
    uploadId: job.uploadId,
  });

  let draft: GuestEditorDraft;
  try {
    draft = parseGuestEditorDraft(params.draft);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "DRAFT_TOO_LARGE") {
      throw new GuestDomainError("GUEST_METADATA_EDITOR_FIELD_TOO_LONG");
    }
    throw new GuestDomainError("GUEST_METADATA_EDITOR_DRAFT_INVALID");
  }

  const validation = params.validate ? validateGuestEditorDraft(draft) : null;
  if (params.validate && validation && !validation.ok) {
    // Persist draft + validation; client reads issues. Not a hard HTTP error unless blocking
    // fields are structurally invalid (already stripped). Keep completed state.
  }

  const aiJob = await findImportableAiAltJob({
    sessionId: params.session.id,
    uploadId: upload.id,
  });
  const summary = buildSummary({
    upload,
    draft,
    validation,
    aiImportAvailable: Boolean(aiJob),
  });

  const [updated] = await db
    .update(guestJobs)
    .set({
      options: {
        schemaVersion: GUEST_METADATA_EDITOR_SCHEMA,
        sourceMode: draft.sourceMode,
      },
      resultSummary: summary,
      // expiresAt unchanged
    })
    .where(and(eq(guestJobs.id, job.id), eq(guestJobs.sessionId, params.session.id)))
    .returning();
  if (!updated) throw new GuestDomainError("INTERNAL_ERROR");
  return updated;
}

export async function importAiIntoGuestMetadataEditor(params: {
  session: GuestSession;
  jobId: string;
}): Promise<GuestJob> {
  if (isGuestExpired(params.session.expiresAt)) {
    throw new GuestDomainError("GUEST_SESSION_EXPIRED");
  }
  const db = getDb();
  const [job] = await db
    .select()
    .from(guestJobs)
    .where(
      and(
        eq(guestJobs.id, params.jobId),
        eq(guestJobs.sessionId, params.session.id),
        eq(guestJobs.operation, GUEST_METADATA_EDIT_OPERATION),
      ),
    )
    .limit(1);
  if (!job || !job.uploadId) throw new GuestDomainError("JOB_NOT_FOUND");
  if (isGuestExpired(job.expiresAt)) throw new GuestDomainError("GUEST_SESSION_EXPIRED");

  const aiJob = await findImportableAiAltJob({
    sessionId: params.session.id,
    uploadId: job.uploadId,
  });
  if (!aiJob || !isValidAiSummary(aiJob.resultSummary)) {
    throw new GuestDomainError("GUEST_METADATA_EDITOR_AI_RESULT_NOT_FOUND");
  }
  // Same session enforced by query; cross-upload impossible via uploadId match.
  if (aiJob.uploadId !== job.uploadId) {
    throw new GuestDomainError("GUEST_METADATA_EDITOR_AI_RESULT_NOT_ALLOWED");
  }

  const draft = mapAiResultToEditorDraft(aiJob.resultSummary.result);
  return saveGuestMetadataEditorDraft({
    session: params.session,
    jobId: job.id,
    draft,
    validate: false,
  });
}

export async function createGuestRenamedDownload(params: {
  session: GuestSession;
  uploadId: string;
  filenameBase: string;
}): Promise<{url: string; expiresAt: string; filename: string}> {
  if (!isR2Configured()) throw new GuestDomainError("STORAGE_NOT_CONFIGURED");
  if (isGuestExpired(params.session.expiresAt)) {
    throw new GuestDomainError("GUEST_SESSION_EXPIRED");
  }

  const upload = await loadOwnedValidatedUpload({
    session: params.session,
    uploadId: params.uploadId,
  });
  const mime = upload.detectedMimeType ?? upload.declaredMimeType;
  const filename = suggestedFilenameWithExtension(params.filenameBase, mime);
  if (!filename || filename.startsWith(".")) {
    throw new GuestDomainError("GUEST_METADATA_EDITOR_FILENAME_INVALID");
  }

  if (
    !assertGuestStorageKeyOwned({
      storageKey: upload.storageKey,
      sessionPublicId: params.session.publicId,
    })
  ) {
    throw new GuestDomainError("GUEST_METADATA_EDITOR_RENAMED_DOWNLOAD_FAILED");
  }

  const ttl = clampGuestDownloadTtl(getR2SignedUrlTtlSeconds());
  const provider = await getObjectStorageProvider();
  try {
    const signed = await provider.createSignedReadUrl(upload.storageKey, ttl, {
      downloadFilename: filename,
    });
    return {
      url: signed.url,
      expiresAt: signed.expiresAt.toISOString(),
      filename,
    };
  } catch {
    throw new GuestDomainError("GUEST_METADATA_EDITOR_RENAMED_DOWNLOAD_FAILED");
  }
}
