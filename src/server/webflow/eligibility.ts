/**
 * Prompt 28 — publish eligibility gate.
 * Centralizes every check that must pass before a Webflow publish job may be
 * created: permission, connection health, target CMS item identifier + field
 * mapping currency, image lifecycle state, source freshness, approved-
 * metadata currency, and plan entitlement/quota. Mirrors `shopify/eligibility.ts`.
 */
import {and, eq} from "drizzle-orm";
import {getDb} from "@/db";
import {
  imageDerivatives,
  imageMetadataApproved,
  imageReplacements,
  images,
  type ApiWorkspaceType,
  type Image,
  type ImageDerivative,
  type ImageMetadataApproved,
  type Project,
  type WebflowConnection,
  type WebflowFieldMapping,
  type WebflowFilenameMode,
} from "@/db/schema";
import {countUsageInPeriod, resolveEntitlement} from "@/server/billing/entitlements";
import {isDeletionUnavailableStatus, isOpenReplacementStatus} from "@/server/images/lifecycle-errors";
import {resolveEntitlementUserIdForProject} from "@/server/organizations/access";
import {getOwnedProject} from "@/server/projects/queries";
import type {MetadataLanguage} from "@/server/projects/validation";
import {getConnectionRowForPublish} from "@/server/webflow/connections";
import {WebflowError} from "@/server/webflow/errors";
import {getMappingRowForPublish} from "@/server/webflow/field-mappings";

export type PublishEligibility = {
  project: Project;
  connection: WebflowConnection;
  fieldMapping: WebflowFieldMapping;
  image: Image;
  derivative: ImageDerivative | null;
  approvedMetadata: ImageMetadataApproved;
  sourceStorageKey: string;
  collectionId: string;
  cmsItemId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
};

export function resolveProjectWorkspace(project: Project): {
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
} {
  if (project.workspaceType === "organization" && project.organizationId) {
    return {workspaceType: "organization", workspaceId: project.organizationId};
  }
  return {workspaceType: "personal", workspaceId: project.userId};
}

