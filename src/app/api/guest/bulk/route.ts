import {z} from "zod";
import {auth} from "@/auth";
import {guestCatch, guestFail, guestOk} from "@/server/guest/http";
import {requireGuestSessionFromRequest} from "@/server/guest/require-guest";
import {
  createGuestBulkJob,
  resolveGuestBulkPolicy,
  toPublicBulkJob,
} from "@/server/guest/bulk-service";

export const runtime = "nodejs";

const bodySchema = z.object({
  toolCode: z.enum(["compress", "resize", "convert"]),
  options: z.record(z.string(), z.unknown()).optional(),
  files: z
    .array(
      z.object({
        originalFilename: z.string().min(1).max(200),
        mimeType: z.string().min(3).max(100),
        sizeBytes: z.number().int().positive().max(50 * 1024 * 1024),
      }),
    )
    .min(1)
    .max(50),
});

export async function GET(request: Request) {
  try {
    await requireGuestSessionFromRequest(request);
    const sessionAuth = await auth();
    const policy = resolveGuestBulkPolicy({authenticated: Boolean(sessionAuth?.user?.id)});
    return guestOk({policy});
  } catch (error) {
    return guestCatch(error);
  }
}

export async function POST(request: Request) {
  try {
    const {session} = await requireGuestSessionFromRequest(request);
    const sessionAuth = await auth();
    const raw = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) return guestFail("INVALID_REQUEST");

    const result = await createGuestBulkJob({
      session,
      toolCode: parsed.data.toolCode,
      options: parsed.data.options,
      files: parsed.data.files,
      authenticated: Boolean(sessionAuth?.user?.id),
    });
    return guestOk(toPublicBulkJob(result.job, result.items));
  } catch (error) {
    return guestCatch(error);
  }
}
