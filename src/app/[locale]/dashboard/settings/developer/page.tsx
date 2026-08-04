import {getTranslations, setRequestLocale} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {isAppLocale} from "@/server/auth/validation";
import {requireUser} from "@/server/auth/session";
import {resolveActiveWorkspace} from "@/server/organizations/workspace";
import {canManageIntegrations, canViewIntegrations, resolveWorkspaceEntitlementUserId} from "@/server/api/permissions";
import {resolveEntitlement} from "@/server/billing/entitlements";
import {listApiKeys} from "@/server/api/keys";
import {listEndpoints} from "@/server/webhooks/endpoints";
import type {ApiWorkspaceType} from "@/db/schema";

export const dynamic = "force-dynamic";

type Props = {params: Promise<{locale: string}>};

const OPEN_ENDPOINT_STATUSES = new Set(["pending_verification", "active", "failing"]);

export default async function DeveloperSettingsOverviewPage({params}: Props) {
  const {locale: raw} = await params;
  const locale = isAppLocale(raw) ? raw : "en";
  setRequestLocale(locale);
  const session = await requireUser(locale, "/dashboard/settings/developer");
  const userId = session.user.id;

  const workspace = await resolveActiveWorkspace(userId);
  const workspaceType: ApiWorkspaceType = workspace.type === "organization" ? "organization" : "personal";
  const workspaceId = workspace.id;

  const t = await getTranslations("developer");
  const canView = await canViewIntegrations(userId, workspaceType, workspaceId);

  if (!canView) {
    return (
      <main className="p-4 sm:p-6 lg:p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
        </header>
        <p className="rounded-xl border border-[var(--border)] bg-white p-4 text-sm text-[var(--muted)]">
          {t("noAccessNotice")}
        </p>
      </main>
    );
  }

  const canManage = await canManageIntegrations(userId, workspaceType, workspaceId);
  const entitlementUserId = await resolveWorkspaceEntitlementUserId(workspaceType, workspaceId);
  const entitlement = entitlementUserId ? await resolveEntitlement(entitlementUserId) : null;

  const [apiKeys, endpoints] = await Promise.all([
    listApiKeys({actorUserId: userId, workspaceType, workspaceId}),
    listEndpoints({actorUserId: userId, workspaceType, workspaceId}),
  ]);
  const activeKeyCount = apiKeys.filter((key) => key.status === "active").length;
  const activeEndpointCount = endpoints.filter((endpoint) => OPEN_ENDPOINT_STATUSES.has(endpoint.status)).length;

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">{t("subtitle")}</p>
      </header>

      <p className="mb-6 text-sm text-[var(--muted)]">
        {t("workspaceLabel")}:{" "}
        <span className="font-medium text-[var(--foreground)]">
          {workspace.type === "personal" ? t("personalWorkspace") : workspace.displayName}
        </span>
      </p>

      {!canManage ? (
        <p role="status" className="mb-6 rounded-xl border border-[var(--border)] bg-amber-50 p-3 text-sm">
          {t("readOnlyNotice")}
        </p>
      ) : null}

      <section className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">{t("apiAccess")}</h2>
          <p className="mt-2 text-sm font-medium">
            {entitlement?.plan.apiAccessEnabled ? t("enabled") : t("notIncluded")}
          </p>
          {entitlement?.plan.apiAccessEnabled ? (
            <>
              <p className="mt-3 text-sm text-[var(--muted)]">
                {t("activeApiKeys")}:{" "}
                <span className="font-medium text-[var(--foreground)]">
                  {activeKeyCount} / {entitlement.plan.maxApiKeys}
                </span>
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {t("rateLimit")}: {t("requestsPerMinute", {count: entitlement.plan.apiRequestsPerMinute})}
              </p>
            </>
          ) : null}
          <Link
            href="/dashboard/settings/developer/keys"
            className="mt-4 inline-block rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            {canManage ? t("manageApiKeys") : t("viewApiKeys")}
          </Link>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">{t("webhooksAccess")}</h2>
          <p className="mt-2 text-sm font-medium">
            {entitlement?.plan.webhooksEnabled ? t("enabled") : t("notIncluded")}
          </p>
          {entitlement?.plan.webhooksEnabled ? (
            <p className="mt-3 text-sm text-[var(--muted)]">
              {t("activeWebhooks")}:{" "}
              <span className="font-medium text-[var(--foreground)]">
                {activeEndpointCount} / {entitlement.plan.maxWebhookEndpoints}
              </span>
            </p>
          ) : null}
          <Link
            href="/dashboard/settings/developer/webhooks"
            className="mt-4 inline-block rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            {canManage ? t("manageWebhooks") : t("viewWebhooks")}
          </Link>
        </div>
      </section>

      <p className="text-sm text-[var(--muted)]">
        <Link href="/docs/api" className="font-medium text-[var(--accent)]">
          {t("docsLink")}
        </Link>
      </p>
    </main>
  );
}
