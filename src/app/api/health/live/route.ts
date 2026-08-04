import {healthJson, probeLive, type HealthPayload} from "@/server/health/probes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const live = await probeLive();
  const payload: HealthPayload = {
    status: live.status,
    checkedAt: new Date().toISOString(),
    probes: {live},
  };
  return healthJson(payload);
}
