"use client";

import {useActionState, useEffect, useRef, useState} from "react";
import {useFormatter, useLocale, useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";
import {
  disableWebflowConnectionAction,
  disconnectWebflowConnectionAction,
  enableWebflowConnectionAction,
  listWebflowSitesAction,
  selectWebflowSiteAction,
  updateWebflowTokenAction,
  verifyWebflowConnectionAction,
  type WebflowActionState,
} from "@/server/webflow/actions";
import type {WebflowConnectionSafeDto} from "@/server/webflow/connections";
import {PublishHistory, type PublishHistoryJob} from "@/components/webflow/publish-history";

const initial: WebflowActionState = {ok: false};

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
  connection: WebflowConnectionSafeDto;
  jobs: PublishHistoryJob[];
  workspaceType: "personal" | "organization";
  workspaceId: string;
  canManage: boolean;
};

export function ConnectionDetail({connection, jobs, workspaceType, workspaceId, canManage}: ConnectionDetailProps) {
  const t = useTranslations("webflow");
  const tErr = useTranslations("webflow.errors");
  const format = useFormatter();
  const locale = useLocale();

  const [verifyState, verifyAction, verifyPending] = useActionState(verifyWebflowConnectionAction, initial);
  const [disableState, disableAction, disablePending] = useActionState(disableWebflowConnectionAction, initial);
  const [enableState, enableAction, enablePending] = useActionState(enableWebflowConnectionAction, initial);
  const [disconnectState, disconnectAction, disconnectPending] = useActionState(
    disconnectWebflowConnectionAction,
    initial,
  );
  const [tokenState, tokenAction, tokenPending] = useActionState(updateWebflowTokenAction, initial);
  const [sitesState, loadSitesAction, sitesPending] = useActionState(listWebflowSitesAction, initial);
  const [selectSiteState, selectSiteAction, selectSitePending] = useActionState(selectWebflowSiteAction, initial);

  const [display, setDisplay] = useState(connection);
  const [chosenSiteId, setChosenSiteId] = useState("");
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
    if (selectSiteState.connection) setDisplay(selectSiteState.connection);
  }, [selectSiteState.connection]);
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

  function handleLoadSites() {
    const formData = new FormData();
    formData.set("connectionId", connection.id);
    formData.set("workspaceType", workspaceType);
    formData.set("workspaceId", workspaceId);
    loadSitesAction(formData);
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/settings/integrations/webflow" className="text-sm text-[var(--accent)]">
        ← {t("backToConnections")}
      </Link>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">{display.name}</h1>
            <p className="mt-1 break-all text-sm text-[var(--muted)]">
              {display.remoteSiteHostnameSafe || display.remoteSiteNameSafe || t("noSiteSelected")}
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
            <dt className="text-[var(--muted)]">{t("siteName")}</dt>
            <dd className="mt-1">{display.remoteSiteNameSafe ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">{t("siteHostname")}</dt>
            <dd className="mt-1">{display.remoteSiteHostnameSafe ?? "—"}</dd>
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
          <h2 className="text-lg font-semibold">{t("selectSiteTitle")}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{t("selectSiteHint")}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleLoadSites}
              disabled={sitesPending}
              className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
            >
              {sitesPending ? t("loadingSites") : t("loadSites")}
            </button>
          </div>

          {sitesState.error ? (
            <p role="alert" className="mt-2 text-sm text-red-700">
              {msg(sitesState.error)}
            </p>
          ) : null}

          {sitesState.ok && sitesState.sites ? (
            sitesState.sites.length === 0 ? (
              <p role="status" className="mt-2 text-sm text-[var(--muted)]">
                {t("noSitesFound")}
              </p>
            ) : (
              <form action={selectSiteAction} className="mt-3 flex flex-wrap items-center gap-2">
                {hiddenFields}
                <select
                  name="siteId"
                  value={chosenSiteId || sitesState.sites[0]?.siteId || ""}
                  onChange={(e) => setChosenSiteId(e.target.value)}
                  disabled={selectSitePending}
                  className="rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm"
                >
                  {sitesState.sites.map((site) => (
                    <option key={site.siteId} value={site.siteId}>
                      {site.displayNameSafe || site.siteId} {site.defaultHostnameSafe ? `(${site.defaultHostnameSafe})` : ""}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={selectSitePending}
                  className="rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {selectSitePending ? t("selectingSite") : t("selectSite")}
                </button>
              </form>
            )
          ) : null}

          {selectSiteState.error ? (
            <p role="alert" className="mt-2 text-sm text-red-700">
              {msg(selectSiteState.error)}
            </p>
          ) : null}
          {selectSiteState.ok && selectSiteState.connection ? (
            <p role="status" className="mt-2 text-sm text-emerald-800">
              {t("selectSiteSuccess")}
            </p>
          ) : null}
        </section>
      ) : null}

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
