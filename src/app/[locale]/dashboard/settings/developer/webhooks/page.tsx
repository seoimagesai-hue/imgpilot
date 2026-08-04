import {getTranslations, setRequestLocale} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {isAppLocale} from "@/server/auth/validation";
import {requireUser} from "@/server/auth/session";
import {resolveActiveWorkspace} from "@/server/organizations/workspace";
import {canManageIntegrations, canViewIntegrations} from "@/server/api/permissions";
import {listEndpoints} from "@/server/webhooks/endpoints";
import type {ApiWorkspaceType} from "@/db/schema";
import {CreateWebhookForm} from "@/components/developer/create-webhook-form";
import {WebhookList} from "@/components/developer/webhook-list";

export const dynamic = "force-dynamic";

type Props = {params: Promise<{locale: string}>};

export default async function DeveloperWebhooksPage({params}: Props) {
  const {locale: raw} = await params;
  const locale = isAppLocale(raw) ? raw : "en";
  setRequestLocale(locale);
  const session = await requireUser(locale, "/dashboard/settings/developer/webhooks");
  const userId = session.user.id;

  const workspace = await resolveActiveWorkspace(userId);
  const workspaceType: ApiWorkspaceType = workspace.type === "organization" ? "organization" : "personal";
  const workspaceId = workspace.id;

  const t = await getTranslations("developer");
  const tWebhooks = await getTranslations("developer.webhooks");
  const canView = await canViewIntegrations(userId, workspaceType, workspaceId);

  if (!canView) {
    return (
      <main className="p-4 sm:p-6 lg:p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{tWebhooks("title")}</h1>
        </header>
        <p className="rounded-xl border border-[var(--border)] bg-white p-4 text-sm text-[var(--muted)]">
          {t("noAccessNotice")}
        </p>
      </main>
    );
  }

  const canManage = await canManageIntegrations(userId, workspaceType, workspaceId);
  const endpoints = await listEndpoints({actorUserId: userId, workspaceType, workspaceId});

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <Link href="/dashboard/settings/developer" className="text-sm text-[var(--accent)]">
          ← {t("title")}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{tWebhooks("title")}</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">{tWebhooks("subtitle")}</p>
      </header>

      {!canManage ? (
        <p role="status" className="mb-6 rounded-xl border border-[var(--border)] bg-amber-50 p-3 text-sm">
          {t("readOnlyNotice")}
        </p>
      ) : null}

      <div className="space-y-6">
        {canManage ? <CreateWebhookForm workspaceType={workspaceType} workspaceId={workspaceId} /> : null}
        <WebhookList endpoints={endpoints} />
      </div>
    </main>
  );
}
