"use client";

import {useActionState, useEffect, useRef, useState} from "react";
import {useFormatter, useLocale, useTranslations} from "next-intl";
import {revokeApiKeyAction, rotateApiKeyAction, type DeveloperActionState} from "@/server/api/actions";
import type {ApiKeySafeDto} from "@/server/api/keys";
import {OneTimeSecretBanner} from "@/components/developer/one-time-secret-banner";

const initial: DeveloperActionState = {ok: false};

type ApiKeyListProps = {
  apiKeys: ApiKeySafeDto[];
  workspaceType: "personal" | "organization";
  workspaceId: string;
  canManage: boolean;
};

export function ApiKeyList({apiKeys, workspaceType, workspaceId, canManage}: ApiKeyListProps) {
  const t = useTranslations("developer.keys");

  if (apiKeys.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 text-center shadow-sm">
        <h3 className="font-semibold">{t("emptyTitle")}</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">{t("emptyText")}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
      <h2 className="border-b border-[var(--border)] p-4 text-lg font-semibold">{t("listTitle")}</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
              <th className="px-4 py-3">{t("columnName")}</th>
              <th className="px-4 py-3">{t("columnPrefix")}</th>
              <th className="px-4 py-3">{t("columnScopes")}</th>
              <th className="px-4 py-3">{t("columnStatus")}</th>
              <th className="px-4 py-3">{t("columnLastUsed")}</th>
              <th className="px-4 py-3">{t("columnActions")}</th>
            </tr>
          </thead>
          <tbody>
            {apiKeys.map((key) => (
              <ApiKeyRow
                key={key.id}
                apiKey={key}
                workspaceType={workspaceType}
                workspaceId={workspaceId}
                canManage={canManage}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ApiKeyRow({
  apiKey,
  workspaceType,
  workspaceId,
  canManage,
}: {
  apiKey: ApiKeySafeDto;
  workspaceType: "personal" | "organization";
  workspaceId: string;
  canManage: boolean;
}) {
  const t = useTranslations("developer.keys");
  const tOneTime = useTranslations("developer.oneTime");
  const tErr = useTranslations("developer.errors");
  const format = useFormatter();
  const locale = useLocale();

  const [revokeState, revokeAction, revokePending] = useActionState(revokeApiKeyAction, initial);
  const [rotateState, rotateAction, rotatePending] = useActionState(rotateApiKeyAction, initial);
  const [rotateDismissed, setRotateDismissed] = useState(false);
  const lastRotatedRawKey = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (rotateState.rawKey && rotateState.rawKey !== lastRotatedRawKey.current) {
      lastRotatedRawKey.current = rotateState.rawKey;
      setRotateDismissed(false);
    }
  }, [rotateState.rawKey]);

  function msg(code?: string) {
    if (!code) return null;
    try {
      return tErr(code as "INTERNAL_ERROR");
    } catch {
      return tErr("INTERNAL_ERROR");
    }
  }

  const currentKey = rotateState.ok && rotateState.apiKey ? rotateState.apiKey : revokeState.ok && revokeState.apiKey ? revokeState.apiKey : apiKey;

  if (rotateState.ok && rotateState.rawKey && !rotateDismissed) {
    return (
      <tr>
        <td colSpan={6} className="px-4 py-4">
          <OneTimeSecretBanner
            title={tOneTime("keyTitle")}
            value={rotateState.rawKey}
            onDismiss={() => setRotateDismissed(true)}
          />
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-[var(--border)] last:border-b-0">
      <td className="px-4 py-3 font-medium">{currentKey.name}</td>
      <td className="px-4 py-3 font-mono text-xs text-[var(--muted)]">{currentKey.publicPrefix}…</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {currentKey.scopes.map((scope) => (
            <span key={scope} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-mono">
              {scope}
            </span>
          ))}
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={
            currentKey.status === "active"
              ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800"
              : "rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700"
          }
        >
          {t(`statusValues.${currentKey.status}` as "statusValues.active")}
        </span>
      </td>
      <td className="px-4 py-3 text-[var(--muted)]">
        {currentKey.lastUsedAt
          ? format.dateTime(new Date(currentKey.lastUsedAt), {dateStyle: "medium", timeZone: "UTC"})
          : t("never")}
      </td>
      <td className="px-4 py-3">
        {canManage && currentKey.status === "active" ? (
          <div className="flex flex-wrap gap-2">
            <form action={rotateAction}>
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="workspaceType" value={workspaceType} />
              <input type="hidden" name="workspaceId" value={workspaceId} />
              <input type="hidden" name="apiKeyId" value={apiKey.id} />
              <button
                type="submit"
                disabled={rotatePending || revokePending}
                onClick={(e) => {
                  if (!window.confirm(t("confirmRotate"))) e.preventDefault();
                }}
                className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-60"
              >
                {rotatePending ? t("rotating") : t("rotate")}
              </button>
            </form>
            <form action={revokeAction}>
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="workspaceType" value={workspaceType} />
              <input type="hidden" name="workspaceId" value={workspaceId} />
              <input type="hidden" name="apiKeyId" value={apiKey.id} />
              <button
                type="submit"
                disabled={rotatePending || revokePending}
                onClick={(e) => {
                  if (!window.confirm(t("confirmRevoke"))) e.preventDefault();
                }}
                className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                {revokePending ? t("revoking") : t("revoke")}
              </button>
            </form>
          </div>
        ) : null}
        {revokeState.error ? <p className="mt-1 text-xs text-red-700">{msg(revokeState.error)}</p> : null}
        {rotateState.error ? <p className="mt-1 text-xs text-red-700">{msg(rotateState.error)}</p> : null}
      </td>
    </tr>
  );
}
