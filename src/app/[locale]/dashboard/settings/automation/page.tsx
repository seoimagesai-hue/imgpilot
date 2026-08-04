import {getTranslations, setRequestLocale} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {WorkflowForm} from "@/components/workflows/workflow-form";
import {WorkflowList} from "@/components/workflows/workflow-list";
import type {ApiWorkspaceType} from "@/db/schema";
import {isAppLocale} from "@/server/auth/validation";
import {requireUser} from "@/server/auth/session";
import {resolveWorkspaceEntitlementUserId} from "@/server/api/permissions";
import {resolveEntitlement} from "@/server/billing/entitlements";
import {resolveActiveWorkspace} from "@/server/organizations/workspace";
import {listAccessibleProjectsForUser} from "@/server/projects/queries";
import {listWorkflows} from "@/server/workflows/definitions";
import {canManageWorkflows, canRunWorkflows, canViewWorkflows} from "@/server/workflows/permissions";

export const dynamic = "force-dynamic";

type Props = {params: Promise<{locale: string}>};

export default async function AutomationSettingsPage({params}: Props) {
  const {locale: raw} = await params;
  const locale = isAppLocale(raw) ? raw : "en";
  setRequestLocale(locale);
  const session = await requireUser(locale, "/dashboard/settings/automation");
  const userId = session.user.id;

  const workspace = await resolveActiveWorkspace(userId);
  const workspaceType: ApiWorkspaceType = workspace.type === "organization" ? "organization" : "personal";
  const workspaceId = workspace.id;

  const t = await getTranslations("workflows");
  const canView = await canViewWorkflows(userId, workspaceType, workspaceId);

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

  const canManage = await canManageWorkflows(userId, workspaceType, workspaceId);
  const canRun = await canRunWorkflows(userId, workspaceType, workspaceId);
  const entitlementUserId = await resolveWorkspaceEntitlementUserId(workspaceType, workspaceId);
  const entitlement = entitlementUserId ? await resolveEntitlement(entitlementUserId) : null;

  const workflows = await listWorkflows({actorUserId: userId, workspaceType, workspaceId});
  const allProjects = await listAccessibleProjectsForUser(userId, "active");
  const projects = allProjects
    .filter((project) =>
      workspaceType === "personal"
        ? project.workspaceType === "personal" && project.userId === workspaceId
        : project.workspaceType === "organization" && project.organizationId === workspaceId,
    )
    .map((project) => ({id: project.id, name: project.name}));

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

      {!entitlement?.plan.workflowsEnabled ? (
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
        {canManage && entitlement?.plan.workflowsEnabled ? (
          <>
            <WorkflowForm
              workspaceType={workspaceType}
              workspaceId={workspaceId}
              projects={projects}
              canManage={canManage}
            />
            {entitlement ? (
              <p className="text-sm text-[var(--muted)]">
                {t("workflowsUsed")}:{" "}
                <span className="font-medium text-[var(--foreground)]">
                  {workflows.length} / {entitlement.plan.maxWorkflows}
                </span>
              </p>
            ) : null}
          </>
        ) : null}

        {entitlement?.plan.workflowsEnabled ? (
          <WorkflowList
            workflows={workflows}
            workspaceType={workspaceType}
            workspaceId={workspaceId}
            canManage={canManage}
            canRun={canRun}
          />
        ) : null}
      </div>

      <p className="mt-6 text-sm text-[var(--muted)]">
        <Link href="/docs/automation" className="font-medium text-[var(--accent)]">
          {t("docsLink")}
        </Link>
      </p>
    </main>
  );
}
