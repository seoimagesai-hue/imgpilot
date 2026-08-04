import {z} from "zod";
import {routing, type AppLocale} from "@/i18n/routing";

export const PASSWORD_MIN_LENGTH = 8;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "nameRequired").max(100, "nameRequired"),
    email: z.string().trim().min(1, "emailRequired").email("emailInvalid"),
    password: z.string().min(PASSWORD_MIN_LENGTH, "passwordTooShort"),
    confirmPassword: z.string().min(1, "confirmPasswordRequired"),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "passwordMismatch",
        path: ["confirmPassword"],
      });
    }
  })
  .transform((value) => ({
    ...value,
    email: normalizeEmail(value.email),
    name: value.name.trim(),
  }));

export const loginSchema = z
  .object({
    email: z.string().trim().min(1, "emailRequired").email("emailInvalid"),
    password: z.string().min(1, "passwordRequired"),
  })
  .transform((value) => ({
    ...value,
    email: normalizeEmail(value.email),
  }));

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Allow only internal relative paths to prevent open redirects.
 * Prefer locale-prefixed app paths; fall back to the current locale homepage.
 */
export function getSafeCallbackUrl(
  callbackUrl: string | null | undefined,
  locale: string,
): string {
  const fallbackLocale = routing.locales.includes(locale as AppLocale)
    ? locale
    : routing.defaultLocale;
  const fallback = `/${fallbackLocale}`;

  if (!callbackUrl) return fallback;

  let candidate = callbackUrl.trim();
  try {
    if (candidate.startsWith("http://") || candidate.startsWith("https://")) {
      const url = new URL(candidate);
      candidate = `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    return fallback;
  }

  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("..")) {
    return fallback;
  }

  let pathname = candidate;
  try {
    const normalized = new URL(candidate, "http://seoimages.local");
    pathname = `${normalized.pathname}${normalized.search}${normalized.hash}`;
  } catch {
    return fallback;
  }

  if (pathname.includes("..")) {
    return fallback;
  }

  const localeMatch = pathname.match(/^\/(en|ur)(\/|$)/);
  if (!localeMatch) {
    return fallback;
  }

  // Never bounce consumers into legacy dashboard via callback.
  if (/^\/(en|ur)\/dashboard(\/|$)/.test(pathname)) {
    return `/${localeMatch[1]}/account`;
  }

  return pathname;
}

export function isAppLocale(value: string): value is AppLocale {
  return routing.locales.includes(value as AppLocale);
}
