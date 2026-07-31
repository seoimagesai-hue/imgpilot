import {getTranslations, setRequestLocale} from "next-intl/server";
import {RegisterForm} from "@/components/auth/register-form";
import {isGoogleAuthConfigured} from "@/lib/env";
import {getSafeCallbackUrl, isAppLocale} from "@/server/auth/validation";
import {redirectIfAuthenticated} from "@/server/auth/session";

export const dynamic = "force-dynamic";

type RegisterPageProps = {
  params: Promise<{locale: string}>;
  searchParams: Promise<{callbackUrl?: string}>;
};

export default async function RegisterPage({params, searchParams}: RegisterPageProps) {
  const {locale: rawLocale} = await params;
  const locale = isAppLocale(rawLocale) ? rawLocale : "en";
  setRequestLocale(locale);
  await redirectIfAuthenticated(locale);

  const {callbackUrl: rawCallback} = await searchParams;
  const callbackUrl = getSafeCallbackUrl(rawCallback, locale);
  const t = await getTranslations("authentication");

  return (
    <main className="flex min-h-screen items-center justify-center p-4 sm:p-6">
      <div className="w-full">
        <p className="mb-4 text-center text-sm text-[var(--muted)]">{t("secureAreaHint")}</p>
        <RegisterForm callbackUrl={callbackUrl} googleEnabled={isGoogleAuthConfigured()} />
      </div>
    </main>
  );
}
