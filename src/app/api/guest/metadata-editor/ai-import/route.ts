import {z} from "zod";
import {guestCatch, guestFail, guestOk} from "@/server/guest/http";
import {requireGuestSessionFromRequest} from "@/server/guest/require-guest";
import {importAiIntoGuestMetadataEditor} from "@/server/guest/metadata-editor-service";
import {toGuestJobPublic} from "@/server/guest/processing-service";

export const runtime = "nodejs";

const bodySchema = z.object({
  jobId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const {session} = await requireGuestSessionFromRequest(request);
    const raw = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) return guestFail("INVALID_REQUEST");

    const job = await importAiIntoGuestMetadataEditor({
      session,
      jobId: parsed.data.jobId,
    });
    return guestOk({...toGuestJobPublic(job)});
  } catch (error) {
    return guestCatch(error);
  }
}
