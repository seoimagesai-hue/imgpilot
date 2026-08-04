import {z} from "zod";
import {guestCatch, guestFail, guestOk} from "@/server/guest/http";
import {requireGuestSessionFromRequest} from "@/server/guest/require-guest";
import {authorizeGuestUpload} from "@/server/guest/upload-service";

export const runtime = "nodejs";

const bodySchema = z.object({
  originalFilename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(128),
  sizeBytes: z.number().int().positive(),
  contentType: z.string().min(1).max(128).optional(),
  byteLength: z.number().int().positive().optional(),
});

export async function POST(request: Request) {
  try {
    const {session} = await requireGuestSessionFromRequest(request);
    const raw = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) return guestFail("INVALID_REQUEST");

    const mimeType = parsed.data.mimeType || parsed.data.contentType || "";
    const sizeBytes = parsed.data.sizeBytes || parsed.data.byteLength || 0;
    const result = await authorizeGuestUpload({
      session,
      originalFilename: parsed.data.originalFilename,
      mimeType,
      sizeBytes,
    });
    return guestOk(result);
  } catch (error) {
    return guestCatch(error);
  }
}
