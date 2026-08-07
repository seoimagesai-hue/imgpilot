import {z} from "zod";
import {localePath, routing, type AppLocale} from "@/i18n/routing";
import {getClientEnv} from "@/lib/env";

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

const localeAlt = routing.locales.join("|");
const localePrefixRe = new RegExp(`^/(${localeAlt})(?=/|$)`);

/**
 * Allow only internal relative paths to prevent open redirects.
 * Accepts unprefixed English paths and `/{locale}/...` for every supported locale.
 * Legacy `/en/...` is normalized to unprefixed English.
 * Absolute URLs are accepted only when same-origin as NEXT_PUBLIC_APP_URL.
 */
export function getSafeCallbackUrl(
  callbackUrl: string | null | undefined,
  locale: string,
): string {
  const fallbackLocale = routing.locales.includes(locale as AppLocale)
    ? locale
    : routing.defaultLocale;
  const fallback = localePath(fallbackLocale, "/");

  if (!callbackUrl) return fallback;

  let candidate = callbackUrl.trim();
  try {
    if (candidate.startsWith("http://") || candidate.startsWith("https://")) {
      const url = new URL(candidate);
      const appOrigin = getClientEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
      const app = new URL(appOrigin);
      if (url.origin !== app.origin) {
        return fallback;
      }
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

  // Strip legacy English prefix permanently (English is unprefixed).
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    pathname = pathname === "/en" ? "/" : pathname.slice(3) || "/";
  }

  const prefixMatch = pathname.match(localePrefixRe);
  const pathLocale = prefixMatch?.[1];
  const pathWithoutLocale = pathLocale
    ? pathname.slice(pathLocale.length + 1) || "/"
    : pathname;

  // Never bounce consumers into legacy dashboard via callback.
  if (pathWithoutLocale === "/dashboard" || pathWithoutLocale.startsWith("/dashboard/")) {
    return localePath(pathLocale && pathLocale !== "en" ? pathLocale : fallbackLocale, "/account");
  }

  // Prefixed non-default locale path is valid as-is.
  if (pathLocale && pathLocale !== routing.defaultLocale) {
    return pathname;
  }

  // Unprefixed (English) internal path.
  return pathname.startsWith("/") ? pathname : fallback;
}

export function isAppLocale(value: string): value is AppLocale {
  return routing.locales.includes(value as AppLocale);
}
