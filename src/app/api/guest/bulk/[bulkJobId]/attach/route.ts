import {z} from "zod";
import {guestCatch, guestFail, guestOk} from "@/server/guest/http";
import {requireGuestSessionFromRequest} from "@/server/guest/require-guest";
import {attachUploadToBulkItem, getGuestBulkJob, toPublicBulkJob} from "@/server/guest/bulk-service";

export const runtime = "nodejs";

type Ctx = {params: Promise<{bulkJobId: string}>};

const bodySchema = z.object({
  itemId: z.string().uuid(),
  uploadId: z.string().uuid(),
});

export async function POST(request: Request, ctx: Ctx) {
  try {
    const {session} = await requireGuestSessionFromRequest(request);
    const {bulkJobId} = await ctx.params;
    const raw = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success || !bulkJobId) return guestFail("INVALID_REQUEST");

    await attachUploadToBulkItem({
      session,
      bulkJobId,
      itemId: parsed.data.itemId,
      uploadId: parsed.data.uploadId,
    });
    const result = await getGuestBulkJob({session, bulkJobId});
    return guestOk(toPublicBulkJob(result.job, result.items));
  } catch (error) {
    return guestCatch(error);
  }
}
