import {z} from "zod";
import {GUEST_COMPRESS_OPERATION} from "@/server/guest/compress-policy";
import type {SafeGuestErrorCode} from "@/server/guest/errors";
import {guestCatch, guestFail, guestOk} from "@/server/guest/http";
import {requireGuestSessionFromRequest} from "@/server/guest/require-guest";
import {createGuestJob, toGuestJobPublic} from "@/server/guest/processing-service";

export const runtime = "nodejs";

const bodySchema = z.object({
  uploadId: z.string().uuid(),
  operation: z.string().max(64).optional(),
  options: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  try {
    const {session} = await requireGuestSessionFromRequest(request);
    const raw = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) return guestFail("INVALID_REQUEST");

    const job = await createGuestJob({
      session,
      uploadId: parsed.data.uploadId,
      operation: parsed.data.operation ?? GUEST_COMPRESS_OPERATION,
      options: parsed.data.options,
    });

    if (job.status === "failed") {
      const code = (job.errorCode ?? "INTERNAL_ERROR") as SafeGuestErrorCode;
      return guestFail(code);
    }

    return guestOk(toGuestJobPublic(job));
  } catch (error) {
    return guestCatch(error);
  }
}
