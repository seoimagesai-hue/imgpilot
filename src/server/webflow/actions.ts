"use server";

/**
 * Prompt 28 — server actions backing the Webflow integrations UI.
 * Thin wrappers around `@/server/webflow/*`: resolve the acting user +
 * workspace, map `WebflowError` codes to form-friendly state, and revalidate
 * the integrations pages. The site access token is write-only from this
 * layer — no action ever returns it.
 */
import {revalidatePath} from "next/cache";
import {auth} from "@/auth";
import type {ApiWorkspaceType, WebflowBulkJob, WebflowFilenameMode} from "@/db/schema";
import {isAppLocale} from "@/server/auth/validation";
import {getOrganizationBySlug, resolveActiveWorkspace} from "@/server/organizations/workspace";
import type {MetadataLanguage} from "@/server/projects/validation";
import {cancelBulkPublishJob, createBulkPublishJob, type WebflowBulkItemInput} from "@/server/webflow/bulk";
import {
  getCollection,
  listCollectionItems,
  listCollections,
  listSites,
  type WebflowCollectionDetail,
  type WebflowCollectionItemSummary,
  type WebflowCollectionSummary,
  type WebflowSiteSummary,
} from "@/server/webflow/client";
import {
  createConnection,
  decryptConnectionCredentials,
  disableConnection,
  disconnectConnection,
  enableConnection,
  getConnectionRowForPublish,
  getConnectionSafe,
  selectSite,
  updateToken,
  verifyConnection,
  type WebflowConnectionSafeDto,
} from "@/server/webflow/connections";
import {WebflowError} from "@/server/webflow/errors";
import {upsertFieldMapping, type WebflowFieldMappingSafeDto} from "@/server/webflow/field-mappings";
import {
  createPublishJob,
  retryPublishJob,
  type WebflowPublishJobDto,
} from "@/server/webflow/publish-service";
import {requireViewWebflow} from "@/server/webflow/permissions";

export type WebflowActionState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  connection?: WebflowConnectionSafeDto;
  fieldMapping?: WebflowFieldMappingSafeDto;
  job?: WebflowPublishJobDto;
  bulkJob?: WebflowBulkJob;
  bulkCreatedCount?: number;
  bulkSkippedCount?: number;
  sites?: WebflowSiteSummary[];
  collections?: WebflowCollectionSummary[];
  collection?: WebflowCollectionDetail;
  items?: WebflowCollectionItemSummary[];
};

async function requireSessionUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

function localeFrom(formData: FormData): string {
  const raw = String(formData.get("locale") ?? "en");
  return isAppLocale(raw) ? raw : "en";
}

function webflowErrorCode(error: unknown): string {
  if (error instanceof WebflowError) return error.code;
  return "INTERNAL_ERROR";
}

/**
 * Best-effort field-error mapping so the connection form can highlight the
 * specific input rather than only showing a top-level banner.
 */
function connectionFieldErrors(error: WebflowError): Record<string, string> | undefined {
  if (error.code !== "INVALID_REQUEST") return undefined;
  if (/access ?token/i.test(error.message)) return {accessToken: error.code};
  if (/name/i.test(error.message)) return {name: error.code};
  if (/site/i.test(error.message)) return {siteId: error.code};
  return undefined;
}

/**
 * Resolve which workspace an action should operate on: explicit hidden form
 * fields (`workspaceType` + `workspaceId`, optionally `organizationSlug` as a
 * fallback lookup) take precedence over the active-workspace cookie.
 */
