/**
 * Safe public pricing projection — no secrets, no Stripe IDs.
 */
import {
  AUTH_PUBLIC_BULK_MAX_BATCH_BYTES_DEFAULT,
  AUTH_PUBLIC_BULK_MAX_FILES_DEFAULT,
  GUEST_BULK_MAX_BATCH_BYTES_DEFAULT,
  GUEST_BULK_MAX_FILES_DEFAULT,
} from "@/lib/guest/bulk-policy";
import {getGuestMaxFileBytes, getGuestMaxOpsPerDay} from "@/lib/env";
import {
  getStripeConfigStatus,
  type StripeConfigStatus,
} from "@/server/billing/stripe-client";
import {
  isPaidCheckoutAvailable,
  listConsumerPricingPlans,
  type BillingInterval,
  type PlanDefinition,
} from "@/server/billing/plan-catalog";
import {GUEST_ASSET_TTL_MS} from "@/server/guest/guest-policy";

export type PublicPlanCard = {
  code: "guest" | "free" | "pro";
  displayName: string;
  description: string;
  checkoutAvailable: boolean;
  monthlyCheckoutAvailable: boolean;
  annualCheckoutAvailable: boolean;
  display: {
    maxProjects: number | null;
    maxFileBytes: number;
    bulkFiles: number;
    batchBytes: number;
    standardOpsPerPeriod: number | null;
    aiOpsPerPeriod: number | null;
    retentionHours: number | null;
    zipDownload: boolean;
    savedHistory: boolean;
    bulkCompress: boolean;
    bulkResize: boolean;
    bulkConvert: boolean;
    bulkAi: boolean;
    aiLiveRequiresProvider: true;
  };
};

export type PublicPricingView = {
  billingConfigured: boolean;
  stripeMode: StripeConfigStatus["mode"];
  paidLaunchReady: boolean;
  currency: "USD";
  pricesApproved: false;
  aiProviderNote: "unavailable_until_configured";
  guest: PublicPlanCard;
  plans: PublicPlanCard[];
};

function cardFromAccountPlan(
  plan: PlanDefinition,
  extras: {bulkFiles: number; batchBytes: number; maxFileBytes: number},
): PublicPlanCard {
  const monthly = isPaidCheckoutAvailable(plan.code as "pro", "month");
  const annual = isPaidCheckoutAvailable(plan.code as "pro", "year");
  return {
    code: plan.code === "pro" ? "pro" : "free",
    displayName: plan.displayName,
    description: plan.description,
    checkoutAvailable: plan.code === "pro" && (monthly || annual),
    monthlyCheckoutAvailable: plan.code === "pro" && monthly,
    annualCheckoutAvailable: plan.code === "pro" && annual,
    display: {
      maxProjects: plan.maxProjects,
      maxFileBytes: extras.maxFileBytes,
      bulkFiles: extras.bulkFiles,
      batchBytes: extras.batchBytes,
      standardOpsPerPeriod: plan.monthlyProcessingLimit,
      aiOpsPerPeriod: plan.monthlyAiLimit,
      retentionHours: null,
      zipDownload: true,
      savedHistory: true,
      bulkCompress: plan.bulkProcessingEnabled,
      bulkResize: plan.bulkProcessingEnabled,
      bulkConvert: plan.bulkProcessingEnabled,
      bulkAi: plan.code === "pro" ? plan.aiMetadataEnabled : false,
      aiLiveRequiresProvider: true,
    },
  };
}

export function getPublicPricingView(): PublicPricingView {
  const stripe = getStripeConfigStatus();
  const guestMaxFile = getGuestMaxFileBytes();
  const guestOps = getGuestMaxOpsPerDay();

  const guest: PublicPlanCard = {
    code: "guest",
    displayName: "Guest",
    description: "Try core tools without an account. Temporary storage only.",
    checkoutAvailable: false,
    monthlyCheckoutAvailable: false,
    annualCheckoutAvailable: false,
    display: {
      maxProjects: null,
      maxFileBytes: guestMaxFile,
      bulkFiles: GUEST_BULK_MAX_FILES_DEFAULT,
      batchBytes: GUEST_BULK_MAX_BATCH_BYTES_DEFAULT,
      standardOpsPerPeriod: guestOps,
      aiOpsPerPeriod: 0,
      retentionHours: Math.round(GUEST_ASSET_TTL_MS / (60 * 60 * 1000)),
      zipDownload: true,
      savedHistory: false,
      bulkCompress: true,
      bulkResize: true,
      bulkConvert: true,
      bulkAi: false,
      aiLiveRequiresProvider: true,
    },
  };

  const plans = listConsumerPricingPlans().map((plan) => {
    if (plan.code === "free") {
      return cardFromAccountPlan(plan, {
        maxFileBytes: guestMaxFile,
        bulkFiles: AUTH_PUBLIC_BULK_MAX_FILES_DEFAULT,
        batchBytes: AUTH_PUBLIC_BULK_MAX_BATCH_BYTES_DEFAULT,
      });
    }
    return cardFromAccountPlan(plan, {
      maxFileBytes: Math.max(guestMaxFile, 25 * 1024 * 1024),
      bulkFiles: Math.max(AUTH_PUBLIC_BULK_MAX_FILES_DEFAULT, 50),
      batchBytes: Math.max(AUTH_PUBLIC_BULK_MAX_BATCH_BYTES_DEFAULT, 200 * 1024 * 1024),
    });
  });

  return {
    billingConfigured: stripe.configured,
    stripeMode: stripe.mode,
    paidLaunchReady: stripe.configured && (stripe.proMonthlyConfigured || stripe.proAnnualConfigured),
    currency: "USD",
    pricesApproved: false,
    aiProviderNote: "unavailable_until_configured",
    guest,
    plans,
  };
}

export function isConsumerCheckoutInterval(value: string): value is BillingInterval {
  return value === "month" || value === "year";
}
