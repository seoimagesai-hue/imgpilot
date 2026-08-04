import {notFound} from "next/navigation";
import {getTranslations, setRequestLocale} from "next-intl/server";
import {isAppLocale} from "@/server/auth/validation";
import {requireUser} from "@/server/auth/session";
import {resolveActiveWorkspace} from "@/server/organizations/workspace";
import {canManageIntegrations} from "@/server/api/permissions";
import {canViewCloudinary} from "@/server/cloudinary/permissions";
import {getConnectionSafe} from "@/server/cloudinary/connections";
import {listRecentPublishJobsForConnection} from "@/server/cloudinary/publish-service";
import {CloudinaryError} from "@/server/cloudinary/errors";
import type {ApiWorkspaceType} from "@/db/schema";
import {ConnectionDetail} from "@/components/cloudinary/connection-detail";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{locale: string; connectionId: string}>;
};

export default async function CloudinaryConnectionDetailPage({params}: Props) {
  const {locale: raw, connectionId} = await params;
  const locale = isAppLocale(raw) ? raw : "en";
  setRequestLocale(locale);
  const session = await requireUser(locale, `/dashboard/settings/integrations/cloudinary/${connectionId}`);
  const userId = session.user.id;

  const workspace = await resolveActiveWorkspace(userId);
  const workspaceType: ApiWorkspaceType = workspace.type === "organization" ? "organization" : "personal";
  const workspaceId = workspace.id;

  const t = await getTranslations("cloudinary");
  const canView = await canViewCloudinary(userId, workspaceType, workspaceId);

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
    if (error instanceof CloudinaryError && error.code === "CONNECTION_NOT_FOUND") {
      notFound();
    }
    throw error;
  }

  const jobs = await listRecentPublishJobsForConnection({actorUserId: userId, workspaceType, workspaceId, connectionId});

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      {!canManage ? (
        <p role="status" className="mb-6 rounded-xl border border-[var(--border)] bg-amber-50 p-3 text-sm">
          {t("readOnlyNotice")}
        </p>
      ) : null}
      <ConnectionDetail
        connection={connection}
        jobs={jobs}
        workspaceType={workspaceType}
        workspaceId={workspaceId}
        canManage={canManage}
      />
    </main>
  );
}
