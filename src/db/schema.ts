import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type {AdapterAccountType} from "next-auth/adapters";
import {sql} from "drizzle-orm";

/**
 * Auth.js-compatible tables plus product project ownership and image uploads.
 */
export const userRoleEnum = pgEnum("user_role", ["user", "super_admin"]);
export const accountStatusEnum = pgEnum("account_status", ["active", "suspended"]);

export const users = pgTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: timestamp("email_verified", {mode: "date"}),
    image: text("image"),
    /** bcrypt hash for credentials accounts; null for OAuth-only users. */
    passwordHash: text("password_hash"),
    /** Prompt 22 — default user; never client-controlled. */
    role: userRoleEnum("role").notNull().default("user"),
    accountStatus: accountStatusEnum("account_status").notNull().default("active"),
    suspendedAt: timestamp("suspended_at", {mode: "date"}),
    suspendedBy: text("suspended_by"),
    suspensionReason: text("suspension_reason"),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    index("users_role_idx").on(table.role),
    index("users_account_status_idx").on(table.accountStatus),
  ],
);

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, {onDelete: "cascade"}),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, {onDelete: "cascade"}),
  expires: timestamp("expires", {mode: "date"}).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", {mode: "date"}).notNull(),
  },
  (verificationToken) => [
    primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  ],
);

export const authenticators = pgTable(
  "authenticators",
  {
    credentialID: text("credential_id").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, {onDelete: "cascade"}),
    providerAccountId: text("provider_account_id").notNull(),
    credentialPublicKey: text("credential_public_key").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credential_device_type").notNull(),
    credentialBackedUp: boolean("credential_backed_up").notNull(),
    transports: text("transports"),
  },
  (authenticator) => [
    primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  ],
);

export const projectStatusEnum = pgEnum("project_status", ["active", "archived"]);
export const metadataLanguageEnum = pgEnum("metadata_language", ["en", "ur"]);
export const workspaceTypeEnum = pgEnum("workspace_type", ["personal", "organization"]);
export const organizationStatusEnum = pgEnum("organization_status", [
  "active",
  "archived",
  "restricted",
]);
export const organizationMemberRoleEnum = pgEnum("organization_member_role", [
  "owner",
  "admin",
  "editor",
  "viewer",
]);
export const organizationMemberStatusEnum = pgEnum("organization_member_status", [
  "active",
  "removed",
]);
export const organizationInvitationStatusEnum = pgEnum("organization_invitation_status", [
  "pending",
  "accepted",
  "declined",
  "revoked",
  "expired",
]);
export const organizationInviteRoleEnum = pgEnum("organization_invite_role", [
  "admin",
  "editor",
  "viewer",
]);

/** Prompt 24 — organization workspaces (billing owner interim = Option B). */
export const organizations = pgTable(
  "organizations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    status: organizationStatusEnum("status").notNull().default("active"),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => users.id, {onDelete: "restrict"}),
    primaryOwnerUserId: text("primary_owner_user_id")
      .notNull()
      .references(() => users.id, {onDelete: "restrict"}),
    billingOwnerUserId: text("billing_owner_user_id")
      .notNull()
      .references(() => users.id, {onDelete: "restrict"}),
    billingOwnerAssignedAt: timestamp("billing_owner_assigned_at", {mode: "date"})
      .defaultNow()
      .notNull(),
    archivedAt: timestamp("archived_at", {mode: "date"}),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("organizations_slug_uidx").on(table.slug),
    index("organizations_status_idx").on(table.status),
    index("organizations_billing_owner_idx").on(table.billingOwnerUserId),
  ],
);

export const organizationMembers = pgTable(
  "organization_members",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, {onDelete: "cascade"}),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, {onDelete: "cascade"}),
    role: organizationMemberRoleEnum("role").notNull(),
    status: organizationMemberStatusEnum("status").notNull().default("active"),
    invitedByUserId: text("invited_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    joinedAt: timestamp("joined_at", {mode: "date"}).defaultNow().notNull(),
    removedAt: timestamp("removed_at", {mode: "date"}),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    index("organization_members_user_status_idx").on(table.userId, table.status),
    index("organization_members_org_status_idx").on(table.organizationId, table.status),
  ],
);

export const organizationInvitations = pgTable(
  "organization_invitations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, {onDelete: "cascade"}),
    emailNormalized: text("email_normalized").notNull(),
    role: organizationInviteRoleEnum("role").notNull(),
    tokenHash: text("token_hash").notNull(),
    status: organizationInvitationStatusEnum("status").notNull().default("pending"),
    invitedByUserId: text("invited_by_user_id")
      .notNull()
      .references(() => users.id, {onDelete: "restrict"}),
    expiresAt: timestamp("expires_at", {mode: "date"}).notNull(),
    acceptedAt: timestamp("accepted_at", {mode: "date"}),
    acceptedByUserId: text("accepted_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    revokedAt: timestamp("revoked_at", {mode: "date"}),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("organization_invitations_token_hash_uidx").on(table.tokenHash),
    index("organization_invitations_org_email_status_idx").on(
      table.organizationId,
      table.emailNormalized,
      table.status,
    ),
    index("organization_invitations_expires_idx").on(table.expiresAt),
  ],
);

export const organizationAuditLogs = pgTable(
  "organization_audit_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, {onDelete: "cascade"}),
    actorUserId: text("actor_user_id").references(() => users.id, {onDelete: "set null"}),
    action: text("action").notNull(),
    targetEntityType: text("target_entity_type").notNull(),
    targetEntityId: text("target_entity_id"),
    beforeSummary: text("before_summary"),
    afterSummary: text("after_summary"),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    index("organization_audit_logs_org_created_idx").on(table.organizationId, table.createdAt),
    index("organization_audit_logs_actor_created_idx").on(table.actorUserId, table.createdAt),
  ],
);

export const projects = pgTable(
  "projects",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    /** Personal owner OR original creator audit for org projects (not sole ACL). */
    userId: text("user_id")
      .notNull()
      .references(() => users.id, {onDelete: "cascade"}),
    workspaceType: workspaceTypeEnum("workspace_type").notNull().default("personal"),
    organizationId: text("organization_id").references(() => organizations.id, {
      onDelete: "restrict",
    }),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => users.id, {onDelete: "restrict"}),
    name: text("name").notNull(),
    websiteUrl: text("website_url"),
    description: text("description"),
    /** Future AI/filename output language — independent of UI locale. */
    metadataLanguage: metadataLanguageEnum("metadata_language").notNull().default("en"),
    status: projectStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
    archivedAt: timestamp("archived_at", {mode: "date"}),
  },
  (table) => [
    index("projects_user_id_idx").on(table.userId),
    index("projects_user_status_idx").on(table.userId, table.status),
    index("projects_user_updated_idx").on(table.userId, table.updatedAt),
    index("projects_organization_status_idx").on(table.organizationId, table.status),
    index("projects_workspace_user_idx").on(table.workspaceType, table.userId),
  ],
);

/**
 * Image upload lifecycle for Milestone 3 foundation.
 * Processing statuses belong to a later milestone.
 * Original object bytes are never stored in PostgreSQL and must never be mutated in place.
 */
export const imageStatusEnum = pgEnum("image_status", [
  "pending_upload",
  "uploaded",
  "upload_failed",
  "validating",
  "validated",
  "validation_failed",
  "ready_for_processing",
  "deletion_pending",
  "storage_deleting",
  "deletion_failed",
  "deleted",
]);

/** Replacement candidate lifecycle — separate from active image row. */
export const imageReplacementStatusEnum = pgEnum("image_replacement_status", [
  "pending",
  "uploading",
  "uploaded",
  "validating",
  "validated",
  "failed",
  "promotion_pending",
  "promoted",
  "old_storage_deleting",
  "complete",
  "old_storage_cleanup_failed",
  "cancelled",
  "cancel_cleanup_failed",
]);

/** Initial durable storage provider. */
export const storageProviderEnum = pgEnum("storage_provider", ["r2"]);

export const images = pgTable(
  "images",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, {onDelete: "cascade"}),
    /** User-facing name; never used as a storage path. */
    originalFilename: text("original_filename").notNull(),
    /** Server-generated unique object key. Required for persisted records. */
    storageKey: text("storage_key").notNull().unique(),
    storageProvider: storageProviderEnum("storage_provider").notNull().default("r2"),
    /** Declared MIME at authorize time — not binary proof. */
    mimeType: text("mime_type").notNull(),
    fileExtension: text("file_extension").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    /** Trusted encoded width from Sharp — not browser-authoritative. */
    width: integer("width"),
    /** Trusted encoded height from Sharp — not browser-authoritative. */
    height: integer("height"),
    status: imageStatusEnum("status").notNull().default("pending_upload"),
    failureCode: text("failure_code"),
    failureMessage: text("failure_message"),
    /** Staged upload expiry for pending_upload rows. */
    uploadExpiresAt: timestamp("upload_expires_at", {mode: "date"}),
    /** Set when HeadObject confirmation succeeds. */
    confirmedAt: timestamp("confirmed_at", {mode: "date"}),
    /** R2 ETag from HeadObject (not a content hash guarantee). */
    etag: text("etag"),
    /** Size reported by R2 HeadObject after confirmation. */
    storageSizeBytes: integer("storage_size_bytes"),
    /** Content-Type reported by R2 HeadObject after confirmation. */
    storageContentType: text("storage_content_type"),
    uploadedAt: timestamp("uploaded_at", {mode: "date"}),
    /** Sharp-detected format token (jpeg/png/webp/gif/avif). */
    detectedFormat: text("detected_format"),
    /** Trusted MIME derived from Sharp format. */
    detectedMimeType: text("detected_mime_type"),
    /** width * height (encoded), guarded against overflow. */
    pixelCount: integer("pixel_count"),
    isAnimated: boolean("is_animated"),
    frameCount: integer("frame_count"),
    /** Raw EXIF orientation 1–8 when present; never GPS/EXIF blob. */
    orientation: integer("orientation"),
    hasAlpha: boolean("has_alpha"),
    colourSpace: text("colour_space"),
    validatedAt: timestamp("validated_at", {mode: "date"}),
    validationVersion: text("validation_version"),
    validationAttempts: integer("validation_attempts").notNull().default(0),
    lastValidationAttemptAt: timestamp("last_validation_attempt_at", {mode: "date"}),
    /** Soft-delete / deletion saga timestamps and attempt counters. */
    deletionRequestedAt: timestamp("deletion_requested_at", {mode: "date"}),
    deletionStartedAt: timestamp("deletion_started_at", {mode: "date"}),
    storageDeletedAt: timestamp("storage_deleted_at", {mode: "date"}),
    deletionAttempts: integer("deletion_attempts").notNull().default(0),
    deletionFailureCode: text("deletion_failure_code"),
    deletedBy: text("deleted_by"),
    replacedAt: timestamp("replaced_at", {mode: "date"}),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", {mode: "date"}),
  },
  (table) => [
    index("images_project_id_idx").on(table.projectId),
    index("images_project_status_idx").on(table.projectId, table.status),
    index("images_project_created_idx").on(table.projectId, table.createdAt),
    index("images_upload_expires_at_idx").on(table.uploadExpiresAt),
    index("images_project_filename_idx").on(table.projectId, table.originalFilename),
    index("images_project_size_idx").on(table.projectId, table.sizeBytes),
    index("images_project_validated_at_idx").on(table.projectId, table.validatedAt),
    index("images_project_deleted_at_idx").on(table.projectId, table.deletedAt),
  ],
);

/**
 * Replacement candidates. Active image identity stays on `images.id`.
 * Candidate uses a new unique storage key; old key is cleaned after promotion.
 */
export const imageReplacements = pgTable(
  "image_replacements",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    imageId: text("image_id")
      .notNull()
      .references(() => images.id, {onDelete: "cascade"}),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, {onDelete: "cascade"}),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id, {onDelete: "cascade"}),
    status: imageReplacementStatusEnum("status").notNull().default("pending"),
    newStorageKey: text("new_storage_key").notNull().unique(),
    newOriginalFilename: text("new_original_filename").notNull(),
    newDeclaredMime: text("new_declared_mime").notNull(),
    newFileExtension: text("new_file_extension").notNull(),
    newDeclaredSizeBytes: integer("new_declared_size_bytes").notNull(),
    newDetectedMime: text("new_detected_mime"),
    newDetectedFormat: text("new_detected_format"),
    newByteSize: integer("new_byte_size"),
    newWidth: integer("new_width"),
    newHeight: integer("new_height"),
    newPixelCount: integer("new_pixel_count"),
    newFrameCount: integer("new_frame_count"),
    newAnimated: boolean("new_animated"),
    newOrientation: integer("new_orientation"),
    newHasAlpha: boolean("new_has_alpha"),
    newColourSpace: text("new_colour_space"),
    newEtag: text("new_etag"),
    newStorageContentType: text("new_storage_content_type"),
    uploadExpiresAt: timestamp("upload_expires_at", {mode: "date"}),
    uploadConfirmedAt: timestamp("upload_confirmed_at", {mode: "date"}),
    validatedAt: timestamp("validated_at", {mode: "date"}),
    validationVersion: text("validation_version"),
    validationAttempts: integer("validation_attempts").notNull().default(0),
    lastValidationAttemptAt: timestamp("last_validation_attempt_at", {mode: "date"}),
    promotionStartedAt: timestamp("promotion_started_at", {mode: "date"}),
    promotedAt: timestamp("promoted_at", {mode: "date"}),
    /** Captured at promotion — used only for post-commit old-object cleanup. */
    oldStorageKey: text("old_storage_key"),
    /** Trusted byte size of old object at promotion — for quota cleanup release. */
    oldByteSize: integer("old_byte_size"),
    oldStorageCleanupStartedAt: timestamp("old_storage_cleanup_started_at", {mode: "date"}),
    oldStorageDeletedAt: timestamp("old_storage_deleted_at", {mode: "date"}),
    failureCode: text("failure_code"),
    attemptCount: integer("attempt_count").notNull().default(0),
    cancelledAt: timestamp("cancelled_at", {mode: "date"}),
    candidateDeletedAt: timestamp("candidate_deleted_at", {mode: "date"}),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    index("image_replacements_image_id_idx").on(table.imageId),
    index("image_replacements_project_id_idx").on(table.projectId),
    index("image_replacements_status_idx").on(table.status),
    index("image_replacements_image_status_idx").on(table.imageId, table.status),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Image = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert;
