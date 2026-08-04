import {healthJson, probeScheduler, type HealthPayload} from "@/server/health/probes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const scheduler = await probeScheduler();
  const payload: HealthPayload = {
    status: scheduler.status,
    checkedAt: new Date().toISOString(),
    probes: {scheduler},
  };
  return healthJson(payload);
}
