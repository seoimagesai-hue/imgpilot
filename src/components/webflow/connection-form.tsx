"use client";

import {useActionState, useEffect, useRef} from "react";
import {useLocale, useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";
import {createWebflowConnectionAction, type WebflowActionState} from "@/server/webflow/actions";

const initial: WebflowActionState = {ok: false};

type ConnectionFormProps = {
  workspaceType: "personal" | "organization";
  workspaceId: string;
};

export function ConnectionForm({workspaceType, workspaceId}: ConnectionFormProps) {
  const t = useTranslations("webflow");
  const tErr = useTranslations("webflow.errors");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(createWebflowConnectionAction, initial);
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
          <Link href={`/dashboard/settings/integrations/webflow/${state.connection.id}`} className="font-medium underline">
            {t("viewDetails")}
          </Link>
        </div>
      ) : null}

      <div>
        <label htmlFor="webflow-name" className="mb-1.5 block text-sm font-medium">
          {t("name")}
        </label>
        <input
          id="webflow-name"
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
        <label htmlFor="webflow-access-token" className="mb-1.5 block text-sm font-medium">
          {t("accessToken")}
        </label>
        <input
          id="webflow-access-token"
          name="accessToken"
          type="password"
          required
          maxLength={500}
          autoComplete="new-password"
          disabled={pending}
          placeholder={t("accessTokenPlaceholder")}
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
        />
        <p className="mt-1 text-xs text-[var(--muted)]">{t("accessTokenHint")}</p>
        {state.fieldErrors?.accessToken ? (
          <p className="mt-1 text-sm text-red-700">{msg(state.fieldErrors.accessToken)}</p>
        ) : null}
      </div>

      <p className="text-xs text-[var(--muted)]">{t("siteSelectionNote")}</p>

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
