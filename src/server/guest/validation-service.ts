import {inspectAndFullyDecodeImage} from "@/server/images/image-inspector";
import {GuestDomainError} from "@/server/guest/errors";
import {
  GUEST_MAX_HEIGHT,
  GUEST_MAX_PIXELS,
  GUEST_MAX_WIDTH,
  isGuestExtensionAllowed,
  isGuestMimeAllowed,
  guestExtensionFromFilename,
} from "@/server/guest/upload-policy";
import {getGuestMaxFileBytes} from "@/lib/env";

export type GuestValidationResult = {
  mimeType: string;
  width: number;
  height: number;
  isAnimated: boolean;
  hasAlpha: boolean | null;
  sizeBytes: number;
};

export function validateGuestUploadDeclaration(params: {
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
}): void {
  if (!Number.isFinite(params.sizeBytes) || params.sizeBytes <= 0) {
    throw new GuestDomainError("INVALID_REQUEST");
  }
  if (params.sizeBytes > getGuestMaxFileBytes()) {
    throw new GuestDomainError("OBJECT_TOO_LARGE");
  }
  if (!isGuestMimeAllowed(params.mimeType)) {
    throw new GuestDomainError("UNSUPPORTED_MEDIA_TYPE");
  }
  const ext = guestExtensionFromFilename(params.originalFilename);
  if (!isGuestExtensionAllowed(ext)) {
    throw new GuestDomainError("UNSUPPORTED_MEDIA_TYPE");
  }
}

export async function validateGuestImageBuffer(
  buffer: Buffer,
): Promise<GuestValidationResult> {
  if (!buffer.length) throw new GuestDomainError("CORRUPT_IMAGE");
  if (buffer.length > getGuestMaxFileBytes()) {
    throw new GuestDomainError("OBJECT_TOO_LARGE");
  }
  try {
    const inspected = await inspectAndFullyDecodeImage(buffer);
    if (
      inspected.width > GUEST_MAX_WIDTH ||
      inspected.height > GUEST_MAX_HEIGHT ||
      inspected.pixelCount > GUEST_MAX_PIXELS
    ) {
      throw new GuestDomainError("VALIDATION_FAILED");
    }
    if (!isGuestMimeAllowed(inspected.mimeType)) {
      throw new GuestDomainError("UNSUPPORTED_MEDIA_TYPE");
    }
    return {
      mimeType: inspected.mimeType,
      width: inspected.width,
      height: inspected.height,
      isAnimated: inspected.isAnimated,
      hasAlpha: inspected.hasAlpha,
      sizeBytes: buffer.length,
    };
  } catch (error) {
    if (error instanceof GuestDomainError) throw error;
    throw new GuestDomainError("CORRUPT_IMAGE");
  }
}
