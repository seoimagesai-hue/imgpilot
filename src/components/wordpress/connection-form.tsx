"use client";

import {useActionState, useEffect, useRef} from "react";
import {useLocale, useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";
import {createWordpressConnectionAction, type WordpressActionState} from "@/server/wordpress/actions";

const initial: WordpressActionState = {ok: false};

type ConnectionFormProps = {
  workspaceType: "personal" | "organization";
  workspaceId: string;
};

export function ConnectionForm({workspaceType, workspaceId}: ConnectionFormProps) {
  const t = useTranslations("wordpress");
  const tErr = useTranslations("wordpress.errors");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(createWordpressConnectionAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const lastConnectionId = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (state.ok && state.connection && state.connection.id !== lastConnectionId.current) {
      lastConnectionId.current = state.connection.id;
      formRef.current?.reset();
    }
  }, [state.ok, state.connection]);

  function msg(code?: string) {
    if (!code) return null;
    try {
      return tErr(code as "INTERNAL_ERROR");
    } catch {
      return tErr("INTERNAL_ERROR");
    }
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm"
      noValidate
    >
      <h2 className="text-lg font-semibold">{t("createTitle")}</h2>
      <p className="text-sm text-[var(--muted)]">{t("createHint")}</p>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="workspaceType" value={workspaceType} />
      <input type="hidden" name="workspaceId" value={workspaceId} />

      {state.error && !state.fieldErrors ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {msg(state.error)}
        </div>
      ) : null}

      {state.ok && state.connection ? (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {t("createdNotice")}{" "}
          <Link href={`/dashboard/settings/integrations/wordpress/${state.connection.id}`} className="font-medium underline">
            {t("viewDetails")}
          </Link>
        </div>
      ) : null}

      <div>
        <label htmlFor="wp-name" className="mb-1.5 block text-sm font-medium">
          {t("name")}
        </label>
        <input
          id="wp-name"
          name="name"
          required
          maxLength={120}
          disabled={pending}
          placeholder={t("namePlaceholder")}
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
        />
        {state.fieldErrors?.name ? <p className="mt-1 text-sm text-red-700">{msg(state.fieldErrors.name)}</p> : null}
      </div>

      <div>
        <label htmlFor="wp-site-url" className="mb-1.5 block text-sm font-medium">
          {t("siteUrl")}
        </label>
        <input
          id="wp-site-url"
          name="siteUrl"
          type="url"
          required
          inputMode="url"
          disabled={pending}
          placeholder={t("siteUrlPlaceholder")}
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
        />
        <p className="mt-1 text-xs text-[var(--muted)]">{t("siteUrlHint")}</p>
        {state.fieldErrors?.siteUrl ? <p className="mt-1 text-sm text-red-700">{msg(state.fieldErrors.siteUrl)}</p> : null}
      </div>

      <div>
        <label htmlFor="wp-username" className="mb-1.5 block text-sm font-medium">
          {t("username")}
        </label>
        <input
          id="wp-username"
          name="username"
          required
          maxLength={200}
          disabled={pending}
          placeholder={t("usernamePlaceholder")}
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
        />
        {state.fieldErrors?.username ? (
          <p className="mt-1 text-sm text-red-700">{msg(state.fieldErrors.username)}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="wp-app-password" className="mb-1.5 block text-sm font-medium">
          {t("applicationPassword")}
        </label>
        <input
          id="wp-app-password"
          name="applicationPassword"
          type="password"
          required
          maxLength={500}
          autoComplete="new-password"
          disabled={pending}
          placeholder={t("applicationPasswordPlaceholder")}
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
        />
        <p className="mt-1 text-xs text-[var(--muted)]">{t("applicationPasswordHint")}</p>
        {state.fieldErrors?.applicationPassword ? (
          <p className="mt-1 text-sm text-red-700">{msg(state.fieldErrors.applicationPassword)}</p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? t("connecting") : t("connect")}
      </button>
    </form>
  );
}
