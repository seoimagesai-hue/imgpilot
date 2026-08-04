import {notFound} from "next/navigation";
import {setRequestLocale} from "next-intl/server";
import {RunDetail} from "@/components/workflows/run-detail";
import type {ApiWorkspaceType} from "@/db/schema";
import {isAppLocale} from "@/server/auth/validation";
import {requireUser} from "@/server/auth/session";
import {resolveActiveWorkspace} from "@/server/organizations/workspace";
import {WorkflowError} from "@/server/workflows/errors";
import {canViewWorkflows} from "@/server/workflows/permissions";
import {getWorkflowRunWithSteps} from "@/server/workflows/runs";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{locale: string; workflowId: string; runId: string}>;
};

export default async function WorkflowRunDetailPage({params}: Props) {
  const {locale: raw, workflowId, runId} = await params;
  const locale = isAppLocale(raw) ? raw : "en";
  setRequestLocale(locale);
  const session = await requireUser(locale, `/dashboard/settings/automation/${workflowId}/runs/${runId}`);
  const userId = session.user.id;

  const workspace = await resolveActiveWorkspace(userId);
  const workspaceType: ApiWorkspaceType = workspace.type === "organization" ? "organization" : "personal";
  const workspaceId = workspace.id;

  const canView = await canViewWorkflows(userId, workspaceType, workspaceId);
  if (!canView) notFound();

  let runWithSteps;
  try {
    runWithSteps = await getWorkflowRunWithSteps({
      actorUserId: userId,
      workspaceType,
      workspaceId,
      runId,
    });
  } catch (error) {
    if (error instanceof WorkflowError && error.code === "WORKFLOW_RUN_NOT_FOUND") {
      notFound();
    }
    throw error;
  }

  if (runWithSteps.workflowId !== workflowId) notFound();

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <RunDetail workflowId={workflowId} run={runWithSteps} steps={runWithSteps.steps} />
    </main>
  );
}
