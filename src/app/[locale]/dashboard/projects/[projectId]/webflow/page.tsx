import {notFound} from "next/navigation";
import {getTranslations, setRequestLocale} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {isAppLocale} from "@/server/auth/validation";
import {requireUser} from "@/server/auth/session";
import {resolveWorkspaceEntitlementUserId} from "@/server/api/permissions";
import {resolveEntitlement} from "@/server/billing/entitlements";
import {listMetadataReviewRows} from "@/server/images/metadata-review-service";
import {listActiveDerivativesForImage} from "@/server/images/processing-queries";
import {getOwnedProject} from "@/server/projects/queries";
import {projectIdSchema, type MetadataLanguage} from "@/server/projects/validation";
import {listConnections} from "@/server/webflow/connections";
import {resolveProjectWorkspace} from "@/server/webflow/eligibility";
import {listMappings} from "@/server/webflow/field-mappings";
import {listRecentPublishJobsForProject} from "@/server/webflow/publish-service";
import {
  PublishForm,
  type PublishFormApprovedMetadata,
  type PublishFormConnectionOption,
  type PublishFormMappingOption,
} from "@/components/webflow/publish-form";
import {PublishHistory} from "@/components/webflow/publish-history";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{locale: string; projectId: string}>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function derivativeLabel(derivative: {
  kind: string;
  preset: string | null;
  format: string | null;
  width: number | null;
  height: number | null;
}): string {
  const parts = [derivative.kind.replace(/_/g, " ")];
  if (derivative.preset) parts.push(derivative.preset);
  if (derivative.format) parts.push(derivative.format.toUpperCase());
  if (derivative.width && derivative.height) parts.push(`${derivative.width}×${derivative.height}`);
  return parts.join(" · ");
}

export default async function ProjectWebflowPublishPage({params, searchParams}: Props) {
  const {locale: raw, projectId} = await params;
  const rawParams = await searchParams;
  const locale = isAppLocale(raw) ? raw : "en";
  setRequestLocale(locale);
  const session = await requireUser(locale, `/dashboard/projects/${projectId}/webflow`);
  const userId = session.user.id;

  const idParsed = projectIdSchema.safeParse(projectId);
  if (!idParsed.success) notFound();

  const project = await getOwnedProject(userId, idParsed.data, "webflow.publish");
  if (!project) notFound();

  const t = await getTranslations("webflow");
  const tp = await getTranslations("projects");
  const tPublish = await getTranslations("webflow.publish");

  const {workspaceType, workspaceId} = resolveProjectWorkspace(project);
  const entitlementUserId = await resolveWorkspaceEntitlementUserId(workspaceType, workspaceId);
  const entitlement = entitlementUserId ? await resolveEntitlement(entitlementUserId) : null;

  const connections = await listConnections({actorUserId: userId, workspaceType, workspaceId});
  const activeConnections = connections.filter((c) => c.status === "active" || c.status === "degraded");

  const mappingsByConnection = await Promise.all(
    activeConnections.map((c) =>
      listMappings({actorUserId: userId, workspaceType, workspaceId, connectionId: c.id}),
    ),
  );
  const mappingOptions: PublishFormMappingOption[] = mappingsByConnection.flat().map((m) => ({
    id: m.id,
    connectionId: m.connectionId,
    collectionId: m.collectionId,
    collectionNameSafe: m.collectionNameSafe,
    hasAltField: Boolean(m.altFieldId),
    hasTitleField: Boolean(m.titleFieldId),
    hasCaptionField: Boolean(m.captionFieldId),
    hasDescriptionField: Boolean(m.descriptionFieldId),
    isStale: Boolean(m.staleAt),
  }));

  const connectionOptions: PublishFormConnectionOption[] = activeConnections.map((c) => ({
    id: c.id,
    name: c.name,
    siteLabel: c.remoteSiteNameSafe || c.remoteSiteHostnameSafe || null,
  }));

  const review = await listMetadataReviewRows({userId, projectId: project.id, filter: "approved", limit: 200});
  const eligibleImages = (review?.rows ?? []).filter((row) => row.approved !== null);

  const selectedImageId = first(rawParams.imageId) ?? eligibleImages[0]?.imageId ?? "";
  const selectedRow = eligibleImages.find((row) => row.imageId === selectedImageId) ?? null;

  const derivatives = selectedRow
    ? (await listActiveDerivativesForImage(selectedRow.imageId, project.id)).filter((d) => d.status === "active")
    : [];

  const recentJobs = await listRecentPublishJobsForProject({userId, projectId: project.id, limit: 20});

  const approvedLanguage = selectedRow?.approved?.language as MetadataLanguage | undefined;
  const approvedMetadataByLanguage: Partial<Record<MetadataLanguage, PublishFormApprovedMetadata>> = approvedLanguage
    ? {
        [approvedLanguage]: {
          title: selectedRow!.approved!.title,
          altText: selectedRow!.approved!.altText,
          caption: selectedRow!.approved!.caption,
          description: selectedRow!.approved!.description,
        },
      }
    : {};

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <p className="text-sm text-[var(--muted)]">
          <Link href="/dashboard/projects" className="hover:underline">
            {tp("title")}
          </Link>
          <span aria-hidden="true"> / </span>
          <Link href={`/dashboard/projects/${project.id}`} className="hover:underline">
            {project.name}
          </Link>
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{tPublish("title")}</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">{tPublish("subtitle")}</p>
      </header>

      {!entitlement?.plan.webflowEnabled ? (
        <p role="status" className="mb-6 rounded-xl border border-[var(--border)] bg-amber-50 p-3 text-sm">
          {t("notEnabled")}
        </p>
      ) : null}

      {connections.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 text-sm text-[var(--muted)] shadow-sm">
          {t("emptyText")}{" "}
          <Link href="/dashboard/settings/integrations/webflow" className="font-medium text-[var(--accent)]">
            {t("createTitle")}
          </Link>
        </div>
      ) : eligibleImages.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 text-sm text-[var(--muted)] shadow-sm">
          {tPublish("noEligibleImages")}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <form method="get" className="h-fit rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
            <label htmlFor="webflow-image-picker" className="mb-1.5 block text-sm font-medium">
              {tPublish("imagePicker")}
            </label>
            <select
              id="webflow-image-picker"
              name="imageId"
              defaultValue={selectedImageId}
              className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm"
            >
              {eligibleImages.map((row) => (
                <option key={row.imageId} value={row.imageId}>
                  {row.originalFilename}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="mt-3 w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-gray-50"
            >
              {tPublish("loadImage")}
            </button>
          </form>

          <div className="space-y-6">
            {selectedRow ? (
              <PublishForm
                projectId={project.id}
                imageId={selectedRow.imageId}
                workspaceType={workspaceType}
                workspaceId={workspaceId}
                connections={connectionOptions}
                mappings={mappingOptions}
                derivatives={derivatives.map((d) => ({id: d.id, label: derivativeLabel(d)}))}
                approvedMetadataByLanguage={approvedMetadataByLanguage}
              />
            ) : null}

            <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">{t("recentPublishes")}</h2>
              <div className="mt-3">
                <PublishHistory jobs={recentJobs} />
              </div>
            </section>
          </div>
        </div>
      )}
    </main>
  );
}
