import {guestCatch, guestFail, guestOk} from "@/server/guest/http";
import {requireGuestSessionFromRequest} from "@/server/guest/require-guest";
import {processGuestBulkJob, toPublicBulkJob} from "@/server/guest/bulk-service";

export const runtime = "nodejs";

type Ctx = {params: Promise<{bulkJobId: string}>};

export async function POST(request: Request, ctx: Ctx) {
  try {
    const {session} = await requireGuestSessionFromRequest(request);
    const {bulkJobId} = await ctx.params;
    if (!bulkJobId) return guestFail("INVALID_REQUEST");
    // Re-load session mid-flight via require already done; process uses sequential child jobs.
    const result = await processGuestBulkJob({session, bulkJobId});
    return guestOk(toPublicBulkJob(result.job, result.items));
  } catch (error) {
    return guestCatch(error);
  }
}
