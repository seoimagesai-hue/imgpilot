"use server";

/**
 * Prompt 29 — server actions backing the Cloudinary integrations UI.
 * Thin wrappers around `@/server/cloudinary/*`: resolve the acting user +
 * workspace, map `CloudinaryError` codes to form-friendly state, and
 * revalidate the integrations pages. cloud_name/api_key/api_secret are
 * write-only from this layer — no action ever returns them.
 */
import {revalidatePath} from "next/cache";
import {auth} from "@/auth";
import type {
  ApiWorkspaceType,
  CloudinaryBulkJob,
  CloudinaryDeliveryType,
  CloudinaryFilenameMode,
} from "@/db/schema";
import {isAppLocale} from "@/server/auth/validation";
import {getOrganizationBySlug, resolveActiveWorkspace} from "@/server/organizations/workspace";
import type {MetadataLanguage} from "@/server/projects/validation";
import {cancelBulkPublishJob, createBulkPublishJob, type CloudinaryBulkItemInput} from "@/server/cloudinary/bulk";
import {
  acknowledgePublicDelivery,
  createConnection,
  disableConnection,
  disconnectConnection,
  enableConnection,
  getConnectionSafe,
  updateCredentials,
  verifyConnection,
  type CloudinaryConnectionSafeDto,
} from "@/server/cloudinary/connections";
import {getSafeDeliveryUrl, type SafeDeliveryUrlResult} from "@/server/cloudinary/delivery";
import {CloudinaryError} from "@/server/cloudinary/errors";
import {ALL_TRANSFORMATION_PRESETS} from "@/server/cloudinary/policy";
import {
  createPublishJob,
  retryPublishJob,
  type CloudinaryPublishJobDto,
} from "@/server/cloudinary/publish-service";

export type CloudinaryActionState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  connection?: CloudinaryConnectionSafeDto;
  job?: CloudinaryPublishJobDto;
  bulkJob?: CloudinaryBulkJob;
  bulkCreatedCount?: number;
  bulkSkippedCount?: number;
  delivery?: SafeDeliveryUrlResult;
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

function cloudinaryErrorCode(error: unknown): string {
  if (error instanceof CloudinaryError) return error.code;
  return "INTERNAL_ERROR";
}

/**
 * Best-effort field-error mapping so the connection form can highlight the
 * specific input rather than only showing a top-level banner.
 */
function connectionFieldErrors(error: CloudinaryError): Record<string, string> | undefined {
  if (error.code !== "INVALID_REQUEST") return undefined;
  if (/cloud ?name/i.test(error.message)) return {cloudName: error.code};
  if (/api ?key/i.test(error.message)) return {apiKey: error.code};
  if (/api ?secret/i.test(error.message)) return {apiSecret: error.code};
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

function revalidateCloudinaryPaths(locale: string, connectionId?: string) {
  revalidatePath(`/${locale}/dashboard/settings/integrations/cloudinary`);
  if (connectionId) {
    revalidatePath(`/${locale}/dashboard/settings/integrations/cloudinary/${connectionId}`);
  }
}

function revalidateProjectCloudinaryPath(locale: string, projectId: string) {
  revalidatePath(`/${locale}/dashboard/projects/${projectId}/cloudinary`);
}

// ---------------------------------------------------------------------------
// Connections
// ---------------------------------------------------------------------------

export async function createCloudinaryConnectionAction(
  _prev: CloudinaryActionState,
  formData: FormData,
): Promise<CloudinaryActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const name = String(formData.get("name") ?? "").trim();
  const cloudName = String(formData.get("cloudName") ?? "").trim();
  const apiKey = String(formData.get("apiKey") ?? "");
  const apiSecret = String(formData.get("apiSecret") ?? "");
  const defaultDeliveryType = String(formData.get("defaultDeliveryType") ?? "upload") as CloudinaryDeliveryType;
  const defaultFolder = String(formData.get("defaultFolder") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    const connection = await createConnection({
      actorUserId: user.id,
      workspaceType,
      workspaceId,
      name,
      cloudName,
      apiKey,
      apiSecret,
      defaultDeliveryType: defaultDeliveryType === "signed" ? "signed" : "upload",
      defaultFolder: defaultFolder || null,
    });
    revalidateCloudinaryPaths(locale, connection.id);
    return {ok: true, connection};
  } catch (error) {
    if (error instanceof CloudinaryError) {
      return {ok: false, error: error.code, fieldErrors: connectionFieldErrors(error)};
    }
    return {ok: false, error: cloudinaryErrorCode(error)};
  }
}

export async function verifyCloudinaryConnectionAction(
  _prev: CloudinaryActionState,
  formData: FormData,
): Promise<CloudinaryActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const connectionId = String(formData.get("connectionId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    const connection = await verifyConnection({actorUserId: user.id, workspaceType, workspaceId, connectionId});
    revalidateCloudinaryPaths(locale, connectionId);
    return {ok: true, connection};
  } catch (error) {
    return {ok: false, error: cloudinaryErrorCode(error)};
  }
}

