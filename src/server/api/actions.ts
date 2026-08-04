"use server";

/**
 * Prompt 25 — server actions backing the developer settings UI (API keys +
 * webhook endpoints). Thin wrappers around `@/server/api/keys` and
 * `@/server/webhooks/endpoints`: resolve the acting user + workspace, map
 * `ApiError` codes to form-friendly state, and revalidate the settings pages.
 *
 * One-time secrets (`rawKey` / `rawSecret`) are only ever present on the
 * action state returned from the create/rotate call that generated them —
 * they are never re-fetched, re-derived, or persisted anywhere by this file.
 */
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {auth} from "@/auth";
import type {ApiWorkspaceType} from "@/db/schema";
import {isAppLocale} from "@/server/auth/validation";
import {ApiError} from "@/server/api/errors";
import {requireManageIntegrations} from "@/server/api/permissions";
import {
  createApiKey,
  revokeApiKey,
  rotateApiKey,
  type ApiKeySafeDto,
} from "@/server/api/keys";
import {
  createEndpoint,
  disable as disableEndpoint,
  enable as enableEndpoint,
  rotateSecret,
  sendTestEvent,
  softDelete,
  verifyEndpoint,
  type WebhookEndpointSafeDto,
} from "@/server/webhooks/endpoints";
import {getOrganizationBySlug, resolveActiveWorkspace} from "@/server/organizations/workspace";

export type DeveloperActionState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Present only immediately after createApiKeyAction / rotateApiKeyAction succeed. */
  rawKey?: string;
  apiKey?: ApiKeySafeDto;
  /** Present only immediately after createWebhookEndpointAction / rotateWebhookSecretAction succeed. */
  rawSecret?: string;
  endpoint?: WebhookEndpointSafeDto;
  test?: {statusCode: number | null; success: boolean; detail: string};
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

function apiErrorCode(error: unknown): string {
  if (error instanceof ApiError) return error.code;
  return "INTERNAL_ERROR";
}

/**
 * Best-effort field-error mapping so the form can highlight the specific
 * input rather than only showing a top-level banner.
 */
function fieldErrorsFor(error: ApiError, kind: "apiKey" | "webhook"): Record<string, string> | undefined {
  if (error.code === "INVALID_SCOPE") return {scopes: error.code};
  if (error.code === "INVALID_REQUEST") {
    if (/name/i.test(error.message)) return {name: error.code};
    if (kind === "webhook" && /event/i.test(error.message)) return {events: error.code};
    if (kind === "webhook" && /expiresAt|expires/i.test(error.message)) return {expiresAt: error.code};
  }
  if (kind === "webhook" && (error.code === "WEBHOOK_URL_UNSAFE" || error.code === "WEBHOOK_URL_UNREACHABLE")) {
    return {url: error.code};
  }
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

function revalidateDeveloperPaths(locale: string, endpointId?: string) {
  revalidatePath(`/${locale}/dashboard/settings/developer`);
  revalidatePath(`/${locale}/dashboard/settings/developer/keys`);
  revalidatePath(`/${locale}/dashboard/settings/developer/webhooks`);
  if (endpointId) {
    revalidatePath(`/${locale}/dashboard/settings/developer/webhooks/${endpointId}`);
  }
}

// ---------------------------------------------------------------------------
// API keys
// ---------------------------------------------------------------------------

export async function createApiKeyAction(
  _prev: DeveloperActionState,
  formData: FormData,
): Promise<DeveloperActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const name = String(formData.get("name") ?? "").trim();
  const scopes = formData.getAll("scopes").map((v) => String(v));

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    await requireManageIntegrations(user.id, workspaceType, workspaceId);
    const {key, rawKey} = await createApiKey({
      actorUserId: user.id,
      workspaceType,
      workspaceId,
      name,
      scopes,
    });
    revalidateDeveloperPaths(locale);
    return {ok: true, apiKey: key, rawKey};
  } catch (error) {
    if (error instanceof ApiError) {
      return {ok: false, error: error.code, fieldErrors: fieldErrorsFor(error, "apiKey")};
    }
    return {ok: false, error: apiErrorCode(error)};
  }
}

export async function revokeApiKeyAction(
  _prev: DeveloperActionState,
  formData: FormData,
): Promise<DeveloperActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const apiKeyId = String(formData.get("apiKeyId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    await requireManageIntegrations(user.id, workspaceType, workspaceId);
    const key = await revokeApiKey({actorUserId: user.id, workspaceType, workspaceId, apiKeyId});
    revalidateDeveloperPaths(locale);
    return {ok: true, apiKey: key};
  } catch (error) {
    return {ok: false, error: apiErrorCode(error)};
  }
}

