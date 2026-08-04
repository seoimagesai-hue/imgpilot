"use client";

import {useActionState, useEffect, useRef, useState} from "react";
import {useFormatter, useLocale, useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";
import {
  disableShopifyConnectionAction,
  disconnectShopifyConnectionAction,
  enableShopifyConnectionAction,
  updateShopifyTokenAction,
  verifyShopifyConnectionAction,
  type ShopifyActionState,
} from "@/server/shopify/actions";
import type {ShopifyConnectionSafeDto} from "@/server/shopify/connections";
import {PublishHistory, type PublishHistoryJob} from "@/components/shopify/publish-history";

const initial: ShopifyActionState = {ok: false};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  verifying: "bg-blue-100 text-blue-800",
  active: "bg-emerald-100 text-emerald-800",
  degraded: "bg-amber-100 text-amber-800",
  authentication_failed: "bg-red-100 text-red-800",
  permission_failed: "bg-red-100 text-red-800",
  unreachable: "bg-red-100 text-red-800",
  disabled: "bg-gray-100 text-gray-700",
  disconnected: "bg-gray-100 text-gray-700",
};

type ConnectionDetailProps = {
  connection: ShopifyConnectionSafeDto;
  jobs: PublishHistoryJob[];
  workspaceType: "personal" | "organization";
  workspaceId: string;
  canManage: boolean;
};

export function ConnectionDetail({connection, jobs, workspaceType, workspaceId, canManage}: ConnectionDetailProps) {
  const t = useTranslations("shopify");
  const tErr = useTranslations("shopify.errors");
  const format = useFormatter();
  const locale = useLocale();

  const [verifyState, verifyAction, verifyPending] = useActionState(verifyShopifyConnectionAction, initial);
  const [disableState, disableAction, disablePending] = useActionState(disableShopifyConnectionAction, initial);
  const [enableState, enableAction, enablePending] = useActionState(enableShopifyConnectionAction, initial);
  const [disconnectState, disconnectAction, disconnectPending] = useActionState(
    disconnectShopifyConnectionAction,
    initial,
  );
  const [tokenState, tokenAction, tokenPending] = useActionState(updateShopifyTokenAction, initial);

  const [display, setDisplay] = useState(connection);
  const tokenFormRef = useRef<HTMLFormElement>(null);
  const lastTokenUpdate = useRef<string | undefined>(undefined);

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
    if (tokenState.connection) {
      setDisplay(tokenState.connection);
      const key = String(tokenState.connection.updatedAt);
      if (key !== lastTokenUpdate.current) {
        lastTokenUpdate.current = key;
        tokenFormRef.current?.reset();
      }
    }
  }, [tokenState.connection]);

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

  return (
    <div className="space-y-6">
      <Link href="/dashboard/settings/integrations/shopify" className="text-sm text-[var(--accent)]">
        ← {t("backToConnections")}
      </Link>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">{display.name}</h1>
            <p className="mt-1 break-all text-sm text-[var(--muted)]">{display.shopDomain}</p>
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
            <dt className="text-[var(--muted)]">{t("shopName")}</dt>
            <dd className="mt-1">{display.shopNameSafe ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">{t("shopPlan")}</dt>
            <dd className="mt-1">{display.shopifyPlanNameSafe ?? "—"}</dd>
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

      {canManage && !isDisconnected ? (
        <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">{t("updateTokenTitle")}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{t("updateTokenHint")}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">{t("accessTokenNeverShown")}</p>
          <form ref={tokenFormRef} action={tokenAction} className="mt-4 space-y-4" noValidate>
            {hiddenFields}
            {tokenState.error && !tokenState.fieldErrors ? (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {msg(tokenState.error)}
              </div>
            ) : null}
            {tokenState.ok ? (
              <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {t("updateTokenSuccess")}
              </div>
            ) : null}
            <div>
              <label htmlFor="shopify-access-token" className="mb-1.5 block text-sm font-medium">
                {t("accessToken")}
              </label>
              <input
                id="shopify-access-token"
                name="accessToken"
                type="password"
                required
                maxLength={500}
                autoComplete="new-password"
                disabled={tokenPending}
                placeholder={t("accessTokenPlaceholder")}
                className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
              />
              {tokenState.fieldErrors?.accessToken ? (
                <p className="mt-1 text-sm text-red-700">{msg(tokenState.fieldErrors.accessToken)}</p>
              ) : null}
            </div>
            <button
              type="submit"
              disabled={tokenPending}
              className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
            >
              {tokenPending ? t("updatingToken") : t("updateToken")}
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
