import {notFound} from "next/navigation";
import {getTranslations, setRequestLocale} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {RunHistory} from "@/components/workflows/run-history";
import {StepBuilder} from "@/components/workflows/step-builder";
import {WorkflowForm} from "@/components/workflows/workflow-form";
import type {ApiWorkspaceType} from "@/db/schema";
import {isAppLocale} from "@/server/auth/validation";
import {requireUser} from "@/server/auth/session";
import {resolveWorkspaceEntitlementUserId} from "@/server/api/permissions";
import {resolveEntitlement} from "@/server/billing/entitlements";
import {resolveActiveWorkspace} from "@/server/organizations/workspace";
import {listAccessibleProjectsForUser} from "@/server/projects/queries";
import {getWorkflowWithSteps} from "@/server/workflows/definitions";
import {WorkflowError} from "@/server/workflows/errors";
import {canManageWorkflows, canRunWorkflows, canViewWorkflows} from "@/server/workflows/permissions";
import {listWorkflowRuns} from "@/server/workflows/runs";
import {ManualRunPanel} from "@/components/workflows/manual-run-panel";
import {WorkflowControls} from "@/components/workflows/workflow-controls";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{locale: string; workflowId: string}>;
};

export default async function WorkflowDetailPage({params}: Props) {
  const {locale: raw, workflowId} = await params;
  const locale = isAppLocale(raw) ? raw : "en";
  setRequestLocale(locale);
  const session = await requireUser(locale, `/dashboard/settings/automation/${workflowId}`);
  const userId = session.user.id;

  const workspace = await resolveActiveWorkspace(userId);
  const workspaceType: ApiWorkspaceType = workspace.type === "organization" ? "organization" : "personal";
  const workspaceId = workspace.id;

  const t = await getTranslations("workflows");
  const canView = await canViewWorkflows(userId, workspaceType, workspaceId);

  if (!canView) {
    return (
      <main className="p-4 sm:p-6 lg:p-8">
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

  let workflow;
  try {
    workflow = await getWorkflowWithSteps({actorUserId: userId, workspaceType, workspaceId, workflowId});
  } catch (error) {
    if (error instanceof WorkflowError && error.code === "WORKFLOW_NOT_FOUND") {
      notFound();
    }
    throw error;
  }

  const runs = await listWorkflowRuns({
    actorUserId: userId,
    workspaceType,
    workspaceId,
    workflowId,
    limit: 20,
  });

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
      <Link href="/dashboard/settings/automation" className="text-sm text-[var(--accent)]">
        ← {t("backToAutomation")}
      </Link>

      <header className="my-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{workflow.name}</h1>
        {workflow.description ? <p className="mt-2 max-w-2xl text-[var(--muted)]">{workflow.description}</p> : null}
      </header>

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
        {entitlement?.plan.workflowsEnabled ? (
          <>
            <WorkflowControls
              workflow={workflow}
              workspaceType={workspaceType}
              workspaceId={workspaceId}
              canManage={canManage}
              canRun={canRun}
            />
            <WorkflowForm
              workflow={workflow}
              workspaceType={workspaceType}
              workspaceId={workspaceId}
              projects={projects}
              canManage={canManage}
            />
            <StepBuilder
              workflowId={workflow.id}
              workspaceType={workspaceType}
              workspaceId={workspaceId}
              initialSteps={workflow.steps}
              canManage={canManage}
              workflowEnabled={workflow.status === "enabled"}
            />
            {canRun && workflow.status === "enabled" ? (
              <ManualRunPanel
                workflowId={workflow.id}
                workspaceType={workspaceType}
                workspaceId={workspaceId}
                defaultProjectId={workflow.projectId}
              />
            ) : null}
            <RunHistory workflowId={workflow.id} runs={runs} />
          </>
        ) : null}
      </div>
    </main>
  );
}
