import createMiddleware from "next-intl/middleware";
import {routing} from "./i18n/routing";

/**
 * Locale negotiation and prefix handling only.
 * Dashboard authorization is enforced in the localized dashboard layout via Auth.js `auth()`,
 * not in this Edge middleware, to avoid Edge/database incompatibilities with credentials auth.
 * Auth.js API routes under `/api/auth/*` are excluded by the matcher.
 */
export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
