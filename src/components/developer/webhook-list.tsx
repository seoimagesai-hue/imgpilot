"use client";

import {useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";
import type {WebhookEndpointSafeDto} from "@/server/webhooks/endpoints";

type WebhookListProps = {
  endpoints: WebhookEndpointSafeDto[];
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  pending_verification: "bg-amber-100 text-amber-800",
  failing: "bg-red-100 text-red-800",
  disabled: "bg-gray-100 text-gray-700",
  deleted: "bg-gray-100 text-gray-700",
};

export function WebhookList({endpoints}: WebhookListProps) {
  const t = useTranslations("developer.webhooks");

  if (endpoints.length === 0) {
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
              <th className="px-4 py-3">{t("columnUrl")}</th>
              <th className="px-4 py-3">{t("columnStatus")}</th>
              <th className="px-4 py-3">{t("columnActions")}</th>
            </tr>
          </thead>
          <tbody>
            {endpoints.map((endpoint) => (
              <tr key={endpoint.id} className="border-b border-[var(--border)] last:border-b-0">
                <td className="px-4 py-3 font-medium">{endpoint.name}</td>
                <td className="max-w-[240px] truncate px-4 py-3 text-[var(--muted)]">{endpoint.url}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_STYLES[endpoint.status] ?? "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {t(`statusValues.${endpoint.status}` as "statusValues.active")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/settings/developer/webhooks/${endpoint.id}`}
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