export async function updateCloudinaryCredentialsAction(
  _prev: CloudinaryActionState,
  formData: FormData,
): Promise<CloudinaryActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const connectionId = String(formData.get("connectionId") ?? "").trim();
  const cloudName = String(formData.get("cloudName") ?? "").trim();
  const apiKey = String(formData.get("apiKey") ?? "");
  const apiSecret = String(formData.get("apiSecret") ?? "");

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    const connection = await updateCredentials({
      actorUserId: user.id,
      workspaceType,
      workspaceId,
      connectionId,
      cloudName,
      apiKey,
      apiSecret,
    });
    revalidateCloudinaryPaths(locale, connectionId);
    return {ok: true, connection};
  } catch (error) {
    if (error instanceof CloudinaryError) {
      return {ok: false, error: error.code, fieldErrors: connectionFieldErrors(error)};
    }
    return {ok: false, error: cloudinaryErrorCode(error)};
  }
}

export async function acknowledgeCloudinaryPublicDeliveryAction(
  _prev: CloudinaryActionState,
  formData: FormData,
): Promise<CloudinaryActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const connectionId = String(formData.get("connectionId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    const connection = await acknowledgePublicDelivery({actorUserId: user.id, workspaceType, workspaceId, connectionId});
    revalidateCloudinaryPaths(locale, connectionId);
    return {ok: true, connection};
  } catch (error) {
    return {ok: false, error: cloudinaryErrorCode(error)};
  }
}

export async function disableCloudinaryConnectionAction(
  _prev: CloudinaryActionState,
  formData: FormData,
): Promise<CloudinaryActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const connectionId = String(formData.get("connectionId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    const connection = await disableConnection({actorUserId: user.id, workspaceType, workspaceId, connectionId});
    revalidateCloudinaryPaths(locale, connectionId);
    return {ok: true, connection};
  } catch (error) {
    return {ok: false, error: cloudinaryErrorCode(error)};
  }
}

export async function enableCloudinaryConnectionAction(
  _prev: CloudinaryActionState,
  formData: FormData,
): Promise<CloudinaryActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const connectionId = String(formData.get("connectionId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    const connection = await enableConnection({actorUserId: user.id, workspaceType, workspaceId, connectionId});
    revalidateCloudinaryPaths(locale, connectionId);
    return {ok: true, connection};
  } catch (error) {
    return {ok: false, error: cloudinaryErrorCode(error)};
  }
}

export async function disconnectCloudinaryConnectionAction(
  _prev: CloudinaryActionState,
  formData: FormData,
): Promise<CloudinaryActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const connectionId = String(formData.get("connectionId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    await disconnectConnection({actorUserId: user.id, workspaceType, workspaceId, connectionId});
    const connection = await getConnectionSafe({actorUserId: user.id, workspaceType, workspaceId, connectionId});
    revalidateCloudinaryPaths(locale, connectionId);
    return {ok: true, connection};
  } catch (error) {
    return {ok: false, error: cloudinaryErrorCode(error)};
  }
}

// ---------------------------------------------------------------------------
// Publishing
// ---------------------------------------------------------------------------

const FILENAME_MODES: CloudinaryFilenameMode[] = ["keep", "suggestion"];
const METADATA_LANGUAGES: MetadataLanguage[] = ["en", "ur"];
const DELIVERY_TYPES: CloudinaryDeliveryType[] = ["upload", "signed"];

function parsePresets(formData: FormData): string[] {
  return formData.getAll("transformationPresets").map((v) => String(v));
}

export async function createCloudinaryPublishAction(
  _prev: CloudinaryActionState,
  formData: FormData,
): Promise<CloudinaryActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const projectId = String(formData.get("projectId") ?? "").trim();
  const imageId = String(formData.get("imageId") ?? "").trim();
  const connectionId = String(formData.get("connectionId") ?? "").trim();
  const derivativeId = String(formData.get("derivativeId") ?? "").trim();
  const filenameModeRaw = String(formData.get("filenameMode") ?? "keep");
  const deliveryTypeRaw = String(formData.get("deliveryType") ?? "upload");
  const languageRaw = String(formData.get("language") ?? "");
  const transformationPresets = parsePresets(formData);

  if (!FILENAME_MODES.includes(filenameModeRaw as CloudinaryFilenameMode)) {
    return {ok: false, error: "INVALID_REQUEST", fieldErrors: {filenameMode: "INVALID_REQUEST"}};
  }
  if (!DELIVERY_TYPES.includes(deliveryTypeRaw as CloudinaryDeliveryType)) {
    return {ok: false, error: "INVALID_REQUEST", fieldErrors: {deliveryType: "INVALID_REQUEST"}};
  }
  if (!METADATA_LANGUAGES.includes(languageRaw as MetadataLanguage)) {
    return {ok: false, error: "INVALID_REQUEST", fieldErrors: {language: "INVALID_REQUEST"}};
  }

  try {
    const job = await createPublishJob({
      userId: user.id,
      connectionId,
      projectId,
      imageId,
      derivativeId: derivativeId || null,
      filenameMode: filenameModeRaw as CloudinaryFilenameMode,
      deliveryType: deliveryTypeRaw as CloudinaryDeliveryType,
      transformationPresets,
      language: languageRaw as MetadataLanguage,
    });
    revalidateProjectCloudinaryPath(locale, projectId);
    revalidateCloudinaryPaths(locale, connectionId);
    return {ok: true, job};
  } catch (error) {
    return {ok: false, error: cloudinaryErrorCode(error)};
  }
}

