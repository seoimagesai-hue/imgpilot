/**
 * Prompt 25 — public API request authentication.
 * Verifies the bearer key, checks workspace/entitlement/rate-limit state,
 * and returns a minimal principal. The raw key and its hash never leave
 * `keys.ts` / this module — nothing here logs or returns the secret.
 */
import type {ApiWorkspaceType, Project} from "@/db/schema";
import {ApiError} from "@/server/api/errors";
import {newRequestId, parseBearerAuthorization, assertNoApiKeyInQueryString} from "@/server/api/http";
import {
  findApiKeyByPublicPrefix,
  parseApiKeyFormat,
  recordApiKeyUsage,
  verifyApiKey,
  type ApiKeyEnvironment,
} from "@/server/api/keys";
import {isWorkspaceActive, resolveWorkspaceEntitlementUserId} from "@/server/api/permissions";
import {consumeRateLimit, type RateLimitResult} from "@/server/api/rate-limit";
import {hasScope, isValidScope, type ApiScope} from "@/server/api/scopes";
import {resolveEntitlement} from "@/server/billing/entitlements";
import {getAccessibleProject} from "@/server/organizations/access";
import type {OrgPermission} from "@/server/organizations/permissions";

export type ApiPrincipal = {
  apiKeyId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  scopes: ApiScope[];
  environment: ApiKeyEnvironment;
  /** Billing-owner-resolved user used only to reuse existing per-project ACL checks. */
  entitlementUserId: string;
  requestId: string;
  rateLimit: RateLimitResult;
};

/**
 * Authenticate a public API request. Throws `ApiError` with a code from
 * `errors.ts` on any failure — callers should catch and pass to `errorJson`.
 */
export async function authenticateApiRequest(request: Request): Promise<ApiPrincipal> {
  const requestId = newRequestId();

  assertNoApiKeyInQueryString(request.url);

  const bearer = parseBearerAuthorization(request.headers.get("authorization"));
  if (!bearer.ok) {
    throw new ApiError("API_KEY_MISSING", "Missing or malformed Authorization: Bearer <key> header.");
  }
  const rawKey = bearer.token;

  const parsed = parseApiKeyFormat(rawKey);
  if (!parsed) {
    throw new ApiError("API_KEY_INVALID", "API key format is not recognized.");
  }

  const keyRow = await findApiKeyByPublicPrefix(parsed.publicPrefix);
  if (!keyRow || !verifyApiKey(rawKey, keyRow.secretHash)) {
    throw new ApiError("API_KEY_INVALID", "API key is invalid.");
  }

  if (keyRow.status === "revoked" || keyRow.status === "rotated") {
    throw new ApiError("API_KEY_REVOKED", "This API key has been revoked.");
  }
  if (keyRow.status === "expired" || (keyRow.expiresAt && keyRow.expiresAt.getTime() <= Date.now())) {
    throw new ApiError("API_KEY_EXPIRED", "This API key has expired.");
  }
  if (keyRow.status !== "active") {
    throw new ApiError("API_KEY_SUSPENDED", "This API key is not active.");
  }

  const workspaceActive = await isWorkspaceActive(keyRow.workspaceType, keyRow.workspaceId);
  if (!workspaceActive) {
    throw new ApiError("API_WORKSPACE_INACTIVE", "The workspace for this API key is not active.");
  }

  const entitlementUserId = await resolveWorkspaceEntitlementUserId(
    keyRow.workspaceType,
    keyRow.workspaceId,
  );
  if (!entitlementUserId) {
    throw new ApiError("API_WORKSPACE_INACTIVE", "The workspace for this API key could not be resolved.");
  }
  const entitlement = await resolveEntitlement(entitlementUserId);
  if (!entitlement.plan.apiAccessEnabled) {
    throw new ApiError("API_ACCESS_NOT_ENABLED", "This plan does not include API access.");
  }

  const rateLimit = await consumeRateLimit(
    `apikey:${keyRow.id}`,
    entitlement.plan.apiRequestsPerMinute,
  );
  if (!rateLimit.ok) {
    throw new ApiError("API_RATE_LIMITED", "Rate limit exceeded for this API key.", {
      resetAt: rateLimit.resetAt.toISOString(),
    });
  }

  const scopes = (keyRow.scopes ?? []).filter(isValidScope);

  await recordApiKeyUsage({
    apiKeyId: keyRow.id,
    workspaceType: keyRow.workspaceType,
    workspaceId: keyRow.workspaceId,
  });

  return {
    apiKeyId: keyRow.id,
    workspaceType: keyRow.workspaceType,
    workspaceId: keyRow.workspaceId,
    scopes,
    environment: keyRow.environment as ApiKeyEnvironment,
    entitlementUserId,
    requestId,
    rateLimit,
  };
}