export type ImageReplacement = typeof imageReplacements.$inferSelect;
export type NewImageReplacement = typeof imageReplacements.$inferInsert;

/** Quota reservation kind — new upload reserves a logical slot; replacement does not. */
export const quotaReservationKindEnum = pgEnum("quota_reservation_kind", [
  "new_upload",
  "replacement_upload",
]);

export const quotaReservationStatusEnum = pgEnum("quota_reservation_status", [
  "reserved",
  "consumed",
  "released",
  "expired",
  "cancelled",
]);

/**
 * Per-project quota counters — authoritative for enforcement when consistent.
 * Physical bytes release only after trusted R2 absence is verified.
 */
export const projectQuotaState = pgTable("project_quota_state", {
  projectId: text("project_id")
    .primaryKey()
    .references(() => projects.id, {onDelete: "cascade"}),
  activeImageCount: integer("active_image_count").notNull().default(0),
  reservedImageSlots: integer("reserved_image_slots").notNull().default(0),
  activeOriginalBytes: bigint("active_original_bytes", {mode: "number"}).notNull().default(0),
  reservedUploadBytes: bigint("reserved_upload_bytes", {mode: "number"}).notNull().default(0),
  replacementCandidateBytes: bigint("replacement_candidate_bytes", {mode: "number"})
    .notNull()
    .default(0),
  cleanupPendingBytes: bigint("cleanup_pending_bytes", {mode: "number"}).notNull().default(0),
  /** Completed + cleanup-pending derivative bytes (separate from original quota). */
  generatedOutputBytes: bigint("generated_output_bytes", {mode: "number"}).notNull().default(0),
  reservedGeneratedBytes: bigint("reserved_generated_bytes", {mode: "number"}).notNull().default(0),
  quotaVersion: integer("quota_version").notNull().default(0),
  lastReconciledAt: timestamp("last_reconciled_at", {mode: "date"}),
  inconsistencyFlag: boolean("inconsistency_flag").notNull().default(false),
  updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
});

export const quotaReservations = pgTable(
  "quota_reservations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, {onDelete: "cascade"}),
    /** May be set before the image row exists (authorize-before-insert). */
    imageId: text("image_id"),
    /** May be set before the replacement row exists. */
    replacementId: text("replacement_id"),
    kind: quotaReservationKindEnum("kind").notNull(),
    status: quotaReservationStatusEnum("status").notNull().default("reserved"),
    declaredBytes: bigint("declared_bytes", {mode: "number"}).notNull(),
    trustedConfirmedBytes: bigint("trusted_confirmed_bytes", {mode: "number"}),
    expiresAt: timestamp("expires_at", {mode: "date"}).notNull(),
    consumedAt: timestamp("consumed_at", {mode: "date"}),
    releasedAt: timestamp("released_at", {mode: "date"}),
    idempotencyKey: text("idempotency_key"),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    index("quota_reservations_project_id_idx").on(table.projectId),
    index("quota_reservations_status_idx").on(table.status),
    index("quota_reservations_expires_at_idx").on(table.expiresAt),
    uniqueIndex("quota_reservations_idempotency_key_idx")
      .on(table.idempotencyKey)
      .where(sql`${table.idempotencyKey} is not null`),
  ],
);

export type ProjectQuotaState = typeof projectQuotaState.$inferSelect;
export type NewProjectQuotaState = typeof projectQuotaState.$inferInsert;
export type QuotaReservation = typeof quotaReservations.$inferSelect;
export type NewQuotaReservation = typeof quotaReservations.$inferInsert;

/** Prompt 12 — single-image processing job lifecycle (no background queue). */
export const processingJobStatusEnum = pgEnum("processing_job_status", [
  "queued",
  "processing",
  "uploading_output",
  "verifying_output",
  "completed",
  "failed",
  "cancelled",
  "cleanup_pending",
  "cleanup_failed",
  "stale",
]);

export const processingOperationEnum = pgEnum("processing_operation", [
  "optimize_same_format",
  "resize",
  "convert_format",
  "generate_metadata",
]);

export const imageDerivativeStatusEnum = pgEnum("image_derivative_status", [
  "pending",
  "active",
  "stale",
  "cleanup_pending",
  "cleanup_failed",
  "deleted",
]);

export const imageDerivativeKindEnum = pgEnum("image_derivative_kind", [
  "optimized_same_format",
  "resized",
  "converted",
]);

export const processingJobs = pgTable(
  "processing_jobs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, {onDelete: "cascade"}),
    imageId: text("image_id")
      .notNull()
      .references(() => images.id, {onDelete: "cascade"}),
    createdBy: text("created_by").notNull(),
    operation: processingOperationEnum("operation").notNull().default("optimize_same_format"),
    /** Resize preset id (e.g. px_1024). Null for optimize_same_format. */
    preset: text("preset"),
    status: processingJobStatusEnum("status").notNull().default("queued"),
    sourceStorageKey: text("source_storage_key").notNull(),
    sourceByteSize: integer("source_byte_size").notNull(),
    sourceDetectedFormat: text("source_detected_format"),
    sourceMimeType: text("source_mime_type"),
    sourceWidth: integer("source_width"),
    sourceHeight: integer("source_height"),
    sourceEtag: text("source_etag"),
    outputStorageKey: text("output_storage_key"),
    outputByteSize: integer("output_byte_size"),
    outputDetectedFormat: text("output_detected_format"),
    outputMimeType: text("output_mime_type"),
    outputWidth: integer("output_width"),
    outputHeight: integer("output_height"),
    outputEtag: text("output_etag"),
    outputChecksum: text("output_checksum"),
    processingDurationMs: integer("processing_duration_ms"),
    attemptCount: integer("attempt_count").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    idempotencyKey: text("idempotency_key"),
    /** Prompt 16 — worker that currently holds the lease (null when queued). */
    leaseOwner: text("lease_owner"),
    leaseExpiresAt: timestamp("lease_expires_at", {mode: "date"}),
    heartbeatAt: timestamp("heartbeat_at", {mode: "date"}),
    startedAt: timestamp("started_at", {mode: "date"}),
    completedAt: timestamp("completed_at", {mode: "date"}),
    failedAt: timestamp("failed_at", {mode: "date"}),
    cancelledAt: timestamp("cancelled_at", {mode: "date"}),
    cleanupStartedAt: timestamp("cleanup_started_at", {mode: "date"}),
    cleanupCompletedAt: timestamp("cleanup_completed_at", {mode: "date"}),
    lastErrorCode: text("last_error_code"),
    lastErrorMessageSafe: text("last_error_message_safe"),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    index("processing_jobs_project_id_idx").on(table.projectId),
    index("processing_jobs_image_id_idx").on(table.imageId),
    index("processing_jobs_status_idx").on(table.status),
    index("processing_jobs_image_status_idx").on(table.imageId, table.status),
    index("processing_jobs_image_op_preset_status_idx").on(
      table.imageId,
      table.operation,
      table.preset,
      table.status,
    ),
    index("processing_jobs_queue_claim_idx").on(table.status, table.createdAt),
    index("processing_jobs_project_completed_at_idx").on(table.projectId, table.completedAt),
    index("processing_jobs_lease_expires_at_idx")
      .on(table.leaseExpiresAt)
      .where(sql`${table.leaseExpiresAt} is not null`),
    uniqueIndex("processing_jobs_idempotency_key_idx")
      .on(table.idempotencyKey)
      .where(sql`${table.idempotencyKey} is not null`),
  ],
);

export const imageDerivatives = pgTable(
  "image_derivatives",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, {onDelete: "cascade"}),
    imageId: text("image_id")
      .notNull()
      .references(() => images.id, {onDelete: "cascade"}),
    processingJobId: text("processing_job_id")
      .notNull()
      .references(() => processingJobs.id, {onDelete: "cascade"}),
    storageKey: text("storage_key").notNull().unique(),
    kind: imageDerivativeKindEnum("kind").notNull().default("optimized_same_format"),
    preset: text("preset"),
    format: text("format"),
    mimeType: text("mime_type"),
    byteSize: integer("byte_size"),
    width: integer("width"),
    height: integer("height"),
    etag: text("etag"),
    checksum: text("checksum"),
    status: imageDerivativeStatusEnum("status").notNull().default("pending"),
    sourceStorageKey: text("source_storage_key").notNull(),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", {mode: "date"}),
    updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    index("image_derivatives_project_id_idx").on(table.projectId),
    index("image_derivatives_image_id_idx").on(table.imageId),
    index("image_derivatives_job_id_idx").on(table.processingJobId),
    index("image_derivatives_status_idx").on(table.status),
    index("image_derivatives_project_created_at_idx").on(table.projectId, table.createdAt),
    index("image_derivatives_image_kind_preset_status_idx").on(
      table.imageId,
      table.kind,
      table.preset,
      table.status,
    ),
  ],
);

export type ProcessingJob = typeof processingJobs.$inferSelect;
export type NewProcessingJob = typeof processingJobs.$inferInsert;
export type ImageDerivative = typeof imageDerivatives.$inferSelect;
export type NewImageDerivative = typeof imageDerivatives.$inferInsert;

/** Prompt 16 — worker liveness / metrics (not exposed to browser). */
export const workerHeartbeats = pgTable("worker_heartbeats", {
  workerId: text("worker_id").primaryKey(),
  hostname: text("hostname"),
  startedAt: timestamp("started_at", {mode: "date"}).defaultNow().notNull(),
  lastHeartbeatAt: timestamp("last_heartbeat_at", {mode: "date"}).defaultNow().notNull(),
  status: text("status").notNull().default("running"),
  jobsClaimed: integer("jobs_claimed").notNull().default(0),
  jobsCompleted: integer("jobs_completed").notNull().default(0),
  jobsFailed: integer("jobs_failed").notNull().default(0),
  inFlight: integer("in_flight").notNull().default(0),
  updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
});

export type WorkerHeartbeat = typeof workerHeartbeats.$inferSelect;

/** Prompt 15 — synchronous bulk orchestration over single-image jobs. */
export const bulkJobStatusEnum = pgEnum("bulk_job_status", [
  "queued",
  "validating",
  "running",
  "completed",
  "partially_completed",
  "failed",
  "cancelled",
]);

export const bulkItemStatusEnum = pgEnum("bulk_item_status", [
  "pending",
  "skipped",
  "running",
  "completed",
  "failed",
  "cancelled",
  "stale",
]);

export const bulkJobs = pgTable(
  "bulk_jobs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, {onDelete: "cascade"}),
    createdBy: text("created_by").notNull(),
    operation: processingOperationEnum("operation").notNull(),
    preset: text("preset"),
    status: bulkJobStatusEnum("status").notNull().default("queued"),
    totalCount: integer("total_count").notNull().default(0),
    pendingCount: integer("pending_count").notNull().default(0),
    runningCount: integer("running_count").notNull().default(0),
    completedCount: integer("completed_count").notNull().default(0),
    failedCount: integer("failed_count").notNull().default(0),
    skippedCount: integer("skipped_count").notNull().default(0),
    cancelledCount: integer("cancelled_count").notNull().default(0),
    cancelRequested: boolean("cancel_requested").notNull().default(false),
    idempotencyKey: text("idempotency_key"),
    lastErrorCode: text("last_error_code"),
    startedAt: timestamp("started_at", {mode: "date"}),
    completedAt: timestamp("completed_at", {mode: "date"}),
    cancelledAt: timestamp("cancelled_at", {mode: "date"}),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    index("bulk_jobs_project_id_idx").on(table.projectId),
    index("bulk_jobs_status_idx").on(table.status),
    uniqueIndex("bulk_jobs_idempotency_key_idx")
      .on(table.idempotencyKey)
      .where(sql`${table.idempotencyKey} is not null`),
  ],
);

export const bulkJobItems = pgTable(
  "bulk_job_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    bulkJobId: text("bulk_job_id")
      .notNull()
      .references(() => bulkJobs.id, {onDelete: "cascade"}),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, {onDelete: "cascade"}),
    imageId: text("image_id")
      .notNull()
      .references(() => images.id, {onDelete: "cascade"}),
    processingJobId: text("processing_job_id"),
    status: bulkItemStatusEnum("status").notNull().default("pending"),
    skipReason: text("skip_reason"),
    lastErrorCode: text("last_error_code"),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    index("bulk_job_items_bulk_job_id_idx").on(table.bulkJobId),
    index("bulk_job_items_status_idx").on(table.status),
    index("bulk_job_items_image_id_idx").on(table.imageId),
  ],
);

export type BulkJob = typeof bulkJobs.$inferSelect;
export type NewBulkJob = typeof bulkJobs.$inferInsert;
export type BulkJobItem = typeof bulkJobItems.$inferSelect;
export type NewBulkJobItem = typeof bulkJobItems.$inferInsert;

/** Prompt 17 — AI metadata generation history + approval snapshots. */
export const metadataGenerationStatusEnum = pgEnum("metadata_generation_status", [
  "queued",
  "generating",
  "validating_output",
  "draft",
  "reviewed",
  "approved",
  "rejected",
  "failed",
  "cancelled",
  "stale",
]);

