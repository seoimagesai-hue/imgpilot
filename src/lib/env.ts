import {z} from "zod";

/**
 * Server-only environment variables.
 * Never import this module from Client Components.
 */
const serverSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    /** PostgreSQL connection string for Drizzle. Required for auth/database runtime. */
    DATABASE_URL: z.string().optional().default(""),
    /**
     * Auth.js signing secret. Generate with:
     * `openssl rand -base64 32` or `npx auth secret`
     */
    AUTH_SECRET: z.string().optional().default(""),
    AUTH_GOOGLE_ID: z.string().optional().default(""),
    AUTH_GOOGLE_SECRET: z.string().optional().default(""),
    AUTH_TRUST_HOST: z.string().optional().default("true"),
    /** Future: Cloudflare R2 */
    R2_ACCOUNT_ID: z.string().optional().default(""),
    R2_ACCESS_KEY_ID: z.string().optional().default(""),
    R2_SECRET_ACCESS_KEY: z.string().optional().default(""),
    R2_BUCKET_NAME: z.string().optional().default(""),
    R2_PUBLIC_BASE_URL: z.string().optional().default(""),
    /** Future: AI providers */
    AI_PROVIDER: z.enum(["gemini", "openai", ""]).optional().default(""),
    GEMINI_API_KEY: z.string().optional().default(""),
    OPENAI_API_KEY: z.string().optional().default(""),
    /** Future: Stripe */
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
  });

/**
 * Client-safe environment variables (NEXT_PUBLIC_* only).
 */
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

/** Eager validation for scripts/tests that import this module intentionally. */
export const clientEnv = getClientEnv();
