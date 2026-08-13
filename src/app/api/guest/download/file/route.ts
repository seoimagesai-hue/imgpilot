import {guestCatch, guestFail} from "@/server/guest/http";
import {requireGuestSessionFromRequest} from "@/server/guest/require-guest";
import {loadGuestDownloadBytes} from "@/server/guest/download-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeDownloadFilename(raw: string | null): string {
  const fallback = "compressed-image";
  if (!raw) return fallback;
  const trimmed = raw.replace(/[/\\]/g, "").replace(/[\r\n"]/g, "").slice(0, 180).trim();
  return trimmed || fallback;
}

export async function GET(request: Request) {
  try {
    const {session} = await requireGuestSessionFromRequest(request);
    const url = new URL(request.url);
    const jobId = url.searchParams.get("jobId") ?? undefined;
    const uploadId = url.searchParams.get("uploadId") ?? undefined;
    if (!jobId && !uploadId) return guestFail("INVALID_REQUEST");

    const file = await loadGuestDownloadBytes({session, jobId, uploadId});
    const filename = safeDownloadFilename(url.searchParams.get("filename"));
    const ascii = filename.replace(/[^\x20-\x7E]/g, "_");

    return new Response(new Uint8Array(file.body), {
      status: 200,
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return guestCatch(error);
  }
}
