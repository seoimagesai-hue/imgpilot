import {z} from "zod";
import {
  buildGuestSetCookieHeader,
} from "@/server/guest/cookie";
import {clientIpFromRequest, guestCatch, guestFail, guestOk, hashIpHint} from "@/server/guest/http";
import {createGuestSession} from "@/server/guest/session-service";

export const runtime = "nodejs";

const bodySchema = z.object({
  locale: z.enum(["en", "ur"]).optional(),
  toolCode: z.string().max(64).optional(),
});

export async function POST(request: Request) {
  try {
    const raw = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) return guestFail("INVALID_REQUEST");

    const ipHash = await hashIpHint(clientIpFromRequest(request));
    const {rawToken, public: pub, session} = await createGuestSession({
      locale: parsed.data.locale,
      toolCode: parsed.data.toolCode,
      ipHash,
      userAgent: request.headers.get("user-agent"),
    });

    return guestOk(
      {
        publicId: pub.publicId,
        expiresAt: pub.expiresAt,
        createdAt: pub.createdAt,
        toolCode: pub.toolCode,
        policy: pub.policy,
      },
      {
        headers: {
          "Set-Cookie": buildGuestSetCookieHeader(rawToken, session.expiresAt),
        },
      },
    );
  } catch (error) {
    return guestCatch(error);
  }
}
