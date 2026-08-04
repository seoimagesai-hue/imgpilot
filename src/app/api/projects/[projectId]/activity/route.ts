import {NextResponse} from "next/server";

export const runtime = "nodejs";

/** Phase 1 stub — activity API restored as unavailable placeholder. */
export async function GET() {
  return NextResponse.json({ok: false, error: "UNAVAILABLE"}, {status: 501});
}