async function resolveWorkspaceForAction(
  userId: string,
  formData: FormData,
): Promise<{workspaceType: ApiWorkspaceType; workspaceId: string}> {
  const explicitType = String(formData.get("workspaceType") ?? "").trim();
  const explicitId = String(formData.get("workspaceId") ?? "").trim();
  if (explicitType === "organization" && explicitId) {
    return {workspaceType: "organization", workspaceId: explicitId};
  }
  if (explicitType === "personal") {
    return {workspaceType: "personal", workspaceId: userId};
  }

  const slug = String(formData.get("organizationSlug") ?? "").trim().toLowerCase();
  if (slug) {
    const org = await getOrganizationBySlug(slug);
    if (org && org.status !== "archived") {
      return {workspaceType: "organization", workspaceId: org.id};
    }
  }

  const workspace = await resolveActiveWorkspace(userId);
  return workspace.type === "organization"
    ? {workspaceType: "organization", workspaceId: workspace.id}
    : {workspaceType: "personal", workspaceId: userId};
}

function revalidateWebflowPaths(locale: string, connectionId?: string) {
  revalidatePath(`/${locale}/dashboard/settings/integrations/webflow`);
  if (connectionId) {
    revalidatePath(`/${locale}/dashboard/settings/integrations/webflow/${connectionId}`);
  }
}

function revalidateProjectWebflowPath(locale: string, projectId: string) {
  revalidatePath(`/${locale}/dashboard/projects/${projectId}/webflow`);
}

// ---------------------------------------------------------------------------
// Connections
// ---------------------------------------------------------------------------

export async function createWebflowConnectionAction(
  _prev: WebflowActionState,
  formData: FormData,
): Promise<WebflowActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const name = String(formData.get("name") ?? "").trim();
  const accessToken = String(formData.get("accessToken") ?? "");
  const siteId = String(formData.get("siteId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    const connection = await createConnection({
      actorUserId: user.id,
      workspaceType,
      workspaceId,
      name,
      accessToken,
      siteId: siteId || null,
    });
    revalidateWebflowPaths(locale, connection.id);
    return {ok: true, connection};
  } catch (error) {
    if (error instanceof WebflowError) {
      return {ok: false, error: error.code, fieldErrors: connectionFieldErrors(error)};
    }
    return {ok: false, error: webflowErrorCode(error)};
  }
}

export async function verifyWebflowConnectionAction(
  _prev: WebflowActionState,
  formData: FormData,
): Promise<WebflowActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const connectionId = String(formData.get("connectionId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    const connection = await verifyConnection({actorUserId: user.id, workspaceType, workspaceId, connectionId});
    revalidateWebflowPaths(locale, connectionId);
    return {ok: true, connection};
  } catch (error) {
    return {ok: false, error: webflowErrorCode(error)};
  }
}

export async function updateWebflowTokenAction(
  _prev: WebflowActionState,
  formData: FormData,
): Promise<WebflowActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const connectionId = String(formData.get("connectionId") ?? "").trim();
  const accessToken = String(formData.get("accessToken") ?? "");

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    const connection = await updateToken({
      actorUserId: user.id,
      workspaceType,
      workspaceId,
      connectionId,
      accessToken,
    });
    revalidateWebflowPaths(locale, connectionId);
    return {ok: true, connection};
  } catch (error) {
    if (error instanceof WebflowError) {
      return {ok: false, error: error.code, fieldErrors: connectionFieldErrors(error)};
    }
    return {ok: false, error: webflowErrorCode(error)};
  }
}

export async function selectWebflowSiteAction(
  _prev: WebflowActionState,
  formData: FormData,
): Promise<WebflowActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const connectionId = String(formData.get("connectionId") ?? "").trim();
  const siteId = String(formData.get("siteId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    const connection = await selectSite({actorUserId: user.id, workspaceType, workspaceId, connectionId, siteId});
    revalidateWebflowPaths(locale, connectionId);
    return {ok: true, connection};
  } catch (error) {
    return {ok: false, error: webflowErrorCode(error)};
  }
}

export async function disableWebflowConnectionAction(
  _prev: WebflowActionState,
  formData: FormData,
): Promise<WebflowActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const connectionId = String(formData.get("connectionId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    const connection = await disableConnection({actorUserId: user.id, workspaceType, workspaceId, connectionId});
    revalidateWebflowPaths(locale, connectionId);
    return {ok: true, connection};
  } catch (error) {
    return {ok: false, error: webflowErrorCode(error)};
  }
}

