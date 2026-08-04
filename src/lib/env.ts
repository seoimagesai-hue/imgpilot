import {z} from "zod";
import {
  R2_TTL_DEFAULT_SECONDS,
  assertCompleteOrEmptyR2Config,
  parseSignedUrlTtlSeconds,
  r2EndpointSchema,
} from "@/server/storage/errors";

/**
 * Server-only environment variables.
 * Never import this module from Client Components.
 */
const serverSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().optional().default(""),
    AUTH_SECRET: z.string().optional().default(""),
    AUTH_GOOGLE_ID: z.string().optional().default(""),
    AUTH_GOOGLE_SECRET: z.string().optional().default(""),
    AUTH_TRUST_HOST: z.string().optional().default("true"),
    /** Cloudflare R2 — all empty OR all required fields set. */
    R2_ACCOUNT_ID: z.string().optional().default(""),
    R2_ACCESS_KEY_ID: z.string().optional().default(""),
    R2_SECRET_ACCESS_KEY: z.string().optional().default(""),
    R2_BUCKET_NAME: z.string().optional().default(""),
    R2_ENDPOINT: z.string().optional().default(""),
    R2_PUBLIC_BASE_URL: z.string().optional().default(""),
    R2_SIGNED_URL_TTL_SECONDS: z.string().optional().default(""),
    AI_PROVIDER: z.enum(["gemini", "openai", ""]).optional().default(""),
    GEMINI_API_KEY: z.string().optional().default(""),
    OPENAI_API_KEY: z.string().optional().default(""),
    AI_MODEL: z.string().optional().default(""),
    AI_REQUEST_TIMEOUT_SECONDS: z.string().optional().default(""),
    AI_METADATA_PROMPT_VERSION: z.string().optional().default(""),
    STRIPE_SECRET_KEY: z.string().optional().default(""),
    STRIPE_WEBHOOK_SECRET: z.string().optional().default(""),
    STRIPE_PRICE_STARTER_MONTHLY: z.string().optional().default(""),
    STRIPE_PRICE_STARTER_ANNUAL: z.string().optional().default(""),
    STRIPE_PRICE_PRO_MONTHLY: z.string().optional().default(""),
    STRIPE_PRICE_PRO_ANNUAL: z.string().optional().default(""),
    STRIPE_PRICE_AGENCY_MONTHLY: z.string().optional().default(""),
    STRIPE_PRICE_AGENCY_ANNUAL: z.string().optional().default(""),
    STRIPE_CUSTOMER_PORTAL_CONFIGURATION_ID: z.string().optional().default(""),
    CRON_SECRET: z.string().optional().default(""),
    CLEANUP_CRON_SECRET: z.string().optional().default(""),
    /** Prompt 26 — WordPress publish integration (self-hosted, Application Passwords). */
    WORDPRESS_REQUEST_TIMEOUT_SECONDS: z.string().optional().default(""),
    WORDPRESS_MAX_RESPONSE_BYTES: z.string().optional().default(""),
    WORDPRESS_MAX_CONCURRENT_PUBLISHES: z.string().optional().default(""),
    WORDPRESS_PUBLISH_RETRY_LIMIT: z.string().optional().default(""),
    /** Prompt 27 — Shopify publish integration (Custom App Admin API access token). */
    SHOPIFY_REQUEST_TIMEOUT_SECONDS: z.string().optional().default(""),
    SHOPIFY_MAX_RESPONSE_BYTES: z.string().optional().default(""),
    SHOPIFY_MAX_CONCURRENT_PUBLISHES: z.string().optional().default(""),
    SHOPIFY_PUBLISH_RETRY_LIMIT: z.string().optional().default(""),
    /** Prompt 28 — Webflow CMS publish integration (Site access token). */
    WEBFLOW_REQUEST_TIMEOUT_SECONDS: z.string().optional().default(""),
    WEBFLOW_MAX_RESPONSE_BYTES: z.string().optional().default(""),
    WEBFLOW_MAX_CONCURRENT_PUBLISHES: z.string().optional().default(""),
    WEBFLOW_PUBLISH_RETRY_LIMIT: z.string().optional().default(""),
    /** Prompt 29 — Cloudinary publish integration. */
    CLOUDINARY_REQUEST_TIMEOUT_SECONDS: z.string().optional().default(""),
    CLOUDINARY_MAX_RESPONSE_BYTES: z.string().optional().default(""),
    /** Optional dedicated key for integration secrets; falls back to AUTH_SECRET-derived key. */
    INTEGRATION_ENCRYPTION_KEY: z.string().optional().default(""),
    /** Consumer guest foundation (Phase 1) — optional overrides; defaults applied in guest-policy. */
    GUEST_COOKIE_NAME: z.string().optional().default(""),
    GUEST_MAX_FILE_BYTES: z.string().optional().default(""),
    GUEST_MAX_OPS_PER_DAY: z.string().optional().default(""),
    GUEST_ASSET_TTL_HOURS: z.string().optional().default(""),
  })
  .superRefine((value, ctx) => {
    const hasGoogleId = Boolean(value.AUTH_GOOGLE_ID);
    const hasGoogleSecret = Boolean(value.AUTH_GOOGLE_SECRET);
    if (hasGoogleId !== hasGoogleSecret) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET must both be set, or both left empty.",
        path: hasGoogleId ? ["AUTH_GOOGLE_SECRET"] : ["AUTH_GOOGLE_ID"],
      });
    }

    const stripeSecret = Boolean(value.STRIPE_SECRET_KEY);
    const stripeWebhook = Boolean(value.STRIPE_WEBHOOK_SECRET);
    if (stripeSecret !== stripeWebhook) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET must both be set, or both left empty.",
        path: stripeSecret ? ["STRIPE_WEBHOOK_SECRET"] : ["STRIPE_SECRET_KEY"],
      });
    }
    for (const key of [
      "STRIPE_PRICE_STARTER_MONTHLY",
      "STRIPE_PRICE_STARTER_ANNUAL",
      "STRIPE_PRICE_PRO_MONTHLY",
      "STRIPE_PRICE_PRO_ANNUAL",
      "STRIPE_PRICE_AGENCY_MONTHLY",
      "STRIPE_PRICE_AGENCY_ANNUAL",
    ] as const) {
      const price = value[key];
      if (price && !/^price_[A-Za-z0-9]+$/.test(price)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${key} must be a Stripe Price ID (price_…) or empty`,
          path: [key],
        });
      }
    }

    if (value.AI_PROVIDER === "openai" && !value.OPENAI_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "OPENAI_API_KEY is required when AI_PROVIDER=openai",
        path: ["OPENAI_API_KEY"],
      });
    }
    if (value.AI_PROVIDER === "gemini" && !value.GEMINI_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "GEMINI_API_KEY is required when AI_PROVIDER=gemini",
        path: ["GEMINI_API_KEY"],
      });
    }
    if (!value.AI_PROVIDER && (value.OPENAI_API_KEY || value.GEMINI_API_KEY)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "AI_PROVIDER must be set when an AI API key is provided",
        path: ["AI_PROVIDER"],
      });
    }

    try {
      assertCompleteOrEmptyR2Config(value);
    } catch (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: error instanceof Error ? error.message : "Invalid R2 configuration",
        path: ["R2_ACCOUNT_ID"],
      });
    }

    if (value.R2_ENDPOINT) {
      const endpoint = r2EndpointSchema.safeParse(value.R2_ENDPOINT);
      if (!endpoint.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "R2_ENDPOINT must be a valid https URL",
          path: ["R2_ENDPOINT"],
        });
      }
    }

    if (value.R2_SIGNED_URL_TTL_SECONDS) {
      try {
        parseSignedUrlTtlSeconds(value.R2_SIGNED_URL_TTL_SECONDS);
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `R2_SIGNED_URL_TTL_SECONDS must be between 60 and 900 (default ${R2_TTL_DEFAULT_SECONDS})`,
          path: ["R2_SIGNED_URL_TTL_SECONDS"],
        });
      }
    }

    for (const key of [
      "WORDPRESS_REQUEST_TIMEOUT_SECONDS",
      "WORDPRESS_MAX_RESPONSE_BYTES",
      "WORDPRESS_MAX_CONCURRENT_PUBLISHES",
      "WORDPRESS_PUBLISH_RETRY_LIMIT",
      "SHOPIFY_REQUEST_TIMEOUT_SECONDS",
      "SHOPIFY_MAX_RESPONSE_BYTES",
      "SHOPIFY_MAX_CONCURRENT_PUBLISHES",
      "SHOPIFY_PUBLISH_RETRY_LIMIT",
      "WEBFLOW_REQUEST_TIMEOUT_SECONDS",
      "WEBFLOW_MAX_RESPONSE_BYTES",
      "WEBFLOW_MAX_CONCURRENT_PUBLISHES",
      "WEBFLOW_PUBLISH_RETRY_LIMIT",
      "CLOUDINARY_REQUEST_TIMEOUT_SECONDS",
      "CLOUDINARY_MAX_RESPONSE_BYTES",
    ] as const) {
      const raw = value[key];
      if (raw && (!/^\d+$/.test(raw) || Number(raw) <= 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${key} must be a positive integer or empty`,
          path: [key],
        });
      }
    }

    if (value.INTEGRATION_ENCRYPTION_KEY) {
      let byteLength = 0;
      try {
        byteLength = Buffer.from(value.INTEGRATION_ENCRYPTION_KEY, "base64").length;
      } catch {
        byteLength = 0;
      }
      if (byteLength < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "INTEGRATION_ENCRYPTION_KEY must decode (base64) to at least 32 bytes, or be left empty",
          path: ["INTEGRATION_ENCRYPTION_KEY"],
        });
      }
    }
  });

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional().default(""),
});

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("; ");
}

