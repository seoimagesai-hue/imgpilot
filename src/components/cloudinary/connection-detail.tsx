"use client";

import {useActionState, useEffect, useRef, useState} from "react";
import {useFormatter, useLocale, useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";
import {
  acknowledgeCloudinaryPublicDeliveryAction,
  disableCloudinaryConnectionAction,
  disconnectCloudinaryConnectionAction,
  enableCloudinaryConnectionAction,
  updateCloudinaryCredentialsAction,
  verifyCloudinaryConnectionAction,
  type CloudinaryActionState,
} from "@/server/cloudinary/actions";
import type {CloudinaryConnectionSafeDto} from "@/server/cloudinary/connections";
import {PublishHistory, type PublishHistoryJob} from "@/components/cloudinary/publish-history";

const initial: CloudinaryActionState = {ok: false};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  verifying: "bg-blue-100 text-blue-800",
  active: "bg-emerald-100 text-emerald-800",
  degraded: "bg-amber-100 text-amber-800",
  authentication_failed: "bg-red-100 text-red-800",
  permission_failed: "bg-red-100 text-red-800",
  rate_limited: "bg-amber-100 text-amber-800",
  unreachable: "bg-red-100 text-red-800",
  disabled: "bg-gray-100 text-gray-700",
  disconnected: "bg-gray-100 text-gray-700",
};

type ConnectionDetailProps = {
  connection: CloudinaryConnectionSafeDto;
  jobs: PublishHistoryJob[];
  workspaceType: "personal" | "organization";
  workspaceId: string;
  canManage: boolean;
};

/**
 * Connection detail screen: verify / rotate credentials / acknowledge public
 * delivery / disable / enable / disconnect. Mirrors
 * `components/webflow/connection-detail.tsx`. The API secret input is never
 * pre-filled — only a fresh value is ever submitted for rotation.
 */