export const metadataGenerations = pgTable(
  "metadata_generations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, {onDelete: "cascade"}),
    imageId: text("image_id")
      .notNull()
      .references(() => images.id, {onDelete: "cascade"}),
    processingJobId: text("processing_job_id"),
    sourceStorageKey: text("source_storage_key").notNull(),
    language: metadataLanguageEnum("language").notNull(),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    promptVersion: text("prompt_version").notNull(),
    status: metadataGenerationStatusEnum("status").notNull().default("queued"),
    altText: text("alt_text"),
    title: text("title"),
    caption: text("caption"),
    description: text("description"),
    filenameSuggestion: text("filename_suggestion"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    attemptCount: integer("attempt_count").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    idempotencyKey: text("idempotency_key"),
    startedAt: timestamp("started_at", {mode: "date"}),
    generatedAt: timestamp("generated_at", {mode: "date"}),
    reviewedAt: timestamp("reviewed_at", {mode: "date"}),
    approvedAt: timestamp("approved_at", {mode: "date"}),
    rejectedAt: timestamp("rejected_at", {mode: "date"}),
    failedAt: timestamp("failed_at", {mode: "date"}),
    createdBy: text("created_by").notNull(),
    updatedBy: text("updated_by"),
    lastErrorCode: text("last_error_code"),
    lastErrorMessageSafe: text("last_error_message_safe"),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    index("metadata_generations_project_id_idx").on(table.projectId),
    index("metadata_generations_image_id_idx").on(table.imageId),
    index("metadata_generations_status_idx").on(table.status),
    index("metadata_generations_project_approved_at_idx").on(table.projectId, table.approvedAt),
    uniqueIndex("metadata_generations_idempotency_key_idx")
      .on(table.idempotencyKey)
      .where(sql`${table.idempotencyKey} is not null`),
  ],
);

export const imageMetadataApproved = pgTable(
  "image_metadata_approved",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, {onDelete: "cascade"}),
    imageId: text("image_id")
      .notNull()
      .references(() => images.id, {onDelete: "cascade"}),
    language: metadataLanguageEnum("language").notNull(),
    generationId: text("generation_id")
      .notNull()
      .references(() => metadataGenerations.id, {onDelete: "cascade"}),
    sourceStorageKey: text("source_storage_key").notNull(),
    altText: text("alt_text").notNull(),
    title: text("title").notNull(),
    caption: text("caption"),
    description: text("description").notNull(),
    filenameSuggestion: text("filename_suggestion").notNull(),
    approvedBy: text("approved_by").notNull(),
    approvedAt: timestamp("approved_at", {mode: "date"}).defaultNow().notNull(),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    index("image_metadata_approved_project_id_idx").on(table.projectId),
    uniqueIndex("image_metadata_approved_image_lang_idx").on(table.imageId, table.language),
  ],
);

export type MetadataGeneration = typeof metadataGenerations.$inferSelect;
export type ImageMetadataApproved = typeof imageMetadataApproved.$inferSelect;

export const exportJobStatusEnum = pgEnum("export_job_status", [
  "queued",
  "processing",
  "uploading",
  "completed",
  "failed",
  "cancelled",
  "expired",
  "cleanup_pending",
]);

export const exportPackageKindEnum = pgEnum("export_package_kind", [
  "csv",
  "json",
  "zip",
  "wordpress",
  "shopify",
  "webflow",
  "generic",
]);

export const exportSourceFilterEnum = pgEnum("export_source_filter", [
  "approved",
  "draft",
  "reviewed",
]);

export const exportJobs = pgTable(
  "export_jobs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, {onDelete: "cascade"}),
    createdBy: text("created_by").notNull(),
    packageKind: exportPackageKindEnum("package_kind").notNull().default("zip"),
    sourceFilter: exportSourceFilterEnum("source_filter").notNull().default("approved"),
    language: metadataLanguageEnum("language").notNull(),
    status: exportJobStatusEnum("status").notNull().default("queued"),
    includeImages: boolean("include_images").notNull().default(false),
    includeCsv: boolean("include_csv").notNull().default(true),
    includeJson: boolean("include_json").notNull().default(true),
    includeTxt: boolean("include_txt").notNull().default(true),
    includeHtmlReport: boolean("include_html_report").notNull().default(true),
    includeSidecars: boolean("include_sidecars").notNull().default(true),
    imageIdsJson: text("image_ids_json"),
    itemCount: integer("item_count").notNull().default(0),
    outputStorageKey: text("output_storage_key"),
    outputByteSize: integer("output_byte_size"),
    outputContentType: text("output_content_type"),
    outputEtag: text("output_etag"),
    outputChecksum: text("output_checksum"),
    downloadExpiresAt: timestamp("download_expires_at", {mode: "date"}),
    leaseOwner: text("lease_owner"),
    leaseExpiresAt: timestamp("lease_expires_at", {mode: "date"}),
    heartbeatAt: timestamp("heartbeat_at", {mode: "date"}),
    attemptCount: integer("attempt_count").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    idempotencyKey: text("idempotency_key"),
    startedAt: timestamp("started_at", {mode: "date"}),
    completedAt: timestamp("completed_at", {mode: "date"}),
    failedAt: timestamp("failed_at", {mode: "date"}),
    cancelledAt: timestamp("cancelled_at", {mode: "date"}),
    lastErrorCode: text("last_error_code"),
    lastErrorMessageSafe: text("last_error_message_safe"),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    index("export_jobs_project_id_idx").on(table.projectId),
    index("export_jobs_status_idx").on(table.status),
    index("export_jobs_queue_claim_idx").on(table.status, table.createdAt),
    index("export_jobs_project_completed_at_idx").on(table.projectId, table.completedAt),
    uniqueIndex("export_jobs_idempotency_key_idx")
      .on(table.idempotencyKey)
      .where(sql`${table.idempotencyKey} is not null`),
  ],
);

export type ExportJob = typeof exportJobs.$inferSelect;

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, {onDelete: "cascade"}),
    imageId: text("image_id"),
    eventType: text("event_type").notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    /** JSON string of safe fields only — never keys, URLs, or secrets. */
    safeMetadata: text("safe_metadata"),
    backfilled: boolean("backfilled").notNull().default(false),
    idempotencyKey: text("idempotency_key"),
    occurredAt: timestamp("occurred_at", {mode: "date"}).notNull(),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    index("analytics_events_project_occurred_idx").on(table.projectId, table.occurredAt),
    index("analytics_events_user_occurred_idx").on(table.userId, table.occurredAt),
    uniqueIndex("analytics_events_idempotency_key_idx")
      .on(table.idempotencyKey)
      .where(sql`${table.idempotencyKey} is not null`),
  ],
);

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;

/** Prompt 21 — one Stripe customer per user (billing owner). */
export const billingAccounts = pgTable("billing_accounts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, {onDelete: "cascade"}),
  stripeCustomerId: text("stripe_customer_id").unique(),
  createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
});

export const billingSubscriptions = pgTable(
  "billing_subscriptions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, {onDelete: "cascade"}),
    billingAccountId: text("billing_account_id")
      .notNull()
      .references(() => billingAccounts.id, {onDelete: "cascade"}),
    stripeSubscriptionId: text("stripe_subscription_id").unique(),
    stripePriceId: text("stripe_price_id"),
    stripeProductId: text("stripe_product_id"),
    planCode: text("plan_code").notNull().default("free"),
    status: text("status").notNull().default("inactive"),
    billingInterval: text("billing_interval"),
    currentPeriodStart: timestamp("current_period_start", {mode: "date"}),
    currentPeriodEnd: timestamp("current_period_end", {mode: "date"}),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    cancelAt: timestamp("cancel_at", {mode: "date"}),
    cancelledAt: timestamp("cancelled_at", {mode: "date"}),
    trialStart: timestamp("trial_start", {mode: "date"}),
    trialEnd: timestamp("trial_end", {mode: "date"}),
    endedAt: timestamp("ended_at", {mode: "date"}),
    latestInvoiceStatus: text("latest_invoice_status"),
    lastStripeEventCreatedAt: timestamp("last_stripe_event_created_at", {mode: "date"}),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    index("billing_subscriptions_user_id_idx").on(table.userId),
    index("billing_subscriptions_status_idx").on(table.status),
  ],
);

export const billingEntitlementSnapshots = pgTable("billing_entitlement_snapshots", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, {onDelete: "cascade"}),
  planCode: text("plan_code").notNull().default("free"),
  subscriptionStatus: text("subscription_status").notNull().default("inactive"),
  entitlementState: text("entitlement_state").notNull().default("enabled"),
  billingInterval: text("billing_interval"),
  periodStart: timestamp("period_start", {mode: "date"}),
  periodEnd: timestamp("period_end", {mode: "date"}),
  trialEnd: timestamp("trial_end", {mode: "date"}),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  gracePeriodEndsAt: timestamp("grace_period_ends_at", {mode: "date"}),
  maxProjects: integer("max_projects").notNull(),
  maxImagesPerProject: integer("max_images_per_project").notNull(),
  maxOriginalStorageBytes: bigint("max_original_storage_bytes", {mode: "number"}).notNull(),
  maxGeneratedStorageBytes: bigint("max_generated_storage_bytes", {mode: "number"}).notNull(),
  monthlyProcessingLimit: integer("monthly_processing_limit").notNull(),
  monthlyAiLimit: integer("monthly_ai_limit").notNull(),
  monthlyExportLimit: integer("monthly_export_limit").notNull(),
  bulkProcessingEnabled: boolean("bulk_processing_enabled").notNull().default(true),
  aiMetadataEnabled: boolean("ai_metadata_enabled").notNull().default(true),
  exportEnabled: boolean("export_enabled").notNull().default(true),
  cmsExportEnabled: boolean("cms_export_enabled").notNull().default(false),
  version: integer("version").notNull().default(1),
  calculatedAt: timestamp("calculated_at", {mode: "date"}).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
});

export const stripeEvents = pgTable(
  "stripe_events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    stripeEventId: text("stripe_event_id").notNull().unique(),
    eventType: text("event_type").notNull(),
    eventCreatedAt: timestamp("event_created_at", {mode: "date"}).notNull(),
    livemode: boolean("livemode").notNull().default(false),
    processingStatus: text("processing_status").notNull().default("pending"),
    attemptCount: integer("attempt_count").notNull().default(0),
    processedAt: timestamp("processed_at", {mode: "date"}),
    failureCode: text("failure_code"),
    failureMessageSafe: text("failure_message_safe"),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [index("stripe_events_status_idx").on(table.processingStatus)],
);

export const billingUsageLedger = pgTable(
  "billing_usage_ledger",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, {onDelete: "cascade"}),
    projectId: text("project_id"),
    category: text("category").notNull(),
    entityId: text("entity_id"),
    idempotencyKey: text("idempotency_key").notNull(),
    periodStart: timestamp("period_start", {mode: "date"}).notNull(),
    periodEnd: timestamp("period_end", {mode: "date"}).notNull(),
    quantity: integer("quantity").notNull().default(1),
    status: text("status").notNull().default("recorded"),
    recordedAt: timestamp("recorded_at", {mode: "date"}).defaultNow().notNull(),
    reversedAt: timestamp("reversed_at", {mode: "date"}),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("billing_usage_ledger_idempotency_key_idx").on(table.idempotencyKey),
    index("billing_usage_ledger_user_period_category_idx").on(
      table.userId,
      table.periodStart,
      table.category,
    ),
  ],
);

export type BillingAccount = typeof billingAccounts.$inferSelect;
export type BillingSubscription = typeof billingSubscriptions.$inferSelect;
export type BillingEntitlementSnapshot = typeof billingEntitlementSnapshots.$inferSelect;
export type StripeEventRow = typeof stripeEvents.$inferSelect;
export type BillingUsageLedgerRow = typeof billingUsageLedger.$inferSelect;

/** Prompt 22 — append-only admin audit (no secrets). */
export const adminAuditLogs = pgTable(
  "admin_audit_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    adminUserId: text("admin_user_id")
      .notNull()
      .references(() => users.id, {onDelete: "restrict"}),
    action: text("action").notNull(),
    targetEntityType: text("target_entity_type").notNull(),
    targetEntityId: text("target_entity_id"),
    reason: text("reason"),
    beforeSummary: text("before_summary"),
    afterSummary: text("after_summary"),
    correlationId: text("correlation_id"),
    requestMetaSafe: text("request_meta_safe"),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    index("admin_audit_logs_admin_created_idx").on(table.adminUserId, table.createdAt),
    index("admin_audit_logs_target_created_idx").on(
      table.targetEntityType,
      table.targetEntityId,
      table.createdAt,
    ),
    index("admin_audit_logs_created_idx").on(table.createdAt),
  ],
);

/** Prompt 22 — admin-only support notes (not shown to users). */
export const adminSupportNotes = pgTable(
  "admin_support_notes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    adminUserId: text("admin_user_id")
      .notNull()
      .references(() => users.id, {onDelete: "restrict"}),
    targetEntityType: text("target_entity_type").notNull(),
    targetEntityId: text("target_entity_id").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    index("admin_support_notes_target_created_idx").on(
      table.targetEntityType,
      table.targetEntityId,
      table.createdAt,
    ),
  ],
);

export type AdminAuditLog = typeof adminAuditLogs.$inferSelect;
export type AdminSupportNote = typeof adminSupportNotes.$inferSelect;
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type AccountStatus = (typeof accountStatusEnum.enumValues)[number];
export type Organization = typeof organizations.$inferSelect;
export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type OrganizationInvitation = typeof organizationInvitations.$inferSelect;
export type OrganizationAuditLog = typeof organizationAuditLogs.$inferSelect;
export type WorkspaceType = (typeof workspaceTypeEnum.enumValues)[number];
export type OrganizationMemberRole = (typeof organizationMemberRoleEnum.enumValues)[number];
export type OrganizationInviteRole = (typeof organizationInviteRoleEnum.enumValues)[number];

