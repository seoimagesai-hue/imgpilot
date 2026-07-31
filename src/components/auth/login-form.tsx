"use client";

import {useLocale, useTranslations} from "next-intl";
import {useActionState} from "react";
import {Link} from "@/i18n/navigation";
import {loginAction, type AuthActionState} from "@/server/auth/actions";
import {GoogleSignInButton} from "./google-sign-in-button";
import {useAuthMessage} from "./use-auth-message";
import {LanguageSwitcher} from "@/components/dashboard/language-switcher";

const initialState: AuthActionState = {ok: false};

type LoginFormProps = {
  callbackUrl: string;
  googleEnabled: boolean;
};

export function LoginForm({callbackUrl, googleEnabled}: LoginFormProps) {
  const t = useTranslations("authentication");
  const locale = useLocale();
  const messageFor = useAuthMessage();
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("loginTitle")}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{t("loginSubtitle")}</p>
        </div>
        <LanguageSwitcher />
      </div>

      {state.error ? (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {messageFor(state.error)}
        </div>
      ) : null}

      <form action={formAction} className="space-y-4" noValidate>
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="callbackUrl" value={callbackUrl} />

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
            {t("email")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={pending}
            className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5"
          />
          {state.fieldErrors?.email ? (
            <p className="mt-1 text-sm text-red-700">{messageFor(state.fieldErrors.email)}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
            {t("password")}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={pending}
            className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5"
          />
          {state.fieldErrors?.password ? (
            <p className="mt-1 text-sm text-red-700">{messageFor(state.fieldErrors.password)}</p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? t("signingIn") : t("signIn")}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-[var(--muted)]">
        <span className="h-px flex-1 bg-[var(--border)]" />
        <span>{t("or")}</span>
        <span className="h-px flex-1 bg-[var(--border)]" />
      </div>

      <GoogleSignInButton enabled={googleEnabled} callbackUrl={callbackUrl} />

      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        {t("noAccount")}{" "}
        <Link href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-medium text-[var(--accent)]">
          {t("createAccount")}
        </Link>
      </p>
    </div>
  );
}