export async function enableWebflowConnectionAction(
  _prev: WebflowActionState,
  formData: FormData,
): Promise<WebflowActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const connectionId = String(formData.get("connectionId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    const connection = await enableConnection({actorUserId: user.id, workspaceType, workspaceId, connectionId});
    revalidateWebflowPaths(locale, connectionId);
    return {ok: true, connection};
  } catch (error) {
    return {ok: false, error: webflowErrorCode(error)};
  }
}

export async function disconnectWebflowConnectionAction(
  _prev: WebflowActionState,
  formData: FormData,
): Promise<WebflowActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const connectionId = String(formData.get("connectionId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    await disconnectConnection({actorUserId: user.id, workspaceType, workspaceId, connectionId});
    const connection = await getConnectionSafe({actorUserId: user.id, workspaceType, workspaceId, connectionId});
    revalidateWebflowPaths(locale, connectionId);
    return {ok: true, connection};
  } catch (error) {
    return {ok: false, error: webflowErrorCode(error)};
  }
}

// ---------------------------------------------------------------------------
// Sites / collections / CMS items (read-only lookups for the publish UI)
// ---------------------------------------------------------------------------

export async function listWebflowSitesAction(
  _prev: WebflowActionState,
  formData: FormData,
): Promise<WebflowActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const connectionId = String(formData.get("connectionId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    await requireViewWebflow(user.id, workspaceType, workspaceId);
    const connection = await getConnectionRowForPublish(workspaceType, workspaceId, connectionId);
    const {accessToken} = await decryptConnectionCredentials(connection);
    const sites = await listSites(accessToken);
    return {ok: true, sites};
  } catch (error) {
    return {ok: false, error: webflowErrorCode(error)};
  }
}

/** List EXISTING collections on the connection's selected site — never creates one. */
export async function listWebflowCollectionsAction(
  _prev: WebflowActionState,
  formData: FormData,
): Promise<WebflowActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const connectionId = String(formData.get("connectionId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    await requireViewWebflow(user.id, workspaceType, workspaceId);
    const connection = await getConnectionRowForPublish(workspaceType, workspaceId, connectionId);
    if (!connection.remoteSiteId) {
      return {ok: false, error: "WEBFLOW_SITE_NOT_FOUND"};
    }
    const {accessToken} = await decryptConnectionCredentials(connection);
    const collections = await listCollections(accessToken, connection.remoteSiteId);
    return {ok: true, collections};
  } catch (error) {
    return {ok: false, error: webflowErrorCode(error)};
  }
}

/** Fetch a collection's field schema — required before saving a field mapping. */
export async function getWebflowCollectionAction(
  _prev: WebflowActionState,
  formData: FormData,
): Promise<WebflowActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const connectionId = String(formData.get("connectionId") ?? "").trim();
  const collectionId = String(formData.get("collectionId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    await requireViewWebflow(user.id, workspaceType, workspaceId);
    const connection = await getConnectionRowForPublish(workspaceType, workspaceId, connectionId);
    const {accessToken} = await decryptConnectionCredentials(connection);
    const collection = await getCollection(accessToken, collectionId);
    return {ok: true, collection};
  } catch (error) {
    return {ok: false, error: webflowErrorCode(error)};
  }
}

/** Search EXISTING collection items — never creates items. */
export async function searchWebflowCollectionItemsAction(
  _prev: WebflowActionState,
  formData: FormData,
): Promise<WebflowActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const connectionId = String(formData.get("connectionId") ?? "").trim();
  const collectionId = String(formData.get("collectionId") ?? "").trim();
  const query = String(formData.get("query") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    await requireViewWebflow(user.id, workspaceType, workspaceId);
    const connection = await getConnectionRowForPublish(workspaceType, workspaceId, connectionId);
    const {accessToken} = await decryptConnectionCredentials(connection);
    const {items} = await listCollectionItems(accessToken, collectionId, {
      limit: 20,
      nameFilter: query || null,
    });
    return {ok: true, items};
  } catch (error) {
    return {ok: false, error: webflowErrorCode(error)};
  }
}