/** Prompt 25 — public API keys & outbound webhooks. */
export const apiKeyStatusEnum = pgEnum("api_key_status", [
  "active",
  "revoked",
  "expired",
  "rotated",
]);
export const apiWorkspaceTypeEnum = pgEnum("api_workspace_type", ["personal", "organization"]);
export const webhookEndpointStatusEnum = pgEnum("webhook_endpoint_status", [
  "pending_verification",
  "active",
  "failing",
  "disabled",
  "deleted",
]);
export const webhookDeliveryStatusEnum = pgEnum("webhook_delivery_status", [
  "queued",
  "delivering",
  "succeeded",
  "failed",
  "retry_scheduled",
  "exhausted",
  "cancelled",
]);

export const apiKeys = pgTable(
  "api_keys",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workspaceType: apiWorkspaceTypeEnum("workspace_type").notNull(),
    workspaceId: text("workspace_id").notNull(),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => users.id, {onDelete: "restrict"}),
    name: text("name").notNull(),
    environment: text("environment").notNull(),
    publicPrefix: text("public_prefix").notNull(),
    secretHash: text("secret_hash").notNull(),
    scopes: jsonb("scopes").$type<string[]>().notNull(),
    status: apiKeyStatusEnum("status").notNull().default("active"),
    expiresAt: timestamp("expires_at", {mode: "date"}),
    lastUsedAt: timestamp("last_used_at", {mode: "date"}),
    lastUsedIpHash: text("last_used_ip_hash"),
    lastUsedUserAgentSummary: text("last_used_user_agent_summary"),
    requestCount: integer("request_count").notNull().default(0),
    revokedAt: timestamp("revoked_at", {mode: "date"}),
    revokedByUserId: text("revoked_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    rotatedFromKeyId: text("rotated_from_key_id"),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("api_keys_public_prefix_uidx").on(table.publicPrefix),
    index("api_keys_workspace_status_idx").on(
      table.workspaceType,
      table.workspaceId,
      table.status,
    ),
    index("api_keys_created_by_idx").on(table.createdByUserId),
  ],
);

export const apiIdempotencyRecords = pgTable(
  "api_idempotency_records",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    apiKeyId: text("api_key_id")
      .notNull()
      .references(() => apiKeys.id, {onDelete: "cascade"}),
    workspaceType: apiWorkspaceTypeEnum("workspace_type").notNull(),
    workspaceId: text("workspace_id").notNull(),
    routeKey: text("route_key").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    requestFingerprint: text("request_fingerprint").notNull(),
    responseStatus: integer("response_status").notNull(),
    responseBody: jsonb("response_body").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", {mode: "date"}).notNull(),
  },
  (table) => [
    uniqueIndex("api_idempotency_uidx").on(
      table.apiKeyId,
      table.routeKey,
      table.idempotencyKey,
    ),
    index("api_idempotency_expires_idx").on(table.expiresAt),
  ],
);

export const apiRateLimitBuckets = pgTable(
  "api_rate_limit_buckets",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    bucketKey: text("bucket_key").notNull(),
    windowStartedAt: timestamp("window_started_at", {mode: "date"}).notNull(),
    count: integer("count").notNull().default(0),
    updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("api_rate_limit_buckets_key_uidx").on(table.bucketKey)],
);

export const apiUsageCounters = pgTable(
  "api_usage_counters",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workspaceType: apiWorkspaceTypeEnum("workspace_type").notNull(),
    workspaceId: text("workspace_id").notNull(),
    apiKeyId: text("api_key_id"),
    periodYyyyMm: text("period_yyyy_mm").notNull(),
    category: text("category").notNull(),
    quantity: integer("quantity").notNull().default(0),
    updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("api_usage_counters_uidx").on(
      table.workspaceType,
      table.workspaceId,
      table.apiKeyId,
      table.periodYyyyMm,
      table.category,
    ),
  ],
);

export const webhookEndpoints = pgTable(
  "webhook_endpoints",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workspaceType: apiWorkspaceTypeEnum("workspace_type").notNull(),
    workspaceId: text("workspace_id").notNull(),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => users.id, {onDelete: "restrict"}),
    name: text("name").notNull(),
    url: text("url").notNull(),
    status: webhookEndpointStatusEnum("status").notNull().default("pending_verification"),
    secretCiphertext: text("secret_ciphertext").notNull(),
    secretNonce: text("secret_nonce").notNull(),
    subscribedEvents: jsonb("subscribed_events").$type<string[]>().notNull(),
    verificationTokenHash: text("verification_token_hash"),
    verifiedAt: timestamp("verified_at", {mode: "date"}),
    disabledAt: timestamp("disabled_at", {mode: "date"}),
    deletedAt: timestamp("deleted_at", {mode: "date"}),
    consecutiveFailures: integer("consecutive_failures").notNull().default(0),
    lastDeliveryAt: timestamp("last_delivery_at", {mode: "date"}),
    lastDeliveryStatus: text("last_delivery_status"),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    index("webhook_endpoints_workspace_status_idx").on(
      table.workspaceType,
      table.workspaceId,
      table.status,
    ),
  ],
);

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workspaceType: apiWorkspaceTypeEnum("workspace_type").notNull(),
    workspaceId: text("workspace_id").notNull(),
    eventType: text("event_type").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    eventVersion: text("event_version").notNull().default("1"),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    occurredAt: timestamp("occurred_at", {mode: "date"}).notNull(),
    deduplicationKey: text("deduplication_key").notNull(),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("webhook_events_dedupe_uidx").on(
      table.workspaceType,
      table.workspaceId,
      table.deduplicationKey,
    ),
    index("webhook_events_workspace_created_idx").on(
      table.workspaceType,
      table.workspaceId,
      table.createdAt,
    ),
  ],
);

export const webhookDeliveries = pgTable(
  "webhook_deliveries",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    webhookEventId: text("webhook_event_id")
      .notNull()
      .references(() => webhookEvents.id, {onDelete: "cascade"}),
    endpointId: text("endpoint_id")
      .notNull()
      .references(() => webhookEndpoints.id, {onDelete: "cascade"}),
    attemptNumber: integer("attempt_number").notNull().default(1),
    status: webhookDeliveryStatusEnum("status").notNull().default("queued"),
    scheduledAt: timestamp("scheduled_at", {mode: "date"}).defaultNow().notNull(),
    startedAt: timestamp("started_at", {mode: "date"}),
    completedAt: timestamp("completed_at", {mode: "date"}),
    responseStatus: integer("response_status"),
    responseDurationMs: integer("response_duration_ms"),
    safeFailureCode: text("safe_failure_code"),
    nextAttemptAt: timestamp("next_attempt_at", {mode: "date"}),
    leaseOwner: text("lease_owner"),
    leaseExpiresAt: timestamp("lease_expires_at", {mode: "date"}),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    index("webhook_deliveries_claim_idx").on(table.status, table.scheduledAt),
    index("webhook_deliveries_endpoint_created_idx").on(table.endpointId, table.createdAt),
    index("webhook_deliveries_event_idx").on(table.webhookEventId),
  ],
);

export const integrationAuditLogs = pgTable(
  "integration_audit_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workspaceType: apiWorkspaceTypeEnum("workspace_type").notNull(),
    workspaceId: text("workspace_id").notNull(),
    actorUserId: text("actor_user_id"),
    action: text("action").notNull(),
    targetEntityType: text("target_entity_type").notNull(),
    targetEntityId: text("target_entity_id"),
    beforeSummary: text("before_summary"),
    afterSummary: text("after_summary"),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    index("integration_audit_workspace_created_idx").on(
      table.workspaceType,
      table.workspaceId,
      table.createdAt,
    ),
  ],
);

export type ApiKey = typeof apiKeys.$inferSelect;
export type ApiIdempotencyRecord = typeof apiIdempotencyRecords.$inferSelect;
export type WebhookEndpoint = typeof webhookEndpoints.$inferSelect;
export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type IntegrationAuditLog = typeof integrationAuditLogs.$inferSelect;
export type ApiKeyStatus = (typeof apiKeyStatusEnum.enumValues)[number];
export type ApiWorkspaceType = (typeof apiWorkspaceTypeEnum.enumValues)[number];
export type WebhookEndpointStatus = (typeof webhookEndpointStatusEnum.enumValues)[number];
export type WebhookDeliveryStatus = (typeof webhookDeliveryStatusEnum.enumValues)[number];

/**
 * Prompt 26 — WordPress (self-hosted, Application Passwords) integration.
 * Credentials are always stored as AES-GCM ciphertext/nonce pairs (see
 * `src/server/wordpress/crypto.ts`) and never as plaintext columns.
 */
export const wordpressConnectionStatusEnum = pgEnum("wordpress_connection_status", [
  "pending",
  "verifying",
  "active",
  "degraded",
  "authentication_failed",
  "permission_failed",
  "unreachable",
  "disabled",
  "disconnected",
]);

export const wordpressPublishSourceTypeEnum = pgEnum("wordpress_publish_source_type", [
  "derivative",
  "original",
]);

export const wordpressFilenameModeEnum = pgEnum("wordpress_filename_mode", ["keep", "suggestion"]);

export const wordpressPublishJobStatusEnum = pgEnum("wordpress_publish_job_status", [
  "queued",
  "leased",
  "validating",
  "uploading_media",
  "updating_metadata",
  "verifying_remote",
  "completed",
  "partially_completed",
  "failed",
  "cancelled",
  "stale",
]);

export const wordpressMediaPublishStatusEnum = pgEnum("wordpress_media_publish_status", [
  "active",
  "stale",
  "disconnected",
]);

export const wordpressBulkJobStatusEnum = pgEnum("wordpress_bulk_job_status", [
  "queued",
  "running",
  "completed",
  "partially_completed",
  "failed",
  "cancelled",
]);

export const wordpressConnections = pgTable(
  "wordpress_connections",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workspaceType: apiWorkspaceTypeEnum("workspace_type").notNull(),
    workspaceId: text("workspace_id").notNull(),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => users.id, {onDelete: "restrict"}),
    name: text("name").notNull(),
    siteUrlNormalized: text("site_url_normalized").notNull(),
    siteHost: text("site_host").notNull(),
    status: wordpressConnectionStatusEnum("status").notNull().default("pending"),
    /** AES-256-GCM ciphertext — never the plaintext Application Password / username. */
    usernameCiphertext: text("username_ciphertext").notNull(),
    usernameNonce: text("username_nonce").notNull(),
    applicationPasswordCiphertext: text("application_password_ciphertext").notNull(),
    applicationPasswordNonce: text("application_password_nonce").notNull(),
    credentialVersion: integer("credential_version").notNull().default(1),
    wordpressUserId: text("wordpress_user_id"),
    /** Display name only — never emails or other PII beyond what WP itself exposes publicly. */
    wordpressUserDisplayNameSafe: text("wordpress_user_display_name_safe"),
    wordpressVersion: text("wordpress_version"),
    siteTitle: text("site_title"),
    capabilities: jsonb("capabilities").$type<Record<string, unknown>>(),
    lastVerifiedAt: timestamp("last_verified_at", {mode: "date"}),
    lastSuccessAt: timestamp("last_success_at", {mode: "date"}),
    lastFailureAt: timestamp("last_failure_at", {mode: "date"}),
    lastFailureCode: text("last_failure_code"),
    consecutiveFailureCount: integer("consecutive_failure_count").notNull().default(0),
    disabledAt: timestamp("disabled_at", {mode: "date"}),
    disconnectedAt: timestamp("disconnected_at", {mode: "date"}),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    index("wordpress_connections_workspace_status_idx").on(
      table.workspaceType,
      table.workspaceId,
      table.status,
    ),
    index("wordpress_connections_site_host_idx").on(table.siteHost),
  ],
);

export const wordpressBulkJobs = pgTable(
  "wordpress_bulk_jobs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workspaceType: apiWorkspaceTypeEnum("workspace_type").notNull(),
    workspaceId: text("workspace_id").notNull(),
    connectionId: text("connection_id")
      .notNull()
      .references(() => wordpressConnections.id, {onDelete: "cascade"}),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, {onDelete: "cascade"}),
    status: wordpressBulkJobStatusEnum("status").notNull().default("queued"),
    totalCount: integer("total_count").notNull().default(0),
    pendingCount: integer("pending_count").notNull().default(0),
    runningCount: integer("running_count").notNull().default(0),
    completedCount: integer("completed_count").notNull().default(0),
    failedCount: integer("failed_count").notNull().default(0),
    cancelledCount: integer("cancelled_count").notNull().default(0),
    cancelRequested: boolean("cancel_requested").notNull().default(false),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => users.id, {onDelete: "restrict"}),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    index("wordpress_bulk_jobs_connection_idx").on(table.connectionId),
    index("wordpress_bulk_jobs_project_idx").on(table.projectId),
    index("wordpress_bulk_jobs_status_idx").on(table.status),
  ],
);

