import Stripe from "stripe";
import {getClientEnv, getServerEnv} from "@/lib/env";

export type StripeConfigStatus = {
  configured: boolean;
  mode: "test" | "live" | "unconfigured";
  publishableConfigured: boolean;
  proMonthlyConfigured: boolean;
  proAnnualConfigured: boolean;
};

export function getStripeConfigStatus(env = getServerEnv()): StripeConfigStatus {
  const secret = (env.STRIPE_SECRET_KEY || "").trim();
  const webhook = (env.STRIPE_WEBHOOK_SECRET || "").trim();
  const pub = (getClientEnv().NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "").trim();
  const configured = Boolean(secret && webhook);
  let mode: StripeConfigStatus["mode"] = "unconfigured";
  if (configured) {
    mode = secret.startsWith("sk_live_") ? "live" : "test";
  }
  return {
    configured,
    mode,
    publishableConfigured: Boolean(pub),
    proMonthlyConfigured: Boolean((env.STRIPE_PRICE_PRO_MONTHLY || "").trim()),
    proAnnualConfigured: Boolean((env.STRIPE_PRICE_PRO_ANNUAL || "").trim()),
  };
}

export function isStripeBillingConfigured(env = getServerEnv()): boolean {
  return getStripeConfigStatus(env).configured;
}

let cached: Stripe | null = null;

export function getStripeClient(env = getServerEnv()): Stripe {
  const key = (env.STRIPE_SECRET_KEY || "").trim();
  if (!key) {
    throw new Error("STRIPE_NOT_CONFIGURED");
  }
  if (!cached) {
    cached = new Stripe(key, {
      apiVersion: "2025-08-27.basil",
      typescript: true,
    });
  }
  return cached;
}

/** Test helper */
export function __resetStripeClientForTests(): void {
  cached = null;
}
