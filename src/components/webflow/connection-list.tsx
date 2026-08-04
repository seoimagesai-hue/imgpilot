"use client";

import {useFormatter, useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";
import type {WebflowConnectionSafeDto} from "@/server/webflow/connections";

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

type ConnectionListProps = {
  connections: WebflowConnectionSafeDto[];
};

export function ConnectionList({connections}: ConnectionListProps) {
  const t = useTranslations("webflow");
  const format = useFormatter();

  if (connections.length === 0) {
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
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
              <th className="px-4 py-3">{t("columnName")}</th>
              <th className="px-4 py-3">{t("columnSite")}</th>
              <th className="px-4 py-3">{t("columnStatus")}</th>
              <th className="px-4 py-3">{t("columnLastVerified")}</th>
              <th className="px-4 py-3">{t("columnActions")}</th>
            </tr>
          </thead>
          <tbody>
            {connections.map((connection) => (
              <tr key={connection.id} className="border-b border-[var(--border)] last:border-b-0">
                <td className="px-4 py-3 font-medium">{connection.name}</td>
                <td className="max-w-[220px] truncate px-4 py-3 text-[var(--muted)]">
                  {connection.remoteSiteHostnameSafe || connection.remoteSiteNameSafe || t("noSiteSelected")}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_STYLES[connection.status] ?? "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {t(`statusValues.${connection.status}` as "statusValues.pending")}
                  </span>
                </td>
                <td className="px-4 py-3 text-[var(--muted)]">
                  {connection.lastVerifiedAt
                    ? format.dateTime(new Date(connection.lastVerifiedAt), {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "UTC",
                      })
                    : t("neverVerified")}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/settings/integrations/webflow/${connection.id}`}
                    className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium hover:bg-gray-50"
                  >
                    {t("viewDetails")}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