export const wordpressPublishJobs = pgTable(
  "wordpress_publish_jobs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workspaceType: apiWorkspaceTypeEnum("workspace_type").notNull(),
    workspaceId: text("workspace_id").notNull(),
    connectionId: text("connection_id")
      .notNull()
      .references(() => wordpressConnections.id, {onDelete: "cascade"}),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, {onDelete: "cascade"}),
    imageId: text("image_id")
      .notNull()
      .references(() => images.id, {onDelete: "cascade"}),
    sourceType: wordpressPublishSourceTypeEnum("source_type").notNull().default("derivative"),
    /** Set only when sourceType = derivative; no FK — derivative rows may be cleaned up independently. */
    derivativeId: text("derivative_id"),
    sourceStorageKey: text("source_storage_key").notNull(),
    /** Same value as sourceStorageKey at job creation — kept distinct for future revision tracking. */
    sourceRevisionKey: text("source_revision_key").notNull(),
    metadataApprovalId: text("metadata_approval_id").notNull(),
    metadataLanguage: metadataLanguageEnum("metadata_language").notNull(),
    filenameMode: wordpressFilenameModeEnum("filename_mode").notNull().default("keep"),
    requestedFilename: text("requested_filename").notNull(),
    status: wordpressPublishJobStatusEnum("status").notNull().default("queued"),
    remoteMediaId: text("remote_media_id"),
    attemptCount: integer("attempt_count").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(5),
    idempotencyKey: text("idempotency_key"),
    bulkParentId: text("bulk_parent_id").references(() => wordpressBulkJobs.id, {
      onDelete: "set null",
    }),
    lastErrorCode: text("last_error_code"),
    leaseOwner: text("lease_owner"),
    leaseExpiresAt: timestamp("lease_expires_at", {mode: "date"}),
    startedAt: timestamp("started_at", {mode: "date"}),
    completedAt: timestamp("completed_at", {mode: "date"}),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    index("wordpress_publish_jobs_claim_idx").on(table.status, table.createdAt),
    index("wordpress_publish_jobs_connection_idx").on(table.connectionId),
    index("wordpress_publish_jobs_project_idx").on(table.projectId),
    index("wordpress_publish_jobs_image_idx").on(table.imageId),
    index("wordpress_publish_jobs_bulk_parent_idx").on(table.bulkParentId),
    index("wordpress_publish_jobs_lease_expires_at_idx")
      .on(table.leaseExpiresAt)
      .where(sql`${table.leaseExpiresAt} is not null`),
    uniqueIndex("wordpress_publish_jobs_idempotency_key_idx")
      .on(table.idempotencyKey)
      .where(sql`${table.idempotencyKey} is not null`),
  ],
);

export const wordpressMediaMappings = pgTable(
  "wordpress_media_mappings",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workspaceType: apiWorkspaceTypeEnum("workspace_type").notNull(),
    workspaceId: text("workspace_id").notNull(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, {onDelete: "cascade"}),
    imageId: text("image_id")
      .notNull()
      .references(() => images.id, {onDelete: "cascade"}),
    connectionId: text("connection_id")
      .notNull()
      .references(() => wordpressConnections.id, {onDelete: "cascade"}),
    publishJobId: text("publish_job_id").references(() => wordpressPublishJobs.id, {
      onDelete: "set null",
    }),
    sourceStorageKey: text("source_storage_key").notNull(),
    derivativeId: text("derivative_id"),
    metadataApprovalId: text("metadata_approval_id").notNull(),
    remoteMediaId: text("remote_media_id").notNull(),
    remoteMediaUrlSafe: text("remote_media_url_safe").notNull(),
    remoteFilename: text("remote_filename").notNull(),
    remoteMimeType: text("remote_mime_type").notNull(),
    remoteWidth: integer("remote_width"),
    remoteHeight: integer("remote_height"),
    publishStatus: wordpressMediaPublishStatusEnum("publish_status").notNull().default("active"),
    publishedAt: timestamp("published_at", {mode: "date"}).defaultNow().notNull(),
    lastVerifiedAt: timestamp("last_verified_at", {mode: "date"}),
    staleAt: timestamp("stale_at", {mode: "date"}),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    index("wordpress_media_mappings_project_idx").on(table.projectId),
    index("wordpress_media_mappings_image_idx").on(table.imageId),
    index("wordpress_media_mappings_connection_idx").on(table.connectionId),
    index("wordpress_media_mappings_publish_job_idx").on(table.publishJobId),
    uniqueIndex("wordpress_media_mappings_identity_uidx").on(
      table.connectionId,
      table.imageId,
      table.sourceStorageKey,
      sql`coalesce(${table.derivativeId}, 'original')`,
      table.metadataApprovalId,
    ),
  ],
);

export type WordpressConnection = typeof wordpressConnections.$inferSelect;
export type NewWordpressConnection = typeof wordpressConnections.$inferInsert;
export type WordpressBulkJob = typeof wordpressBulkJobs.$inferSelect;
export type WordpressPublishJob = typeof wordpressPublishJobs.$inferSelect;
export type NewWordpressPublishJob = typeof wordpressPublishJobs.$inferInsert;
export type WordpressMediaMapping = typeof wordpressMediaMappings.$inferSelect;
export type NewWordpressMediaMapping = typeof wordpressMediaMappings.$inferInsert;
export type WordpressConnectionStatus = (typeof wordpressConnectionStatusEnum.enumValues)[number];
export type WordpressPublishJobStatus = (typeof wordpressPublishJobStatusEnum.enumValues)[number];
export type WordpressFilenameMode = (typeof wordpressFilenameModeEnum.enumValues)[number];
export type WordpressPublishSourceType = (typeof wordpressPublishSourceTypeEnum.enumValues)[number];
export type WordpressMediaPublishStatus = (typeof wordpressMediaPublishStatusEnum.enumValues)[number];
export type WordpressBulkJobStatus = (typeof wordpressBulkJobStatusEnum.enumValues)[number];

/**
 * Prompt 27 — Shopify (Custom App Admin API access token) integration.
 * Access tokens are always stored as AES-256-GCM ciphertext/nonce pairs (see
 * `src/server/wordpress/crypto.ts`, reused as-is) and never as plaintext columns.
 * Publish targets EXISTING products only via the REST product images API — this
 * integration never creates products/variants and never touches orders/inventory.
 */
export const shopifyConnectionStatusEnum = pgEnum("shopify_connection_status", [
  "pending",
  "verifying",
  "active",
  "degraded",
  "authentication_failed",
  "permission_failed",
  "unreachable",
  "disabled",
  "disconnected",
]);

export const shopifyPublishSourceTypeEnum = pgEnum("shopify_publish_source_type", [
  "derivative",
  "original",
]);

export const shopifyFilenameModeEnum = pgEnum("shopify_filename_mode", ["keep", "suggestion"]);

export const shopifyPublishJobStatusEnum = pgEnum("shopify_publish_job_status", [
  "queued",
  "leased",
  "validating",
  "uploading_media",
  "updating_metadata",
  "verifying_remote",
  "completed",
  "partially_completed",
  "failed",
  "cancelled",
  "stale",
]);

export const shopifyMediaPublishStatusEnum = pgEnum("shopify_media_publish_status", [
  "active",
  "stale",
  "disconnected",
]);

export const shopifyBulkJobStatusEnum = pgEnum("shopify_bulk_job_status", [
  "queued",
  "running",
  "completed",
  "partially_completed",
  "failed",
  "cancelled",
]);

export const shopifyConnections = pgTable(
  "shopify_connections",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workspaceType: apiWorkspaceTypeEnum("workspace_type").notNull(),
    workspaceId: text("workspace_id").notNull(),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => users.id, {onDelete: "restrict"}),
    name: text("name").notNull(),
    shopDomain: text("shop_domain").notNull(),
    status: shopifyConnectionStatusEnum("status").notNull().default("pending"),
    /** AES-256-GCM ciphertext — never the plaintext Admin API access token. */
    accessTokenCiphertext: text("access_token_ciphertext").notNull(),
    accessTokenNonce: text("access_token_nonce").notNull(),
    credentialVersion: integer("credential_version").notNull().default(1),
    shopId: text("shop_id"),
    /** Display-safe shop name/plan only — never emails or other Shopify PII. */
    shopNameSafe: text("shop_name_safe"),
    shopifyPlanNameSafe: text("shopify_plan_name_safe"),
    apiVersion: text("api_version").notNull().default("2024-10"),
    scopesSafe: text("scopes_safe"),
    lastVerifiedAt: timestamp("last_verified_at", {mode: "date"}),
    lastSuccessAt: timestamp("last_success_at", {mode: "date"}),
    lastFailureAt: timestamp("last_failure_at", {mode: "date"}),
    lastFailureCode: text("last_failure_code"),
    consecutiveFailureCount: integer("consecutive_failure_count").notNull().default(0),
    disabledAt: timestamp("disabled_at", {mode: "date"}),
    disconnectedAt: timestamp("disconnected_at", {mode: "date"}),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    index("shopify_connections_workspace_status_idx").on(
      table.workspaceType,
      table.workspaceId,
      table.status,
    ),
    index("shopify_connections_shop_domain_idx").on(table.shopDomain),
  ],
);

export const shopifyBulkJobs = pgTable(
  "shopify_bulk_jobs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workspaceType: apiWorkspaceTypeEnum("workspace_type").notNull(),
    workspaceId: text("workspace_id").notNull(),
    connectionId: text("connection_id")
      .notNull()
      .references(() => shopifyConnections.id, {onDelete: "cascade"}),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, {onDelete: "cascade"}),
    /** A bulk job targets exactly one existing product on one connection. */
    shopifyProductId: text("shopify_product_id").notNull(),
    status: shopifyBulkJobStatusEnum("status").notNull().default("queued"),
    totalCount: integer("total_count").notNull().default(0),
    pendingCount: integer("pending_count").notNull().default(0),
    runningCount: integer("running_count").notNull().default(0),
    completedCount: integer("completed_count").notNull().default(0),
    failedCount: integer("failed_count").notNull().default(0),
    cancelledCount: integer("cancelled_count").notNull().default(0),
    cancelRequested: boolean("cancel_requested").notNull().default(false),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => users.id, {onDelete: "restrict"}),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    index("shopify_bulk_jobs_connection_idx").on(table.connectionId),
    index("shopify_bulk_jobs_project_idx").on(table.projectId),
    index("shopify_bulk_jobs_status_idx").on(table.status),
  ],
);

export const shopifyPublishJobs = pgTable(
  "shopify_publish_jobs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workspaceType: apiWorkspaceTypeEnum("workspace_type").notNull(),
    workspaceId: text("workspace_id").notNull(),
    connectionId: text("connection_id")
      .notNull()
      .references(() => shopifyConnections.id, {onDelete: "cascade"}),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, {onDelete: "cascade"}),
    imageId: text("image_id")
      .notNull()
      .references(() => images.id, {onDelete: "cascade"}),
    shopifyProductId: text("shopify_product_id").notNull(),
    /** Display-safe product title captured at job creation for history views. */
    shopifyProductTitleSafe: text("shopify_product_title_safe"),
    sourceType: shopifyPublishSourceTypeEnum("source_type").notNull().default("derivative"),
    /** Set only when sourceType = derivative; no FK — derivative rows may be cleaned up independently. */
    derivativeId: text("derivative_id"),
    sourceStorageKey: text("source_storage_key").notNull(),
    /** Same value as sourceStorageKey at job creation — kept distinct for future revision tracking. */
    sourceRevisionKey: text("source_revision_key").notNull(),
    metadataApprovalId: text("metadata_approval_id").notNull(),
    metadataLanguage: metadataLanguageEnum("metadata_language").notNull(),
    filenameMode: shopifyFilenameModeEnum("filename_mode").notNull().default("keep"),
    requestedFilename: text("requested_filename").notNull(),
    status: shopifyPublishJobStatusEnum("status").notNull().default("queued"),
    /** Shopify product image id — preserved across retries so we never re-attach a duplicate image. */
    remoteImageId: text("remote_image_id"),
    attemptCount: integer("attempt_count").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(5),
    idempotencyKey: text("idempotency_key"),
    bulkParentId: text("bulk_parent_id").references(() => shopifyBulkJobs.id, {
      onDelete: "set null",
    }),
    lastErrorCode: text("last_error_code"),
    leaseOwner: text("lease_owner"),
    leaseExpiresAt: timestamp("lease_expires_at", {mode: "date"}),
    startedAt: timestamp("started_at", {mode: "date"}),
    completedAt: timestamp("completed_at", {mode: "date"}),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    index("shopify_publish_jobs_claim_idx").on(table.status, table.createdAt),
    index("shopify_publish_jobs_connection_idx").on(table.connectionId),
    index("shopify_publish_jobs_project_idx").on(table.projectId),
    index("shopify_publish_jobs_image_idx").on(table.imageId),
    index("shopify_publish_jobs_product_idx").on(table.shopifyProductId),
    index("shopify_publish_jobs_bulk_parent_idx").on(table.bulkParentId),
    index("shopify_publish_jobs_lease_expires_at_idx")
      .on(table.leaseExpiresAt)
      .where(sql`${table.leaseExpiresAt} is not null`),
    uniqueIndex("shopify_publish_jobs_idempotency_key_idx")
      .on(table.idempotencyKey)
      .where(sql`${table.idempotencyKey} is not null`),
  ],
);