// ---------------------------------------------------------------------------
// Field mappings
// ---------------------------------------------------------------------------

export async function upsertWebflowFieldMappingAction(
  _prev: WebflowActionState,
  formData: FormData,
): Promise<WebflowActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const connectionId = String(formData.get("connectionId") ?? "").trim();
  const collectionId = String(formData.get("collectionId") ?? "").trim();
  const imageFieldId = String(formData.get("imageFieldId") ?? "").trim();
  const altFieldId = String(formData.get("altFieldId") ?? "").trim();
  const titleFieldId = String(formData.get("titleFieldId") ?? "").trim();
  const captionFieldId = String(formData.get("captionFieldId") ?? "").trim();
  const descriptionFieldId = String(formData.get("descriptionFieldId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    const fieldMapping = await upsertFieldMapping({
      actorUserId: user.id,
      workspaceType,
      workspaceId,
      connectionId,
      collectionId,
      imageFieldId,
      altFieldId: altFieldId || null,
      titleFieldId: titleFieldId || null,
      captionFieldId: captionFieldId || null,
      descriptionFieldId: descriptionFieldId || null,
    });
    revalidateWebflowPaths(locale, connectionId);
    return {ok: true, fieldMapping};
  } catch (error) {
    return {ok: false, error: webflowErrorCode(error)};
  }
}

// ---------------------------------------------------------------------------
// Publishing
// ---------------------------------------------------------------------------

const FILENAME_MODES: WebflowFilenameMode[] = ["keep", "suggestion"];
const METADATA_LANGUAGES: MetadataLanguage[] = ["en", "ur"];

export async function createWebflowPublishAction(
  _prev: WebflowActionState,
  formData: FormData,
): Promise<WebflowActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const projectId = String(formData.get("projectId") ?? "").trim();
  const imageId = String(formData.get("imageId") ?? "").trim();
  const connectionId = String(formData.get("connectionId") ?? "").trim();
  const collectionId = String(formData.get("collectionId") ?? "").trim();
  const cmsItemId = String(formData.get("cmsItemId") ?? "").trim();
  const cmsItemNameSafe = String(formData.get("cmsItemNameSafe") ?? "").trim();
  const fieldMappingId = String(formData.get("fieldMappingId") ?? "").trim();
  const derivativeId = String(formData.get("derivativeId") ?? "").trim();
  const filenameModeRaw = String(formData.get("filenameMode") ?? "keep");
  const languageRaw = String(formData.get("language") ?? "");

  if (!FILENAME_MODES.includes(filenameModeRaw as WebflowFilenameMode)) {
    return {ok: false, error: "INVALID_REQUEST", fieldErrors: {filenameMode: "INVALID_REQUEST"}};
  }
  if (!METADATA_LANGUAGES.includes(languageRaw as MetadataLanguage)) {
    return {ok: false, error: "INVALID_REQUEST", fieldErrors: {language: "INVALID_REQUEST"}};
  }
  if (!cmsItemId) {
    return {ok: false, error: "INVALID_REQUEST", fieldErrors: {cmsItemId: "INVALID_REQUEST"}};
  }
  if (!fieldMappingId) {
    return {ok: false, error: "INVALID_REQUEST", fieldErrors: {fieldMappingId: "INVALID_REQUEST"}};
  }

  try {
    const job = await createPublishJob({
      userId: user.id,
      connectionId,
      projectId,
      imageId,
      collectionId,
      cmsItemId,
      cmsItemNameSafe: cmsItemNameSafe || null,
      fieldMappingId,
      derivativeId: derivativeId || null,
      filenameMode: filenameModeRaw as WebflowFilenameMode,
      language: languageRaw as MetadataLanguage,
    });
    revalidateProjectWebflowPath(locale, projectId);
    revalidateWebflowPaths(locale, connectionId);
    return {ok: true, job};
  } catch (error) {
    return {ok: false, error: webflowErrorCode(error)};
  }
}

