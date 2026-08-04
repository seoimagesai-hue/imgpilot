import {healthJson, probeWorker, type HealthPayload} from "@/server/health/probes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const worker = await probeWorker();
  const payload: HealthPayload = {
    status: worker.status,
    checkedAt: new Date().toISOString(),
    probes: {worker},
  };
  return healthJson(payload);
}
