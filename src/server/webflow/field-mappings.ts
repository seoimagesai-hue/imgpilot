/**
 * Prompt 28 — Webflow CMS field mapping management.
 * A field mapping binds one Webflow connection + collection to the specific
 * CMS fields a publish job writes to: exactly one Image (or ImageRef) field
 * (required) plus optional PlainText/RichText fields for alt/title/caption/
 * description. Management is gated on `integrations.manage` (owner/admin) —
 * same as connection management (see `connections.ts`).
 * Mapping changes bump `mappingVersion`; publish jobs capture the mapping
 * version at creation time and re-validate it has not gone stale (deleted
 * mapping, or a field removed from the collection) before writing to Webflow.
 */
import {and, eq} from "drizzle-orm";
import {getDb} from "@/db";
import {
  webflowFieldMappings,
  type ApiWorkspaceType,
  type WebflowFieldMapping,
} from "@/db/schema";
import {writeIntegrationAudit} from "@/server/api/audit";
import {requireManageIntegrations} from "@/server/api/permissions";
import {getCollection, type WebflowCollectionField} from "@/server/webflow/client";
import {decryptConnectionCredentials, getConnectionRowForPublish} from "@/server/webflow/connections";
import {WebflowError} from "@/server/webflow/errors";
import {requireViewWebflow} from "@/server/webflow/permissions";

const IMAGE_FIELD_TYPES = new Set(["Image", "ImageRef"]);
const TEXT_FIELD_TYPES = new Set(["PlainText", "RichText"]);

export type WebflowFieldMappingSafeDto = WebflowFieldMapping;

function findField(fields: WebflowCollectionField[], fieldId: string): WebflowCollectionField | null {
  return fields.find((f) => f.id === fieldId) ?? null;
}

function validateTextField(
  fields: WebflowCollectionField[],
  fieldId: string | null | undefined,
  label: string,
): WebflowCollectionField | null {
  if (!fieldId) return null;
  const field = findField(fields, fieldId);
  if (!field) {
    throw new WebflowError("FIELD_MAPPING_INVALID", `${label} field was not found on this collection.`);
  }
  if (!TEXT_FIELD_TYPES.has(field.type)) {
    throw new WebflowError("FIELD_MAPPING_INVALID", `${label} field must be a PlainText or RichText field.`);
  }
  return field;
}

export type UpsertFieldMappingInput = {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  connectionId: string;
  collectionId: string;
  imageFieldId: string;
  altFieldId?: string | null;
  titleFieldId?: string | null;
  captionFieldId?: string | null;
  descriptionFieldId?: string | null;
};

