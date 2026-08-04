import {healthJson, probeR2, type HealthPayload} from "@/server/health/probes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const r2 = await probeR2();
  const payload: HealthPayload = {
    status: r2.status,
    checkedAt: new Date().toISOString(),
    probes: {storage: r2, r2},
  };
  return healthJson(payload);
}