export async function rotateApiKeyAction(
  _prev: DeveloperActionState,
  formData: FormData,
): Promise<DeveloperActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const apiKeyId = String(formData.get("apiKeyId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    await requireManageIntegrations(user.id, workspaceType, workspaceId);
    const {key, rawKey} = await rotateApiKey({
      actorUserId: user.id,
      workspaceType,
      workspaceId,
      apiKeyId,
    });
    revalidateDeveloperPaths(locale);
    return {ok: true, apiKey: key, rawKey};
  } catch (error) {
    return {ok: false, error: apiErrorCode(error)};
  }
}

// ---------------------------------------------------------------------------
// Webhook endpoints
// ---------------------------------------------------------------------------

export async function createWebhookEndpointAction(
  _prev: DeveloperActionState,
  formData: FormData,
): Promise<DeveloperActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const name = String(formData.get("name") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const subscribedEvents = formData.getAll("events").map((v) => String(v));

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    await requireManageIntegrations(user.id, workspaceType, workspaceId);
    const {endpoint, secret} = await createEndpoint({
      actorUserId: user.id,
      workspaceType,
      workspaceId,
      name,
      url,
      subscribedEvents,
    });
    revalidateDeveloperPaths(locale);
    return {ok: true, endpoint, rawSecret: secret};
  } catch (error) {
    if (error instanceof ApiError) {
      return {ok: false, error: error.code, fieldErrors: fieldErrorsFor(error, "webhook")};
    }
    return {ok: false, error: apiErrorCode(error)};
  }
}

export async function verifyWebhookEndpointAction(
  _prev: DeveloperActionState,
  formData: FormData,
): Promise<DeveloperActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const endpointId = String(formData.get("endpointId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    await requireManageIntegrations(user.id, workspaceType, workspaceId);
    const endpoint = await verifyEndpoint({
      actorUserId: user.id,
      workspaceType,
      workspaceId,
      endpointId,
    });
    revalidateDeveloperPaths(locale, endpointId);
    return {ok: true, endpoint};
  } catch (error) {
    return {ok: false, error: apiErrorCode(error)};
  }
}

export async function rotateWebhookSecretAction(
  _prev: DeveloperActionState,
  formData: FormData,
): Promise<DeveloperActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const endpointId = String(formData.get("endpointId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    await requireManageIntegrations(user.id, workspaceType, workspaceId);
    const {endpoint, secret} = await rotateSecret({
      actorUserId: user.id,
      workspaceType,
      workspaceId,
      endpointId,
    });
    revalidateDeveloperPaths(locale, endpointId);
    return {ok: true, endpoint, rawSecret: secret};
  } catch (error) {
    return {ok: false, error: apiErrorCode(error)};
  }
}

export async function disableWebhookEndpointAction(
  _prev: DeveloperActionState,
  formData: FormData,
): Promise<DeveloperActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const endpointId = String(formData.get("endpointId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    await requireManageIntegrations(user.id, workspaceType, workspaceId);
    const endpoint = await disableEndpoint({
      actorUserId: user.id,
      workspaceType,
      workspaceId,
      endpointId,
    });
    revalidateDeveloperPaths(locale, endpointId);
    return {ok: true, endpoint};
  } catch (error) {
    return {ok: false, error: apiErrorCode(error)};
  }
}

export async function enableWebhookEndpointAction(
  _prev: DeveloperActionState,
  formData: FormData,
): Promise<DeveloperActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const endpointId = String(formData.get("endpointId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    await requireManageIntegrations(user.id, workspaceType, workspaceId);
    const endpoint = await enableEndpoint({
      actorUserId: user.id,
      workspaceType,
      workspaceId,
      endpointId,
    });
    revalidateDeveloperPaths(locale, endpointId);
    return {ok: true, endpoint};
  } catch (error) {
    return {ok: false, error: apiErrorCode(error)};
  }
}

export async function deleteWebhookEndpointAction(
  _prev: DeveloperActionState,
  formData: FormData,
): Promise<DeveloperActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const endpointId = String(formData.get("endpointId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    await requireManageIntegrations(user.id, workspaceType, workspaceId);
    await softDelete({actorUserId: user.id, workspaceType, workspaceId, endpointId});
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    return {ok: false, error: apiErrorCode(error)};
  }
  revalidateDeveloperPaths(locale, endpointId);
  redirect(`/${locale}/dashboard/settings/developer/webhooks`);
}

export async function sendTestWebhookAction(
  _prev: DeveloperActionState,
  formData: FormData,
): Promise<DeveloperActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const endpointId = String(formData.get("endpointId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    await requireManageIntegrations(user.id, workspaceType, workspaceId);
    const result = await sendTestEvent({
      actorUserId: user.id,
      workspaceType,
      workspaceId,
      endpointId,
    });
    return {ok: result.success, test: result, error: result.success ? undefined : "TEST_DELIVERY_FAILED"};
  } catch (error) {
    return {ok: false, error: apiErrorCode(error)};
  }
}
