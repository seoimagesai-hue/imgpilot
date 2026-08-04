import {describe, expect, it} from "vitest";
import {routing} from "../src/i18n/routing";
import {getClientEnv, isGoogleAuthConfigured} from "../src/lib/env";
import {
  getSafeCallbackUrl,
  loginSchema,
  normalizeEmail,
  registerSchema,
} from "../src/server/auth/validation";
import {hashPassword, verifyPassword} from "../src/server/auth/password";

describe("locale routing", () => {
  it("supports English and Urdu", () => {
    expect(routing.locales).toEqual(["en", "ur"]);
  });

  it("uses English by default", () => {
    expect(routing.defaultLocale).toBe("en");
  });

  it("always prefixes locales in URLs", () => {
    expect(routing.localePrefix).toBe("always");
  });
});

describe("client environment", () => {
  it("provides a default public app URL", () => {
    const env = getClientEnv();
    expect(env.NEXT_PUBLIC_APP_URL).toMatch(/^https?:\/\//);
  });
});

describe("registration schema", () => {
  it("accepts valid registration data", () => {
    const parsed = registerSchema.safeParse({
      name: "Ada Lovelace",
      email: "Ada@Example.com",
      password: "secure-pass",
      confirmPassword: "secure-pass",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.email).toBe("ada@example.com");
      expect(parsed.data.name).toBe("Ada Lovelace");
    }
  });

  it("rejects invalid email", () => {
    const parsed = registerSchema.safeParse({
      name: "Ada",
      email: "not-an-email",
      password: "secure-pass",
      confirmPassword: "secure-pass",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects short password", () => {
    const parsed = registerSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      password: "short",
      confirmPassword: "short",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects password mismatch", () => {
    const parsed = registerSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      password: "secure-pass",
      confirmPassword: "different-pass",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("email normalization", () => {
  it("trims and lowercases email addresses", () => {
    expect(normalizeEmail("  Admin@Example.COM ")).toBe("admin@example.com");
  });
});

describe("login schema", () => {
  it("normalizes email on login", () => {
    const parsed = loginSchema.safeParse({
      email: "User@Example.com",
      password: "anything",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.email).toBe("user@example.com");
    }
  });
});

describe("safe callback URLs", () => {
  it("accepts locale-prefixed internal paths", () => {
    expect(getSafeCallbackUrl("/en/compress-image", "en")).toBe("/en/compress-image");
    expect(getSafeCallbackUrl("/ur/account", "ur")).toBe("/ur/account");
  });

  it("maps legacy dashboard callbacks to account", () => {
    expect(getSafeCallbackUrl("/en/dashboard", "en")).toBe("/en/account");
    expect(getSafeCallbackUrl("/ur/dashboard/projects", "ur")).toBe("/ur/account");
  });

  it("rejects open redirects", () => {
    expect(getSafeCallbackUrl("https://evil.example/phish", "en")).toBe("/en");
    expect(getSafeCallbackUrl("//evil.example", "en")).toBe("/en");
    expect(getSafeCallbackUrl("/en/../admin", "en")).toBe("/en");
  });

  it("falls back when callback is missing", () => {
    expect(getSafeCallbackUrl(undefined, "ur")).toBe("/ur");
  });
});

describe("Google provider configuration helper", () => {
  it("is disabled when credentials are empty", () => {
    expect(
      isGoogleAuthConfigured({
        NODE_ENV: "test",
        DATABASE_URL: "",
        AUTH_SECRET: "",
        AUTH_GOOGLE_ID: "",
        AUTH_GOOGLE_SECRET: "",
        AUTH_TRUST_HOST: "true",
        R2_ACCOUNT_ID: "",
        R2_ACCESS_KEY_ID: "",
        R2_SECRET_ACCESS_KEY: "",
        R2_BUCKET_NAME: "",
        R2_ENDPOINT: "",
        R2_PUBLIC_BASE_URL: "",
        R2_SIGNED_URL_TTL_SECONDS: "",
        AI_PROVIDER: "",
        GEMINI_API_KEY: "",
        OPENAI_API_KEY: "",
        AI_MODEL: "",
        AI_REQUEST_TIMEOUT_SECONDS: "",
        AI_METADATA_PROMPT_VERSION: "",
        STRIPE_SECRET_KEY: "",
        STRIPE_WEBHOOK_SECRET: "",
        STRIPE_PRICE_STARTER_MONTHLY: "",
        STRIPE_PRICE_STARTER_ANNUAL: "",
        STRIPE_PRICE_PRO_MONTHLY: "",
        STRIPE_PRICE_PRO_ANNUAL: "",
        STRIPE_PRICE_AGENCY_MONTHLY: "",
        STRIPE_PRICE_AGENCY_ANNUAL: "",
        STRIPE_CUSTOMER_PORTAL_CONFIGURATION_ID: "",
        CRON_SECRET: "",
        CLEANUP_CRON_SECRET: "",
        WORDPRESS_REQUEST_TIMEOUT_SECONDS: "",
        WORDPRESS_MAX_RESPONSE_BYTES: "",
        WORDPRESS_MAX_CONCURRENT_PUBLISHES: "",
        WORDPRESS_PUBLISH_RETRY_LIMIT: "",
        SHOPIFY_REQUEST_TIMEOUT_SECONDS: "",
        SHOPIFY_MAX_RESPONSE_BYTES: "",
        SHOPIFY_MAX_CONCURRENT_PUBLISHES: "",
        SHOPIFY_PUBLISH_RETRY_LIMIT: "",
        WEBFLOW_REQUEST_TIMEOUT_SECONDS: "",
        WEBFLOW_MAX_RESPONSE_BYTES: "",
        WEBFLOW_MAX_CONCURRENT_PUBLISHES: "",
        WEBFLOW_PUBLISH_RETRY_LIMIT: "",
        CLOUDINARY_REQUEST_TIMEOUT_SECONDS: "",
        CLOUDINARY_MAX_RESPONSE_BYTES: "",
        INTEGRATION_ENCRYPTION_KEY: "",
        GUEST_COOKIE_NAME: "seoimages_guest",
        GUEST_MAX_FILE_BYTES: "10485760",
        GUEST_MAX_OPS_PER_DAY: "5",
        GUEST_ASSET_TTL_HOURS: "1",
      }),
    ).toBe(false);
  });

  it("is enabled when both credentials are present", () => {
    expect(
      isGoogleAuthConfigured({
        NODE_ENV: "test",
        DATABASE_URL: "",
        AUTH_SECRET: "x".repeat(32),
        AUTH_GOOGLE_ID: "id",
        AUTH_GOOGLE_SECRET: "secret",
        AUTH_TRUST_HOST: "true",
        R2_ACCOUNT_ID: "",
        R2_ACCESS_KEY_ID: "",
        R2_SECRET_ACCESS_KEY: "",
        R2_BUCKET_NAME: "",
        R2_ENDPOINT: "",
        R2_PUBLIC_BASE_URL: "",
        R2_SIGNED_URL_TTL_SECONDS: "",
        AI_PROVIDER: "",
        GEMINI_API_KEY: "",
        OPENAI_API_KEY: "",
        AI_MODEL: "",
        AI_REQUEST_TIMEOUT_SECONDS: "",
        AI_METADATA_PROMPT_VERSION: "",
        STRIPE_SECRET_KEY: "",
        STRIPE_WEBHOOK_SECRET: "",
        STRIPE_PRICE_STARTER_MONTHLY: "",
        STRIPE_PRICE_STARTER_ANNUAL: "",
        STRIPE_PRICE_PRO_MONTHLY: "",
        STRIPE_PRICE_PRO_ANNUAL: "",
        STRIPE_PRICE_AGENCY_MONTHLY: "",
        STRIPE_PRICE_AGENCY_ANNUAL: "",
        STRIPE_CUSTOMER_PORTAL_CONFIGURATION_ID: "",
        CRON_SECRET: "",
        CLEANUP_CRON_SECRET: "",
        WORDPRESS_REQUEST_TIMEOUT_SECONDS: "",
        WORDPRESS_MAX_RESPONSE_BYTES: "",
        WORDPRESS_MAX_CONCURRENT_PUBLISHES: "",
        WORDPRESS_PUBLISH_RETRY_LIMIT: "",
        SHOPIFY_REQUEST_TIMEOUT_SECONDS: "",
        SHOPIFY_MAX_RESPONSE_BYTES: "",
        SHOPIFY_MAX_CONCURRENT_PUBLISHES: "",
        SHOPIFY_PUBLISH_RETRY_LIMIT: "",
        WEBFLOW_REQUEST_TIMEOUT_SECONDS: "",
        WEBFLOW_MAX_RESPONSE_BYTES: "",
        WEBFLOW_MAX_CONCURRENT_PUBLISHES: "",
        WEBFLOW_PUBLISH_RETRY_LIMIT: "",
        CLOUDINARY_REQUEST_TIMEOUT_SECONDS: "",
        CLOUDINARY_MAX_RESPONSE_BYTES: "",
        INTEGRATION_ENCRYPTION_KEY: "",
        GUEST_COOKIE_NAME: "seoimages_guest",
        GUEST_MAX_FILE_BYTES: "10485760",
        GUEST_MAX_OPS_PER_DAY: "5",
        GUEST_ASSET_TTL_HOURS: "1",
      }),
    ).toBe(true);
  });
});

describe("password hashing", () => {
  it("hashes and verifies passwords without returning the plaintext", async () => {
    const password = "secure-pass-123";
    const hash = await hashPassword(password);
    expect(hash).not.toContain(password);
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });
});

describe("locale-aware authentication paths", () => {
  it("builds expected login and register paths for each locale", () => {
    for (const locale of routing.locales) {
      expect(`/${locale}/login`).toMatch(/^\/(en|ur)\/login$/);
      expect(`/${locale}/register`).toMatch(/^\/(en|ur)\/register$/);
      expect(`/${locale}/dashboard`).toMatch(/^\/(en|ur)\/dashboard$/);
    }
  });
});
