import {unstable_noStore as noStore} from "next/cache";
import {redirect} from "next/navigation";
import {auth} from "@/auth";
import {isAppLocale} from "@/server/auth/validation";

export async function requireUser(locale: string) {
  noStore();
  const session = await auth();
  const safeLocale = isAppLocale(locale) ? locale : "en";

  if (!session?.user?.id) {
    const callbackUrl = encodeURIComponent(`/${safeLocale}/dashboard`);
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
