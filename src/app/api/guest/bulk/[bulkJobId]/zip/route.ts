import {guestCatch, guestFail, guestOk} from "@/server/guest/http";
import {requireGuestSessionFromRequest} from "@/server/guest/require-guest";
import {createGuestBulkZip} from "@/server/guest/bulk-service";

export const runtime = "nodejs";

type Ctx = {params: Promise<{bulkJobId: string}>};

export async function POST(request: Request, ctx: Ctx) {
  try {
    const {session} = await requireGuestSessionFromRequest(request);
    const {bulkJobId} = await ctx.params;
    if (!bulkJobId) return guestFail("INVALID_REQUEST");
    const result = await createGuestBulkZip({session, bulkJobId});
    return guestOk({
      url: result.url,
      expiresAt: result.expiresAt,
      bytes: result.bytes,
      filename: result.filename,
    });
  } catch (error) {
    return guestCatch(error);
  }
}
