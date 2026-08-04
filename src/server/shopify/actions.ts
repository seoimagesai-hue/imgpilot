"use server";

/**
 * Prompt 27 — server actions backing the Shopify integrations UI.
 * Thin wrappers around `@/server/shopify/*`: resolve the acting user +
 * workspace, map `ShopifyError` codes to form-friendly state, and revalidate
 * the integrations pages. The Admin API access token is write-only from this
 * layer — no action ever returns it.
 */
import {revalidatePath} from "next/cache";
import {auth} from "@/auth";
import type {ApiWorkspaceType, ShopifyBulkJob, ShopifyFilenameMode} from "@/db/schema";
import {isAppLocale} from "@/server/auth/validation";
import {getOrganizationBySlug, resolveActiveWorkspace} from "@/server/organizations/workspace";
import type {MetadataLanguage} from "@/server/projects/validation";
import {createBulkPublishJob, type ShopifyBulkItemInput} from "@/server/shopify/bulk";
import {searchProducts as searchShopifyProducts, type ShopifyProductSummary} from "@/server/shopify/client";
import {
  createConnection,
  decryptConnectionCredentials,
  disableConnection,
  disconnectConnection,
  enableConnection,
  getConnectionRowForPublish,
  getConnectionSafe,
  updateToken,
  verifyConnection,
  type ShopifyConnectionSafeDto,
} from "@/server/shopify/connections";
import {ShopifyError} from "@/server/shopify/errors";
import {
  createPublishJob,
  retryPublishJob,
  type ShopifyPublishJobDto,
} from "@/server/shopify/publish-service";
import {requireViewShopify} from "@/server/shopify/permissions";

export type ShopifyActionState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  connection?: ShopifyConnectionSafeDto;
  job?: ShopifyPublishJobDto;
  bulkJob?: ShopifyBulkJob;
  bulkCreatedCount?: number;
  bulkSkippedCount?: number;
  products?: ShopifyProductSummary[];
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

function shopifyErrorCode(error: unknown): string {
  if (error instanceof ShopifyError) return error.code;
  return "INTERNAL_ERROR";
}

/**
 * Best-effort field-error mapping so the connection form can highlight the
 * specific input rather than only showing a top-level banner.
 */
function connectionFieldErrors(error: ShopifyError): Record<string, string> | undefined {
  if (error.code !== "INVALID_REQUEST") return undefined;
  if (/access ?token/i.test(error.message)) return {accessToken: error.code};
  if (/shop/i.test(error.message)) return {shop: error.code};
  if (/name/i.test(error.message)) return {name: error.code};
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

function revalidateShopifyPaths(locale: string, connectionId?: string) {
  revalidatePath(`/${locale}/dashboard/settings/integrations/shopify`);
  if (connectionId) {
    revalidatePath(`/${locale}/dashboard/settings/integrations/shopify/${connectionId}`);
  }
}

function revalidateProjectShopifyPath(locale: string, projectId: string) {
  revalidatePath(`/${locale}/dashboard/projects/${projectId}/shopify`);
}

// ---------------------------------------------------------------------------
// Connections
// ---------------------------------------------------------------------------

export async function createShopifyConnectionAction(
  _prev: ShopifyActionState,
  formData: FormData,
): Promise<ShopifyActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const name = String(formData.get("name") ?? "").trim();
  const shop = String(formData.get("shop") ?? "").trim();
  const accessToken = String(formData.get("accessToken") ?? "");

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    const connection = await createConnection({
      actorUserId: user.id,
      workspaceType,
      workspaceId,
      name,
      shop,
      accessToken,
    });
    revalidateShopifyPaths(locale, connection.id);
    return {ok: true, connection};
  } catch (error) {
    if (error instanceof ShopifyError) {
      return {ok: false, error: error.code, fieldErrors: connectionFieldErrors(error)};
    }
    return {ok: false, error: shopifyErrorCode(error)};
  }
}

export async function verifyShopifyConnectionAction(
  _prev: ShopifyActionState,
  formData: FormData,
): Promise<ShopifyActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const connectionId = String(formData.get("connectionId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    const connection = await verifyConnection({actorUserId: user.id, workspaceType, workspaceId, connectionId});
    revalidateShopifyPaths(locale, connectionId);
    return {ok: true, connection};
  } catch (error) {
    return {ok: false, error: shopifyErrorCode(error)};
  }
}

