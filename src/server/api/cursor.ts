/**
 * Prompt 25 — opaque, signed pagination cursors for public API list endpoints.
 * Cursors are base64url(JSON) + an HMAC-SHA256 signature keyed off AUTH_SECRET,
 * and are bound to the workspace that issued them so a leaked/guessed cursor
 * from one workspace can never be replayed against another.
 */
import {createHmac, timingSafeEqual} from "node:crypto";
import {requireAuthSecret} from "@/lib/env";
import {ApiError} from "@/server/api/errors";
import type {ApiWorkspaceType} from "@/db/schema";

type WorkspaceBinding = {
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
};

type CursorEnvelope<T> = {
  v: 1;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  payload: T;
};

function sign(encodedBody: string): string {
  const secret = requireAuthSecret();
  return createHmac("sha256", secret).update(encodedBody, "utf8").digest("base64url");
}

export function encodeCursor<T>(payload: T, binding: WorkspaceBinding): string {
  const envelope: CursorEnvelope<T> = {
    v: 1,
    workspaceType: binding.workspaceType,
    workspaceId: binding.workspaceId,
    payload,
  };
  const encodedBody = Buffer.from(JSON.stringify(envelope), "utf8").toString("base64url");
  const signature = sign(encodedBody);
  return `${encodedBody}.${signature}`;
}

export function decodeCursor<T>(cursor: string, binding: WorkspaceBinding): T {
  const parts = cursor.split(".");
  if (parts.length !== 2) {
    throw new ApiError("INVALID_CURSOR", "Malformed cursor.");
  }
  const [encodedBody, signature] = parts;
  if (!encodedBody || !signature) {
    throw new ApiError("INVALID_CURSOR", "Malformed cursor.");
  }

  const expectedSignature = sign(encodedBody);
  const expectedBuf = Buffer.from(expectedSignature, "base64url");
  const actualBuf = Buffer.from(signature, "base64url");
  if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
    throw new ApiError("INVALID_CURSOR", "Cursor signature is invalid.");
  }

  let envelope: CursorEnvelope<T>;
  try {
    envelope = JSON.parse(Buffer.from(encodedBody, "base64url").toString("utf8")) as CursorEnvelope<T>;
  } catch {
    throw new ApiError("INVALID_CURSOR", "Cursor could not be decoded.");
  }

  if (envelope.v !== 1) {
    throw new ApiError("INVALID_CURSOR", "Unsupported cursor version.");
  }
  if (
    envelope.workspaceType !== binding.workspaceType ||
    envelope.workspaceId !== binding.workspaceId
  ) {
    throw new ApiError("INVALID_CURSOR", "Cursor does not belong to this workspace.");
  }

  return envelope.payload;
}

/** Convenience shape for id + secondary sort key cursors (createdAt, etc). */
export type ListCursorPayload = {
  id: string;
  sortValue: string;
};

export function encodeListCursor(
  payload: ListCursorPayload,
  binding: WorkspaceBinding,
): string {
  return encodeCursor(payload, binding);
}

export function decodeListCursor(
  cursor: string,
  binding: WorkspaceBinding,
): ListCursorPayload {
  return decodeCursor<ListCursorPayload>(cursor, binding);
}
