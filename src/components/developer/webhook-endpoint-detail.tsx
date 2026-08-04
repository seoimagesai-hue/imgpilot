"use client";

import {useActionState, useEffect, useRef, useState} from "react";
import {useFormatter, useLocale, useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";
import {
  deleteWebhookEndpointAction,
  disableWebhookEndpointAction,
  enableWebhookEndpointAction,
  rotateWebhookSecretAction,
  sendTestWebhookAction,
  verifyWebhookEndpointAction,
  type DeveloperActionState,
} from "@/server/api/actions";
import type {WebhookDeliveryHistoryItem, WebhookEndpointSafeDto} from "@/server/webhooks/endpoints";
import {OneTimeSecretBanner} from "@/components/developer/one-time-secret-banner";

const initial: DeveloperActionState = {ok: false};

type WebhookEndpointDetailProps = {
  endpoint: WebhookEndpointSafeDto;
  deliveries: WebhookDeliveryHistoryItem[];
  workspaceType: "personal" | "organization";
  workspaceId: string;
  canManage: boolean;
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  pending_verification: "bg-amber-100 text-amber-800",
  failing: "bg-red-100 text-red-800",
  disabled: "bg-gray-100 text-gray-700",
  deleted: "bg-gray-100 text-gray-700",
};

const DELIVERY_STATUS_STYLES: Record<string, string> = {
  succeeded: "bg-emerald-100 text-emerald-800",
  queued: "bg-gray-100 text-gray-700",
  delivering: "bg-blue-100 text-blue-800",
  retry_scheduled: "bg-amber-100 text-amber-800",
  failed: "bg-red-100 text-red-800",
  exhausted: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-700",
};

export function WebhookEndpointDetail({
  endpoint,
  deliveries,
  workspaceType,
  workspaceId,
  canManage,
}: WebhookEndpointDetailProps) {
  const t = useTranslations("developer.webhooks");
  const tOneTime = useTranslations("developer.oneTime");
  const tErr = useTranslations("developer.errors");
  const format = useFormatter();
  const locale = useLocale();

  const [verifyState, verifyAction, verifyPending] = useActionState(verifyWebhookEndpointAction, initial);
  const [testState, testAction, testPending] = useActionState(sendTestWebhookAction, initial);
  const [rotateState, rotateAction, rotatePending] = useActionState(rotateWebhookSecretAction, initial);
  const [disableState, disableAction, disablePending] = useActionState(disableWebhookEndpointAction, initial);
  const [enableState, enableAction, enablePending] = useActionState(enableWebhookEndpointAction, initial);
  const [, deleteAction, deletePending] = useActionState(deleteWebhookEndpointAction, initial);

  const [displayEndpoint, setDisplayEndpoint] = useState(endpoint);
  const [rotateDismissed, setRotateDismissed] = useState(false);
  const lastRawSecret = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (verifyState.endpoint) setDisplayEndpoint(verifyState.endpoint);
  }, [verifyState.endpoint]);
  useEffect(() => {
    if (rotateState.endpoint) setDisplayEndpoint(rotateState.endpoint);
  }, [rotateState.endpoint]);
  useEffect(() => {
    if (disableState.endpoint) setDisplayEndpoint(disableState.endpoint);
  }, [disableState.endpoint]);
  useEffect(() => {
    if (enableState.endpoint) setDisplayEndpoint(enableState.endpoint);
  }, [enableState.endpoint]);
  useEffect(() => {
    if (rotateState.rawSecret && rotateState.rawSecret !== lastRawSecret.current) {
      lastRawSecret.current = rotateState.rawSecret;
      setRotateDismissed(false);
    }
  }, [rotateState.rawSecret]);

  function msg(code?: string) {
    if (!code) return null;
    try {
      return tErr(code as "INTERNAL_ERROR");
    } catch {
      return tErr("INTERNAL_ERROR");
    }
  }

  const hiddenFields = (
    <>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="workspaceType" value={workspaceType} />
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="endpointId" value={endpoint.id} />
    </>
  );

  return (
    <div className="space-y-6">
      <Link href="/dashboard/settings/developer/webhooks" className="text-sm text-[var(--accent)]">
        ← {t("listTitle")}
      </Link>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">{displayEndpoint.name}</h1>
            <p className="mt-1 break-all text-sm text-[var(--muted)]">{displayEndpoint.url}</p>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              STATUS_STYLES[displayEndpoint.status] ?? "bg-gray-100 text-gray-700"
            }`}
          >
            {t(`statusValues.${displayEndpoint.status}` as "statusValues.active")}
          </span>
        </div>

        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[var(--muted)]">{t("subscribedEventsLabel")}</dt>
            <dd className="mt-1 flex flex-wrap gap-1">
              {displayEndpoint.subscribedEvents.map((eventType) => (
                <span key={eventType} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-mono">
                  {eventType}
                </span>
              ))}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">{t("verifiedAt")}</dt>
            <dd className="mt-1">
              {displayEndpoint.verifiedAt
                ? format.dateTime(new Date(displayEndpoint.verifiedAt), {dateStyle: "medium", timeStyle: "short", timeZone: "UTC"})
                : t("notVerified")}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">{t("consecutiveFailures")}</dt>
            <dd className="mt-1 tabular-nums">{displayEndpoint.consecutiveFailures}</dd>
          </div>
        </dl>

        {verifyState.ok && verifyState.endpoint?.status === "active" ? (
          <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">
            {t("verifySuccess")}
          </p>
        ) : null}
        {verifyState.error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {msg(verifyState.error)}
          </p>
        ) : null}

        {testState.test ? (
          <p
            className={`mt-4 rounded-lg px-3 py-2 text-sm ${
              testState.test.success ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
            }`}
            role="status"
          >
            {testState.test.success ? t("testSuccess") : t("testFailed")} ({testState.test.detail})
          </p>
        ) : testState.error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {msg(testState.error)}
          </p>
        ) : null}

        {canManage ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {displayEndpoint.status !== "active" && displayEndpoint.status !== "deleted" ? (
              <form action={verifyAction}>
                {hiddenFields}
                <button
                  type="submit"
                  disabled={verifyPending}
                  className="rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {verifyPending ? t("verifying") : t("verify")}
                </button>
              </form>
            ) : null}

            {displayEndpoint.status === "active" || displayEndpoint.status === "failing" ? (
              <form action={testAction}>
                {hiddenFields}
                <button
                  type="submit"
                  disabled={testPending}
                  className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
                >
                  {testPending ? t("sendingTest") : t("sendTest")}
                </button>
              </form>
            ) : null}

            <form action={rotateAction}>
              {hiddenFields}
              <button
                type="submit"
                disabled={rotatePending}
                onClick={(e) => {
                  if (!window.confirm(t("confirmRotateSecret"))) e.preventDefault();
                }}
                className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
              >
                {rotatePending ? t("rotatingSecret") : t("rotateSecret")}
              </button>
            </form>

            {displayEndpoint.status === "disabled" ? (
              <form action={enableAction}>
                {hiddenFields}
                <button
                  type="submit"
                  disabled={enablePending}
                  className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
                >
                  {enablePending ? t("enabling") : t("enable")}
                </button>
              </form>
            ) : (
              <form action={disableAction}>
                {hiddenFields}
                <button
                  type="submit"
                  disabled={disablePending}
                  onClick={(e) => {
                    if (!window.confirm(t("confirmDisable"))) e.preventDefault();
                  }}
                  className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
                >
                  {disablePending ? t("disabling") : t("disable")}
                </button>
              </form>
            )}

            <form action={deleteAction}>
              {hiddenFields}
              <button
                type="submit"
                disabled={deletePending}
                onClick={(e) => {
                  if (!window.confirm(t("confirmDelete"))) e.preventDefault();
                }}
                className="rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                {deletePending ? t("deleting") : t("delete")}
              </button>
            </form>
          </div>
        ) : null}

        {disableState.error ? (
          <p className="mt-3 text-sm text-red-700">{msg(disableState.error)}</p>
        ) : null}
        {enableState.error ? <p className="mt-3 text-sm text-red-700">{msg(enableState.error)}</p> : null}

        {rotateState.ok && rotateState.rawSecret && !rotateDismissed ? (
          <div className="mt-5">
            <OneTimeSecretBanner
              title={tOneTime("secretTitle")}
              value={rotateState.rawSecret}
              onDismiss={() => setRotateDismissed(true)}
            />
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">{t("deliveryHistory")}</h2>
        {deliveries.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">{t("deliveryHistoryEmpty")}</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
                  <th className="px-3 py-2">{t("columnEvent")}</th>
                  <th className="px-3 py-2">{t("columnAttempt")}</th>
                  <th className="px-3 py-2">{t("columnDeliveryStatus")}</th>
                  <th className="px-3 py-2">{t("columnResponse")}</th>
                  <th className="px-3 py-2">{t("columnScheduled")}</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((delivery) => (
                  <tr key={delivery.id} className="border-b border-[var(--border)] last:border-b-0">
                    <td className="px-3 py-2 font-mono text-xs">{delivery.eventType}</td>
                    <td className="px-3 py-2 tabular-nums">{delivery.attemptNumber}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          DELIVERY_STATUS_STYLES[delivery.status] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {t(`deliveryStatusValues.${delivery.status}` as "deliveryStatusValues.queued")}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[var(--muted)]">
                      {delivery.responseStatus ?? delivery.safeFailureCode ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-[var(--muted)]">
                      {format.dateTime(new Date(delivery.scheduledAt), {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "UTC",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
