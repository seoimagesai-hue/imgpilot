import type {GuestCohort, GuestPublicPolicy, GuestToolCode} from "@/server/guest/guest-policy";
import type {GuestJobStatus} from "@/server/guest/processing-policy";

export type GuestSessionPublic = {
  publicId: string;
  expiresAt: string;
  createdAt: string;
  toolCode: GuestToolCode;
  cohort: GuestCohort;
  operationsUsed: number;
  operationsLimit: number;
  policy: GuestPublicPolicy;
};

export type GuestUploadPublic = {
  uploadId: string;
  status: string;
  mimeType: string | null;
  sizeBytes: number | null;
  width: number | null;
  height: number | null;
  hasAlpha: boolean | null;
  expiresAt: string;
};

export type GuestJobPublic = {
  jobId: string;
  status: GuestJobStatus;
  operation: string;
  expiresAt: string;
  errorCode: string | null;
  completedAt: string | null;
  resultSummary: {
    inputBytes?: number;
    outputBytes?: number;
    savedBytes?: number;
    savedPercent?: number;
    quality?: number;
    preset?: string;
    width?: number;
    height?: number;
    mimeType?: string;
    durationMs?: number;
  } | null;
};

export type GuestAuthorizeUploadResult = {
  uploadId: string;
  method: "PUT";
  uploadUrl: string;
  headers: Record<string, string>;
  expiresAt: string;
};
