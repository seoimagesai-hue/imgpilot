/**
 * Server-controlled commercial plan catalog.
 * Prices are NOT invented — paid plans require configured Stripe Price IDs.
 * Free plan always available as operational fallback (maps current dev defaults).
 */

import {
  MAX_IMAGES_PER_PROJECT,
  MAX_PROJECT_STORAGE_BYTES,
} from "@/server/images/quota-policy";
import {MAX_GENERATED_OUTPUT_BYTES_PER_PROJECT} from "@/server/images/processing-policy";

export type PlanCode = "free" | "pro" | "starter" | "professional" | "agency";
export type BillingInterval = "month" | "year";

/** Consumer checkout sells Free + Pro only. Legacy codes remain for snapshots. */
export const CONSUMER_CHECKOUT_PLAN_CODES = ["pro"] as const;

export type PlanDefinition = {
  code: PlanCode;
  displayName: string;
  description: string;
  /** null = free / no Stripe price */
  monthlyPriceEnvKey: string | null;
  annualPriceEnvKey: string | null;
  /** Display amount only when Price ID configured — never invent customer-facing prices. */
  displayPriceConfiguredOnly: true;
  maxProjects: number;
  maxImagesPerProject: number;
  maxOriginalStorageBytes: number;
  maxGeneratedStorageBytes: number;
  /** -1 = unlimited within abuse safeguards */
  monthlyProcessingLimit: number;
  monthlyAiLimit: number;
  monthlyExportLimit: number;
  bulkProcessingEnabled: boolean;
  aiMetadataEnabled: boolean;
  exportEnabled: boolean;
  cmsExportEnabled: boolean;
  /** Prompt 24 — organizations architecture; no seat prices invented. */
  organizationsEnabled: boolean;
  /**
   * Prompt 25 — external API / webhooks (defaults; no invented seat/API prices).
   * Conservative caps for development until commercial packaging is approved.
   */
  apiAccessEnabled: boolean;
  webhooksEnabled: boolean;
  maxApiKeys: number;
  apiRequestsPerMinute: number;
  maxWebhookEndpoints: number;
  /**
   * Prompt 26 — WordPress publish integration (defaults; no invented prices).
   * Conservative caps for development until commercial packaging is approved.
   */
  wordpressEnabled: boolean;
  maxWordpressConnections: number;
  monthlyWordpressPublishLimit: number;
  maxWordpressBulkSize: number;
  /**
   * Prompt 27 — Shopify publish integration (defaults; no invented prices).
   * Mirrors the WordPress caps per tier until commercial packaging is approved.
   */
  shopifyEnabled: boolean;
  maxShopifyConnections: number;
  monthlyShopifyPublishLimit: number;
  maxShopifyBulkSize: number;
  /**
   * Prompt 28 — Webflow CMS publish integration (defaults; no invented prices).
   * Mirrors the Shopify/WordPress caps per tier until commercial packaging is approved.
   */
  webflowEnabled: boolean;
  maxWebflowConnections: number;
  monthlyWebflowPublishLimit: number;
  maxWebflowBulkSize: number;
  /**
   * Prompt 29 — Cloudinary optional publish/delivery integration (defaults; no invented prices).
   * Mirrors the Webflow/Shopify/WordPress caps per tier until commercial packaging is approved.
   */
  cloudinaryEnabled: boolean;
  maxCloudinaryConnections: number;
  monthlyCloudinaryPublishLimit: number;
  maxCloudinaryBulkSize: number;
  /**
   * Prompt 30 — workflow automation (defaults; no invented prices).
   */
  workflowsEnabled: boolean;
  maxWorkflows: number;
  monthlyWorkflowRuns: number;
  active: boolean;
};

/**
 * Free plan limits match current development defaults so existing access is preserved
 * until paid Price IDs are configured by the operator.
 */
