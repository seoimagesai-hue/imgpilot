import {z} from "zod";
import {guestCatch, guestFail, guestOk} from "@/server/guest/http";
import {requireGuestSessionFromRequest} from "@/server/guest/require-guest";
import {createGuestRenamedDownload} from "@/server/guest/metadata-editor-service";

export const runtime = "nodejs";

const bodySchema = z.object({
  uploadId: z.string().uuid(),
  filenameBase: z.string().min(1).max(120),
});

export async function POST(request: Request) {
  try {
    const {session} = await requireGuestSessionFromRequest(request);
    const raw = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) return guestFail("INVALID_REQUEST");

    const result = await createGuestRenamedDownload({
      session,
      uploadId: parsed.data.uploadId,
      filenameBase: parsed.data.filenameBase,
    });
    return guestOk({
      url: result.url,
      expiresAt: result.expiresAt,
      filename: result.filename,
    });
  } catch (error) {
    return guestCatch(error);
  }
}
