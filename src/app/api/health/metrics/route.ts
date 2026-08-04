export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const memory = process.memoryUsage();
  return Response.json(
    {
      status: "ok",
      checkedAt: new Date().toISOString(),
      metrics: {
        uptimeSec: Math.round(process.uptime()),
        node: process.version,
      },
      memory,
    },
    {
      status: 200,
      headers: {"Cache-Control": "no-store"},
    },
  );
}
