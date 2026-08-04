import {healthJson, probeQueue, type HealthPayload} from "@/server/health/probes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const queue = await probeQueue();
  const payload: HealthPayload = {
    status: queue.status,
    checkedAt: new Date().toISOString(),
    probes: {queue},
  };
  return healthJson(payload);
}
