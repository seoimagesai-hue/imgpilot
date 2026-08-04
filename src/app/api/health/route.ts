import {buildFullHealth, healthJson} from "@/server/health/probes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const payload = await buildFullHealth();
  return healthJson(payload);
}
