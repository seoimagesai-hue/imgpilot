import {guestOk, guestCatch} from "@/server/guest/http";
import {getGuestAiPublicStatus} from "@/server/guest/ai-alt-provider";

export const runtime = "nodejs";

/**
 * Safe AI configuration status for guest alt-text UI.
 * Never returns API keys, model org IDs, or provider error bodies.
 */
export async function GET() {
  try {
    const status = getGuestAiPublicStatus();
    return guestOk({
      configured: status.configured,
      provider: status.provider,
    });
  } catch (error) {
    return guestCatch(error);
  }
}