export async function retryCloudinaryPublishAction(
  _prev: CloudinaryActionState,
  formData: FormData,
): Promise<CloudinaryActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const projectId = String(formData.get("projectId") ?? "").trim();
  const jobId = String(formData.get("jobId") ?? "").trim();

  try {
    const job = await retryPublishJob({userId: user.id, projectId, jobId});
    revalidateProjectCloudinaryPath(locale, projectId);
    revalidateCloudinaryPaths(locale, job.connectionId);
    return {ok: true, job};
  } catch (error) {
    return {ok: false, error: cloudinaryErrorCode(error)};
  }
}

export async function createCloudinaryBulkPublishAction(
  _prev: CloudinaryActionState,
  formData: FormData,
): Promise<CloudinaryActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const projectId = String(formData.get("projectId") ?? "").trim();
  const connectionId = String(formData.get("connectionId") ?? "").trim();
  const filenameModeRaw = String(formData.get("filenameMode") ?? "keep");
  const deliveryTypeRaw = String(formData.get("deliveryType") ?? "upload");
  const languageRaw = String(formData.get("language") ?? "");
  const transformationPresets = parsePresets(formData);
  const rawItems = formData.getAll("items").map((v) => String(v));

  if (!FILENAME_MODES.includes(filenameModeRaw as CloudinaryFilenameMode)) {
    return {ok: false, error: "INVALID_REQUEST", fieldErrors: {filenameMode: "INVALID_REQUEST"}};
  }
  if (!DELIVERY_TYPES.includes(deliveryTypeRaw as CloudinaryDeliveryType)) {
    return {ok: false, error: "INVALID_REQUEST", fieldErrors: {deliveryType: "INVALID_REQUEST"}};
  }
  if (!METADATA_LANGUAGES.includes(languageRaw as MetadataLanguage)) {
    return {ok: false, error: "INVALID_REQUEST", fieldErrors: {language: "INVALID_REQUEST"}};
  }

  // Each item is encoded as `imageId|derivativeId` (derivativeId optional).
  const items: CloudinaryBulkItemInput[] = [];
  for (const raw of rawItems) {
    const [imageId, derivativeId] = raw.split("|");
    if (imageId) items.push({imageId, derivativeId: derivativeId || null});
  }

  try {
    const {bulkJob, createdJobIds, skipped} = await createBulkPublishJob({
      userId: user.id,
      connectionId,
      projectId,
      items,
      filenameMode: filenameModeRaw as CloudinaryFilenameMode,
      deliveryType: deliveryTypeRaw as CloudinaryDeliveryType,
      transformationPresets,
      language: languageRaw as MetadataLanguage,
    });
    revalidateProjectCloudinaryPath(locale, projectId);
    revalidateCloudinaryPaths(locale, connectionId);
    return {
      ok: true,
      bulkJob,
      bulkCreatedCount: createdJobIds.length,
      bulkSkippedCount: skipped.length,
    };
  } catch (error) {
    return {ok: false, error: cloudinaryErrorCode(error)};
  }
}

export async function cancelCloudinaryBulkPublishAction(
  _prev: CloudinaryActionState,
  formData: FormData,
): Promise<CloudinaryActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const projectId = String(formData.get("projectId") ?? "").trim();
  const bulkJobId = String(formData.get("bulkJobId") ?? "").trim();

  try {
    const bulkJob = await cancelBulkPublishJob({userId: user.id, projectId, bulkJobId});
    revalidateProjectCloudinaryPath(locale, projectId);
    revalidateCloudinaryPaths(locale, bulkJob.connectionId);
    return {ok: true, bulkJob};
  } catch (error) {
    return {ok: false, error: cloudinaryErrorCode(error)};
  }
}

// ---------------------------------------------------------------------------
// Delivery
// ---------------------------------------------------------------------------

export async function getCloudinaryDeliveryUrlAction(
  _prev: CloudinaryActionState,
  formData: FormData,
): Promise<CloudinaryActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const mappingId = String(formData.get("mappingId") ?? "").trim();
  const preset = String(formData.get("preset") ?? "original").trim();

  if (!ALL_TRANSFORMATION_PRESETS.includes(preset as (typeof ALL_TRANSFORMATION_PRESETS)[number])) {
    return {ok: false, error: "CLOUDINARY_TRANSFORMATION_INVALID"};
  }

  try {
    const delivery = await getSafeDeliveryUrl({userId: user.id, mappingId, preset});
    return {ok: true, delivery};
  } catch (error) {
    return {ok: false, error: cloudinaryErrorCode(error)};
  }
}
