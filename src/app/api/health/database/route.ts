import {healthJson, probeDatabase, type HealthPayload} from "@/server/health/probes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const database = await probeDatabase();
  const payload: HealthPayload = {
    status: database.status,
    checkedAt: new Date().toISOString(),
    probes: {database},
  };
  return healthJson(payload);
}