export function requireScope(principal: ApiPrincipal, scope: ApiScope): void {
  if (!hasScope(principal.scopes, scope)) {
    throw new ApiError(
      "API_KEY_SCOPE_INSUFFICIENT",
      `This API key is missing the required scope: ${scope}.`,
    );
  }
}

/** Fixed mapping from public API scopes to internal OrgPermission codes. */
export function scopeToOrgPermission(scope: ApiScope): OrgPermission {
  switch (scope) {
    case "projects:read":
      return "projects.view";
    case "projects:write":
      return "projects.edit";
    case "images:read":
      return "projects.view";
    case "images:upload":
      return "images.upload";
    case "images:process":
      return "processing.run";
    case "metadata:read":
      return "projects.view";
    case "metadata:generate":
      return "metadata.generate";
    case "metadata:write":
      return "metadata.edit";
    case "metadata:approve":
      return "metadata.approve";
    case "exports:read":
      return "exports.download";
    case "exports:create":
      return "exports.create";
    case "analytics:read":
      return "analytics.view";
    case "workflows:read":
      return "workflows.view";
    case "workflows:write":
      return "workflows.manage";
    case "workflows:run":
      return "workflows.run";
  }
}

/**
 * Require both the scope and workspace-bound access to a project.
 * Reuses `getAccessibleProject` (keyed off the entitlement/billing-owner user,
 * who is always guaranteed active owner access) then independently verifies
 * the project belongs to the *exact* workspace the key is scoped to — an API
 * key must never reach a different workspace even if the billing owner
 * happens to also own/administer it.
 */
export async function requireProjectAccess(
  principal: ApiPrincipal,
  projectId: string,
  scope: ApiScope,
): Promise<Project> {
  requireScope(principal, scope);
  const permission = scopeToOrgPermission(scope);
  const project = await getAccessibleProject(principal.entitlementUserId, projectId, permission);
  if (!project) {
    throw new ApiError("RESOURCE_NOT_FOUND", "Project not found.");
  }

  const boundToWorkspace =
    principal.workspaceType === "personal"
      ? project.workspaceType === "personal" && project.userId === principal.workspaceId
      : project.workspaceType === "organization" &&
        project.organizationId === principal.workspaceId;

  if (!boundToWorkspace) {
    throw new ApiError("RESOURCE_NOT_FOUND", "Project not found.");
  }

  return project;
}

/** Require scope + workspace-bound access to a workflow definition. */
export async function requireWorkflowAccess(
  principal: ApiPrincipal,
  workflowId: string,
  scope: Extract<ApiScope, "workflows:read" | "workflows:write" | "workflows:run">,
) {
  requireScope(principal, scope);
  const {getWorkflowWithSteps} = await import("@/server/workflows/definitions");
  const {WorkflowError} = await import("@/server/workflows/errors");
  const {mapThrownError} = await import("@/server/api/v1-handlers");
  try {
    return await getWorkflowWithSteps({
      actorUserId: principal.entitlementUserId,
      workspaceType: principal.workspaceType,
      workspaceId: principal.workspaceId,
      workflowId,
    });
  } catch (error) {
    if (error instanceof WorkflowError && error.code === "WORKFLOW_PERMISSION_DENIED") {
      throw new ApiError("FORBIDDEN", error.message);
    }
    throw mapThrownError(error);
  }
}
