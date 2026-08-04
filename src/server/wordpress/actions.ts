"use server";

/**
 * Prompt 26 — server actions backing the WordPress integrations UI.
 * Thin wrappers around `@/server/wordpress/*`: resolve the acting user +
 * workspace, map `WordPressError` codes to form-friendly state, and
 * revalidate the integrations pages. Credentials (username / Application
 * Password) are write-only from this layer — no action ever returns them.
 */
import {revalidatePath} from "next/cache";
import {auth} from "@/auth";
import type {ApiWorkspaceType, WordpressBulkJob, WordpressFilenameMode} from "@/db/schema";
import {isAppLocale} from "@/server/auth/validation";
import {getOrganizationBySlug, resolveActiveWorkspace} from "@/server/organizations/workspace";
import type {MetadataLanguage} from "@/server/projects/validation";
import {createBulkPublishJob, type WordpressBulkItemInput} from "@/server/wordpress/bulk";
import {
  createConnection,
  disableConnection,
  disconnectConnection,
  enableConnection,
  getConnectionSafe,
  updateCredentials,
  verifyConnection,
  type WordpressConnectionSafeDto,
} from "@/server/wordpress/connections";
import {WordPressError} from "@/server/wordpress/errors";
import {
  createPublishJob,
  retryPublishJob,
  type WordpressPublishJobDto,
} from "@/server/wordpress/publish-service";

export type WordpressActionState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  connection?: WordpressConnectionSafeDto;
  job?: WordpressPublishJobDto;
  bulkJob?: WordpressBulkJob;
  bulkCreatedCount?: number;
  bulkSkippedCount?: number;
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

function wpErrorCode(error: unknown): string {
  if (error instanceof WordPressError) return error.code;
  return "INTERNAL_ERROR";
}

/**
 * Best-effort field-error mapping so the connection form can highlight the
 * specific input rather than only showing a top-level banner.
 */
function connectionFieldErrors(error: WordPressError): Record<string, string> | undefined {
  if (error.code !== "INVALID_REQUEST") return undefined;
  if (/application ?password/i.test(error.message)) return {applicationPassword: error.code};
  if (/username/i.test(error.message)) return {username: error.code};
  if (/name/i.test(error.message)) return {name: error.code};
  if (/site url|url/i.test(error.message)) return {siteUrl: error.code};
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

function revalidateWordpressPaths(locale: string, connectionId?: string) {
  revalidatePath(`/${locale}/dashboard/settings/integrations/wordpress`);
  if (connectionId) {
    revalidatePath(`/${locale}/dashboard/settings/integrations/wordpress/${connectionId}`);
  }
}

function revalidateProjectWordpressPath(locale: string, projectId: string) {
  revalidatePath(`/${locale}/dashboard/projects/${projectId}/wordpress`);
}

// ---------------------------------------------------------------------------
// Connections
// ---------------------------------------------------------------------------

export async function createWordpressConnectionAction(
  _prev: WordpressActionState,
  formData: FormData,
): Promise<WordpressActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const name = String(formData.get("name") ?? "").trim();
  const siteUrl = String(formData.get("siteUrl") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const applicationPassword = String(formData.get("applicationPassword") ?? "");

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    const connection = await createConnection({
      actorUserId: user.id,
      workspaceType,
      workspaceId,
      name,
      siteUrl,
      username,
      applicationPassword,
    });
    revalidateWordpressPaths(locale, connection.id);
    return {ok: true, connection};
  } catch (error) {
    if (error instanceof WordPressError) {
      return {ok: false, error: error.code, fieldErrors: connectionFieldErrors(error)};
    }
    return {ok: false, error: wpErrorCode(error)};
  }
}

export async function verifyWordpressConnectionAction(
  _prev: WordpressActionState,
  formData: FormData,
): Promise<WordpressActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const connectionId = String(formData.get("connectionId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    const connection = await verifyConnection({actorUserId: user.id, workspaceType, workspaceId, connectionId});
    revalidateWordpressPaths(locale, connectionId);
    return {ok: true, connection};
  } catch (error) {
    return {ok: false, error: wpErrorCode(error)};
  }
}

export async function updateWordpressCredentialsAction(
  _prev: WordpressActionState,
  formData: FormData,
): Promise<WordpressActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const connectionId = String(formData.get("connectionId") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const applicationPassword = String(formData.get("applicationPassword") ?? "");

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    const connection = await updateCredentials({
      actorUserId: user.id,
      workspaceType,
      workspaceId,
      connectionId,
      username,
      applicationPassword,
    });
    revalidateWordpressPaths(locale, connectionId);
    return {ok: true, connection};
  } catch (error) {
    if (error instanceof WordPressError) {
      return {ok: false, error: error.code, fieldErrors: connectionFieldErrors(error)};
    }
    return {ok: false, error: wpErrorCode(error)};
  }
}

