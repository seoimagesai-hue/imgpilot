"use client";

import {useLocale, useTranslations} from "next-intl";
import {useActionState} from "react";
import {Link} from "@/i18n/navigation";
import {registerAction, type AuthActionState} from "@/server/auth/actions";
import {GoogleSignInButton} from "./google-sign-in-button";
import {useAuthMessage} from "./use-auth-message";
import {LanguageSwitcher} from "@/components/dashboard/language-switcher";

const initialState: AuthActionState = {ok: false};

type RegisterFormProps = {
  callbackUrl: string;
  googleEnabled: boolean;
};

export function RegisterForm({callbackUrl, googleEnabled}: RegisterFormProps) {
  const t = useTranslations("authentication");
  const locale = useLocale();
  const messageFor = useAuthMessage();
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("registerTitle")}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{t("registerSubtitle")}</p>
        </div>
        <LanguageSwitcher />
      </div>

      {state.error && !state.fieldErrors ? (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {messageFor(state.error)}
        </div>
      ) : null}

      <form action={formAction} className="space-y-4" noValidate>
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="callbackUrl" value={callbackUrl} />

        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
            {t("name")}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            disabled={pending}
            className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5"
          />
          {state.fieldErrors?.name ? (
            <p className="mt-1 text-sm text-red-700">{messageFor(state.fieldErrors.name)}</p>
          ) : null}
        </div>

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
            autoComplete="new-password"
            required
            minLength={8}
            disabled={pending}
            className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5"
          />
          <p className="mt-1 text-xs text-[var(--muted)]">{t("passwordRequirements")}</p>
          {state.fieldErrors?.password ? (
            <p className="mt-1 text-sm text-red-700">{messageFor(state.fieldErrors.password)}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium">
            {t("confirmPassword")}
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            disabled={pending}
            className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5"
          />
          {state.fieldErrors?.confirmPassword ? (
            <p className="mt-1 text-sm text-red-700">{messageFor(state.fieldErrors.confirmPassword)}</p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? t("creatingAccount") : t("createAccount")}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-[var(--muted)]">
        <span className="h-px flex-1 bg-[var(--border)]" />
        <span>{t("or")}</span>
        <span className="h-px flex-1 bg-[var(--border)]" />
      </div>

      <GoogleSignInButton enabled={googleEnabled} callbackUrl={callbackUrl} />

      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        {t("haveAccount")}{" "}
        <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-medium text-[var(--accent)]">
          {t("signIn")}
        </Link>
      </p>
    </div>
  );
}
