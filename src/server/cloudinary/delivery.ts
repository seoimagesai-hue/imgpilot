/**
 * Prompt 29 — safe delivery URL resolution for an already-published
 * Cloudinary asset. R2 remains the private source of truth; this module only
 * ever reads back a URL that Cloudinary itself will serve.
 * `upload` (public) delivery returns a plain delivery URL and requires the
 * connection's `publicDeliveryAcknowledgedAt` to be set; `signed` delivery
 * always computes a fresh, server-side-signed URL (never trusts a
 * previously-stored signature).
 */
import {and, eq} from "drizzle-orm";
import {getDb} from "@/db";
import {cloudinaryMediaMappings, type CloudinaryMediaMapping} from "@/db/schema";
import {decryptConnectionCredentials, getConnectionRowForPublish} from "@/server/cloudinary/connections";
import {CloudinaryError} from "@/server/cloudinary/errors";
import {requireViewCloudinary} from "@/server/cloudinary/permissions";
import {
  buildDeliveryUrl,
  buildSignedDeliveryUrl,
  isValidTransformationPreset,
  type TransformationPreset,
} from "@/server/cloudinary/policy";
import {getOwnedProject} from "@/server/projects/queries";

async function getOwnedMapping(userId: string, mappingId: string): Promise<CloudinaryMediaMapping> {
  const db = getDb();
  const [mapping] = await db
    .select()
    .from(cloudinaryMediaMappings)
    .where(eq(cloudinaryMediaMappings.id, mappingId))
    .limit(1);
  if (!mapping) {
    throw new CloudinaryError("MAPPING_NOT_FOUND", "Cloudinary media mapping not found.");
  }
  const project = await getOwnedProject(userId, mapping.projectId, "cloudinary.view");
  if (!project) {
    throw new CloudinaryError(
      "PROJECT_NOT_FOUND",
      "Project not found or you do not have permission to view this image's Cloudinary delivery.",
    );
  }
  await requireViewCloudinary(userId, mapping.workspaceType, mapping.workspaceId);
  return mapping;
}

export type SafeDeliveryUrlResult = {
  url: string;
  preset: TransformationPreset;
  deliveryType: "upload" | "signed";
};

/** Ownership-checked, safe delivery URL for one already-published Cloudinary asset. */
export async function getSafeDeliveryUrl(params: {
  userId: string;
  mappingId: string;
  preset: string;
}): Promise<SafeDeliveryUrlResult> {
  if (!isValidTransformationPreset(params.preset)) {
    throw new CloudinaryError("CLOUDINARY_TRANSFORMATION_INVALID", `Unknown transformation preset "${params.preset}".`);
  }
  const preset = params.preset;

  const mapping = await getOwnedMapping(params.userId, params.mappingId);
  if (mapping.publishStatus === "disconnected") {
    throw new CloudinaryError("CONNECTION_DISCONNECTED", "This Cloudinary connection has been disconnected.");
  }

  const connection = await getConnectionRowForPublish(mapping.workspaceType, mapping.workspaceId, mapping.connectionId);
  if (connection.status === "disconnected") {
    throw new CloudinaryError("CONNECTION_DISCONNECTED", "This Cloudinary connection has been disconnected.");
  }

  const credentials = await decryptConnectionCredentials(connection);

  if (mapping.deliveryType === "signed") {
    const url = buildSignedDeliveryUrl({
      cloudName: credentials.cloudName,
      publicId: mapping.remotePublicId,
      format: mapping.format,
      preset,
      apiSecret: credentials.apiSecret,
    });
    return {url, preset, deliveryType: "signed"};
  }

  if (!connection.publicDeliveryAcknowledgedAt) {
    throw new CloudinaryError(
      "CLOUDINARY_DELIVERY_NOT_ACKNOWLEDGED",
      "Public (`upload`) delivery requires acknowledging the delivery risk on this connection first.",
    );
  }
  const url = buildDeliveryUrl({
    cloudName: credentials.cloudName,
    publicId: mapping.remotePublicId,
    format: mapping.format,
    preset,
  });
  return {url, preset, deliveryType: "upload"};
}

/** List every published Cloudinary mapping for one image — used to render available delivery presets. */
export async function listMappingsForImage(params: {
  userId: string;
  projectId: string;
  imageId: string;
}): Promise<CloudinaryMediaMapping[]> {
  const project = await getOwnedProject(params.userId, params.projectId, "cloudinary.view");
  if (!project) {
    throw new CloudinaryError(
      "PROJECT_NOT_FOUND",
      "Project not found or you do not have permission to view it.",
    );
  }
  const db = getDb();
  return db
    .select()
    .from(cloudinaryMediaMappings)
    .where(
      and(
        eq(cloudinaryMediaMappings.imageId, params.imageId),
        eq(cloudinaryMediaMappings.projectId, project.id),
      ),
    );
}
