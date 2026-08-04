import {z} from "zod";
import {and, eq} from "drizzle-orm";
import {getDb} from "@/db";
import {guestUploads} from "@/db/schema";
import {guestCatch, guestFail, guestOk} from "@/server/guest/http";
import {requireGuestSessionFromRequest} from "@/server/guest/require-guest";
import {inspectGuestUploadGps} from "@/server/guest/geotag-service";
import {GuestDomainError} from "@/server/guest/errors";
import {isGuestExpired} from "@/server/guest/guest-policy";

export const runtime = "nodejs";

const bodySchema = z.object({
  uploadId: z.string().uuid(),
});

/**
 * Safe GPS inspection for geotag UI — GPS fields only, no raw EXIF.
 */
export async function POST(request: Request) {
  try {
    const {session} = await requireGuestSessionFromRequest(request);
    if (isGuestExpired(session.expiresAt)) {
      return guestFail("GUEST_SESSION_EXPIRED");
    }
    const raw = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) return guestFail("INVALID_REQUEST");

    const db = getDb();
    const [upload] = await db
      .select()
      .from(guestUploads)
      .where(
        and(
          eq(guestUploads.id, parsed.data.uploadId),
          eq(guestUploads.sessionId, session.id),
          eq(guestUploads.status, "validated"),
        ),
      )
      .limit(1);
    if (!upload) return guestFail("OBJECT_NOT_FOUND");

    const result = await inspectGuestUploadGps({session, upload});
    return guestOk({
      uploadId: upload.id,
      formatSupported: result.formatSupported,
      gps: result.gps,
    });
  } catch (error) {
    if (error instanceof GuestDomainError) return guestFail(error.code);
    return guestCatch(error);
  }
}