export const shopifyMediaMappings = pgTable(
  "shopify_media_mappings",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workspaceType: apiWorkspaceTypeEnum("workspace_type").notNull(),
    workspaceId: text("workspace_id").notNull(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, {onDelete: "cascade"}),
    imageId: text("image_id")
      .notNull()
      .references(() => images.id, {onDelete: "cascade"}),
    connectionId: text("connection_id")
      .notNull()
      .references(() => shopifyConnections.id, {onDelete: "cascade"}),
    publishJobId: text("publish_job_id").references(() => shopifyPublishJobs.id, {
      onDelete: "set null",
    }),
    shopifyProductId: text("shopify_product_id").notNull(),
    sourceStorageKey: text("source_storage_key").notNull(),
    derivativeId: text("derivative_id"),
    metadataApprovalId: text("metadata_approval_id").notNull(),
    remoteImageId: text("remote_image_id").notNull(),
    remoteMediaUrlSafe: text("remote_media_url_safe").notNull(),
    remoteFilename: text("remote_filename").notNull(),
    remoteMimeType: text("remote_mime_type").notNull(),
    remoteWidth: integer("remote_width"),
    remoteHeight: integer("remote_height"),
    remoteAltSafe: text("remote_alt_safe"),
    publishStatus: shopifyMediaPublishStatusEnum("publish_status").notNull().default("active"),
    publishedAt: timestamp("published_at", {mode: "date"}).defaultNow().notNull(),
    lastVerifiedAt: timestamp("last_verified_at", {mode: "date"}),
    staleAt: timestamp("stale_at", {mode: "date"}),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    index("shopify_media_mappings_project_idx").on(table.projectId),
    index("shopify_media_mappings_image_idx").on(table.imageId),
    index("shopify_media_mappings_connection_idx").on(table.connectionId),
    index("shopify_media_mappings_product_idx").on(table.shopifyProductId),
    uniqueIndex("shopify_media_mappings_identity_uidx").on(
      table.connectionId,
      table.shopifyProductId,
      table.imageId,
      table.sourceStorageKey,
      sql`coalesce(${table.derivativeId}, 'original')`,
      table.metadataApprovalId,
    ),
  ],
);

export type ShopifyConnection = typeof shopifyConnections.$inferSelect;
export type NewShopifyConnection = typeof shopifyConnections.$inferInsert;
export type ShopifyBulkJob = typeof shopifyBulkJobs.$inferSelect;
export type ShopifyPublishJob = typeof shopifyPublishJobs.$inferSelect;
export type NewShopifyPublishJob = typeof shopifyPublishJobs.$inferInsert;
export type ShopifyMediaMapping = typeof shopifyMediaMappings.$inferSelect;
export type NewShopifyMediaMapping = typeof shopifyMediaMappings.$inferInsert;
export type ShopifyConnectionStatus = (typeof shopifyConnectionStatusEnum.enumValues)[number];
export type ShopifyPublishJobStatus = (typeof shopifyPublishJobStatusEnum.enumValues)[number];
export type ShopifyFilenameMode = (typeof shopifyFilenameModeEnum.enumValues)[number];
export type ShopifyPublishSourceType = (typeof shopifyPublishSourceTypeEnum.enumValues)[number];
export type ShopifyMediaPublishStatus = (typeof shopifyMediaPublishStatusEnum.enumValues)[number];
export type ShopifyBulkJobStatus = (typeof shopifyBulkJobStatusEnum.enumValues)[number];

/**
 * Prompt 28 — Webflow (Site access token) CMS integration.
 * Auth is a Site access token only (`Authorization: Bearer` — never OAuth;
 * `authType` is always `site_token`). Access tokens are always stored as
 * AES-256-GCM ciphertext/nonce pairs (see `src/server/wordpress/crypto.ts`,
 * reused as-is) and never as plaintext columns. Publishing updates EXISTING
 * CMS collection items only — this integration never creates
 * collections/items and never calls the site-wide publish endpoint.
 */
export const webflowConnectionStatusEnum = pgEnum("webflow_connection_status", [
  "pending",
  "verifying",
  "active",
  "degraded",
  "authentication_failed",
  "permission_failed",
  "rate_limited",
  "unreachable",
  "disabled",
  "disconnected",
]);

export const webflowPublishSourceTypeEnum = pgEnum("webflow_publish_source_type", ["derivative", "original"]);

export const webflowFilenameModeEnum = pgEnum("webflow_filename_mode", ["keep", "suggestion"]);

export const webflowPublishJobStatusEnum = pgEnum("webflow_publish_job_status", [
  "queued",
  "leased",
  "validating",
  "creating_asset",
  "uploading_asset",
  "verifying_asset",
  "updating_cms_item",
  "verifying_cms_item",
  "completed",
  "partially_completed",
  "failed",
  "cancelled",
  "stale",
]);

export const webflowMediaPublishStatusEnum = pgEnum("webflow_media_publish_status", [
  "active",
  "stale",
  "disconnected",
]);

export const webflowBulkJobStatusEnum = pgEnum("webflow_bulk_job_status", [
  "queued",
  "running",
  "completed",
  "partially_completed",
  "failed",
  "cancelled",
]);

export const webflowConnections = pgTable(
  "webflow_connections",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workspaceType: apiWorkspaceTypeEnum("workspace_type").notNull(),
    workspaceId: text("workspace_id").notNull(),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => users.id, {onDelete: "restrict"}),
    name: text("name").notNull(),
    /** Locked decision: Site access token only — never OAuth. */
    authType: text("auth_type").notNull().default("site_token"),
    status: webflowConnectionStatusEnum("status").notNull().default("pending"),
    /** AES-256-GCM ciphertext — never the plaintext site access token. */
    accessTokenCiphertext: text("access_token_ciphertext").notNull(),
    accessTokenNonce: text("access_token_nonce").notNull(),
    credentialVersion: integer("credential_version").notNull().default(1),
    remoteSiteId: text("remote_site_id"),
    /** Display-safe site name/hostname only — never emails or other Webflow PII. */
    remoteSiteNameSafe: text("remote_site_name_safe"),
    remoteSiteHostnameSafe: text("remote_site_hostname_safe"),
    scopesSafe: text("scopes_safe"),
    lastVerifiedAt: timestamp("last_verified_at", {mode: "date"}),
    lastSuccessAt: timestamp("last_success_at", {mode: "date"}),
    lastFailureAt: timestamp("last_failure_at", {mode: "date"}),
    lastFailureCode: text("last_failure_code"),
    consecutiveFailureCount: integer("consecutive_failure_count").notNull().default(0),
    disabledAt: timestamp("disabled_at", {mode: "date"}),
    disconnectedAt: timestamp("disconnected_at", {mode: "date"}),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    index("webflow_connections_workspace_status_idx").on(
      table.workspaceType,
      table.workspaceId,
      table.status,
    ),
    index("webflow_connections_site_idx").on(table.remoteSiteId),
  ],
);

export const webflowFieldMappings = pgTable(
  "webflow_field_mappings",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    connectionId: text("connection_id")
      .notNull()
      .references(() => webflowConnections.id, {onDelete: "cascade"}),
    collectionId: text("collection_id").notNull(),
    collectionNameSafe: text("collection_name_safe"),
    mappingVersion: integer("mapping_version").notNull().default(1),
    /** The Image (or ImageRef) field a publish job writes {fileId, url} into. */
    imageFieldId: text("image_field_id").notNull(),
    imageFieldSlug: text("image_field_slug"),
    altFieldId: text("alt_field_id"),
    altFieldSlug: text("alt_field_slug"),
    titleFieldId: text("title_field_id"),
    titleFieldSlug: text("title_field_slug"),
    captionFieldId: text("caption_field_id"),
    captionFieldSlug: text("caption_field_slug"),
    descriptionFieldId: text("description_field_id"),
    descriptionFieldSlug: text("description_field_slug"),
    staleAt: timestamp("stale_at", {mode: "date"}),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => users.id, {onDelete: "restrict"}),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("webflow_field_mappings_connection_collection_uidx").on(
      table.connectionId,
      table.collectionId,
    ),
  ],
);

export const webflowBulkJobs = pgTable(
  "webflow_bulk_jobs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workspaceType: apiWorkspaceTypeEnum("workspace_type").notNull(),
    workspaceId: text("workspace_id").notNull(),
    connectionId: text("connection_id")
      .notNull()
      .references(() => webflowConnections.id, {onDelete: "cascade"}),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, {onDelete: "cascade"}),
    /** A bulk job targets exactly one connection, one collection, one field mapping. */
    collectionId: text("collection_id").notNull(),
    fieldMappingId: text("field_mapping_id")
      .notNull()
      .references(() => webflowFieldMappings.id, {onDelete: "restrict"}),
    status: webflowBulkJobStatusEnum("status").notNull().default("queued"),
    totalCount: integer("total_count").notNull().default(0),
    pendingCount: integer("pending_count").notNull().default(0),
    runningCount: integer("running_count").notNull().default(0),
    completedCount: integer("completed_count").notNull().default(0),
    failedCount: integer("failed_count").notNull().default(0),
    cancelledCount: integer("cancelled_count").notNull().default(0),
    cancelRequested: boolean("cancel_requested").notNull().default(false),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => users.id, {onDelete: "restrict"}),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    index("webflow_bulk_jobs_connection_idx").on(table.connectionId),
    index("webflow_bulk_jobs_project_idx").on(table.projectId),
    index("webflow_bulk_jobs_status_idx").on(table.status),
  ],
);

export const webflowPublishJobs = pgTable(
  "webflow_publish_jobs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workspaceType: apiWorkspaceTypeEnum("workspace_type").notNull(),
    workspaceId: text("workspace_id").notNull(),
    connectionId: text("connection_id")
      .notNull()
      .references(() => webflowConnections.id, {onDelete: "cascade"}),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, {onDelete: "cascade"}),
    imageId: text("image_id")
      .notNull()
      .references(() => images.id, {onDelete: "cascade"}),
    collectionId: text("collection_id").notNull(),
    cmsItemId: text("cms_item_id").notNull(),
    /** Display-safe CMS item name captured at job creation for history views. */
    cmsItemNameSafe: text("cms_item_name_safe"),
    fieldMappingId: text("field_mapping_id")
      .notNull()
      .references(() => webflowFieldMappings.id, {onDelete: "restrict"}),
    /** Mapping version captured at job creation — re-validated before writing to Webflow. */
    mappingVersion: integer("mapping_version").notNull(),
    sourceType: webflowPublishSourceTypeEnum("source_type").notNull().default("derivative"),
    /** Set only when sourceType = derivative; no FK — derivative rows may be cleaned up independently. */
    derivativeId: text("derivative_id"),
    sourceStorageKey: text("source_storage_key").notNull(),
    /** Same value as sourceStorageKey at job creation — kept distinct for future revision tracking. */
    sourceRevisionKey: text("source_revision_key").notNull(),
    metadataApprovalId: text("metadata_approval_id").notNull(),
    metadataLanguage: metadataLanguageEnum("metadata_language").notNull(),
    filenameMode: webflowFilenameModeEnum("filename_mode").notNull().default("keep"),
    requestedFilename: text("requested_filename").notNull(),
    status: webflowPublishJobStatusEnum("status").notNull().default("queued"),
    /** Webflow asset id — preserved across retries so a retry never re-uploads a duplicate asset. */
    remoteAssetId: text("remote_asset_id"),
    remoteAssetUrlSafe: text("remote_asset_url_safe"),
    attemptCount: integer("attempt_count").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(5),
    idempotencyKey: text("idempotency_key"),
    bulkParentId: text("bulk_parent_id").references(() => webflowBulkJobs.id, {
      onDelete: "set null",
    }),
    lastErrorCode: text("last_error_code"),
    leaseOwner: text("lease_owner"),
    leaseExpiresAt: timestamp("lease_expires_at", {mode: "date"}),
    startedAt: timestamp("started_at", {mode: "date"}),
    completedAt: timestamp("completed_at", {mode: "date"}),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    index("webflow_publish_jobs_claim_idx").on(table.status, table.createdAt),
    index("webflow_publish_jobs_connection_idx").on(table.connectionId),
    index("webflow_publish_jobs_project_idx").on(table.projectId),
    index("webflow_publish_jobs_cms_item_idx").on(table.cmsItemId),
    index("webflow_publish_jobs_lease_expires_at_idx")
      .on(table.leaseExpiresAt)
      .where(sql`${table.leaseExpiresAt} is not null`),
    uniqueIndex("webflow_publish_jobs_idempotency_key_idx")
      .on(table.idempotencyKey)
      .where(sql`${table.idempotencyKey} is not null`),
  ],
);

export const webflowMediaMappings = pgTable(
  "webflow_media_mappings",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workspaceType: apiWorkspaceTypeEnum("workspace_type").notNull(),
    workspaceId: text("workspace_id").notNull(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, {onDelete: "cascade"}),
    imageId: text("image_id")
      .notNull()
      .references(() => images.id, {onDelete: "cascade"}),
    connectionId: text("connection_id")
      .notNull()
      .references(() => webflowConnections.id, {onDelete: "cascade"}),
    publishJobId: text("publish_job_id").references(() => webflowPublishJobs.id, {
      onDelete: "set null",
    }),
    collectionId: text("collection_id").notNull(),
    cmsItemId: text("cms_item_id").notNull(),
    fieldMappingId: text("field_mapping_id")
      .notNull()
      .references(() => webflowFieldMappings.id, {onDelete: "restrict"}),
    mappingVersion: integer("mapping_version").notNull(),
    sourceStorageKey: text("source_storage_key").notNull(),
    derivativeId: text("derivative_id"),
    metadataApprovalId: text("metadata_approval_id").notNull(),
    remoteAssetId: text("remote_asset_id").notNull(),
    remoteAssetUrlSafe: text("remote_asset_url_safe").notNull(),
    remoteFilename: text("remote_filename").notNull(),
    remoteMimeType: text("remote_mime_type").notNull(),
    remoteWidth: integer("remote_width"),
    remoteHeight: integer("remote_height"),
    publishStatus: webflowMediaPublishStatusEnum("publish_status").notNull().default("active"),
    publishedAt: timestamp("published_at", {mode: "date"}).defaultNow().notNull(),
    lastVerifiedAt: timestamp("last_verified_at", {mode: "date"}),
    staleAt: timestamp("stale_at", {mode: "date"}),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    index("webflow_media_mappings_project_idx").on(table.projectId),
    index("webflow_media_mappings_image_idx").on(table.imageId),
    index("webflow_media_mappings_connection_idx").on(table.connectionId),
    index("webflow_media_mappings_cms_item_idx").on(table.cmsItemId),
    uniqueIndex("webflow_media_mappings_identity_uidx").on(
      table.connectionId,
      table.collectionId,
      table.cmsItemId,
      table.imageId,
      table.sourceStorageKey,
      sql`coalesce(${table.derivativeId}, 'original')`,
      table.metadataApprovalId,
      table.mappingVersion,
    ),
  ],
);