export function getServerEnv() {
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid server environment variables: ${formatZodError(parsed.error)}`);
  }
  return parsed.data;
}

export function getClientEnv() {
  const parsed = clientSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  });
  if (!parsed.success) {
    throw new Error(`Invalid public environment variables: ${formatZodError(parsed.error)}`);
  }
  return parsed.data;
}

export function isGoogleAuthConfigured(env = getServerEnv()): boolean {
  return Boolean(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET);
}

export function isR2Configured(env = getServerEnv()): boolean {
  return Boolean(
    env.R2_ACCOUNT_ID &&
      env.R2_ACCESS_KEY_ID &&
      env.R2_SECRET_ACCESS_KEY &&
      env.R2_BUCKET_NAME &&
      env.R2_ENDPOINT,
  );
}

export function getR2SignedUrlTtlSeconds(env = getServerEnv()): number {
  return parseSignedUrlTtlSeconds(env.R2_SIGNED_URL_TTL_SECONDS, R2_TTL_DEFAULT_SECONDS);
}

export function requireDatabaseUrl(env = getServerEnv()): string {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for database operations.");
  }
  return env.DATABASE_URL;
}

export function requireAuthSecret(env = getServerEnv()): string {
  if (!env.AUTH_SECRET || env.AUTH_SECRET.length < 32) {
    throw new Error(
      "AUTH_SECRET is required and must be at least 32 characters. Generate with: openssl rand -base64 32",
    );
  }
  return env.AUTH_SECRET;
}

const WORDPRESS_REQUEST_TIMEOUT_SECONDS_DEFAULT = 30;
const WORDPRESS_MAX_RESPONSE_BYTES_DEFAULT = 5 * 1024 * 1024; // 5 MiB
const WORDPRESS_MAX_CONCURRENT_PUBLISHES_DEFAULT = 2;
const WORDPRESS_PUBLISH_RETRY_LIMIT_DEFAULT = 5;

function parsePositiveIntEnv(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

export function getWordpressRequestTimeoutSeconds(env = getServerEnv()): number {
  return parsePositiveIntEnv(
    env.WORDPRESS_REQUEST_TIMEOUT_SECONDS,
    WORDPRESS_REQUEST_TIMEOUT_SECONDS_DEFAULT,
  );
}

export function getWordpressMaxResponseBytes(env = getServerEnv()): number {
  return parsePositiveIntEnv(env.WORDPRESS_MAX_RESPONSE_BYTES, WORDPRESS_MAX_RESPONSE_BYTES_DEFAULT);
}

export function getWordpressMaxConcurrentPublishes(env = getServerEnv()): number {
  return Math.min(
    2,
    parsePositiveIntEnv(
      env.WORDPRESS_MAX_CONCURRENT_PUBLISHES,
      WORDPRESS_MAX_CONCURRENT_PUBLISHES_DEFAULT,
    ),
  );
}

export function getWordpressPublishRetryLimit(env = getServerEnv()): number {
  return parsePositiveIntEnv(env.WORDPRESS_PUBLISH_RETRY_LIMIT, WORDPRESS_PUBLISH_RETRY_LIMIT_DEFAULT);
}

const SHOPIFY_REQUEST_TIMEOUT_SECONDS_DEFAULT = 30;
const SHOPIFY_MAX_RESPONSE_BYTES_DEFAULT = 5 * 1024 * 1024; // 5 MiB
const SHOPIFY_MAX_CONCURRENT_PUBLISHES_DEFAULT = 2;
const SHOPIFY_PUBLISH_RETRY_LIMIT_DEFAULT = 5;

export function getShopifyRequestTimeoutSeconds(env = getServerEnv()): number {
  return parsePositiveIntEnv(env.SHOPIFY_REQUEST_TIMEOUT_SECONDS, SHOPIFY_REQUEST_TIMEOUT_SECONDS_DEFAULT);
}

export function getShopifyMaxResponseBytes(env = getServerEnv()): number {
  return parsePositiveIntEnv(env.SHOPIFY_MAX_RESPONSE_BYTES, SHOPIFY_MAX_RESPONSE_BYTES_DEFAULT);
}

export function getShopifyMaxConcurrentPublishes(env = getServerEnv()): number {
  return Math.min(
    2,
    parsePositiveIntEnv(env.SHOPIFY_MAX_CONCURRENT_PUBLISHES, SHOPIFY_MAX_CONCURRENT_PUBLISHES_DEFAULT),
  );
}

export function getShopifyPublishRetryLimit(env = getServerEnv()): number {
  return parsePositiveIntEnv(env.SHOPIFY_PUBLISH_RETRY_LIMIT, SHOPIFY_PUBLISH_RETRY_LIMIT_DEFAULT);
}

const WEBFLOW_REQUEST_TIMEOUT_SECONDS_DEFAULT = 30;
const WEBFLOW_MAX_RESPONSE_BYTES_DEFAULT = 5 * 1024 * 1024; // 5 MiB
const WEBFLOW_MAX_CONCURRENT_PUBLISHES_DEFAULT = 2;
const WEBFLOW_PUBLISH_RETRY_LIMIT_DEFAULT = 5;

export function getWebflowRequestTimeoutSeconds(env = getServerEnv()): number {
  return parsePositiveIntEnv(env.WEBFLOW_REQUEST_TIMEOUT_SECONDS, WEBFLOW_REQUEST_TIMEOUT_SECONDS_DEFAULT);
}

export function getWebflowMaxResponseBytes(env = getServerEnv()): number {
  return parsePositiveIntEnv(env.WEBFLOW_MAX_RESPONSE_BYTES, WEBFLOW_MAX_RESPONSE_BYTES_DEFAULT);
}

export function getWebflowMaxConcurrentPublishes(env = getServerEnv()): number {
  return Math.min(
    2,
    parsePositiveIntEnv(env.WEBFLOW_MAX_CONCURRENT_PUBLISHES, WEBFLOW_MAX_CONCURRENT_PUBLISHES_DEFAULT),
  );
}

export function getWebflowPublishRetryLimit(env = getServerEnv()): number {
  return parsePositiveIntEnv(env.WEBFLOW_PUBLISH_RETRY_LIMIT, WEBFLOW_PUBLISH_RETRY_LIMIT_DEFAULT);
}

const CLOUDINARY_REQUEST_TIMEOUT_SECONDS_DEFAULT = 30;
const CLOUDINARY_MAX_RESPONSE_BYTES_DEFAULT = 5 * 1024 * 1024; // 5 MiB

export function getCloudinaryRequestTimeoutSeconds(env = getServerEnv()): number {
  return parsePositiveIntEnv(env.CLOUDINARY_REQUEST_TIMEOUT_SECONDS, CLOUDINARY_REQUEST_TIMEOUT_SECONDS_DEFAULT);
}

export function getCloudinaryMaxResponseBytes(env = getServerEnv()): number {
  return parsePositiveIntEnv(env.CLOUDINARY_MAX_RESPONSE_BYTES, CLOUDINARY_MAX_RESPONSE_BYTES_DEFAULT);
}

/**
 * Encryption key material for integration secrets (WordPress credentials, etc).
 * Prefers a dedicated `INTEGRATION_ENCRYPTION_KEY` (base64, 32+ bytes); falls back
 * to the same AUTH_SECRET-derived key used by outbound webhook secrets.
 */
export function getIntegrationEncryptionKeyMaterial(env = getServerEnv()): {
  source: "integration_key" | "auth_secret";
  value: string;
} {
  if (env.INTEGRATION_ENCRYPTION_KEY) {
    return {source: "integration_key", value: env.INTEGRATION_ENCRYPTION_KEY};
  }
  return {source: "auth_secret", value: requireAuthSecret(env)};
}

export function getGuestMaxFileBytes(env = getServerEnv()): number {
  return parsePositiveIntEnv(env.GUEST_MAX_FILE_BYTES, 10 * 1024 * 1024);
}

export function getGuestMaxOpsPerDay(env = getServerEnv()): number {
  return parsePositiveIntEnv(env.GUEST_MAX_OPS_PER_DAY, 5);
}

export function getGuestAssetTtlMs(env = getServerEnv()): number {
  const hours = parsePositiveIntEnv(env.GUEST_ASSET_TTL_HOURS, 1);
  return hours * 60 * 60 * 1000;
}

export const clientEnv = getClientEnv();
