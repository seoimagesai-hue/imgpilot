import {notFound} from "next/navigation";
import {getTranslations, setRequestLocale} from "next-intl/server";
import {isAppLocale} from "@/server/auth/validation";
import {requireUser} from "@/server/auth/session";
import {resolveActiveWorkspace} from "@/server/organizations/workspace";
import {canManageIntegrations, canViewIntegrations} from "@/server/api/permissions";
import {ApiError} from "@/server/api/errors";
import {getEndpoint, listRecentDeliveriesForEndpoint} from "@/server/webhooks/endpoints";
import type {ApiWorkspaceType} from "@/db/schema";
import {WebhookEndpointDetail} from "@/components/developer/webhook-endpoint-detail";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{locale: string; endpointId: string}>;
};

export default async function DeveloperWebhookEndpointDetailPage({params}: Props) {
  const {locale: raw, endpointId} = await params;
  const locale = isAppLocale(raw) ? raw : "en";
  setRequestLocale(locale);
  const session = await requireUser(locale, `/dashboard/settings/developer/webhooks/${endpointId}`);
  const userId = session.user.id;

  const workspace = await resolveActiveWorkspace(userId);
  const workspaceType: ApiWorkspaceType = workspace.type === "organization" ? "organization" : "personal";
  const workspaceId = workspace.id;

  const t = await getTranslations("developer");
  const canView = await canViewIntegrations(userId, workspaceType, workspaceId);

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

  let endpoint;
  try {
    endpoint = await getEndpoint({actorUserId: userId, workspaceType, workspaceId, endpointId});
  } catch (error) {
    if (error instanceof ApiError && error.code === "WEBHOOK_ENDPOINT_NOT_FOUND") {
      notFound();
    }
    throw error;
  }

  const deliveries = await listRecentDeliveriesForEndpoint({
    actorUserId: userId,
    workspaceType,
    workspaceId,
    endpointId,
  });

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      {!canManage ? (
        <p role="status" className="mb-6 rounded-xl border border-[var(--border)] bg-amber-50 p-3 text-sm">
          {t("readOnlyNotice")}
        </p>
      ) : null}
      <WebhookEndpointDetail
        endpoint={endpoint}
        deliveries={deliveries}
        workspaceType={workspaceType}
        workspaceId={workspaceId}
        canManage={canManage}
      />
    </main>
  );
}
