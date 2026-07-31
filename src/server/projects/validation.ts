import {z} from "zod";

export const PROJECT_NAME_MIN = 2;
export const PROJECT_NAME_MAX = 100;
export const PROJECT_DESCRIPTION_MAX = 2000;
export const PROJECT_LIST_LIMIT = 50;

export const metadataLanguageValues = ["en", "ur"] as const;
export type MetadataLanguage = (typeof metadataLanguageValues)[number];

export const projectStatusValues = ["active", "archived"] as const;
export type ProjectStatus = (typeof projectStatusValues)[number];

export const projectFilterValues = ["active", "archived", "all"] as const;
export type ProjectFilter = (typeof projectFilterValues)[number];

const unsafeProtocols = /^(javascript|data|vbscript|file):/i;

export function normalizeWebsiteUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  let candidate = trimmed;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error("websiteUrlInvalid");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("websiteUrlUnsafe");
  }

  if (unsafeProtocols.test(candidate)) {
    throw new Error("websiteUrlUnsafe");
  }

  return url.toString();
}

const websiteUrlSchema = z
  .string()
  .trim()
  .max(2048, "websiteUrlTooLong")
  .optional()
  .or(z.literal(""))
  .transform((value, ctx) => {
    if (!value) return null;
    try {
      return normalizeWebsiteUrl(value);
    } catch (error) {
      const code = error instanceof Error ? error.message : "websiteUrlInvalid";
      ctx.addIssue({code: z.ZodIssueCode.custom, message: code});
      return z.NEVER;
    }
  });

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(PROJECT_NAME_MIN, "nameTooShort")
    .max(PROJECT_NAME_MAX, "nameTooLong")
    .refine((value) => value.length > 0, "nameRequired"),
  websiteUrl: websiteUrlSchema,
  description: z
    .string()
    .trim()
    .max(PROJECT_DESCRIPTION_MAX, "descriptionTooLong")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
  metadataLanguage: z.enum(metadataLanguageValues, {
    errorMap: () => ({message: "metadataLanguageInvalid"}),
  }),
});

export const updateProjectSchema = createProjectSchema;

export const projectIdSchema = z.string().uuid("projectIdInvalid");

export const projectFilterSchema = z
  .enum(projectFilterValues)
  .catch("active");

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
