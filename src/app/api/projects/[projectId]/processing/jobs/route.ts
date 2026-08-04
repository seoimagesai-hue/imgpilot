import {auth} from "@/auth";
import {z} from "zod";
import {projectIdSchema} from "@/server/projects/validation";
import {createProcessingJob} from "@/server/images/processing-service";
import {RESIZE_PRESET_IDS} from "@/lib/resize-presets";
import {CONVERSION_TARGET_FORMATS} from "@/lib/conversion-formats";
import {conversionPresetForTarget} from "@/server/images/conversion-policy";

const bodySchema = z
  .object({
    imageId: z.string().uuid(),
    idempotencyKey: z.string().min(8).max(128).optional(),
    operation: z.enum(["optimize_same_format", "resize", "convert_format"]).optional(),
    preset: z.string().min(2).max(32).optional(),
    /** Preferred for convert_format — mapped to preset server-side. */
    targetFormat: z.enum(["jpeg", "png", "webp", "avif"]).optional(),
  })
  .superRefine((value, ctx) => {
    const op = value.operation ?? "optimize_same_format";
    if (op === "resize") {
      if (!value.preset || !(RESIZE_PRESET_IDS as readonly string[]).includes(value.preset)) {
        ctx.addIssue({code: z.ZodIssueCode.custom, message: "preset required", path: ["preset"]});
      }
      if (value.targetFormat) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "targetFormat not allowed",
          path: ["targetFormat"],
        });
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
  });

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
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ok: false, error: "INVALID_REQUEST"}, {status: 400});
  }

  const operation = parsed.data.operation ?? "optimize_same_format";
  let preset: string | null = parsed.data.preset ?? null;
  if (operation === "convert_format") {
    const target = (parsed.data.targetFormat ??
      parsed.data.preset?.replace(/^to_/, "")) as (typeof CONVERSION_TARGET_FORMATS)[number];
    preset = conversionPresetForTarget(target);
  }

  const result = await createProcessingJob({
    userId: session.user.id,
    projectId: projectIdParsed.data,
    imageId: parsed.data.imageId,
    idempotencyKey: parsed.data.idempotencyKey,
    operation,
    preset,
  });

  if (!result.ok) {
    const status =
      result.error === "PROJECT_NOT_FOUND" || result.error === "IMAGE_NOT_FOUND"
        ? 404
        : result.error === "IMAGE_NOT_READY"
          ? 409
          : 400;
    return Response.json({ok: false, error: result.error}, {status});
  }

  return Response.json({ok: true, job: result.job});
}
