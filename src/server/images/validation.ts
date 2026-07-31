import {z} from "zod";
import {projectIdSchema} from "@/server/projects/validation";
import {
  IMAGE_LIST_LIMIT,
  MAX_BYTES_PER_IMAGE,
  MAX_FILES_PER_BATCH,
  MAX_ORIGINAL_FILENAME_LENGTH,
  expectedMimeForExtension,
  getExtension,
  isAllowedImageExtension,
  isAllowedImageMimeType,
  isRejectedExtension,
  isRejectedMimeType,
} from "./policy";

export {
  IMAGE_LIST_LIMIT,
  MAX_BYTES_PER_IMAGE,
  MAX_FILES_PER_BATCH,
  MAX_ORIGINAL_FILENAME_LENGTH,
} from "./policy";

export const imageIdSchema = z.string().uuid("imageIdInvalid");
export const replacementIdSchema = z.string().uuid("replacementIdInvalid");

export const IMAGE_STATUS_FILTERS = [
  "all",
  "validated",
  "validating",
  "uploaded",
  "validation_failed",
  "pending_upload",
  "upload_failed",
] as const;
export type ImageStatusFilter = (typeof IMAGE_STATUS_FILTERS)[number];

export const imageStatusFilterSchema = z.enum(IMAGE_STATUS_FILTERS).catch("validated");

export function parseImageStatusFilter(raw: string | null | undefined): ImageStatusFilter {
  if (!raw) return "validated";
  return imageStatusFilterSchema.parse(raw);
}

/**
 * Trusted internal storage keys only (server-generated).
 * Never authorize solely from a client-supplied key.
 */
export const storageKeySchema = z
  .string()
  .min(8, "storageKeyInvalid")
  .max(1024, "storageKeyInvalid")
  .regex(/^users\/[^/]+\/projects\/[^/]+\/originals\/[^/]+\/[^/]+$/, "storageKeyInvalid")
  .refine((value) => !value.includes(".."), "storageKeyInvalid")
  .refine((value) => !value.includes("\0"), "storageKeyInvalid");

export const originalFilenameSchema = z
  .string()
  .trim()
  .min(1, "filenameRequired")
  .max(MAX_ORIGINAL_FILENAME_LENGTH, "filenameTooLong")
  .refine((value) => !value.includes("\0"), "filenameUnsafe")
  .refine((value) => !/[<>:"|?*\u0000-\u001f]/.test(value), "filenameUnsafe")
  .refine((value) => !/[\\/]/.test(value.split(/[/\\]/).pop() ?? value) || !value.includes(".."), "filenameUnsafe");

/**
 * Sanitize for display / planning only. Never use as the unique storage key.
 */
export function sanitizeOriginalFilename(originalFilename: string): string {
  const leaf = originalFilename.trim().split(/[/\\]/).pop() ?? "image";
  const withoutNulls = leaf.replace(/\0/g, "");
  const normalized = withoutNulls.normalize("NFKC");
  const cleaned = normalized
    .replace(/[<>:"|?*\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_ORIGINAL_FILENAME_LENGTH);
  return cleaned || "image";
}

/**
 * Safe object-key suffix helper for a future R2 task.
 * Final uniqueness must still come from server-generated IDs.
 */
export function buildSafeFilenameSuffix(originalFilename: string): string {
  const leaf = sanitizeOriginalFilename(originalFilename);
  const ext = getExtension(leaf);
  const base = leaf
    .replace(/\.[^.]+$/, "")
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  const safeExt = isAllowedImageExtension(ext) ? ext : "bin";
  return `${base || "image"}.${safeExt}`;
}

export function neutralizePathTraversalFilename(filename: string): string {
  return sanitizeOriginalFilename(filename);
}

export type FileDescriptorInput = {
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
};

export const fileDescriptorSchema = z
  .object({
    originalFilename: z
      .string()
      .trim()
      .min(1, "filenameRequired")
      .max(MAX_ORIGINAL_FILENAME_LENGTH, "filenameTooLong"),
    mimeType: z.string().trim().min(1, "mimeInvalid").max(100, "mimeInvalid"),
    sizeBytes: z.number().int("fileTooSmall"),
  })
  .superRefine((value, ctx) => {
    if (value.originalFilename.includes("\0")) {
      ctx.addIssue({code: z.ZodIssueCode.custom, message: "filenameUnsafe", path: ["originalFilename"]});
      return;
    }
    if (/^[a-zA-Z]:[\\/]/.test(value.originalFilename) || value.originalFilename.startsWith("/")) {
      ctx.addIssue({code: z.ZodIssueCode.custom, message: "filenameUnsafe", path: ["originalFilename"]});
      return;
    }
    if (value.originalFilename.includes("..") || /[\\/]/.test(value.originalFilename)) {
      ctx.addIssue({code: z.ZodIssueCode.custom, message: "filenameUnsafe", path: ["originalFilename"]});
      return;
    }

    const ext = getExtension(value.originalFilename);
    if (!ext) {
      ctx.addIssue({code: z.ZodIssueCode.custom, message: "extensionMissing", path: ["originalFilename"]});
      return;
    }
    if (isRejectedExtension(ext) || !isAllowedImageExtension(ext)) {
      ctx.addIssue({code: z.ZodIssueCode.custom, message: "fileTypeRejected", path: ["originalFilename"]});
      return;
    }

    const mime = value.mimeType.toLowerCase();
    if (isRejectedMimeType(mime) || !isAllowedImageMimeType(mime)) {
      ctx.addIssue({code: z.ZodIssueCode.custom, message: "mimeInvalid", path: ["mimeType"]});
      return;
    }

    const expected = expectedMimeForExtension(ext);
    if (expected && mime !== expected) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "mimeExtensionMismatch",
        path: ["mimeType"],
      });
    }

    if (value.sizeBytes <= 0) {
      ctx.addIssue({code: z.ZodIssueCode.custom, message: "fileTooSmall", path: ["sizeBytes"]});
    } else if (value.sizeBytes > MAX_BYTES_PER_IMAGE) {
      ctx.addIssue({code: z.ZodIssueCode.custom, message: "fileTooLarge", path: ["sizeBytes"]});
    }
  });

export const uploadBatchSchema = z
  .object({
    projectId: projectIdSchema,
    files: z.array(fileDescriptorSchema).min(1, "batchEmpty").max(MAX_FILES_PER_BATCH, "batchTooLarge"),
  })
  .superRefine((value, ctx) => {
    if (value.files.length > MAX_FILES_PER_BATCH) {
      ctx.addIssue({code: z.ZodIssueCode.custom, message: "batchTooLarge", path: ["files"]});
    }
  });

export const imageListQuerySchema = z.object({
  projectId: projectIdSchema,
  status: imageStatusFilterSchema,
  limit: z.number().int().positive().max(IMAGE_LIST_LIMIT).default(IMAGE_LIST_LIMIT),
  offset: z.number().int().nonnegative().default(0),
});

export type FileDescriptor = z.infer<typeof fileDescriptorSchema>;
export type UploadBatchInput = z.infer<typeof uploadBatchSchema>;
