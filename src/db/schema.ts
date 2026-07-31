import {
  bigint,
  boolean,
  index,
  integer,
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
 * Processing batches, optimized copies, and billing remain deferred.
 */
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", {mode: "date"}),
  image: text("image"),
  /** bcrypt hash for credentials accounts; null for OAuth-only users. */
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at", {mode: "date"}).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", {mode: "date"}).defaultNow().notNull(),
});

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

export const projects = pgTable(
  "projects",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, {onDelete: "cascade"}),
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
