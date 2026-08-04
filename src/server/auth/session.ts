import {unstable_noStore as noStore} from "next/cache";
import {notFound, redirect} from "next/navigation";
import {auth} from "@/auth";
import {isAppLocale} from "@/server/auth/validation";

export async function requireUser(locale: string, callbackPath = "/account") {
  noStore();
  const session = await auth();
  const safeLocale = isAppLocale(locale) ? locale : "en";

  if (!session?.user?.id) {
    const path = callbackPath.startsWith("/") ? callbackPath : `/${callbackPath}`;
    const callbackUrl = encodeURIComponent(`/${safeLocale}${path}`);
    redirect(`/${safeLocale}/login?callbackUrl=${callbackUrl}`);
  }

  if (session.user.accountStatus === "suspended") {
    redirect(`/${safeLocale}/login?error=suspended`);
  }

  return session;
}

/**
 * Super-admin gate. Signed-out → login. Non-admin → notFound (do not leak admin existence).
 * Suspended admins lose access.
 */
export async function requireSuperAdmin(locale: string, callbackPath = "/admin") {
  noStore();
  const session = await auth();
  const safeLocale = isAppLocale(locale) ? locale : "en";

  if (!session?.user?.id) {
    const path = callbackPath.startsWith("/") ? callbackPath : `/${callbackPath}`;
    const callbackUrl = encodeURIComponent(`/${safeLocale}${path}`);
    redirect(`/${safeLocale}/login?callbackUrl=${callbackUrl}`);
  }

  if (session.user.accountStatus === "suspended") {
    redirect(`/${safeLocale}/login?error=suspended`);
  }

  if (session.user.role !== "super_admin") {
    notFound();
  }

  return session;
}

export async function redirectIfAuthenticated(locale: string) {
  noStore();
  const session = await auth();
  const safeLocale = isAppLocale(locale) ? locale : "en";

  if (session?.user?.id) {
    if (session.user.accountStatus === "suspended") {
      return;
    }
    redirect(`/${safeLocale}/account`);
  }
}
