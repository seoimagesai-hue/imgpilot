/**
 * Prompt 29 — publish eligibility gate.
 * Centralizes every check that must pass before a Cloudinary publish job may
 * be created: permission, connection health, requested delivery type +
 * transformation presets, image lifecycle state, source freshness, approved-
 * metadata currency, and plan entitlement/quota. Mirrors `webflow/eligibility.ts`.
 */
import {and, eq} from "drizzle-orm";
import {getDb} from "@/db";
import {
  imageDerivatives,
  imageMetadataApproved,
  imageReplacements,
  images,
  type ApiWorkspaceType,
  type CloudinaryConnection,
  type CloudinaryDeliveryType,
  type Image,
  type ImageDerivative,
  type ImageMetadataApproved,
  type Project,
} from "@/db/schema";
import {countUsageInPeriod, resolveEntitlement} from "@/server/billing/entitlements";
import {getConnectionRowForPublish} from "@/server/cloudinary/connections";
import {CloudinaryError} from "@/server/cloudinary/errors";
import {assertValidTransformationPresets, type TransformationPreset} from "@/server/cloudinary/policy";
import {isDeletionUnavailableStatus, isOpenReplacementStatus} from "@/server/images/lifecycle-errors";
import {resolveEntitlementUserIdForProject} from "@/server/organizations/access";
import {getOwnedProject} from "@/server/projects/queries";
import type {MetadataLanguage} from "@/server/projects/validation";

export type PublishEligibility = {
  project: Project;
  connection: CloudinaryConnection;
  image: Image;
  derivative: ImageDerivative | null;
  approvedMetadata: ImageMetadataApproved;
  sourceStorageKey: string;
  deliveryType: CloudinaryDeliveryType;
  transformationPresets: TransformationPreset[];
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
  derivativeId?: string | null;
  deliveryType: CloudinaryDeliveryType;
  transformationPresets: string[];
  language: MetadataLanguage;
}): Promise<PublishEligibility> {
  const transformationPresets = assertValidTransformationPresets(params.transformationPresets ?? []);

  const project = await getOwnedProject(params.userId, params.projectId, "cloudinary.publish");
  if (!project) {
    throw new CloudinaryError(
      "PROJECT_NOT_FOUND",
      "Project not found or you do not have permission to publish from it.",
    );
  }
  const {workspaceType, workspaceId} = resolveProjectWorkspace(project);

  const connection = await getConnectionRowForPublish(workspaceType, workspaceId, params.connectionId);
  if (connection.status === "disabled") {
    throw new CloudinaryError("CONNECTION_DISABLED", "This Cloudinary connection is disabled.");
  }
  if (connection.status === "disconnected") {
    throw new CloudinaryError("CONNECTION_DISCONNECTED", "This Cloudinary connection has been disconnected.");
  }
  if (connection.status !== "active" && connection.status !== "degraded") {
    throw new CloudinaryError(
      "CONNECTION_NOT_ACTIVE",
      "This Cloudinary connection is not active yet. Verify it before publishing.",
    );
  }
  if (params.deliveryType === "upload" && !connection.publicDeliveryAcknowledgedAt) {
    throw new CloudinaryError(
      "CLOUDINARY_DELIVERY_NOT_ACKNOWLEDGED",
      "Public (`upload`) delivery requires acknowledging the delivery risk on this connection first.",
    );
  }

  const db = getDb();
  const [image] = await db
    .select()
    .from(images)
    .where(and(eq(images.id, params.imageId), eq(images.projectId, project.id)))
    .limit(1);
  if (!image) {
    throw new CloudinaryError("IMAGE_NOT_FOUND", "Image not found.");
  }
  if (image.deletedAt || isDeletionUnavailableStatus(image.status)) {
    throw new CloudinaryError("IMAGE_NOT_ELIGIBLE", "This image is deleted or being deleted.");
  }

  const replacementRows = await db
    .select({status: imageReplacements.status})
    .from(imageReplacements)
    .where(eq(imageReplacements.imageId, image.id));
  if (replacementRows.some((row) => isOpenReplacementStatus(row.status))) {
    throw new CloudinaryError("IMAGE_NOT_ELIGIBLE", "This image has a replacement in progress.");
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
      throw new CloudinaryError("DERIVATIVE_NOT_FOUND", "Derivative not found.");
    }
    if (row.status !== "active" || row.sourceStorageKey !== image.storageKey) {
      throw new CloudinaryError(
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
    throw new CloudinaryError(
      "APPROVED_METADATA_NOT_FOUND",
      "No approved metadata exists for this image in the requested language.",
    );
  }
  if (approvedMetadata.sourceStorageKey !== image.storageKey) {
    throw new CloudinaryError(
      "APPROVED_METADATA_STALE",
      "Approved metadata is stale — the image has since been replaced. Re-approve metadata before publishing.",
    );
  }

  const entitlementUserId = await resolveEntitlementUserIdForProject(project);
  const entitlement = await resolveEntitlement(entitlementUserId);
  if (!entitlement.plan.cloudinaryEnabled) {
    throw new CloudinaryError("CLOUDINARY_NOT_ENABLED", "This plan does not include the Cloudinary integration.");
  }
  if (!entitlement.writesAllowed) {
    throw new CloudinaryError("SUBSCRIPTION_RESTRICTED", "Writes are currently restricted for this subscription.");
  }
  if (entitlement.plan.monthlyCloudinaryPublishLimit >= 0) {
    const used = await countUsageInPeriod(
      entitlementUserId,
      "cloudinary_publish",
      entitlement.periodStart,
      entitlement.periodEnd,
    );
    if (used >= entitlement.plan.monthlyCloudinaryPublishLimit) {
      throw new CloudinaryError(
        "CLOUDINARY_PUBLISH_LIMIT_REACHED",
        "Monthly Cloudinary publish limit reached for this plan.",
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
    deliveryType: params.deliveryType,
    transformationPresets,
    workspaceType,
    workspaceId,
  };
}
