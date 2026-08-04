import {z} from "zod";
import {auth} from "@/auth";
import {createCheckoutSession} from "@/server/billing/checkout-service";
import {isConsumerCheckoutInterval} from "@/server/billing/pricing-view";

export const runtime = "nodejs";

const bodySchema = z.object({
  interval: z.enum(["month", "year"]),
  locale: z.enum(["en", "ur"]).optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return Response.json({ok: false, error: "UNAUTHORIZED"}, {status: 401});
  }
  const raw = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success || !isConsumerCheckoutInterval(parsed.data.interval)) {
    return Response.json({ok: false, error: "INVALID_REQUEST"}, {status: 400});
  }
  const result = await createCheckoutSession({
    userId,
    locale: parsed.data.locale ?? "en",
    interval: parsed.data.interval,
  });
  if ("error" in result) {
    const status =
      result.error === "STRIPE_NOT_CONFIGURED" || result.error === "PRICE_UNAVAILABLE"
        ? 503
        : result.error === "ALREADY_SUBSCRIBED"
          ? 409
          : 400;
    return Response.json({ok: false, error: result.error}, {status});
  }
  return Response.json({ok: true, url: result.url});
}
