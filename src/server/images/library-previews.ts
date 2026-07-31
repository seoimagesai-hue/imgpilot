/**
 * Sign short-lived private previews for validated/ready images on the current page only.
 * Never signs unvalidated/failed/deleted rows. Never logs full URLs.
 */
import {createOwnedImageReadUrl} from "@/server/images/upload-service";
import {isPreviewableStatus} from "@/server/images/ready-eligibility";
import {isDeletionUnavailableStatus} from "@/server/images/lifecycle-errors";
import type {LibraryImageListItem} from "@/server/images/library-queries";

export type LibraryImageWithPreview = LibraryImageListItem & {
  previewUrl: string | null;
  previewExpiresAt: string | null;
};

export async function attachCurrentPagePreviews(params: {
  userId: string;
  projectId: string;
  items: LibraryImageListItem[];
}): Promise<LibraryImageWithPreview[]> {
  return Promise.all(
    params.items.map(async (item) => {
      if (!isPreviewableStatus(item.status) || isDeletionUnavailableStatus(item.status)) {
        return {...item, previewUrl: null, previewExpiresAt: null};
      }
      try {
        const signed = await createOwnedImageReadUrl({
          userId: params.userId,
          projectId: params.projectId,
          imageId: item.id,
        });
        if (!signed.ok) {
          return {...item, previewUrl: null, previewExpiresAt: null};
        }
        return {
          ...item,
          previewUrl: signed.url,
          previewExpiresAt: signed.expiresAt,
        };
      } catch {
        console.error("[library] preview sign failed");
        return {...item, previewUrl: null, previewExpiresAt: null};
      }
    }),
  );
}
