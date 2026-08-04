/**
 * Minimal Cloudinary publish stub — Phase 1 typecheck restore.
 */
import type {
  ApiWorkspaceType,
  CloudinaryDeliveryType,
  CloudinaryFilenameMode,
  CloudinaryPublishJob,
} from "@/db/schema";
import type {MetadataLanguage} from "@/server/projects/validation";

export type CloudinaryPublishJobDto = CloudinaryPublishJob;

export async function createPublishJob(_params: {
  userId: string;
  connectionId: string;
  projectId: string;
  imageId: string;
  derivativeId?: string | null;
  filenameMode: CloudinaryFilenameMode;
  deliveryType: CloudinaryDeliveryType;
  transformationPresets: string[];
  language: MetadataLanguage;
  idempotencyKey?: string | null;
  bulkParentId?: string | null;
}): Promise<CloudinaryPublishJobDto> {
  throw new Error("CLOUDINARY_UNAVAILABLE");
}

export async function retryPublishJob(_params: {
  userId: string;
  projectId: string;
  jobId: string;
}): Promise<CloudinaryPublishJobDto> {
  throw new Error("CLOUDINARY_UNAVAILABLE");
}

export async function recoverExpiredCloudinaryLeases(_params?: {
  limit?: number;
}): Promise<number> {
  return 0;
}

export async function listRecentPublishJobsForConnection(_params: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  connectionId: string;
  limit?: number;
}): Promise<CloudinaryPublishJobDto[]> {
  return [];
}

export async function listRecentPublishJobsForProject(_params: {
  userId: string;
  projectId: string;
  limit?: number;
}): Promise<CloudinaryPublishJobDto[]> {
  return [];
}
