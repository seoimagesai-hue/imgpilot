/** Minimal metadata-review-service stub for Phase 1 typecheck. */
import type {ApprovedMetadataDto} from "@/server/images/ai-metadata-service";

export const METADATA_BULK_MAX = 50;
export const METADATA_BULK_CONCURRENCY = 5;

export type MetadataReviewRow = {
  imageId: string;
  originalFilename: string;
  approved: ApprovedMetadataDto | null;
};

export async function listMetadataReviewRows(_params: {
  userId: string;
  projectId: string;
  filter?: string;
  limit?: number;
}): Promise<{rows: MetadataReviewRow[]}> {
  return {rows: []};
}