export async function updateShopifyTokenAction(
  _prev: ShopifyActionState,
  formData: FormData,
): Promise<ShopifyActionState> {
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
    revalidateShopifyPaths(locale, connectionId);
    return {ok: true, connection};
  } catch (error) {
    if (error instanceof ShopifyError) {
      return {ok: false, error: error.code, fieldErrors: connectionFieldErrors(error)};
    }
    return {ok: false, error: shopifyErrorCode(error)};
  }
}

export async function disableShopifyConnectionAction(
  _prev: ShopifyActionState,
  formData: FormData,
): Promise<ShopifyActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const connectionId = String(formData.get("connectionId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    const connection = await disableConnection({actorUserId: user.id, workspaceType, workspaceId, connectionId});
    revalidateShopifyPaths(locale, connectionId);
    return {ok: true, connection};
  } catch (error) {
    return {ok: false, error: shopifyErrorCode(error)};
  }
}

export async function enableShopifyConnectionAction(
  _prev: ShopifyActionState,
  formData: FormData,
): Promise<ShopifyActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const connectionId = String(formData.get("connectionId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    const connection = await enableConnection({actorUserId: user.id, workspaceType, workspaceId, connectionId});
    revalidateShopifyPaths(locale, connectionId);
    return {ok: true, connection};
  } catch (error) {
    return {ok: false, error: shopifyErrorCode(error)};
  }
}

export async function disconnectShopifyConnectionAction(
  _prev: ShopifyActionState,
  formData: FormData,
): Promise<ShopifyActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const connectionId = String(formData.get("connectionId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    await disconnectConnection({actorUserId: user.id, workspaceType, workspaceId, connectionId});
    const connection = await getConnectionSafe({actorUserId: user.id, workspaceType, workspaceId, connectionId});
    revalidateShopifyPaths(locale, connectionId);
    return {ok: true, connection};
  } catch (error) {
    return {ok: false, error: shopifyErrorCode(error)};
  }
}

// ---------------------------------------------------------------------------
// Product search
// ---------------------------------------------------------------------------

/** Search EXISTING products on a connection's shop — never creates products. */
export async function searchShopifyProductsAction(
  _prev: ShopifyActionState,
  formData: FormData,
): Promise<ShopifyActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const connectionId = String(formData.get("connectionId") ?? "").trim();
  const query = String(formData.get("query") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    await requireViewShopify(user.id, workspaceType, workspaceId);
    const connection = await getConnectionRowForPublish(workspaceType, workspaceId, connectionId);
    const {accessToken} = await decryptConnectionCredentials(connection);
    const products = await searchShopifyProducts({
      shopDomain: connection.shopDomain,
      accessToken,
      query: query || null,
      limit: 20,
    });
    return {ok: true, products};
  } catch (error) {
    return {ok: false, error: shopifyErrorCode(error)};
  }
}

// ---------------------------------------------------------------------------
// Publishing
// ---------------------------------------------------------------------------

const FILENAME_MODES: ShopifyFilenameMode[] = ["keep", "suggestion"];
const METADATA_LANGUAGES: MetadataLanguage[] = ["en", "ur"];

export async function createShopifyPublishAction(
  _prev: ShopifyActionState,
  formData: FormData,
): Promise<ShopifyActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const projectId = String(formData.get("projectId") ?? "").trim();
  const imageId = String(formData.get("imageId") ?? "").trim();
  const connectionId = String(formData.get("connectionId") ?? "").trim();
  const shopifyProductId = String(formData.get("shopifyProductId") ?? "").trim();
  const derivativeId = String(formData.get("derivativeId") ?? "").trim();
  const filenameModeRaw = String(formData.get("filenameMode") ?? "keep");
  const languageRaw = String(formData.get("language") ?? "");

  if (!FILENAME_MODES.includes(filenameModeRaw as ShopifyFilenameMode)) {
    return {ok: false, error: "INVALID_REQUEST", fieldErrors: {filenameMode: "INVALID_REQUEST"}};
  }
  if (!METADATA_LANGUAGES.includes(languageRaw as MetadataLanguage)) {
    return {ok: false, error: "INVALID_REQUEST", fieldErrors: {language: "INVALID_REQUEST"}};
  }
  if (!shopifyProductId) {
    return {ok: false, error: "INVALID_REQUEST", fieldErrors: {shopifyProductId: "INVALID_REQUEST"}};
  }

  try {
    const job = await createPublishJob({
      userId: user.id,
      connectionId,
      projectId,
      imageId,
      shopifyProductId,
      derivativeId: derivativeId || null,
      filenameMode: filenameModeRaw as ShopifyFilenameMode,
      language: languageRaw as MetadataLanguage,
    });
    revalidateProjectShopifyPath(locale, projectId);
    revalidateShopifyPaths(locale, connectionId);
    return {ok: true, job};
  } catch (error) {
    return {ok: false, error: shopifyErrorCode(error)};
  }
}

