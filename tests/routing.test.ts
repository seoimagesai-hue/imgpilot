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
    expect(getSafeCallbackUrl("/en/dashboard", "en")).toBe("/en/dashboard");
    expect(getSafeCallbackUrl("/ur/dashboard", "ur")).toBe("/ur/dashboard");
  });

  it("rejects open redirects", () => {
    expect(getSafeCallbackUrl("https://evil.example/phish", "en")).toBe("/en/dashboard");
    expect(getSafeCallbackUrl("//evil.example", "en")).toBe("/en/dashboard");
    expect(getSafeCallbackUrl("/en/../admin", "en")).toBe("/en/dashboard");
  });

  it("falls back when callback is missing", () => {
    expect(getSafeCallbackUrl(undefined, "ur")).toBe("/ur/dashboard");
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
        R2_PUBLIC_BASE_URL: "",
        AI_PROVIDER: "",
        GEMINI_API_KEY: "",
        OPENAI_API_KEY: "",
        STRIPE_SECRET_KEY: "",
        STRIPE_WEBHOOK_SECRET: "",
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
        R2_PUBLIC_BASE_URL: "",
        AI_PROVIDER: "",
        GEMINI_API_KEY: "",
        OPENAI_API_KEY: "",
        STRIPE_SECRET_KEY: "",
        STRIPE_WEBHOOK_SECRET: "",
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