/** Create or update the single field mapping for a connection+collection pair. Validates field types against Webflow's live schema. */
export async function upsertFieldMapping(input: UpsertFieldMappingInput): Promise<WebflowFieldMappingSafeDto> {
  await requireManageIntegrations(input.actorUserId, input.workspaceType, input.workspaceId);

  const collectionId = input.collectionId.trim();
  const imageFieldId = input.imageFieldId.trim();
  if (!collectionId) throw new WebflowError("INVALID_REQUEST", "collectionId is required.");
  if (!imageFieldId) throw new WebflowError("INVALID_REQUEST", "imageFieldId is required.");

  const connection = await getConnectionRowForPublish(input.workspaceType, input.workspaceId, input.connectionId);
  if (connection.status === "disconnected") {
    throw new WebflowError("CONNECTION_DISCONNECTED", "This Webflow connection has been disconnected.");
  }
  const {accessToken} = await decryptConnectionCredentials(connection);
  const collection = await getCollection(accessToken, collectionId);

  const imageField = findField(collection.fields, imageFieldId);
  if (!imageField) {
    throw new WebflowError("FIELD_MAPPING_INVALID", "Image field was not found on this collection.");
  }
  if (!IMAGE_FIELD_TYPES.has(imageField.type)) {
    throw new WebflowError("FIELD_MAPPING_INVALID", "Image field must be an Image (or ImageRef) field.");
  }
  const altField = validateTextField(collection.fields, input.altFieldId, "Alt text");
  const titleField = validateTextField(collection.fields, input.titleFieldId, "Title");
  const captionField = validateTextField(collection.fields, input.captionFieldId, "Caption");
  const descriptionField = validateTextField(collection.fields, input.descriptionFieldId, "Description");

  const db = getDb();
  const [existing] = await db
    .select()
    .from(webflowFieldMappings)
    .where(
      and(
        eq(webflowFieldMappings.connectionId, connection.id),
        eq(webflowFieldMappings.collectionId, collectionId),
      ),
    )
    .limit(1);

  const shared = {
    collectionNameSafe: collection.displayNameSafe || null,
    imageFieldId: imageField.id,
    imageFieldSlug: imageField.slug || null,
    altFieldId: altField?.id ?? null,
    altFieldSlug: altField?.slug ?? null,
    titleFieldId: titleField?.id ?? null,
    titleFieldSlug: titleField?.slug ?? null,
    captionFieldId: captionField?.id ?? null,
    captionFieldSlug: captionField?.slug ?? null,
    descriptionFieldId: descriptionField?.id ?? null,
    descriptionFieldSlug: descriptionField?.slug ?? null,
    staleAt: null,
    updatedAt: new Date(),
  };

  if (existing) {
    const [updated] = await db
      .update(webflowFieldMappings)
      .set({...shared, mappingVersion: existing.mappingVersion + 1})
      .where(eq(webflowFieldMappings.id, existing.id))
      .returning();
    if (!updated) throw new WebflowError("INTERNAL_ERROR", "Failed to update Webflow field mapping.");

    await writeIntegrationAudit({
      workspaceType: input.workspaceType,
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      action: "webflow_field_mapping.updated",
      targetEntityType: "webflow_field_mapping",
      targetEntityId: updated.id,
      afterSummary: `collectionId=${collectionId} version=${updated.mappingVersion}`,
    });
    return updated;
  }

  const [created] = await db
    .insert(webflowFieldMappings)
    .values({
      connectionId: connection.id,
      collectionId,
      mappingVersion: 1,
      createdByUserId: input.actorUserId,
      ...shared,
    })
    .returning();
  if (!created) throw new WebflowError("INTERNAL_ERROR", "Failed to create Webflow field mapping.");

  await writeIntegrationAudit({
    workspaceType: input.workspaceType,
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: "webflow_field_mapping.created",
    targetEntityType: "webflow_field_mapping",
    targetEntityId: created.id,
    afterSummary: `collectionId=${collectionId}`,
  });
  return created;
}

async function getWorkspaceMappingOrThrow(
  workspaceType: ApiWorkspaceType,
  workspaceId: string,
  mappingId: string,
): Promise<WebflowFieldMapping> {
  const db = getDb();
  const {webflowConnections} = await import("@/db/schema");
  const [row] = await db
    .select({mapping: webflowFieldMappings})
    .from(webflowFieldMappings)
    .innerJoin(webflowConnections, eq(webflowConnections.id, webflowFieldMappings.connectionId))
    .where(
      and(
        eq(webflowFieldMappings.id, mappingId),
        eq(webflowConnections.workspaceType, workspaceType),
        eq(webflowConnections.workspaceId, workspaceId),
      ),
    )
    .limit(1);
  if (!row) {
    throw new WebflowError("FIELD_MAPPING_NOT_FOUND", "Webflow field mapping not found.");
  }
  return row.mapping;
}

export async function getMapping(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  fieldMappingId: string;
}): Promise<WebflowFieldMappingSafeDto> {
  await requireViewWebflow(input.actorUserId, input.workspaceType, input.workspaceId);
  return getWorkspaceMappingOrThrow(input.workspaceType, input.workspaceId, input.fieldMappingId);
}

export async function listMappings(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  connectionId: string;
}): Promise<WebflowFieldMappingSafeDto[]> {
  await requireViewWebflow(input.actorUserId, input.workspaceType, input.workspaceId);
  await getConnectionRowForPublish(input.workspaceType, input.workspaceId, input.connectionId);
  const db = getDb();
  return db
    .select()
    .from(webflowFieldMappings)
    .where(eq(webflowFieldMappings.connectionId, input.connectionId))
    .orderBy(webflowFieldMappings.createdAt);
}

/** Mark a mapping stale (e.g. a mapped field was renamed/removed remotely) so new jobs fail fast until re-mapped. */
export async function markStale(mappingId: string): Promise<void> {
  const db = getDb();
  await db
    .update(webflowFieldMappings)
    .set({staleAt: new Date(), updatedAt: new Date()})
    .where(eq(webflowFieldMappings.id, mappingId));
}

/** Internal helper for eligibility/publish-service — loads a mapping by id without a permission check. */
export async function getMappingRowForPublish(fieldMappingId: string): Promise<WebflowFieldMapping> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(webflowFieldMappings)
    .where(eq(webflowFieldMappings.id, fieldMappingId))
    .limit(1);
  if (!row) {
    throw new WebflowError("FIELD_MAPPING_NOT_FOUND", "Webflow field mapping not found.");
  }
  return row;
}
