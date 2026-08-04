/**
 * Prompt 27 — publish eligibility gate.
 * Centralizes every check that must pass before a Shopify publish job may be
 * created: permission, connection health, target product identifier,
 * image lifecycle state, source freshness, approved-metadata currency, and
 * plan entitlement/quota. Mirrors `wordpress/eligibility.ts`.
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
  type ShopifyConnection,
  type ShopifyFilenameMode,
} from "@/db/schema";
import {countUsageInPeriod, resolveEntitlement} from "@/server/billing/entitlements";
import {isDeletionUnavailableStatus, isOpenReplacementStatus} from "@/server/images/lifecycle-errors";
import {resolveEntitlementUserIdForProject} from "@/server/organizations/access";
import {getOwnedProject} from "@/server/projects/queries";
import type {MetadataLanguage} from "@/server/projects/validation";
import {getConnectionRowForPublish} from "@/server/shopify/connections";
import {ShopifyError} from "@/server/shopify/errors";

export type PublishEligibility = {
  project: Project;
  connection: ShopifyConnection;
  image: Image;
  derivative: ImageDerivative | null;
  approvedMetadata: ImageMetadataApproved;
  sourceStorageKey: string;
  shopifyProductId: string;
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
  shopifyProductId: string;
  derivativeId?: string | null;
  filenameMode: ShopifyFilenameMode;
  language: MetadataLanguage;
}): Promise<PublishEligibility> {
  const shopifyProductId = params.shopifyProductId.trim();
  if (!shopifyProductId) {
    throw new ShopifyError("INVALID_REQUEST", "shopifyProductId is required.");
  }

  const project = await getOwnedProject(params.userId, params.projectId, "shopify.publish");
  if (!project) {
    throw new ShopifyError(
      "PROJECT_NOT_FOUND",
      "Project not found or you do not have permission to publish from it.",
    );
  }
  const {workspaceType, workspaceId} = resolveProjectWorkspace(project);

  const connection = await getConnectionRowForPublish(workspaceType, workspaceId, params.connectionId);
  if (connection.status === "disabled") {
    throw new ShopifyError("CONNECTION_DISABLED", "This Shopify connection is disabled.");
  }
  if (connection.status === "disconnected") {
    throw new ShopifyError("CONNECTION_DISCONNECTED", "This Shopify connection has been disconnected.");
  }
  if (connection.status !== "active" && connection.status !== "degraded") {
    throw new ShopifyError(
      "CONNECTION_NOT_ACTIVE",
      "This Shopify connection is not active yet. Verify it before publishing.",
    );
  }

  const db = getDb();
  const [image] = await db
    .select()
    .from(images)
    .where(and(eq(images.id, params.imageId), eq(images.projectId, project.id)))
    .limit(1);
  if (!image) {
    throw new ShopifyError("IMAGE_NOT_FOUND", "Image not found.");
  }
  if (image.deletedAt || isDeletionUnavailableStatus(image.status)) {
    throw new ShopifyError("IMAGE_NOT_ELIGIBLE", "This image is deleted or being deleted.");
  }

  const replacementRows = await db
    .select({status: imageReplacements.status})
    .from(imageReplacements)
    .where(eq(imageReplacements.imageId, image.id));
  if (replacementRows.some((row) => isOpenReplacementStatus(row.status))) {
    throw new ShopifyError("IMAGE_NOT_ELIGIBLE", "This image has a replacement in progress.");
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
      throw new ShopifyError("DERIVATIVE_NOT_FOUND", "Derivative not found.");
    }
    if (row.status !== "active" || row.sourceStorageKey !== image.storageKey) {
      throw new ShopifyError(
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
    throw new ShopifyError(
      "APPROVED_METADATA_NOT_FOUND",
      "No approved metadata exists for this image in the requested language.",
    );
  }
  if (approvedMetadata.sourceStorageKey !== image.storageKey) {
    throw new ShopifyError(
      "APPROVED_METADATA_STALE",
      "Approved metadata is stale — the image has since been replaced. Re-approve metadata before publishing.",
    );
  }

  const entitlementUserId = await resolveEntitlementUserIdForProject(project);
  const entitlement = await resolveEntitlement(entitlementUserId);
  if (!entitlement.plan.shopifyEnabled) {
    throw new ShopifyError("SHOPIFY_NOT_ENABLED", "This plan does not include the Shopify integration.");
  }
  if (!entitlement.writesAllowed) {
    throw new ShopifyError("SUBSCRIPTION_RESTRICTED", "Writes are currently restricted for this subscription.");
  }
  if (entitlement.plan.monthlyShopifyPublishLimit >= 0) {
    const used = await countUsageInPeriod(
      entitlementUserId,
      "shopify_publish",
      entitlement.periodStart,
      entitlement.periodEnd,
    );
    if (used >= entitlement.plan.monthlyShopifyPublishLimit) {
      throw new ShopifyError(
        "SHOPIFY_PUBLISH_LIMIT_REACHED",
        "Monthly Shopify publish limit reached for this plan.",
      );
    }
  }

  return {
    project,
    connection,
    image,
    derivative,
    approvedMetadata,
    sourceStorageKey,
    shopifyProductId,
    workspaceType,
    workspaceId,
  };
}
