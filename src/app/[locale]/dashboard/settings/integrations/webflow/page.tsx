import {getTranslations, setRequestLocale} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {isAppLocale} from "@/server/auth/validation";
import {requireUser} from "@/server/auth/session";
import {resolveActiveWorkspace} from "@/server/organizations/workspace";
import {canManageIntegrations, resolveWorkspaceEntitlementUserId} from "@/server/api/permissions";
import {resolveEntitlement} from "@/server/billing/entitlements";
import {canViewWebflow} from "@/server/webflow/permissions";
import {listConnections} from "@/server/webflow/connections";
import type {ApiWorkspaceType} from "@/db/schema";
import {ConnectionForm} from "@/components/webflow/connection-form";
import {ConnectionList} from "@/components/webflow/connection-list";

export const dynamic = "force-dynamic";

type Props = {params: Promise<{locale: string}>};

export default async function WebflowIntegrationPage({params}: Props) {
  const {locale: raw} = await params;
  const locale = isAppLocale(raw) ? raw : "en";
  setRequestLocale(locale);
  const session = await requireUser(locale, "/dashboard/settings/integrations/webflow");
  const userId = session.user.id;

  const workspace = await resolveActiveWorkspace(userId);
  const workspaceType: ApiWorkspaceType = workspace.type === "organization" ? "organization" : "personal";
  const workspaceId = workspace.id;

  const t = await getTranslations("webflow");
  const canView = await canViewWebflow(userId, workspaceType, workspaceId);

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
  const connections = await listConnections({actorUserId: userId, workspaceType, workspaceId});

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <Link href="/dashboard/settings/integrations" className="text-sm text-[var(--accent)]">
          ← {t("backToIntegrations")}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">{t("subtitle")}</p>
      </header>

      <p className="mb-6 text-sm text-[var(--muted)]">
        {t("workspaceLabel")}:{" "}
        <span className="font-medium text-[var(--foreground)]">
          {workspace.type === "personal" ? t("personalWorkspace") : workspace.displayName}
        </span>
      </p>

      {!entitlement?.plan.webflowEnabled ? (
        <p role="status" className="mb-6 rounded-xl border border-[var(--border)] bg-amber-50 p-3 text-sm">
          {t("notEnabled")}
        </p>
      ) : null}

      {!canManage ? (
        <p role="status" className="mb-6 rounded-xl border border-[var(--border)] bg-amber-50 p-3 text-sm">
          {t("readOnlyNotice")}
        </p>
      ) : null}

      <div className="space-y-6">
        {canManage && entitlement?.plan.webflowEnabled ? (
          <ConnectionForm workspaceType={workspaceType} workspaceId={workspaceId} />
        ) : null}
        {entitlement?.plan.webflowEnabled ? (
          <p className="text-sm text-[var(--muted)]">
            {t("connectionsUsed")}:{" "}
            <span className="font-medium text-[var(--foreground)]">
              {connections.length} / {entitlement.plan.maxWebflowConnections}
            </span>
          </p>
        ) : null}
        <ConnectionList connections={connections} />
      </div>

      <p className="mt-6 text-sm text-[var(--muted)]">
        <Link href="/docs/webflow" className="font-medium text-[var(--accent)]">
          {t("docsLink")}
        </Link>
      </p>
    </main>
  );
}
