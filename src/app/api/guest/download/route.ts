import {z} from "zod";
import {guestCatch, guestFail, guestOk} from "@/server/guest/http";
import {requireGuestSessionFromRequest} from "@/server/guest/require-guest";
import {createGuestSignedDownload} from "@/server/guest/download-service";

export const runtime = "nodejs";

const bodySchema = z
  .object({
    jobId: z.string().uuid().optional(),
    uploadId: z.string().uuid().optional(),
  })
  .refine((v) => Boolean(v.jobId || v.uploadId), {message: "jobId or uploadId required"});

export async function POST(request: Request) {
  try {
    const {session} = await requireGuestSessionFromRequest(request);
    const raw = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) return guestFail("INVALID_REQUEST");

    const result = await createGuestSignedDownload({
      session,
      jobId: parsed.data.jobId,
      uploadId: parsed.data.uploadId,
    });
    return guestOk({url: result.url, expiresAt: result.expiresAt});
  } catch (error) {
    return guestCatch(error);
  }
}
