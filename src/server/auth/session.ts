import {unstable_noStore as noStore} from "next/cache";
import {redirect} from "next/navigation";
import {auth} from "@/auth";
import {isAppLocale} from "@/server/auth/validation";

export async function requireUser(locale: string, callbackPath = "/dashboard") {
  noStore();
  const session = await auth();
  const safeLocale = isAppLocale(locale) ? locale : "en";

  if (!session?.user?.id) {
    const path = callbackPath.startsWith("/") ? callbackPath : `/${callbackPath}`;
    const callbackUrl = encodeURIComponent(`/${safeLocale}${path}`);
    redirect(`/${safeLocale}/login?callbackUrl=${callbackUrl}`);
  }

  return session;
}

export async function redirectIfAuthenticated(locale: string) {
  noStore();
  const session = await auth();
  const safeLocale = isAppLocale(locale) ? locale : "en";

  if (session?.user?.id) {
    redirect(`/${safeLocale}/dashboard`);
  }
}
