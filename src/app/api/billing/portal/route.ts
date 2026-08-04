import {z} from "zod";
import {auth} from "@/auth";
import {createBillingPortalSession} from "@/server/billing/checkout-service";

export const runtime = "nodejs";

const bodySchema = z.object({
  locale: z.enum(["en", "ur"]).optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return Response.json({ok: false, error: "UNAUTHORIZED"}, {status: 401});
  }
  const raw = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(raw);
  const result = await createBillingPortalSession({
    userId,
    locale: parsed.success ? (parsed.data.locale ?? "en") : "en",
  });
  if ("error" in result) {
    const status = result.error === "STRIPE_NOT_CONFIGURED" ? 503 : 400;
    return Response.json({ok: false, error: result.error}, {status});
  }
  return Response.json({ok: true, url: result.url});
}
