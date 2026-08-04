/**
 * Public API v1 — create an export job (metadata/CMS package).
 * Execution happens asynchronously via the existing worker — responds 202.
 */
import {z} from "zod";
import {authenticateApiRequest, requireProjectAccess} from "@/server/api/auth";
import {ApiError} from "@/server/api/errors";
import {mapDomainError, withApiHandler, withIdempotentWrite} from "@/server/api/v1-handlers";
import {createExportJob} from "@/server/images/export-service";
import {EXPORT_MAX_ITEMS, EXPORT_PACKAGE_KINDS} from "@/server/images/export-policy";
import {projectIdSchema} from "@/server/projects/validation";

export const runtime = "nodejs";

type RouteContext = {params: Promise<{projectId: string}>};

const createExportBodySchema = z.object({
  packageKind: z.enum(EXPORT_PACKAGE_KINDS),
  sourceFilter: z.enum(["approved", "draft", "reviewed"]).optional(),
  language: z.string().trim().min(2).max(10).optional(),
  imageIds: z.array(z.string().uuid()).max(EXPORT_MAX_ITEMS).optional(),
  includeImages: z.boolean().optional(),
  includeCsv: z.boolean().optional(),
  includeJson: z.boolean().optional(),
  includeTxt: z.boolean().optional(),
  includeHtmlReport: z.boolean().optional(),
  includeSidecars: z.boolean().optional(),
  format: z.string().trim().max(50).nullable().optional(),
});

export async function POST(request: Request, {params}: RouteContext) {
  return withApiHandler(async () => {
    const principal = await authenticateApiRequest(request);
    const {projectId: rawProjectId} = await params;
    const projectIdParsed = projectIdSchema.safeParse(rawProjectId);
    if (!projectIdParsed.success) {
      throw new ApiError("INVALID_REQUEST", "projectId must be a valid UUID.");
    }
    const projectId = projectIdParsed.data;

    await requireProjectAccess(principal, projectId, "exports:create");

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      throw new ApiError("INVALID_REQUEST", "Request body must be valid JSON.");
    }
    const parsed = createExportBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new ApiError("INVALID_REQUEST", "Invalid export payload.", {
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    return withIdempotentWrite({
      principal,
      request,
      routeKey: "POST /v1/projects/:projectId/exports",
      requestBody: rawBody,
      run: async (idempotencyKey) => {
        const result = await createExportJob({
          userId: principal.entitlementUserId,
          projectId,
          packageKind: parsed.data.packageKind,
          sourceFilter: parsed.data.sourceFilter,
          language: parsed.data.language,
          imageIds: parsed.data.imageIds,
          includeImages: parsed.data.includeImages,
          includeCsv: parsed.data.includeCsv,
          includeJson: parsed.data.includeJson,
          includeTxt: parsed.data.includeTxt,
          includeHtmlReport: parsed.data.includeHtmlReport,
          includeSidecars: parsed.data.includeSidecars,
          format: parsed.data.format,
          idempotencyKey,
        });

        if (!result.ok) {
          throw mapDomainError(result.error);
        }

        return {status: 202, data: result.job};
      },
    });
  });
}
