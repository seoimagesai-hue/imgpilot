import {getServerEnv} from "@/lib/env";
import {processStripeEvent} from "@/server/billing/stripe-webhooks";
import {getStripeClient, isStripeBillingConfigured} from "@/server/billing/stripe-client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isStripeBillingConfigured()) {
    return Response.json({ok: false, error: "STRIPE_NOT_CONFIGURED"}, {status: 503});
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ok: false, error: "MISSING_SIGNATURE"}, {status: 400});
  }
  const rawBody = await request.text();
  const env = getServerEnv();
  try {
    const stripe = getStripeClient(env);
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
    const result = await processStripeEvent(event);
    return Response.json({ok: true, duplicate: Boolean(result.duplicate)});
  } catch {
    return Response.json({ok: false, error: "WEBHOOK_REJECTED"}, {status: 400});
  }
}
