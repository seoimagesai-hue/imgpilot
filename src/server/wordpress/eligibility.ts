/**
 * Prompt 26 — publish eligibility gate.
 * Centralizes every check that must pass before a WordPress publish job may
 * be created: permission, connection health, image lifecycle state, source
 * freshness, approved-metadata currency, and plan entitlement/quota.
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
  type WordpressConnection,
  type WordpressFilenameMode,
} from "@/db/schema";
import {countUsageInPeriod, resolveEntitlement} from "@/server/billing/entitlements";
import {isDeletionUnavailableStatus, isOpenReplacementStatus} from "@/server/images/lifecycle-errors";
import {resolveEntitlementUserIdForProject} from "@/server/organizations/access";
import {getOwnedProject} from "@/server/projects/queries";
import type {MetadataLanguage} from "@/server/projects/validation";
import {getConnectionRowForPublish} from "@/server/wordpress/connections";
import {WordPressError} from "@/server/wordpress/errors";

export type PublishEligibility = {
  project: Project;
  connection: WordpressConnection;
  image: Image;
  derivative: ImageDerivative | null;
  approvedMetadata: ImageMetadataApproved;
  sourceStorageKey: string;
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
  filenameMode: WordpressFilenameMode;
  language: MetadataLanguage;
}): Promise<PublishEligibility> {
  const project = await getOwnedProject(params.userId, params.projectId, "wordpress.publish");
  if (!project) {
    throw new WordPressError(
      "PROJECT_NOT_FOUND",
      "Project not found or you do not have permission to publish from it.",
    );
  }
  const {workspaceType, workspaceId} = resolveProjectWorkspace(project);

  const connection = await getConnectionRowForPublish(workspaceType, workspaceId, params.connectionId);
  if (connection.status === "disabled") {
    throw new WordPressError("CONNECTION_DISABLED", "This WordPress connection is disabled.");
  }
  if (connection.status === "disconnected") {
    throw new WordPressError("CONNECTION_DISCONNECTED", "This WordPress connection has been disconnected.");
  }
  if (connection.status !== "active" && connection.status !== "degraded") {
    throw new WordPressError(
      "CONNECTION_NOT_ACTIVE",
      "This WordPress connection is not active yet. Verify it before publishing.",
    );
  }

  const db = getDb();
  const [image] = await db
    .select()
    .from(images)
    .where(and(eq(images.id, params.imageId), eq(images.projectId, project.id)))
    .limit(1);
  if (!image) {
    throw new WordPressError("IMAGE_NOT_FOUND", "Image not found.");
  }
  if (image.deletedAt || isDeletionUnavailableStatus(image.status)) {
    throw new WordPressError("IMAGE_NOT_ELIGIBLE", "This image is deleted or being deleted.");
  }

  const replacementRows = await db
    .select({status: imageReplacements.status})
    .from(imageReplacements)
    .where(eq(imageReplacements.imageId, image.id));
  if (replacementRows.some((row) => isOpenReplacementStatus(row.status))) {
    throw new WordPressError("IMAGE_NOT_ELIGIBLE", "This image has a replacement in progress.");
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
      throw new WordPressError("DERIVATIVE_NOT_FOUND", "Derivative not found.");
    }
    if (row.status !== "active" || row.sourceStorageKey !== image.storageKey) {
      throw new WordPressError(
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
    throw new WordPressError(
      "APPROVED_METADATA_NOT_FOUND",
      "No approved metadata exists for this image in the requested language.",
    );
  }
  if (approvedMetadata.sourceStorageKey !== image.storageKey) {
    throw new WordPressError(
      "APPROVED_METADATA_STALE",
      "Approved metadata is stale — the image has since been replaced. Re-approve metadata before publishing.",
    );
  }

  const entitlementUserId = await resolveEntitlementUserIdForProject(project);
  const entitlement = await resolveEntitlement(entitlementUserId);
  if (!entitlement.plan.wordpressEnabled) {
    throw new WordPressError("WORDPRESS_NOT_ENABLED", "This plan does not include the WordPress integration.");
  }
  if (!entitlement.writesAllowed) {
    throw new WordPressError("SUBSCRIPTION_RESTRICTED", "Writes are currently restricted for this subscription.");
  }
  if (entitlement.plan.monthlyWordpressPublishLimit >= 0) {
    const used = await countUsageInPeriod(
      entitlementUserId,
      "wordpress_publish",
      entitlement.periodStart,
      entitlement.periodEnd,
    );
    if (used >= entitlement.plan.monthlyWordpressPublishLimit) {
      throw new WordPressError(
        "WORDPRESS_PUBLISH_LIMIT_REACHED",
        "Monthly WordPress publish limit reached for this plan.",
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
    workspaceType,
    workspaceId,
  };
}
