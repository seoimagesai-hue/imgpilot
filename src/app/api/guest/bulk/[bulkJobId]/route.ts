import {guestCatch, guestFail, guestOk} from "@/server/guest/http";
import {requireGuestSessionFromRequest} from "@/server/guest/require-guest";
import {getGuestBulkJob, toPublicBulkJob} from "@/server/guest/bulk-service";

export const runtime = "nodejs";

type Ctx = {params: Promise<{bulkJobId: string}>};

export async function GET(request: Request, ctx: Ctx) {
  try {
    const {session} = await requireGuestSessionFromRequest(request);
    const {bulkJobId} = await ctx.params;
    if (!bulkJobId) return guestFail("INVALID_REQUEST");
    const result = await getGuestBulkJob({session, bulkJobId});
    return guestOk(toPublicBulkJob(result.job, result.items));
  } catch (error) {
    return guestCatch(error);
  }
}
