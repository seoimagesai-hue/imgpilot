"use client";

import {useActionState, useEffect, useRef, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import {createApiKeyAction, type DeveloperActionState} from "@/server/api/actions";
import {ALL_API_SCOPES, type ApiScope} from "@/server/api/scopes";
import {OneTimeSecretBanner} from "@/components/developer/one-time-secret-banner";

const initial: DeveloperActionState = {ok: false};

type CreateApiKeyFormProps = {
  workspaceType: "personal" | "organization";
  workspaceId: string;
};

export function CreateApiKeyForm({workspaceType, workspaceId}: CreateApiKeyFormProps) {
  const t = useTranslations("developer.keys");
  const tOneTime = useTranslations("developer.oneTime");
  const tErr = useTranslations("developer.errors");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(createApiKeyAction, initial);
  const [dismissed, setDismissed] = useState(false);
  const lastRawKey = useRef<string | undefined>(undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.rawKey && state.rawKey !== lastRawKey.current) {
      lastRawKey.current = state.rawKey;
      setDismissed(false);
      formRef.current?.reset();
    }
  }, [state.rawKey]);

  function msg(code?: string) {
    if (!code) return null;
    try {
      return tErr(code as "INTERNAL_ERROR");
    } catch {
      return tErr("INTERNAL_ERROR");
    }
  }

  if (state.ok && state.rawKey && !dismissed) {
    return (
      <OneTimeSecretBanner
        title={tOneTime("keyTitle")}
        value={state.rawKey}
        onDismiss={() => setDismissed(true)}
      />
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm"
      noValidate
    >
      <h2 className="text-lg font-semibold">{t("createTitle")}</h2>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="workspaceType" value={workspaceType} />
      <input type="hidden" name="workspaceId" value={workspaceId} />

      {state.error && !state.fieldErrors ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {msg(state.error)}
        </div>
      ) : null}

      <div>
        <label htmlFor="apikey-name" className="mb-1.5 block text-sm font-medium">
          {t("name")}
        </label>
        <input
          id="apikey-name"
          name="name"
          required
          maxLength={120}
          disabled={pending}
          placeholder={t("namePlaceholder")}
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
        />
        {state.fieldErrors?.name ? (
          <p className="mt-1 text-sm text-red-700">{msg(state.fieldErrors.name)}</p>
        ) : null}
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-medium">{t("scopes")}</span>
        <p className="mb-2 text-xs text-[var(--muted)]">{t("scopesHint")}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {(ALL_API_SCOPES as readonly ApiScope[]).map((scope) => (
            <label
              key={scope}
              className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            >
              <input type="checkbox" name="scopes" value={scope} disabled={pending} className="size-4" />
              <span className="font-mono text-xs">{scope}</span>
            </label>
          ))}
        </div>
        {state.fieldErrors?.scopes ? (
          <p className="mt-1 text-sm text-red-700">{msg(state.fieldErrors.scopes)}</p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? t("creating") : t("create")}
      </button>
    </form>
  );
}
