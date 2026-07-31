"use client";

import {useLocale, useTranslations} from "next-intl";
import {useFormStatus} from "react-dom";
import {googleSignInAction} from "@/server/auth/actions";

type GoogleSignInButtonProps = {
  enabled: boolean;
  callbackUrl: string;
};

function GoogleSubmitButton() {
  const t = useTranslations("authentication");
  const {pending} = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-medium disabled:opacity-60"
    >
      {pending ? t("signingIn") : t("continueWithGoogle")}
    </button>
  );
}

export function GoogleSignInButton({enabled, callbackUrl}: GoogleSignInButtonProps) {
  const t = useTranslations("authentication");
  const locale = useLocale();

  if (!enabled) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex w-full items-center justify-center rounded-xl border border-[var(--border)] bg-gray-50 px-4 py-2.5 text-sm text-[var(--muted)]"
        title={t("googleUnavailable")}
      >
        {t("googleUnavailable")}
      </button>
    );
  }

  return (
    <form action={googleSignInAction}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <GoogleSubmitButton />
    </form>
  );
}
