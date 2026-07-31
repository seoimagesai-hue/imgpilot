import {revalidatePath} from "next/cache";
import type {SafeLifecycleErrorCode} from "@/server/images/lifecycle-errors";

export function lifecycleErrorHttpStatus(error: SafeLifecycleErrorCode): number {
  if (error === "UNAUTHORIZED") return 401;
  if (
    error === "PROJECT_NOT_FOUND" ||
    error === "IMAGE_NOT_FOUND" ||
    error === "REPLACEMENT_NOT_FOUND" ||
    error === "IMAGE_ALREADY_DELETED"
  ) {
    return 404;
  }
  if (error === "STORAGE_NOT_CONFIGURED" || error === "STORAGE_UNAVAILABLE") return 503;
  if (
    error === "REPLACEMENT_PROMOTION_CONFLICT" ||
    error === "REPLACEMENT_ALREADY_ACTIVE" ||
    error === "IMAGE_DELETION_IN_PROGRESS"
  ) {
    return 409;
  }
  return 400;
}

export function revalidateProjectImageLibrary(projectId: string): void {
  revalidatePath(`/en/dashboard/projects/${projectId}/images`);
  revalidatePath(`/ur/dashboard/projects/${projectId}/images`);
}
