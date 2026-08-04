import {desc, eq} from "drizzle-orm";
import {getDb} from "@/db";
import {billingSubscriptions} from "@/db/schema";
import {getServerEnv} from "@/lib/env";
import {
  appBaseUrl,
  ensureStripeCustomerForUser,
} from "@/server/billing/billing-customers";
import {
  getPlan,
  isPaidCheckoutAvailable,
  resolvePriceIdFromEnv,
  type BillingInterval,
} from "@/server/billing/plan-catalog";
import {getStripeClient, isStripeBillingConfigured} from "@/server/billing/stripe-client";

export async function createCheckoutSession(params: {
  userId: string;
  locale: string;
  interval: BillingInterval;
}): Promise<{url: string} | {error: "STRIPE_NOT_CONFIGURED" | "PRICE_UNAVAILABLE" | "ALREADY_SUBSCRIBED" | "CHECKOUT_FAILED"}> {
  if (!isStripeBillingConfigured()) return {error: "STRIPE_NOT_CONFIGURED"};
  if (!isPaidCheckoutAvailable("pro", params.interval)) return {error: "PRICE_UNAVAILABLE"};

  const db = getDb();
  const [active] = await db
    .select()
    .from(billingSubscriptions)
    .where(eq(billingSubscriptions.userId, params.userId))
    .orderBy(desc(billingSubscriptions.updatedAt))
    .limit(1);
  if (active && (active.status === "active" || active.status === "trialing")) {
    return {error: "ALREADY_SUBSCRIBED"};
  }

  const plan = getPlan("pro");
  if (!plan) return {error: "PRICE_UNAVAILABLE"};
  const priceId = resolvePriceIdFromEnv(plan, params.interval);
  if (!priceId) return {error: "PRICE_UNAVAILABLE"};

  try {
    const {stripeCustomerId} = await ensureStripeCustomerForUser(params.userId);
    const stripe = getStripeClient();
    const base = appBaseUrl();
    const locale = params.locale === "ur" ? "ur" : "en";
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [{price: priceId, quantity: 1}],
      success_url: `${base}/${locale}/dashboard/settings/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/${locale}/dashboard/settings/billing?checkout=cancelled`,
      client_reference_id: params.userId,
      metadata: {userId: params.userId, planCode: "pro", interval: params.interval},
      subscription_data: {
        metadata: {userId: params.userId, planCode: "pro"},
      },
      allow_promotion_codes: false,
    });
    if (!session.url) return {error: "CHECKOUT_FAILED"};
    return {url: session.url};
  } catch {
    return {error: "CHECKOUT_FAILED"};
  }
}

export async function createBillingPortalSession(params: {
  userId: string;
  locale: string;
}): Promise<{url: string} | {error: "STRIPE_NOT_CONFIGURED" | "NO_CUSTOMER" | "PORTAL_FAILED"}> {
  if (!isStripeBillingConfigured()) return {error: "STRIPE_NOT_CONFIGURED"};
  try {
    const {stripeCustomerId} = await ensureStripeCustomerForUser(params.userId);
    const stripe = getStripeClient();
    const env = getServerEnv();
    const base = appBaseUrl();
    const locale = params.locale === "ur" ? "ur" : "en";
    const configuration = (env.STRIPE_CUSTOMER_PORTAL_CONFIGURATION_ID || "").trim() || undefined;
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${base}/${locale}/dashboard/settings/billing`,
      ...(configuration ? {configuration} : {}),
    });
    return {url: session.url};
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "STRIPE_NOT_CONFIGURED") return {error: "STRIPE_NOT_CONFIGURED"};
    return {error: "PORTAL_FAILED"};
  }
}
