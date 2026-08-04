import {z} from "zod";
import {guestCatch, guestFail, guestOk} from "@/server/guest/http";
import {requireGuestSessionFromRequest} from "@/server/guest/require-guest";
import {confirmGuestUpload} from "@/server/guest/upload-service";

export const runtime = "nodejs";

const bodySchema = z.object({
  uploadId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const {session} = await requireGuestSessionFromRequest(request);
    const raw = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) return guestFail("INVALID_REQUEST");

    const upload = await confirmGuestUpload({
      session,
      uploadId: parsed.data.uploadId,
    });

    return guestOk({
      uploadId: upload.id,
      status: upload.status,
      mimeType: upload.detectedMimeType,
      sizeBytes: upload.sizeBytes,
      width: upload.width,
      height: upload.height,
      hasAlpha: upload.hasAlpha,
      expiresAt: upload.expiresAt.toISOString(),
    });
  } catch (error) {
    return guestCatch(error);
  }
}