export function ConnectionDetail({connection, jobs, workspaceType, workspaceId, canManage}: ConnectionDetailProps) {
  const t = useTranslations("cloudinary");
  const tErr = useTranslations("cloudinary.errors");
  const format = useFormatter();
  const locale = useLocale();

  const [verifyState, verifyAction, verifyPending] = useActionState(verifyCloudinaryConnectionAction, initial);
  const [disableState, disableAction, disablePending] = useActionState(disableCloudinaryConnectionAction, initial);
  const [enableState, enableAction, enablePending] = useActionState(enableCloudinaryConnectionAction, initial);
  const [disconnectState, disconnectAction, disconnectPending] = useActionState(
    disconnectCloudinaryConnectionAction,
    initial,
  );
  const [credentialsState, credentialsAction, credentialsPending] = useActionState(
    updateCloudinaryCredentialsAction,
    initial,
  );
  const [ackState, ackAction, ackPending] = useActionState(acknowledgeCloudinaryPublicDeliveryAction, initial);

  const [display, setDisplay] = useState(connection);
  const credentialsFormRef = useRef<HTMLFormElement>(null);
  const lastCredentialsUpdate = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (verifyState.connection) setDisplay(verifyState.connection);
  }, [verifyState.connection]);
  useEffect(() => {
    if (disableState.connection) setDisplay(disableState.connection);
  }, [disableState.connection]);
  useEffect(() => {
    if (enableState.connection) setDisplay(enableState.connection);
  }, [enableState.connection]);
  useEffect(() => {
    if (disconnectState.connection) setDisplay(disconnectState.connection);
  }, [disconnectState.connection]);
  useEffect(() => {
    if (ackState.connection) setDisplay(ackState.connection);
  }, [ackState.connection]);
  useEffect(() => {
    if (credentialsState.connection) {
      setDisplay(credentialsState.connection);
      const key = String(credentialsState.connection.updatedAt);
      if (key !== lastCredentialsUpdate.current) {
        lastCredentialsUpdate.current = key;
        credentialsFormRef.current?.reset();
      }
    }
  }, [credentialsState.connection]);

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
      <input type="hidden" name="connectionId" value={connection.id} />
    </>
  );

  const isDisconnected = display.status === "disconnected";
  const needsPublicAck = display.defaultDeliveryType === "upload" && !display.publicDeliveryAcknowledgedAt;

  return (
    <div className="space-y-6">
      <Link href="/dashboard/settings/integrations/cloudinary" className="text-sm text-[var(--accent)]">
        ← {t("backToConnections")}
      </Link>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">{display.name}</h1>
            <p className="mt-1 break-all text-sm text-[var(--muted)]">
              {display.cloudNameSafe || t("notVerifiedYet")}
            </p>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              STATUS_STYLES[display.status] ?? "bg-gray-100 text-gray-700"
            }`}
          >
            {t(`statusValues.${display.status}` as "statusValues.pending")}
          </span>
        </div>

        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[var(--muted)]">{t("cloudName")}</dt>
            <dd className="mt-1">{display.cloudNameSafe ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">{t("deliveryType")}</dt>
            <dd className="mt-1">
              {t(`deliveryTypeValues.${display.defaultDeliveryType}` as "deliveryTypeValues.upload")}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">{t("defaultFolder")}</dt>
            <dd className="mt-1 break-all font-mono text-xs">{display.defaultFolder}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">{t("lastVerifiedAt")}</dt>
            <dd className="mt-1">
              {display.lastVerifiedAt
                ? format.dateTime(new Date(display.lastVerifiedAt), {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "UTC",
                  })
                : t("neverVerified")}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">{t("consecutiveFailures")}</dt>
            <dd className="mt-1 tabular-nums">{display.consecutiveFailureCount}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">{t("publicDeliveryStatus")}</dt>
            <dd className="mt-1">
              {display.publicDeliveryAcknowledgedAt ? t("publicDeliveryAcknowledged") : t("publicDeliveryNotAcknowledged")}
            </dd>
          </div>
        </dl>

        {verifyState.ok && verifyState.connection?.status === "active" ? (
          <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">
            {t("verifySuccess")}
          </p>
        ) : null}
        {verifyState.error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {msg(verifyState.error)}
          </p>
        ) : null}

        {canManage && !isDisconnected ? (
          <div className="mt-5 flex flex-wrap gap-2">
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

            {display.status === "disabled" ? (
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

            <form action={disconnectAction}>
              {hiddenFields}
              <button
                type="submit"
                disabled={disconnectPending}
                onClick={(e) => {
                  if (!window.confirm(t("confirmDisconnect"))) e.preventDefault();
                }}
                className="rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                {disconnectPending ? t("disconnecting") : t("disconnect")}
              </button>
            </form>
          </div>
        ) : null}

        {disableState.error ? <p className="mt-3 text-sm text-red-700">{msg(disableState.error)}</p> : null}
        {enableState.error ? <p className="mt-3 text-sm text-red-700">{msg(enableState.error)}</p> : null}
        {disconnectState.error ? <p className="mt-3 text-sm text-red-700">{msg(disconnectState.error)}</p> : null}
      </section>

      {canManage && !isDisconnected && needsPublicAck ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-lg font-semibold text-amber-900">{t("publicDeliveryTitle")}</h2>
          <p className="mt-1 text-sm text-amber-900">{t("publicDeliveryAcknowledgement")}</p>
          <form action={ackAction} className="mt-4">
            {hiddenFields}
            <button
              type="submit"
              disabled={ackPending}
              className="rounded-xl bg-amber-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {ackPending ? t("acknowledging") : t("acknowledgePublicDelivery")}
            </button>
          </form>
          {ackState.error ? (
            <p role="alert" className="mt-2 text-sm text-red-700">
              {msg(ackState.error)}
            </p>
          ) : null}
        </section>
      ) : null}

      {canManage && !isDisconnected ? (
        <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">{t("updateCredentialsTitle")}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{t("updateCredentialsHint")}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">{t("apiSecretNeverShown")}</p>
          <form ref={credentialsFormRef} action={credentialsAction} className="mt-4 space-y-4" noValidate>
            {hiddenFields}
            {credentialsState.error && !credentialsState.fieldErrors ? (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {msg(credentialsState.error)}
              </div>
            ) : null}
            {credentialsState.ok ? (
              <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {t("updateCredentialsSuccess")}
              </div>
            ) : null}
            <div>
              <label htmlFor="cloudinary-update-cloud-name" className="mb-1.5 block text-sm font-medium">
                {t("cloudName")}
              </label>
              <input
                id="cloudinary-update-cloud-name"
                name="cloudName"
                required
                maxLength={200}
                disabled={credentialsPending}
                placeholder={t("cloudNamePlaceholder")}
                className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
              />
              {credentialsState.fieldErrors?.cloudName ? (
                <p className="mt-1 text-sm text-red-700">{msg(credentialsState.fieldErrors.cloudName)}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="cloudinary-update-api-key" className="mb-1.5 block text-sm font-medium">
                {t("apiKey")}
              </label>
              <input
                id="cloudinary-update-api-key"
                name="apiKey"
                type="password"
                required
                maxLength={200}
                autoComplete="new-password"
                disabled={credentialsPending}
                placeholder={t("apiKeyPlaceholder")}
                className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
              />
              {credentialsState.fieldErrors?.apiKey ? (
                <p className="mt-1 text-sm text-red-700">{msg(credentialsState.fieldErrors.apiKey)}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="cloudinary-update-api-secret" className="mb-1.5 block text-sm font-medium">
                {t("apiSecret")}
              </label>
              <input
                id="cloudinary-update-api-secret"
                name="apiSecret"
                type="password"
                required
                maxLength={500}
                autoComplete="new-password"
                disabled={credentialsPending}
                placeholder={t("apiSecretPlaceholder")}
                className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
              />
              {credentialsState.fieldErrors?.apiSecret ? (
                <p className="mt-1 text-sm text-red-700">{msg(credentialsState.fieldErrors.apiSecret)}</p>
              ) : null}
            </div>
            <button
              type="submit"
              disabled={credentialsPending}
              className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
            >
              {credentialsPending ? t("updatingCredentials") : t("updateCredentials")}
            </button>
          </form>
        </section>
      ) : null}

      <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">{t("recentPublishes")}</h2>
        <div className="mt-3">
          <PublishHistory jobs={jobs} showRetry={false} />
        </div>
      </section>
    </div>
  );
}