export const PLAN_CATALOG: Record<PlanCode, PlanDefinition> = {
  free: {
    code: "free",
    displayName: "Free",
    description: "Limited access for getting started. No Stripe subscription required.",
    monthlyPriceEnvKey: null,
    annualPriceEnvKey: null,
    displayPriceConfiguredOnly: true,
    maxProjects: 5,
    maxImagesPerProject: MAX_IMAGES_PER_PROJECT,
    maxOriginalStorageBytes: MAX_PROJECT_STORAGE_BYTES,
    maxGeneratedStorageBytes: MAX_GENERATED_OUTPUT_BYTES_PER_PROJECT,
    monthlyProcessingLimit: 200,
    monthlyAiLimit: 50,
    monthlyExportLimit: 20,
    bulkProcessingEnabled: true,
    aiMetadataEnabled: true,
    exportEnabled: true,
    cmsExportEnabled: false,
    organizationsEnabled: true,
    apiAccessEnabled: true,
    webhooksEnabled: true,
    maxApiKeys: 5,
    apiRequestsPerMinute: 60,
    maxWebhookEndpoints: 5,
    wordpressEnabled: true,
    maxWordpressConnections: 1,
    monthlyWordpressPublishLimit: 20,
    maxWordpressBulkSize: 50,
    shopifyEnabled: true,
    maxShopifyConnections: 1,
    monthlyShopifyPublishLimit: 20,
    maxShopifyBulkSize: 50,
    webflowEnabled: true,
    maxWebflowConnections: 1,
    monthlyWebflowPublishLimit: 20,
    maxWebflowBulkSize: 50,
    cloudinaryEnabled: true,
    maxCloudinaryConnections: 1,
    monthlyCloudinaryPublishLimit: 20,
    maxCloudinaryBulkSize: 50,
    workflowsEnabled: true,
    maxWorkflows: 5,
    monthlyWorkflowRuns: 100,
    active: true,
  },
  starter: {
    code: "starter",
    displayName: "Starter",
    description: "Higher limits for small sites. Requires Stripe Price IDs.",
    monthlyPriceEnvKey: "STRIPE_PRICE_STARTER_MONTHLY",
    annualPriceEnvKey: "STRIPE_PRICE_STARTER_ANNUAL",
    displayPriceConfiguredOnly: true,
    maxProjects: 20,
    maxImagesPerProject: 2_000,
    maxOriginalStorageBytes: 5 * 1024 * 1024 * 1024,
    maxGeneratedStorageBytes: 5 * 1024 * 1024 * 1024,
    monthlyProcessingLimit: 2_000,
    monthlyAiLimit: 500,
    monthlyExportLimit: 100,
    bulkProcessingEnabled: true,
    aiMetadataEnabled: true,
    exportEnabled: true,
    cmsExportEnabled: true,
    organizationsEnabled: true,
    apiAccessEnabled: true,
    webhooksEnabled: true,
    maxApiKeys: 10,
    apiRequestsPerMinute: 120,
    maxWebhookEndpoints: 10,
    wordpressEnabled: true,
    maxWordpressConnections: 2,
    monthlyWordpressPublishLimit: 100,
    maxWordpressBulkSize: 50,
    shopifyEnabled: true,
    maxShopifyConnections: 2,
    monthlyShopifyPublishLimit: 100,
    maxShopifyBulkSize: 50,
    webflowEnabled: true,
    maxWebflowConnections: 2,
    monthlyWebflowPublishLimit: 100,
    maxWebflowBulkSize: 50,
    cloudinaryEnabled: true,
    maxCloudinaryConnections: 2,
    monthlyCloudinaryPublishLimit: 100,
    maxCloudinaryBulkSize: 50,
    workflowsEnabled: true,
    maxWorkflows: 15,
    monthlyWorkflowRuns: 500,
    active: false,
  },
  /** Consumer paid plan (Prompt 12). Same limits as legacy `professional`. */
  pro: {
    code: "pro",
    displayName: "Pro",
    description: "For professionals who need higher limits. Requires Stripe Price IDs.",
    monthlyPriceEnvKey: "STRIPE_PRICE_PRO_MONTHLY",
    annualPriceEnvKey: "STRIPE_PRICE_PRO_ANNUAL",
    displayPriceConfiguredOnly: true,
    maxProjects: 50,
    maxImagesPerProject: 10_000,
    maxOriginalStorageBytes: 20 * 1024 * 1024 * 1024,
    maxGeneratedStorageBytes: 20 * 1024 * 1024 * 1024,
    monthlyProcessingLimit: 10_000,
    monthlyAiLimit: 2_000,
    monthlyExportLimit: 500,
    bulkProcessingEnabled: true,
    aiMetadataEnabled: true,
    exportEnabled: true,
    cmsExportEnabled: true,
    organizationsEnabled: true,
    apiAccessEnabled: true,
    webhooksEnabled: true,
    maxApiKeys: 25,
    apiRequestsPerMinute: 300,
    maxWebhookEndpoints: 25,
    wordpressEnabled: true,
    maxWordpressConnections: 5,
    monthlyWordpressPublishLimit: 500,
    maxWordpressBulkSize: 50,
    shopifyEnabled: true,
    maxShopifyConnections: 5,
    monthlyShopifyPublishLimit: 500,
    maxShopifyBulkSize: 50,
    webflowEnabled: true,
    maxWebflowConnections: 5,
    monthlyWebflowPublishLimit: 500,
    maxWebflowBulkSize: 50,
    cloudinaryEnabled: true,
    maxCloudinaryConnections: 5,
    monthlyCloudinaryPublishLimit: 500,
    maxCloudinaryBulkSize: 50,
    workflowsEnabled: true,
    maxWorkflows: 50,
    monthlyWorkflowRuns: 2_000,
    active: true,
  },
  professional: {
    code: "professional",
    displayName: "Professional",
    description: "Legacy paid code — use Pro for new checkout.",
    monthlyPriceEnvKey: "STRIPE_PRICE_PRO_MONTHLY",
    annualPriceEnvKey: "STRIPE_PRICE_PRO_ANNUAL",
    displayPriceConfiguredOnly: true,
    maxProjects: 50,
    maxImagesPerProject: 10_000,
    maxOriginalStorageBytes: 20 * 1024 * 1024 * 1024,
    maxGeneratedStorageBytes: 20 * 1024 * 1024 * 1024,
    monthlyProcessingLimit: 10_000,
    monthlyAiLimit: 2_000,
    monthlyExportLimit: 500,
    bulkProcessingEnabled: true,
    aiMetadataEnabled: true,
    exportEnabled: true,
    cmsExportEnabled: true,
    organizationsEnabled: true,
    apiAccessEnabled: true,
    webhooksEnabled: true,
    maxApiKeys: 25,
    apiRequestsPerMinute: 300,
    maxWebhookEndpoints: 25,
    wordpressEnabled: true,
    maxWordpressConnections: 5,
    monthlyWordpressPublishLimit: 500,
    maxWordpressBulkSize: 50,
    shopifyEnabled: true,
    maxShopifyConnections: 5,
    monthlyShopifyPublishLimit: 500,
    maxShopifyBulkSize: 50,
    webflowEnabled: true,
    maxWebflowConnections: 5,
    monthlyWebflowPublishLimit: 500,
    maxWebflowBulkSize: 50,
    cloudinaryEnabled: true,
    maxCloudinaryConnections: 5,
    monthlyCloudinaryPublishLimit: 500,
    maxCloudinaryBulkSize: 50,
    workflowsEnabled: true,
    maxWorkflows: 50,
    monthlyWorkflowRuns: 2_000,
    active: false,
  },
  agency: {
    code: "agency",
    displayName: "Agency",
    description: "Highest included limits. Not offered for consumer checkout.",
    monthlyPriceEnvKey: "STRIPE_PRICE_AGENCY_MONTHLY",
    annualPriceEnvKey: "STRIPE_PRICE_AGENCY_ANNUAL",
    displayPriceConfiguredOnly: true,
    maxProjects: 200,
    maxImagesPerProject: 50_000,
    maxOriginalStorageBytes: 100 * 1024 * 1024 * 1024,
    maxGeneratedStorageBytes: 100 * 1024 * 1024 * 1024,
    monthlyProcessingLimit: 50_000,
    monthlyAiLimit: 10_000,
    monthlyExportLimit: 2_000,
    bulkProcessingEnabled: true,
    aiMetadataEnabled: true,
    exportEnabled: true,
    cmsExportEnabled: true,
    organizationsEnabled: true,
    apiAccessEnabled: true,
    webhooksEnabled: true,
    maxApiKeys: 50,
    apiRequestsPerMinute: 600,
    maxWebhookEndpoints: 50,
    wordpressEnabled: true,
    maxWordpressConnections: 10,
    monthlyWordpressPublishLimit: 2_000,
    maxWordpressBulkSize: 50,
    shopifyEnabled: true,
    maxShopifyConnections: 10,
    monthlyShopifyPublishLimit: 2_000,
    maxShopifyBulkSize: 50,
    webflowEnabled: true,
    maxWebflowConnections: 10,
    monthlyWebflowPublishLimit: 2_000,
    maxWebflowBulkSize: 50,
    cloudinaryEnabled: true,
    maxCloudinaryConnections: 10,
    monthlyCloudinaryPublishLimit: 2_000,
    maxCloudinaryBulkSize: 50,
    workflowsEnabled: true,
    maxWorkflows: 200,
    monthlyWorkflowRuns: 10_000,
    active: false,
  },
};