export async function retryWebflowPublishAction(
  _prev: WebflowActionState,
  formData: FormData,
): Promise<WebflowActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const projectId = String(formData.get("projectId") ?? "").trim();
  const jobId = String(formData.get("jobId") ?? "").trim();

  try {
    const job = await retryPublishJob({userId: user.id, projectId, jobId});
    revalidateProjectWebflowPath(locale, projectId);
    revalidateWebflowPaths(locale, job.connectionId);
    return {ok: true, job};
  } catch (error) {
    return {ok: false, error: webflowErrorCode(error)};
  }
}

export async function createWebflowBulkPublishAction(
  _prev: WebflowActionState,
  formData: FormData,
): Promise<WebflowActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const projectId = String(formData.get("projectId") ?? "").trim();
  const connectionId = String(formData.get("connectionId") ?? "").trim();
  const collectionId = String(formData.get("collectionId") ?? "").trim();
  const fieldMappingId = String(formData.get("fieldMappingId") ?? "").trim();
  const filenameModeRaw = String(formData.get("filenameMode") ?? "keep");
  const languageRaw = String(formData.get("language") ?? "");
  const rawItems = formData.getAll("items").map((v) => String(v));

  if (!FILENAME_MODES.includes(filenameModeRaw as WebflowFilenameMode)) {
    return {ok: false, error: "INVALID_REQUEST", fieldErrors: {filenameMode: "INVALID_REQUEST"}};
  }
  if (!METADATA_LANGUAGES.includes(languageRaw as MetadataLanguage)) {
    return {ok: false, error: "INVALID_REQUEST", fieldErrors: {language: "INVALID_REQUEST"}};
  }
  if (!fieldMappingId) {
    return {ok: false, error: "INVALID_REQUEST", fieldErrors: {fieldMappingId: "INVALID_REQUEST"}};
  }

  // Each item is encoded as `imageId|cmsItemId|derivativeId` (derivativeId optional).
  const items: WebflowBulkItemInput[] = [];
  for (const raw of rawItems) {
    const [imageId, cmsItemId, derivativeId] = raw.split("|");
    if (imageId && cmsItemId) items.push({imageId, cmsItemId, derivativeId: derivativeId || null});
  }

  try {
    const {bulkJob, createdJobIds, skipped} = await createBulkPublishJob({
      userId: user.id,
      connectionId,
      projectId,
      collectionId,
      fieldMappingId,
      items,
      filenameMode: filenameModeRaw as WebflowFilenameMode,
      language: languageRaw as MetadataLanguage,
    });
    revalidateProjectWebflowPath(locale, projectId);
    revalidateWebflowPaths(locale, connectionId);
    return {
      ok: true,
      bulkJob,
      bulkCreatedCount: createdJobIds.length,
      bulkSkippedCount: skipped.length,
    };
  } catch (error) {
    return {ok: false, error: webflowErrorCode(error)};
  }
}

export async function cancelWebflowBulkPublishAction(
  _prev: WebflowActionState,
  formData: FormData,
): Promise<WebflowActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const projectId = String(formData.get("projectId") ?? "").trim();
  const bulkJobId = String(formData.get("bulkJobId") ?? "").trim();

  try {
    const bulkJob = await cancelBulkPublishJob({userId: user.id, projectId, bulkJobId});
    revalidateProjectWebflowPath(locale, projectId);
    revalidateWebflowPaths(locale, bulkJob.connectionId);
    return {ok: true, bulkJob};
  } catch (error) {
    return {ok: false, error: webflowErrorCode(error)};
  }
}
