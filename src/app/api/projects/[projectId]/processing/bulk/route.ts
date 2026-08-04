import {auth} from "@/auth";
import {z} from "zod";
import {projectIdSchema} from "@/server/projects/validation";
import {RESIZE_PRESET_IDS} from "@/lib/resize-presets";
import {CONVERSION_TARGET_FORMATS} from "@/lib/conversion-formats";
import {createBulkJob, listBulkJobs} from "@/server/images/bulk-service";
import {listFilteredReadyImageIds} from "@/server/images/library-queries";
import {parseLibraryQuery} from "@/server/images/library-query";

const createBodySchema = z
  .object({
    imageIds: z.array(z.string().uuid()).max(100).optional(),
    selectAllFiltered: z.boolean().optional(),
    operation: z.enum(["optimize_same_format", "resize", "convert_format"]).optional(),
    preset: z.string().min(2).max(32).optional(),
    targetFormat: z.enum(["jpeg", "png", "webp", "avif"]).optional(),
    idempotencyKey: z.string().min(8).max(128).optional(),
    q: z.string().max(100).optional(),
    status: z.string().optional(),
    sort: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    const op = value.operation ?? "optimize_same_format";
    if (op === "resize") {
      if (!value.preset || !(RESIZE_PRESET_IDS as readonly string[]).includes(value.preset)) {
        ctx.addIssue({code: z.ZodIssueCode.custom, message: "preset required", path: ["preset"]});
      }
    }
    if (op === "convert_format") {
      const target = value.targetFormat ?? value.preset?.replace(/^to_/, "");
      if (!target || !(CONVERSION_TARGET_FORMATS as readonly string[]).includes(target)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "targetFormat required",
          path: ["targetFormat"],
        });
      }
    }
    if (op === "optimize_same_format" && (value.preset || value.targetFormat)) {
      ctx.addIssue({code: z.ZodIssueCode.custom, message: "preset not allowed", path: ["preset"]});
    }
    if (!value.selectAllFiltered && (!value.imageIds || value.imageIds.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "imageIds required",
        path: ["imageIds"],
      });
    }
  });

export async function GET(
  _request: Request,
  context: {params: Promise<{projectId: string}>},
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ok: false, error: "UNAUTHORIZED"}, {status: 401});
  }
  const {projectId} = await context.params;
  if (!projectIdSchema.safeParse(projectId).success) {
    return Response.json({ok: false, error: "INVALID_REQUEST"}, {status: 400});
  }
  const jobs = await listBulkJobs({
    userId: session.user.id,
    projectId,
    limit: 20,
  });
  return Response.json({ok: true, jobs});
}

export async function POST(
  request: Request,
  context: {params: Promise<{projectId: string}>},
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ok: false, error: "UNAUTHORIZED"}, {status: 401});
  }

  const {projectId} = await context.params;
  const projectIdParsed = projectIdSchema.safeParse(projectId);
  if (!projectIdParsed.success) {
    return Response.json({ok: false, error: "INVALID_REQUEST"}, {status: 400});
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ok: false, error: "INVALID_REQUEST"}, {status: 400});
  }
  const parsed = createBodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ok: false, error: "INVALID_REQUEST"}, {status: 400});
  }

  let imageIds = parsed.data.imageIds ?? [];
  if (parsed.data.selectAllFiltered) {
    const libraryQuery = parseLibraryQuery({
      q: parsed.data.q,
      status: parsed.data.status,
      sort: parsed.data.sort,
    });
    imageIds = await listFilteredReadyImageIds(
      session.user.id,
      projectIdParsed.data,
      libraryQuery,
      100,
    );
  }

  const result = await createBulkJob({
    userId: session.user.id,
    projectId: projectIdParsed.data,
    imageIds,
    operation: parsed.data.operation,
    preset: parsed.data.preset,
    targetFormat: parsed.data.targetFormat,
    idempotencyKey: parsed.data.idempotencyKey,
  });

  if (!result.ok) {
    const status =
      result.error === "PROJECT_NOT_FOUND"
        ? 404
        : result.error === "BULK_EMPTY_SELECTION"
          ? 400
          : 400;
    return Response.json({ok: false, error: result.error}, {status});
  }

  return Response.json({ok: true, job: result.job, items: result.items});
}
