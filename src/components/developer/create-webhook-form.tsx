"use client";

import {useActionState, useEffect, useRef, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import {createWebhookEndpointAction, type DeveloperActionState} from "@/server/api/actions";
import {WEBHOOK_EVENT_TYPES, type WebhookEventType} from "@/server/webhooks/event-types";
import {OneTimeSecretBanner} from "@/components/developer/one-time-secret-banner";

const initial: DeveloperActionState = {ok: false};

type CreateWebhookFormProps = {
  workspaceType: "personal" | "organization";
  workspaceId: string;
};

export function CreateWebhookForm({workspaceType, workspaceId}: CreateWebhookFormProps) {
  const t = useTranslations("developer.webhooks");
  const tOneTime = useTranslations("developer.oneTime");
  const tErr = useTranslations("developer.errors");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(createWebhookEndpointAction, initial);
  const [dismissed, setDismissed] = useState(false);
  const lastRawSecret = useRef<string | undefined>(undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.rawSecret && state.rawSecret !== lastRawSecret.current) {
      lastRawSecret.current = state.rawSecret;
      setDismissed(false);
      formRef.current?.reset();
    }
  }, [state.rawSecret]);

  function msg(code?: string) {
    if (!code) return null;
    try {
      return tErr(code as "INTERNAL_ERROR");
    } catch {
      return tErr("INTERNAL_ERROR");
    }
  }

  if (state.ok && state.rawSecret && !dismissed) {
    return (
      <OneTimeSecretBanner
        title={tOneTime("secretTitle")}
        value={state.rawSecret}
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
        <label htmlFor="webhook-name" className="mb-1.5 block text-sm font-medium">
          {t("name")}
        </label>
        <input
          id="webhook-name"
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
        <label htmlFor="webhook-url" className="mb-1.5 block text-sm font-medium">
          {t("url")}
        </label>
        <input
          id="webhook-url"
          name="url"
          type="url"
          required
          inputMode="url"
          disabled={pending}
          placeholder="https://example.com/webhooks/img-pilot"
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
        />
        <p className="mt-1 text-xs text-[var(--muted)]">{t("urlHint")}</p>
        {state.fieldErrors?.url ? <p className="mt-1 text-sm text-red-700">{msg(state.fieldErrors.url)}</p> : null}
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-medium">{t("events")}</span>
        <p className="mb-2 text-xs text-[var(--muted)]">{t("eventsHint")}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {(WEBHOOK_EVENT_TYPES as readonly WebhookEventType[]).map((eventType) => (
            <label
              key={eventType}
              className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            >
              <input type="checkbox" name="events" value={eventType} disabled={pending} className="size-4" />
              <span className="font-mono text-xs">{eventType}</span>
            </label>
          ))}
        </div>
        {state.fieldErrors?.events ? (
          <p className="mt-1 text-sm text-red-700">{msg(state.fieldErrors.events)}</p>
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
