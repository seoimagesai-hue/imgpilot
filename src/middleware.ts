import createMiddleware from "next-intl/middleware";
import {NextRequest, NextResponse} from "next/server";
import {locales, routing} from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const NON_DEFAULT_LOCALES = new Set(
  locales.filter((locale) => locale !== routing.defaultLocale),
);

const EN_REWRITE_HEADER = "x-seoimages-en-rewrite";

/**
 * Locale routing for English-unprefixed URLs.
 *
 * External `/en` and `/en/*` → permanent 301 to unprefixed English.
 * Unprefixed English → rewrite to `/en/...` (tagged so a second middleware
 * pass on the rewritten path does not 301-loop).
 * Other locales → next-intl middleware.
 */
export default function middleware(request: NextRequest) {
  const {pathname} = request.nextUrl;
  const isInternalEnRewrite = request.headers.get(EN_REWRITE_HEADER) === "1";

  if (!isInternalEnRewrite && (pathname === "/en" || pathname.startsWith("/en/"))) {
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/en" ? "/" : pathname.slice(3) || "/";
    return NextResponse.redirect(url, 301);
  }

  const firstSegment = pathname.split("/")[1] ?? "";
  if (NON_DEFAULT_LOCALES.has(firstSegment as (typeof locales)[number])) {
    return intlMiddleware(request);
  }

  // Already on internal `/en/...` from our rewrite — continue.
  if (isInternalEnRewrite && (pathname === "/en" || pathname.startsWith("/en/"))) {
    const headers = new Headers(request.headers);
    headers.set("X-NEXT-INTL-LOCALE", routing.defaultLocale);
    return NextResponse.next({request: {headers}});
  }

  // English unprefixed → rewrite into `[locale]`.
  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? "/en" : `/en${pathname}`;

  const headers = new Headers(request.headers);
  headers.set(EN_REWRITE_HEADER, "1");
  headers.set("X-NEXT-INTL-LOCALE", routing.defaultLocale);

  return NextResponse.rewrite(url, {request: {headers}});
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