export async function disableWordpressConnectionAction(
  _prev: WordpressActionState,
  formData: FormData,
): Promise<WordpressActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const connectionId = String(formData.get("connectionId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    const connection = await disableConnection({actorUserId: user.id, workspaceType, workspaceId, connectionId});
    revalidateWordpressPaths(locale, connectionId);
    return {ok: true, connection};
  } catch (error) {
    return {ok: false, error: wpErrorCode(error)};
  }
}

export async function enableWordpressConnectionAction(
  _prev: WordpressActionState,
  formData: FormData,
): Promise<WordpressActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const connectionId = String(formData.get("connectionId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    const connection = await enableConnection({actorUserId: user.id, workspaceType, workspaceId, connectionId});
    revalidateWordpressPaths(locale, connectionId);
    return {ok: true, connection};
  } catch (error) {
    return {ok: false, error: wpErrorCode(error)};
  }
}

export async function disconnectWordpressConnectionAction(
  _prev: WordpressActionState,
  formData: FormData,
): Promise<WordpressActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const connectionId = String(formData.get("connectionId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    await disconnectConnection({actorUserId: user.id, workspaceType, workspaceId, connectionId});
    const connection = await getConnectionSafe({actorUserId: user.id, workspaceType, workspaceId, connectionId});
    revalidateWordpressPaths(locale, connectionId);
    return {ok: true, connection};
  } catch (error) {
    return {ok: false, error: wpErrorCode(error)};
  }
}

// ---------------------------------------------------------------------------
// Publishing
// ---------------------------------------------------------------------------

const FILENAME_MODES: WordpressFilenameMode[] = ["keep", "suggestion"];
const METADATA_LANGUAGES: MetadataLanguage[] = ["en", "ur"];

export async function createWordpressPublishAction(
  _prev: WordpressActionState,
  formData: FormData,
): Promise<WordpressActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const projectId = String(formData.get("projectId") ?? "").trim();
  const imageId = String(formData.get("imageId") ?? "").trim();
  const connectionId = String(formData.get("connectionId") ?? "").trim();
  const derivativeId = String(formData.get("derivativeId") ?? "").trim();
  const filenameModeRaw = String(formData.get("filenameMode") ?? "keep");
  const languageRaw = String(formData.get("language") ?? "");

  if (!FILENAME_MODES.includes(filenameModeRaw as WordpressFilenameMode)) {
    return {ok: false, error: "INVALID_REQUEST", fieldErrors: {filenameMode: "INVALID_REQUEST"}};
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
      filenameMode: filenameModeRaw as WordpressFilenameMode,
      language: languageRaw as MetadataLanguage,
    });
    revalidateProjectWordpressPath(locale, projectId);
    revalidateWordpressPaths(locale, connectionId);
    return {ok: true, job};
  } catch (error) {
    return {ok: false, error: wpErrorCode(error)};
  }
}

export async function retryWordpressPublishAction(
  _prev: WordpressActionState,
  formData: FormData,
): Promise<WordpressActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const projectId = String(formData.get("projectId") ?? "").trim();
  const jobId = String(formData.get("jobId") ?? "").trim();

  try {
    const job = await retryPublishJob({userId: user.id, projectId, jobId});
    revalidateProjectWordpressPath(locale, projectId);
    revalidateWordpressPaths(locale, job.connectionId);
    return {ok: true, job};
  } catch (error) {
    return {ok: false, error: wpErrorCode(error)};
  }
}

export async function createWordpressBulkPublishAction(
  _prev: WordpressActionState,
  formData: FormData,
): Promise<WordpressActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const projectId = String(formData.get("projectId") ?? "").trim();
  const connectionId = String(formData.get("connectionId") ?? "").trim();
  const filenameModeRaw = String(formData.get("filenameMode") ?? "keep");
  const languageRaw = String(formData.get("language") ?? "");
  const rawItems = formData.getAll("items").map((v) => String(v));

  if (!FILENAME_MODES.includes(filenameModeRaw as WordpressFilenameMode)) {
    return {ok: false, error: "INVALID_REQUEST", fieldErrors: {filenameMode: "INVALID_REQUEST"}};
  }
  if (!METADATA_LANGUAGES.includes(languageRaw as MetadataLanguage)) {
    return {ok: false, error: "INVALID_REQUEST", fieldErrors: {language: "INVALID_REQUEST"}};
  }

  const items: WordpressBulkItemInput[] = [];
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
      filenameMode: filenameModeRaw as WordpressFilenameMode,
      language: languageRaw as MetadataLanguage,
    });
    revalidateProjectWordpressPath(locale, projectId);
    revalidateWordpressPaths(locale, connectionId);
    return {
      ok: true,
      bulkJob,
      bulkCreatedCount: createdJobIds.length,
      bulkSkippedCount: skipped.length,
    };
  } catch (error) {
    return {ok: false, error: wpErrorCode(error)};
  }
}
