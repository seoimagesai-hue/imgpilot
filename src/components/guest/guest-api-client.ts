"use client";

import type {GuestJobPublic, GuestSessionPublic, GuestUploadPublic} from "@/server/guest/types";
import type {SafeGuestErrorCode} from "@/server/guest/errors";

type ApiOk<T> = {ok: true} & T;
type ApiErr = {ok: false; error: SafeGuestErrorCode};

async function parseJson<T>(res: Response): Promise<ApiOk<T> | ApiErr> {
  const data = (await res.json().catch(() => null)) as (ApiOk<T> | ApiErr) | null;
  if (!data || typeof data !== "object") {
    return {ok: false, error: "INTERNAL_ERROR"};
  }
  if (!("ok" in data)) return {ok: false, error: "INTERNAL_ERROR"};
  return data;
}

export async function ensureGuestSession(params?: {
  locale?: string;
  toolCode?: string;
}): Promise<ApiOk<Pick<GuestSessionPublic, "publicId" | "expiresAt" | "createdAt" | "toolCode" | "policy">> | ApiErr> {
  const statusRes = await fetch("/api/guest/status", {credentials: "include"});
  const status = await parseJson<GuestSessionPublic>(statusRes);
  if (status.ok) return status;

  const createRes = await fetch("/api/guest/session", {
    method: "POST",
    credentials: "include",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      locale: params?.locale,
      toolCode: params?.toolCode ?? "compress-image",
    }),
  });
  return parseJson(createRes);
}

export async function fetchGuestStatus(): Promise<ApiOk<GuestSessionPublic> | ApiErr> {
  const res = await fetch("/api/guest/status", {credentials: "include"});
  return parseJson(res);
}

export async function authorizeGuestUpload(input: {
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<
  | ApiOk<{
      uploadId: string;
      method: "PUT";
      uploadUrl: string;
      headers: Record<string, string>;
      expiresAt: string;
    }>
  | ApiErr
> {
  const res = await fetch("/api/guest/upload/authorize", {
    method: "POST",
    credentials: "include",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(input),
  });
  return parseJson(res);
}

export async function confirmGuestUpload(uploadId: string): Promise<ApiOk<GuestUploadPublic> | ApiErr> {
  const res = await fetch("/api/guest/upload/confirm", {
    method: "POST",
    credentials: "include",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({uploadId}),
  });
  return parseJson(res);
}

export async function putToPresignedUrl(
  uploadUrl: string,
  file: File,
  headers: Record<string, string>,
): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers,
    body: file,
  });
  if (!res.ok) {
    throw new Error("UPLOAD_PUT_FAILED");
  }
}

export async function createGuestToolJob(input: {
  uploadId: string;
  operation: string;
  options: Record<string, unknown>;
}): Promise<ApiOk<GuestJobPublic> | ApiErr> {
  const res = await fetch("/api/guest/jobs", {
    method: "POST",
    credentials: "include",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(input),
  });
  return parseJson(res);
}

/** @deprecated Prefer createGuestToolJob */
export async function createGuestCompressJob(input: {
  uploadId: string;
  quality: number;
  preset: string;
}): Promise<ApiOk<GuestJobPublic> | ApiErr> {
  return createGuestToolJob({
    uploadId: input.uploadId,
    operation: "compress.same_format",
    options: {quality: input.quality, preset: input.preset},
  });
}

export async function getGuestJob(jobId: string): Promise<ApiOk<GuestJobPublic> | ApiErr> {
  const res = await fetch(`/api/guest/jobs/${jobId}`, {credentials: "include"});
  return parseJson(res);
}

export async function createGuestDownload(jobId: string): Promise<ApiOk<{url: string; expiresAt: string}> | ApiErr> {
  const res = await fetch("/api/guest/download", {
    method: "POST",
    credentials: "include",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({jobId}),
  });
  return parseJson(res);
}

export async function inspectGuestGps(uploadId: string): Promise<
  | ApiOk<{
      uploadId: string;
      formatSupported: boolean;
      gps: {
        present: boolean;
        readable: boolean;
        latitude: number | null;
        longitude: number | null;
        altitudeMeters: number | null;
      };
    }>
  | ApiErr
> {
  const res = await fetch("/api/guest/geotag/inspect", {
    method: "POST",
    credentials: "include",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({uploadId}),
  });
  return parseJson(res);
}

export async function fetchGuestAiAltStatus(): Promise<
  ApiOk<{configured: boolean; provider: "openai" | null}> | ApiErr
> {
  const res = await fetch("/api/guest/alt-text/status", {credentials: "include"});
  return parseJson(res);
}

export async function saveGuestMetadataEditorDraft(input: {
  jobId: string;
  draft: unknown;
  validate?: boolean;
}): Promise<ApiOk<GuestJobPublic> | ApiErr> {
  const res = await fetch("/api/guest/metadata-editor/draft", {
    method: "POST",
    credentials: "include",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(input),
  });
  return parseJson(res);
}

export async function importGuestMetadataEditorAi(jobId: string): Promise<ApiOk<GuestJobPublic> | ApiErr> {
  const res = await fetch("/api/guest/metadata-editor/ai-import", {
    method: "POST",
    credentials: "include",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({jobId}),
  });
  return parseJson(res);
}

export async function createGuestRenamedDownload(input: {
  uploadId: string;
  filenameBase: string;
}): Promise<ApiOk<{url: string; expiresAt: string; filename: string}> | ApiErr> {
  const res = await fetch("/api/guest/metadata-editor/renamed-download", {
    method: "POST",
    credentials: "include",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(input),
  });
  return parseJson(res);
}