export type WebflowConnection = typeof webflowConnections.$inferSelect;
export type NewWebflowConnection = typeof webflowConnections.$inferInsert;
export type WebflowFieldMapping = typeof webflowFieldMappings.$inferSelect;
export type NewWebflowFieldMapping = typeof webflowFieldMappings.$inferInsert;
export type WebflowBulkJob = typeof webflowBulkJobs.$inferSelect;
export type WebflowPublishJob = typeof webflowPublishJobs.$inferSelect;
export type NewWebflowPublishJob = typeof webflowPublishJobs.$inferInsert;
export type WebflowMediaMapping = typeof webflowMediaMappings.$inferSelect;
export type NewWebflowMediaMapping = typeof webflowMediaMappings.$inferInsert;
export type WebflowConnectionStatus = (typeof webflowConnectionStatusEnum.enumValues)[number];
export type WebflowPublishJobStatus = (typeof webflowPublishJobStatusEnum.enumValues)[number];
export type WebflowFilenameMode = (typeof webflowFilenameModeEnum.enumValues)[number];
export type WebflowPublishSourceType = (typeof webflowPublishSourceTypeEnum.enumValues)[number];
export type WebflowMediaPublishStatus = (typeof webflowMediaPublishStatusEnum.enumValues)[number];
export type WebflowBulkJobStatus = (typeof webflowBulkJobStatusEnum.enumValues)[number];

/* -------------------------------------------------------------------------- */
/* Consumer guest foundation (Redesign v2 Phase 1)                            */
/* -------------------------------------------------------------------------- */

export const guestCohortEnum = pgEnum("guest_cohort", ["a", "b"]);
export const guestUploadStatusEnum = pgEnum("guest_upload_status", [
  "pending_upload",
  "uploaded",
  "validated",
  "failed",
  "expired",
  "deleted",
]);
export const guestJobStatusEnum = pgEnum("guest_job_status", [
  "queued",
  "running",
  "completed",
  "failed",
  "expired",
  "cancelled",
]);
export const guestBulkJobStatusEnum = pgEnum("guest_bulk_job_status", [
  "draft",
  "uploading",
  "ready",
  "processing",
  "completed",
  "partial",
  "failed",
  "expired",
  "cancelled",
]);
export const guestBulkItemStatusEnum = pgEnum("guest_bulk_item_status", [
  "pending",
  "uploading",
  "validated",
  "processing",
  "completed",
  "failed",
  "skipped",
  "cancelled",
]);
export const guestCleanupStatusEnum = pgEnum("guest_cleanup_status", [
  "pending",
  "in_progress",
  "completed",
  "failed",
]);

export const guestSessions = pgTable(
  "guest_sessions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    publicId: text("public_id").notNull(),
    tokenHash: text("token_hash").notNull(),
    cohort: guestCohortEnum("cohort").notNull(),
    locale: text("locale").notNull().default("en"),
    toolCode: text("tool_code").notNull().default("home"),
    operationsWindowStartedAt: timestamp("operations_window_started_at", {mode: "date"})
      .defaultNow()
      .notNull(),
    operationsUsed: integer("operations_used").notNull().default(0),
    /** Hashed IP hint only — never store raw IP. */
    ipHash: text("ip_hash"),
    userAgentHash: text("user_agent_hash"),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    /** Immutable expiry — downloads/reprocess must not update this. */
    expiresAt: timestamp("expires_at", {mode: "date"}).notNull(),
    scrubbedAt: timestamp("scrubbed_at", {mode: "date"}),
  },
  (table) => [
    uniqueIndex("guest_sessions_public_id_uidx").on(table.publicId),
    uniqueIndex("guest_sessions_token_hash_uidx").on(table.tokenHash),
    index("guest_sessions_expires_at_idx").on(table.expiresAt),
  ],
);

export const guestUploads = pgTable(
  "guest_uploads",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sessionId: text("session_id")
      .notNull()
      .references(() => guestSessions.id, {onDelete: "cascade"}),
    storageKey: text("storage_key").notNull(),
    originalFilename: text("original_filename"),
    declaredMimeType: text("declared_mime_type"),
    detectedMimeType: text("detected_mime_type"),
    sizeBytes: bigint("size_bytes", {mode: "number"}),
    width: integer("width"),
    height: integer("height"),
    isAnimated: boolean("is_animated"),
    hasAlpha: boolean("has_alpha"),
    status: guestUploadStatusEnum("status").notNull().default("pending_upload"),
    failureCode: text("failure_code"),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    validatedAt: timestamp("validated_at", {mode: "date"}),
    expiresAt: timestamp("expires_at", {mode: "date"}).notNull(),
    deletedAt: timestamp("deleted_at", {mode: "date"}),
  },
  (table) => [
    uniqueIndex("guest_uploads_storage_key_uidx").on(table.storageKey),
    index("guest_uploads_session_idx").on(table.sessionId),
    index("guest_uploads_expires_at_idx").on(table.expiresAt),
  ],
);

export const guestJobs = pgTable(
  "guest_jobs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sessionId: text("session_id")
      .notNull()
      .references(() => guestSessions.id, {onDelete: "cascade"}),
    uploadId: text("upload_id").references(() => guestUploads.id, {onDelete: "set null"}),
    operation: text("operation").notNull(),
    status: guestJobStatusEnum("status").notNull().default("queued"),
    /** Tool options (e.g. compress quality/preset). */
    options: jsonb("options"),
    /** Safe result metrics for UI (sizes, quality). */
    resultSummary: jsonb("result_summary"),
    outputStorageKey: text("output_storage_key"),
    errorCode: text("error_code"),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    startedAt: timestamp("started_at", {mode: "date"}),
    completedAt: timestamp("completed_at", {mode: "date"}),
    /** Copied from session/upload policy; immutable. */
    expiresAt: timestamp("expires_at", {mode: "date"}).notNull(),
  },
  (table) => [
    index("guest_jobs_session_status_idx").on(table.sessionId, table.status),
    index("guest_jobs_expires_at_idx").on(table.expiresAt),
  ],
);

export const guestBulkJobs = pgTable(
  "guest_bulk_jobs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sessionId: text("session_id")
      .notNull()
      .references(() => guestSessions.id, {onDelete: "cascade"}),
    toolCode: text("tool_code").notNull(),
    operation: text("operation").notNull(),
    status: guestBulkJobStatusEnum("status").notNull().default("draft"),
    options: jsonb("options"),
    totalItems: integer("total_items").notNull().default(0),
    completedItems: integer("completed_items").notNull().default(0),
    failedItems: integer("failed_items").notNull().default(0),
    skippedItems: integer("skipped_items").notNull().default(0),
    reservedOps: integer("reserved_ops").notNull().default(0),
    archiveStorageKey: text("archive_storage_key"),
    archiveBytes: bigint("archive_bytes", {mode: "number"}),
    archiveStatus: text("archive_status"),
    errorCode: text("error_code"),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    startedAt: timestamp("started_at", {mode: "date"}),
    completedAt: timestamp("completed_at", {mode: "date"}),
    expiresAt: timestamp("expires_at", {mode: "date"}).notNull(),
  },
  (table) => [
    index("guest_bulk_jobs_session_status_idx").on(table.sessionId, table.status),
    index("guest_bulk_jobs_expires_at_idx").on(table.expiresAt),
  ],
);

export const guestBulkJobItems = pgTable(
  "guest_bulk_job_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    bulkJobId: text("bulk_job_id")
      .notNull()
      .references(() => guestBulkJobs.id, {onDelete: "cascade"}),
    sessionId: text("session_id")
      .notNull()
      .references(() => guestSessions.id, {onDelete: "cascade"}),
    uploadId: text("upload_id").references(() => guestUploads.id, {onDelete: "set null"}),
    childJobId: text("child_job_id").references(() => guestJobs.id, {onDelete: "set null"}),
    originalFilename: text("original_filename"),
    declaredMimeType: text("declared_mime_type"),
    declaredSizeBytes: bigint("declared_size_bytes", {mode: "number"}),
    sortOrder: integer("sort_order").notNull().default(0),
    status: guestBulkItemStatusEnum("status").notNull().default("pending"),
    errorCode: text("error_code"),
    resultSummary: jsonb("result_summary"),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
  },
  (table) => [
    index("guest_bulk_job_items_bulk_idx").on(table.bulkJobId),
    index("guest_bulk_job_items_session_idx").on(table.sessionId),
  ],
);

export const guestCleanupQueue = pgTable(
  "guest_cleanup_queue",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    storageKey: text("storage_key").notNull(),
    sessionId: text("session_id").references(() => guestSessions.id, {onDelete: "set null"}),
    status: guestCleanupStatusEnum("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    nextRetryAt: timestamp("next_retry_at", {mode: "date"}).defaultNow().notNull(),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
    completedAt: timestamp("completed_at", {mode: "date"}),
  },
  (table) => [
    index("guest_cleanup_queue_status_retry_idx").on(table.status, table.nextRetryAt),
    uniqueIndex("guest_cleanup_queue_storage_key_pending_uidx").on(table.storageKey),
  ],
);

export type GuestSession = typeof guestSessions.$inferSelect;
export type GuestUpload = typeof guestUploads.$inferSelect;
export type GuestJob = typeof guestJobs.$inferSelect;
export type GuestBulkJob = typeof guestBulkJobs.$inferSelect;
export type GuestBulkJobItem = typeof guestBulkJobItems.$inferSelect;
export type GuestCleanupQueueItem = typeof guestCleanupQueue.$inferSelect;
export type GuestCohortDb = (typeof guestCohortEnum.enumValues)[number];
export type GuestUploadStatus = (typeof guestUploadStatusEnum.enumValues)[number];
export type GuestJobStatusDb = (typeof guestJobStatusEnum.enumValues)[number];
export type GuestBulkJobStatusDb = (typeof guestBulkJobStatusEnum.enumValues)[number];
export type GuestBulkItemStatusDb = (typeof guestBulkItemStatusEnum.enumValues)[number];
export type GuestCleanupStatus = (typeof guestCleanupStatusEnum.enumValues)[number];
/**
 * Workflow + Cloudinary tables (typecheck restore for truncated schema tree).
 * Present in the authenticated product; Phase 1 adds Drizzle definitions so
 * dashboard modules typecheck. DB may already have these from prior installs.
 */

export const workflowTriggerTypeEnum = pgEnum("workflow_trigger_type", [
  "image.uploaded",
  "image.validated",
  "metadata.approved",
  "processing.completed",
  "bulk.processing.completed",
  "image.published",
  "manual",
  "scheduled",
]);
export type WorkflowTriggerType = (typeof workflowTriggerTypeEnum.enumValues)[number];

export const workflowActionTypeEnum = pgEnum("workflow_action_type", [
  "validate_image",
  "optimize",
  "resize",
  "convert_format",
  "generate_metadata",
  "generate_metadata_batch",
  "wait_metadata_approval",
  "publish_cloudinary",
  "export_csv",
  "export_json",
  "send_webhook",
  "update_status",
  "notify_user",
]);
export type WorkflowActionType = (typeof workflowActionTypeEnum.enumValues)[number];

export const workflowStepKindEnum = pgEnum("workflow_step_kind", ["action", "condition", "wait"]);
export type WorkflowStepKind = (typeof workflowStepKindEnum.enumValues)[number];

export const workflowOnFailureEnum = pgEnum("workflow_on_failure", ["fail", "continue", "skip"]);
export type WorkflowOnFailure = (typeof workflowOnFailureEnum.enumValues)[number];

export const workflowStatusEnum = pgEnum("workflow_status", ["draft", "enabled", "disabled"]);
export const workflowRunStatusEnum = pgEnum("workflow_run_status", [
  "queued",
  "leased",
  "running",
  "waiting",
  "completed",
  "failed",
  "cancelled",
  "timed_out",
]);

