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
    STRIPE_SECRET_KEY: z.string().optional().default(""),
    STRIPE_WEBHOOK_SECRET: z.string().optional().default(""),
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

export const clientEnv = getClientEnv();
