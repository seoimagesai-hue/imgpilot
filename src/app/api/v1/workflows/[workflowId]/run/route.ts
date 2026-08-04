import {NextResponse} from "next/server";

export const runtime = "nodejs";

/** Phase 1 stub — workflow run endpoint placeholder. */
export async function POST() {
  return NextResponse.json({ok: false, error: "UNAVAILABLE"}, {status: 501});
}
