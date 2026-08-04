import {guestCatch, guestFail, guestOk} from "@/server/guest/http";
import {requireGuestSessionFromRequest} from "@/server/guest/require-guest";
import {getGuestJobForSession, toGuestJobPublic} from "@/server/guest/processing-service";

export const runtime = "nodejs";

type Ctx = {params: Promise<{jobId: string}>};

export async function GET(request: Request, {params}: Ctx) {
  try {
    const {session} = await requireGuestSessionFromRequest(request);
    const {jobId} = await params;
    if (!jobId) return guestFail("INVALID_REQUEST");
    const job = await getGuestJobForSession(session.id, jobId);
    return guestOk(toGuestJobPublic(job));
  } catch (error) {
    return guestCatch(error);
  }
}