export async function assertPublishEligible(params: {
  userId: string;
  connectionId: string;
  projectId: string;
  imageId: string;
  collectionId: string;
  cmsItemId: string;
  fieldMappingId: string;
  derivativeId?: string | null;
  filenameMode: WebflowFilenameMode;
  language: MetadataLanguage;
}): Promise<PublishEligibility> {
  const collectionId = params.collectionId.trim();
  const cmsItemId = params.cmsItemId.trim();
  if (!collectionId) {
    throw new WebflowError("INVALID_REQUEST", "collectionId is required.");
  }
  if (!cmsItemId) {
    throw new WebflowError("INVALID_REQUEST", "cmsItemId is required.");
  }
  if (!params.fieldMappingId) {
    throw new WebflowError("INVALID_REQUEST", "fieldMappingId is required.");
  }

  const project = await getOwnedProject(params.userId, params.projectId, "webflow.publish");
  if (!project) {
    throw new WebflowError(
      "PROJECT_NOT_FOUND",
      "Project not found or you do not have permission to publish from it.",
    );
  }
  const {workspaceType, workspaceId} = resolveProjectWorkspace(project);

  const connection = await getConnectionRowForPublish(workspaceType, workspaceId, params.connectionId);
  if (connection.status === "disabled") {
    throw new WebflowError("CONNECTION_DISABLED", "This Webflow connection is disabled.");
  }
  if (connection.status === "disconnected") {
    throw new WebflowError("CONNECTION_DISCONNECTED", "This Webflow connection has been disconnected.");
  }
  if (connection.status !== "active" && connection.status !== "degraded") {
    throw new WebflowError(
      "CONNECTION_NOT_ACTIVE",
      "This Webflow connection is not active yet. Verify it before publishing.",
    );
  }

  const fieldMapping = await getMappingRowForPublish(params.fieldMappingId);
  if (fieldMapping.connectionId !== connection.id || fieldMapping.collectionId !== collectionId) {
    throw new WebflowError("FIELD_MAPPING_INVALID", "Field mapping does not match this connection/collection.");
  }
  if (fieldMapping.staleAt) {
    throw new WebflowError("MAPPING_STALE", "This field mapping is stale. Re-map the collection before publishing.");
  }

  const db = getDb();
  const [image] = await db
    .select()
    .from(images)
    .where(and(eq(images.id, params.imageId), eq(images.projectId, project.id)))
    .limit(1);
  if (!image) {
    throw new WebflowError("IMAGE_NOT_FOUND", "Image not found.");
  }
  if (image.deletedAt || isDeletionUnavailableStatus(image.status)) {
    throw new WebflowError("IMAGE_NOT_ELIGIBLE", "This image is deleted or being deleted.");
  }

  const replacementRows = await db
    .select({status: imageReplacements.status})
    .from(imageReplacements)
    .where(eq(imageReplacements.imageId, image.id));
  if (replacementRows.some((row) => isOpenReplacementStatus(row.status))) {
    throw new WebflowError("IMAGE_NOT_ELIGIBLE", "This image has a replacement in progress.");
  }

  let derivative: ImageDerivative | null = null;
  let sourceStorageKey: string;
  if (params.derivativeId) {
    const [row] = await db
      .select()
      .from(imageDerivatives)
      .where(
        and(
          eq(imageDerivatives.id, params.derivativeId),
          eq(imageDerivatives.imageId, image.id),
          eq(imageDerivatives.projectId, project.id),
        ),
      )
      .limit(1);
    if (!row) {
      throw new WebflowError("DERIVATIVE_NOT_FOUND", "Derivative not found.");
    }
    if (row.status !== "active" || row.sourceStorageKey !== image.storageKey) {
      throw new WebflowError(
        "DERIVATIVE_NOT_ACTIVE",
        "This derivative is no longer active (it may have been superseded by a newer image or processing run).",
      );
    }
    derivative = row;
    sourceStorageKey = row.storageKey;
  } else {
    sourceStorageKey = image.storageKey;
  }

  const [approvedMetadata] = await db
    .select()
    .from(imageMetadataApproved)
    .where(
      and(
        eq(imageMetadataApproved.projectId, project.id),
        eq(imageMetadataApproved.imageId, image.id),
        eq(imageMetadataApproved.language, params.language),
      ),
    )
    .limit(1);
  if (!approvedMetadata) {
    throw new WebflowError(
      "APPROVED_METADATA_NOT_FOUND",
      "No approved metadata exists for this image in the requested language.",
    );
  }
  if (approvedMetadata.sourceStorageKey !== image.storageKey) {
    throw new WebflowError(
      "APPROVED_METADATA_STALE",
      "Approved metadata is stale — the image has since been replaced. Re-approve metadata before publishing.",
    );
  }

  const entitlementUserId = await resolveEntitlementUserIdForProject(project);
  const entitlement = await resolveEntitlement(entitlementUserId);
  if (!entitlement.plan.webflowEnabled) {
    throw new WebflowError("WEBFLOW_NOT_ENABLED", "This plan does not include the Webflow integration.");
  }
  if (!entitlement.writesAllowed) {
    throw new WebflowError("SUBSCRIPTION_RESTRICTED", "Writes are currently restricted for this subscription.");
  }
  if (entitlement.plan.monthlyWebflowPublishLimit >= 0) {
    const used = await countUsageInPeriod(
      entitlementUserId,
      "webflow_publish",
      entitlement.periodStart,
      entitlement.periodEnd,
    );
    if (used >= entitlement.plan.monthlyWebflowPublishLimit) {
      throw new WebflowError(
        "WEBFLOW_PUBLISH_LIMIT_REACHED",
        "Monthly Webflow publish limit reached for this plan.",
      );
    }
  }

  return {
    project,
    connection,
    fieldMapping,
    image,
    derivative,
    approvedMetadata,
    sourceStorageKey,
    collectionId,
    cmsItemId,
    workspaceType,
    workspaceId,
  };
}