export function getPlan(code: string): PlanDefinition | null {
  const normalized = code === "professional" ? "pro" : code;
  if (normalized in PLAN_CATALOG) {
    const plan = PLAN_CATALOG[normalized as PlanCode];
    // Prefer consumer Pro definition for legacy professional snapshots.
    if (code === "professional") return PLAN_CATALOG.pro;
    return plan;
  }
  return null;
}

export function listActivePlans(): PlanDefinition[] {
  return Object.values(PLAN_CATALOG).filter((p) => p.active);
}

/** Plans shown on consumer pricing (Free always; Pro when catalog active). */
export function listConsumerPricingPlans(): PlanDefinition[] {
  return [PLAN_CATALOG.free, PLAN_CATALOG.pro];
}

export function normalizePlanCode(code: string): PlanCode {
  if (code === "professional" || code === "pro") return "pro";
  if (code in PLAN_CATALOG) return code as PlanCode;
  return "free";
}

const PRICE_ID_RE = /^price_[A-Za-z0-9]+$/;

export function isValidStripePriceId(value: string): boolean {
  return PRICE_ID_RE.test(value);
}

export function resolvePriceIdFromEnv(
  plan: PlanDefinition,
  interval: BillingInterval,
  env: Record<string, string | undefined> = process.env,
): string | null {
  const key = interval === "month" ? plan.monthlyPriceEnvKey : plan.annualPriceEnvKey;
  if (!key) return null;
  const value = (env[key] ?? "").trim();
  if (!value) return null;
  if (!isValidStripePriceId(value)) return null;
  return value;
}

/** Map a Stripe Price ID to plan + interval using env configuration. */
export function resolvePlanFromPriceId(
  priceId: string,
  env: Record<string, string | undefined> = process.env,
): {plan: PlanDefinition; interval: BillingInterval} | null {
  if (!isValidStripePriceId(priceId)) return null;
  for (const plan of Object.values(PLAN_CATALOG)) {
    if (plan.code === "free") continue;
    const monthly = resolvePriceIdFromEnv(plan, "month", env);
    if (monthly && monthly === priceId) return {plan, interval: "month"};
    const annual = resolvePriceIdFromEnv(plan, "year", env);
    if (annual && annual === priceId) return {plan, interval: "year"};
  }
  return null;
}

export function isPaidCheckoutAvailable(
  planCode: PlanCode,
  interval: BillingInterval,
  env: Record<string, string | undefined> = process.env,
): boolean {
  const plan = getPlan(planCode);
  if (!plan || plan.code === "free") return false;
  return Boolean(resolvePriceIdFromEnv(plan, interval, env));
}