export const workflows = pgTable("workflows", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  workspaceType: apiWorkspaceTypeEnum("workspace_type").notNull(),
  workspaceId: text("workspace_id").notNull(),
  createdByUserId: text("created_by_user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: workflowStatusEnum("status").notNull().default("draft"),
  triggerType: workflowTriggerTypeEnum("trigger_type").notNull(),
  triggerConfig: jsonb("trigger_config"),
  projectId: text("project_id"),
  scheduleInterval: text("schedule_interval"),
  nextScheduledAt: timestamp("next_scheduled_at", { mode: "date" }),
  maxRetries: integer("max_retries").notNull().default(3),
  stepTimeoutSeconds: integer("step_timeout_seconds").notNull().default(3600),
  definitionVersion: integer("definition_version").notNull().default(1),
  enabledAt: timestamp("enabled_at", { mode: "date" }),
  disabledAt: timestamp("disabled_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const workflowSteps = pgTable("workflow_steps", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  workflowId: text("workflow_id").notNull(),
  position: integer("position").notNull(),
  kind: workflowStepKindEnum("kind").notNull(),
  actionType: workflowActionTypeEnum("action_type"),
  config: jsonb("config"),
  conditionConfig: jsonb("condition_config"),
  onFailure: workflowOnFailureEnum("on_failure").notNull().default("fail"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const workflowRuns = pgTable("workflow_runs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  workflowId: text("workflow_id").notNull(),
  workspaceType: apiWorkspaceTypeEnum("workspace_type").notNull(),
  workspaceId: text("workspace_id").notNull(),
  projectId: text("project_id"),
  imageId: text("image_id"),
  status: workflowRunStatusEnum("status").notNull().default("queued"),
  triggerType: workflowTriggerTypeEnum("trigger_type").notNull(),
  context: jsonb("context"),
  createdByUserId: text("created_by_user_id"),
  leaseOwner: text("lease_owner"),
  leaseExpiresAt: timestamp("lease_expires_at", { mode: "date" }),
  lastErrorCode: text("last_error_code"),
  lastErrorMessage: text("last_error_message"),
  startedAt: timestamp("started_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { mode: "date" }),
});

export const workflowRunSteps = pgTable("workflow_run_steps", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  runId: text("run_id").notNull(),
  stepId: text("step_id"),
  position: integer("position").notNull(),
  kind: workflowStepKindEnum("kind").notNull().default("action"),
  actionType: workflowActionTypeEnum("action_type"),
  status: workflowRunStatusEnum("status").notNull().default("queued"),
  errorCode: text("error_code"),
  errorMessage: text("error_message"),
  log: text("log"),
  durationMs: integer("duration_ms"),
  startedAt: timestamp("started_at", { mode: "date" }),
  completedAt: timestamp("completed_at", { mode: "date" }),
});

export type Workflow = typeof workflows.$inferSelect;
export type WorkflowStep = typeof workflowSteps.$inferSelect;
export type WorkflowRun = typeof workflowRuns.$inferSelect;
export type WorkflowRunStep = typeof workflowRunSteps.$inferSelect;

export const cloudinaryFilenameModeEnum = pgEnum("cloudinary_filename_mode", [
  "original",
  "sanitized",
  "custom",
  "keep",
  "suggestion",
]);
export type CloudinaryFilenameMode = (typeof cloudinaryFilenameModeEnum.enumValues)[number];

export const cloudinaryDeliveryTypeEnum = pgEnum("cloudinary_delivery_type", [
  "upload",
  "private",
  "authenticated",
  "signed",
]);
export type CloudinaryDeliveryType = (typeof cloudinaryDeliveryTypeEnum.enumValues)[number];

export const cloudinaryConnectionStatusEnum = pgEnum("cloudinary_connection_status", [
  "pending",
  "verifying",
  "active",
  "degraded",
  "authentication_failed",
  "permission_failed",
  "rate_limited",
  "unreachable",
  "disabled",
  "disconnected",
]);
export type CloudinaryConnectionStatus = (typeof cloudinaryConnectionStatusEnum.enumValues)[number];

export const cloudinaryPublishJobStatusEnum = pgEnum("cloudinary_publish_job_status", [
  "queued",
  "leased",
  "validating",
  "reading_source",
  "uploading_asset",
  "verifying_asset",
  "applying_metadata",
  "verifying_metadata",
  "completed",
  "partially_completed",
  "failed",
  "cancelled",
  "stale",
]);

export const cloudinaryBulkJobStatusEnum = pgEnum("cloudinary_bulk_job_status", [
  "queued",
  "running",
  "completed",
  "partially_completed",
  "failed",
  "cancelled",
]);
export type CloudinaryBulkJobStatus = (typeof cloudinaryBulkJobStatusEnum.enumValues)[number];

export const cloudinaryConnections = pgTable("cloudinary_connections", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  workspaceType: apiWorkspaceTypeEnum("workspace_type").notNull(),
  workspaceId: text("workspace_id").notNull(),
  createdByUserId: text("created_by_user_id").notNull(),
  name: text("name").notNull(),
  status: cloudinaryConnectionStatusEnum("status").notNull().default("pending"),
  cloudNameCiphertext: text("cloud_name_ciphertext").notNull(),
  cloudNameNonce: text("cloud_name_nonce").notNull(),
  apiKeyCiphertext: text("api_key_ciphertext").notNull(),
  apiKeyNonce: text("api_key_nonce").notNull(),
  apiSecretCiphertext: text("api_secret_ciphertext").notNull(),
  apiSecretNonce: text("api_secret_nonce").notNull(),
  cloudNameSafe: text("cloud_name_safe"),
  credentialVersion: integer("credential_version").notNull().default(1),
  defaultDeliveryType: cloudinaryDeliveryTypeEnum("default_delivery_type").notNull().default("upload"),
  defaultFolder: text("default_folder"),
  publicDeliveryAcknowledgedAt: timestamp("public_delivery_acknowledged_at", { mode: "date" }),
  lastFailureCode: text("last_failure_code"),
  lastFailureAt: timestamp("last_failure_at", { mode: "date" }),
  consecutiveFailureCount: integer("consecutive_failure_count").notNull().default(0),
  lastVerifiedAt: timestamp("last_verified_at", { mode: "date" }),
  lastSuccessAt: timestamp("last_success_at", { mode: "date" }),
  disconnectedAt: timestamp("disconnected_at", { mode: "date" }),
  disabledAt: timestamp("disabled_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const cloudinaryPublishJobs = pgTable("cloudinary_publish_jobs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  connectionId: text("connection_id").notNull(),
  projectId: text("project_id").notNull(),
  imageId: text("image_id").notNull(),
  derivativeId: text("derivative_id"),
  requestedPublicId: text("requested_public_id"),
  remotePublicId: text("remote_public_id"),
  deliveryType: cloudinaryDeliveryTypeEnum("delivery_type").notNull(),
  filenameMode: cloudinaryFilenameModeEnum("filename_mode").notNull(),
  status: cloudinaryPublishJobStatusEnum("status").notNull().default("queued"),
  attemptCount: integer("attempt_count").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(5),
  lastErrorCode: text("last_error_code"),
  bulkParentId: text("bulk_parent_id"),
  leaseExpiresAt: timestamp("lease_expires_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { mode: "date" }),
});

export const cloudinaryBulkJobs = pgTable("cloudinary_bulk_jobs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  workspaceType: apiWorkspaceTypeEnum("workspace_type").notNull(),
  workspaceId: text("workspace_id").notNull(),
  connectionId: text("connection_id").notNull(),
  projectId: text("project_id").notNull(),
  status: cloudinaryBulkJobStatusEnum("status").notNull().default("queued"),
  totalCount: integer("total_count").notNull().default(0),
  pendingCount: integer("pending_count").notNull().default(0),
  runningCount: integer("running_count").notNull().default(0),
  completedCount: integer("completed_count").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
  cancelledCount: integer("cancelled_count").notNull().default(0),
  cancelRequested: boolean("cancel_requested").notNull().default(false),
  createdByUserId: text("created_by_user_id").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { mode: "date" }),
});

export const cloudinaryMediaMappings = pgTable("cloudinary_media_mappings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  connectionId: text("connection_id").notNull(),
  workspaceType: apiWorkspaceTypeEnum("workspace_type").notNull(),
  workspaceId: text("workspace_id").notNull(),
  projectId: text("project_id").notNull(),
  imageId: text("image_id").notNull(),
  derivativeId: text("derivative_id"),
  remotePublicId: text("remote_public_id").notNull(),
  deliveryType: cloudinaryDeliveryTypeEnum("delivery_type").notNull(),
  format: text("format"),
  publishStatus: text("publish_status"),
  secureUrlSafe: text("secure_url_safe"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export type CloudinaryConnection = typeof cloudinaryConnections.$inferSelect;
export type CloudinaryPublishJob = typeof cloudinaryPublishJobs.$inferSelect;
export type CloudinaryBulkJob = typeof cloudinaryBulkJobs.$inferSelect;
export type CloudinaryMediaMapping = typeof cloudinaryMediaMappings.$inferSelect;

// ---------------------------------------------------------------------------
// Prompt 32 — collaboration (activity + comments) schema shims
// ---------------------------------------------------------------------------

export const commentSubjectTypeEnum = pgEnum("comment_subject_type", [
  "project",
  "image",
  "metadata_generation",
  "ai_metadata_batch",
  "ai_metadata_batch_item",
]);
export type CommentSubjectType = (typeof commentSubjectTypeEnum.enumValues)[number];

export const commentThreadStatusEnum = pgEnum("comment_thread_status", ["open", "resolved"]);

export const commentThreads = pgTable("comment_threads", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  workspaceType: apiWorkspaceTypeEnum("workspace_type").notNull(),
  workspaceId: text("workspace_id").notNull(),
  projectId: text("project_id").notNull(),
  subjectType: commentSubjectTypeEnum("subject_type").notNull(),
  subjectId: text("subject_id").notNull(),
  status: commentThreadStatusEnum("status").notNull().default("open"),
  createdByUserId: text("created_by_user_id").notNull(),
  resolvedByUserId: text("resolved_by_user_id"),
  resolvedAt: timestamp("resolved_at", {mode: "date"}),
  createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  threadId: text("thread_id").notNull(),
  projectId: text("project_id").notNull(),
  authorUserId: text("author_user_id").notNull(),
  body: text("body").notNull(),
  deletedAt: timestamp("deleted_at", {mode: "date"}),
  createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
});

export const commentMentions = pgTable("comment_mentions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  commentId: text("comment_id").notNull(),
  mentionedUserId: text("mentioned_user_id").notNull(),
  createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
});

export const activityEvents = pgTable("activity_events", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  workspaceType: apiWorkspaceTypeEnum("workspace_type").notNull(),
  workspaceId: text("workspace_id").notNull(),
  organizationId: text("organization_id"),
  projectId: text("project_id"),
  actorUserId: text("actor_user_id"),
  verb: text("verb").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  summarySafe: text("summary_safe").notNull(),
  metadataSafe: jsonb("metadata_safe"),
  idempotencyKey: text("idempotency_key"),
  occurredAt: timestamp("occurred_at", {mode: "date"}).defaultNow().notNull(),
});

export type ActivityEvent = typeof activityEvents.$inferSelect;

// ---------------------------------------------------------------------------
// Prompt 31 — AI metadata batch schema shims
// ---------------------------------------------------------------------------

export const aiMetadataTemplateCodeEnum = pgEnum("ai_metadata_template_code", [
  "seo",
  "accessibility",
  "ecommerce",
]);
export type AiMetadataTemplateCode = (typeof aiMetadataTemplateCodeEnum.enumValues)[number];

export const aiMetadataBatchStatusEnum = pgEnum("ai_metadata_batch_status", [
  "preparing",
  "queued",
  "running",
  "cancelling",
  "partially_completed",
  "completed",
  "failed",
  "cancelled",
]);
export type AiMetadataBatchStatus = (typeof aiMetadataBatchStatusEnum.enumValues)[number];

export const aiMetadataBatchSelectionTypeEnum = pgEnum("ai_metadata_batch_selection_type", [
  "manual",
  "page",
  "filtered",
]);
export type AiMetadataBatchSelectionType = (typeof aiMetadataBatchSelectionTypeEnum.enumValues)[number];

export const aiMetadataBatchItemStatusEnum = pgEnum("ai_metadata_batch_item_status", [
  "pending",
  "queued",
  "running",
  "draft",
  "reviewed",
  "approved",
  "rejected",
  "failed",
  "cancelled",
  "stale",
  "skipped",
]);
export type AiMetadataBatchItemStatus = (typeof aiMetadataBatchItemStatusEnum.enumValues)[number];

export const aiMetadataBatches = pgTable("ai_metadata_batches", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  workspaceType: apiWorkspaceTypeEnum("workspace_type").notNull(),
  workspaceId: text("workspace_id").notNull(),
  projectId: text("project_id").notNull(),
  templateCode: aiMetadataTemplateCodeEnum("template_code").notNull(),
  language: text("language").notNull(),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  promptVersion: text("prompt_version").notNull(),
  status: aiMetadataBatchStatusEnum("status").notNull().default("preparing"),
  selectionType: aiMetadataBatchSelectionTypeEnum("selection_type").notNull(),
  selectionSnapshot: jsonb("selection_snapshot"),
  totalCount: integer("total_count").notNull().default(0),
  eligibleCount: integer("eligible_count").notNull().default(0),
  queuedCount: integer("queued_count").notNull().default(0),
  runningCount: integer("running_count").notNull().default(0),
  draftCount: integer("draft_count").notNull().default(0),
  reviewedCount: integer("reviewed_count").notNull().default(0),
  approvedCount: integer("approved_count").notNull().default(0),
  rejectedCount: integer("rejected_count").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
  cancelledCount: integer("cancelled_count").notNull().default(0),
  staleCount: integer("stale_count").notNull().default(0),
  skippedCount: integer("skipped_count").notNull().default(0),
  usageReserved: integer("usage_reserved").notNull().default(0),
  usageConsumed: integer("usage_consumed").notNull().default(0),
  usageReleased: integer("usage_released").notNull().default(0),
  cancelRequested: boolean("cancel_requested").notNull().default(false),
  idempotencyKey: text("idempotency_key"),
  createdByUserId: text("created_by_user_id").notNull(),
  startedAt: timestamp("started_at", {mode: "date"}),
  completedAt: timestamp("completed_at", {mode: "date"}),
  cancelledAt: timestamp("cancelled_at", {mode: "date"}),
  createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
});

export const aiMetadataBatchItems = pgTable("ai_metadata_batch_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  batchId: text("batch_id").notNull(),
  projectId: text("project_id").notNull(),
  imageId: text("image_id").notNull(),
  generationId: text("generation_id"),
  status: aiMetadataBatchItemStatusEnum("status").notNull().default("pending"),
  eligibilityCode: text("eligibility_code"),
  lastErrorCode: text("last_error_code"),
  queuedAt: timestamp("queued_at", {mode: "date"}),
  startedAt: timestamp("started_at", {mode: "date"}),
  completedAt: timestamp("completed_at", {mode: "date"}),
  createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
});

export type AiMetadataBatch = typeof aiMetadataBatches.$inferSelect;
export type AiMetadataBatchItem = typeof aiMetadataBatchItems.$inferSelect;