export async function retryShopifyPublishAction(
  _prev: ShopifyActionState,
  formData: FormData,
): Promise<ShopifyActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const projectId = String(formData.get("projectId") ?? "").trim();
  const jobId = String(formData.get("jobId") ?? "").trim();

  try {
    const job = await retryPublishJob({userId: user.id, projectId, jobId});
    revalidateProjectShopifyPath(locale, projectId);
    revalidateShopifyPaths(locale, job.connectionId);
    return {ok: true, job};
  } catch (error) {
    return {ok: false, error: shopifyErrorCode(error)};
  }
}

export async function createShopifyBulkPublishAction(
  _prev: ShopifyActionState,
  formData: FormData,
): Promise<ShopifyActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const projectId = String(formData.get("projectId") ?? "").trim();
  const connectionId = String(formData.get("connectionId") ?? "").trim();
  const shopifyProductId = String(formData.get("shopifyProductId") ?? "").trim();
  const filenameModeRaw = String(formData.get("filenameMode") ?? "keep");
  const languageRaw = String(formData.get("language") ?? "");
  const rawItems = formData.getAll("items").map((v) => String(v));

  if (!FILENAME_MODES.includes(filenameModeRaw as ShopifyFilenameMode)) {
    return {ok: false, error: "INVALID_REQUEST", fieldErrors: {filenameMode: "INVALID_REQUEST"}};
  }
  if (!METADATA_LANGUAGES.includes(languageRaw as MetadataLanguage)) {
    return {ok: false, error: "INVALID_REQUEST", fieldErrors: {language: "INVALID_REQUEST"}};
  }
  if (!shopifyProductId) {
    return {ok: false, error: "INVALID_REQUEST", fieldErrors: {shopifyProductId: "INVALID_REQUEST"}};
  }

  const items: ShopifyBulkItemInput[] = [];
  for (const raw of rawItems) {
    const [imageId, derivativeId] = raw.split("|");
    if (imageId) items.push({imageId, derivativeId: derivativeId || null});
  }

  try {
    const {bulkJob, createdJobIds, skipped} = await createBulkPublishJob({
      userId: user.id,
      connectionId,
      projectId,
      shopifyProductId,
      items,
      filenameMode: filenameModeRaw as ShopifyFilenameMode,
      language: languageRaw as MetadataLanguage,
    });
    revalidateProjectShopifyPath(locale, projectId);
    revalidateShopifyPaths(locale, connectionId);
    return {
      ok: true,
      bulkJob,
      bulkCreatedCount: createdJobIds.length,
      bulkSkippedCount: skipped.length,
    };
  } catch (error) {
    return {ok: false, error: shopifyErrorCode(error)};
  }
}

export async function cancelShopifyBulkPublishAction(
  _prev: ShopifyActionState,
  formData: FormData,
): Promise<ShopifyActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const projectId = String(formData.get("projectId") ?? "").trim();
  const bulkJobId = String(formData.get("bulkJobId") ?? "").trim();

  try {
    const {cancelBulkPublishJob} = await import("@/server/shopify/bulk");
    const bulkJob = await cancelBulkPublishJob({userId: user.id, projectId, bulkJobId});
    revalidateProjectShopifyPath(locale, projectId);
    revalidateShopifyPaths(locale, bulkJob.connectionId);
    return {ok: true, bulkJob};
  } catch (error) {
    return {ok: false, error: shopifyErrorCode(error)};
  }
}
