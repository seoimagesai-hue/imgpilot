import {
  getCronSecret,
  runAuthenticatedCleanupJob,
  verifyCronSecret,
} from "@/server/ops/cleanup-scheduler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!getCronSecret()) {
    return Response.json({ok: false, error: "CRON_NOT_CONFIGURED"}, {status: 503});
  }
  const provided =
    request.headers.get("x-cron-secret") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    null;
  if (!verifyCronSecret(provided)) {
    return Response.json({ok: false, error: "UNAUTHORIZED"}, {status: 401});
  }
  try {
    const result = await runAuthenticatedCleanupJob();
    if (result.overlap) {
      return Response.json(
        {ok: true, overlap: true, message: "cleanup_already_running"},
        {status: 202, headers: {"Cache-Control": "no-store"}},
      );
    }
    return Response.json(
      {
        ok: true,
        reconciled: result.reconciled,
        processed: result.processed,
        succeeded: result.succeeded,
        failed: result.failed,
      },
      {headers: {"Cache-Control": "no-store"}},
    );
  } catch {
    return Response.json({ok: false, error: "CLEANUP_FAILED"}, {status: 500});
  }
}

export async function GET() {
  return Response.json({ok: false, error: "METHOD_NOT_ALLOWED"}, {status: 405});
}
