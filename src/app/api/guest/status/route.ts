import {guestCatch, guestFail, guestOk} from "@/server/guest/http";
import {requireGuestSessionFromRequest} from "@/server/guest/require-guest";
import {toPublicSession} from "@/server/guest/session-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const {session} = await requireGuestSessionFromRequest(request);
    const pub = await toPublicSession(session);
    return guestOk({
      publicId: pub.publicId,
      expiresAt: pub.expiresAt,
      createdAt: pub.createdAt,
      toolCode: pub.toolCode,
      cohort: pub.cohort,
      operationsUsed: pub.operationsUsed,
      operationsLimit: pub.operationsLimit,
      policy: pub.policy,
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      const code = (error as {code: string}).code;
      if (code === "GUEST_SESSION_ACCESS_DENIED") {
        // Soft response for bootstrap probes — browsers console.error real 403s.
        // Body remains {ok:false,error} so ensureGuestSession creates a cookie next.
        return guestFail("GUEST_SESSION_ACCESS_DENIED", 200);
      }
      if (code === "GUEST_SESSION_EXPIRED") {
        return guestFail("GUEST_SESSION_EXPIRED");
      }
    }
    return guestCatch(error);
  }
}
