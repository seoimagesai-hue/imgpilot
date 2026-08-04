import {notFound} from "next/navigation";
import {getTranslations, setRequestLocale} from "next-intl/server";
import {isAppLocale} from "@/server/auth/validation";
import {requireUser} from "@/server/auth/session";
import {resolveActiveWorkspace} from "@/server/organizations/workspace";
import {canManageIntegrations} from "@/server/api/permissions";
import {canViewWebflow} from "@/server/webflow/permissions";
import {getConnectionSafe} from "@/server/webflow/connections";
import {listMappings} from "@/server/webflow/field-mappings";
import {listRecentPublishJobsForConnection} from "@/server/webflow/publish-service";
import {WebflowError} from "@/server/webflow/errors";
import type {ApiWorkspaceType} from "@/db/schema";
import {ConnectionDetail} from "@/components/webflow/connection-detail";
import {FieldMappingForm} from "@/components/webflow/field-mapping-form";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{locale: string; connectionId: string}>;
};

export default async function WebflowConnectionDetailPage({params}: Props) {
  const {locale: raw, connectionId} = await params;
  const locale = isAppLocale(raw) ? raw : "en";
  setRequestLocale(locale);
  const session = await requireUser(locale, `/dashboard/settings/integrations/webflow/${connectionId}`);
  const userId = session.user.id;

  const workspace = await resolveActiveWorkspace(userId);
  const workspaceType: ApiWorkspaceType = workspace.type === "organization" ? "organization" : "personal";
  const workspaceId = workspace.id;

  const t = await getTranslations("webflow");
  const canView = await canViewWebflow(userId, workspaceType, workspaceId);

  if (!canView) {
    return (
      <main className="p-4 sm:p-6 lg:p-8">
        <p className="rounded-xl border border-[var(--border)] bg-white p-4 text-sm text-[var(--muted)]">
          {t("noAccessNotice")}
        </p>
      </main>
    );
  }

  const canManage = await canManageIntegrations(userId, workspaceType, workspaceId);

  let connection;
  try {
    connection = await getConnectionSafe({actorUserId: userId, workspaceType, workspaceId, connectionId});
  } catch (error) {
    if (error instanceof WebflowError && error.code === "CONNECTION_NOT_FOUND") {
      notFound();
    }
    throw error;
  }

  const [jobs, mappings] = await Promise.all([
    listRecentPublishJobsForConnection({actorUserId: userId, workspaceType, workspaceId, connectionId}),
    listMappings({actorUserId: userId, workspaceType, workspaceId, connectionId}),
  ]);

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      {!canManage ? (
        <p role="status" className="mb-6 rounded-xl border border-[var(--border)] bg-amber-50 p-3 text-sm">
          {t("readOnlyNotice")}
        </p>
      ) : null}
      <div className="space-y-6">
        <ConnectionDetail
          connection={connection}
          jobs={jobs}
          workspaceType={workspaceType}
          workspaceId={workspaceId}
          canManage={canManage}
        />
        {canManage && connection.status !== "disconnected" ? (
          <FieldMappingForm
            connectionId={connectionId}
            workspaceType={workspaceType}
            workspaceId={workspaceId}
            hasSite={Boolean(connection.remoteSiteId)}
            existingMappings={mappings}
          />
        ) : null}
      </div>
    </main>
  );
}
