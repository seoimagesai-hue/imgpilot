import {auth} from "@/auth";
import {
  countUsageInPeriod,
  resolveEntitlement,
} from "@/server/billing/entitlements";
import {getStripeConfigStatus} from "@/server/billing/stripe-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return Response.json({ok: false, error: "UNAUTHORIZED"}, {status: 401});
  }
  const entitlement = await resolveEntitlement(userId);
  const [processingUsed, aiUsed, exportUsed] = await Promise.all([
    countUsageInPeriod(userId, "processing", entitlement.periodStart, entitlement.periodEnd),
    countUsageInPeriod(userId, "ai", entitlement.periodStart, entitlement.periodEnd),
    countUsageInPeriod(userId, "export", entitlement.periodStart, entitlement.periodEnd),
  ]);
  const stripe = getStripeConfigStatus();
  return Response.json(
    {
      ok: true,
      billingConfigured: stripe.configured,
      paidLaunchReady: stripe.configured && (stripe.proMonthlyConfigured || stripe.proAnnualConfigured),
      planCode: entitlement.planCode,
      planDisplayName: entitlement.plan.displayName,
      subscriptionStatus: entitlement.subscriptionStatus,
      entitlementState: entitlement.entitlementState,
      billingInterval: entitlement.billingInterval,
      periodEnd: entitlement.periodEnd.toISOString(),
      cancelAtPeriodEnd: entitlement.cancelAtPeriodEnd,
      trialEnd: entitlement.trialEnd?.toISOString() ?? null,
      writesAllowed: entitlement.writesAllowed,
      usage: {
        processing: {used: processingUsed, limit: entitlement.plan.monthlyProcessingLimit},
        ai: {used: aiUsed, limit: entitlement.plan.monthlyAiLimit},
        export: {used: exportUsed, limit: entitlement.plan.monthlyExportLimit},
      },
      limits: {
        maxProjects: entitlement.plan.maxProjects,
        maxImagesPerProject: entitlement.plan.maxImagesPerProject,
        maxOriginalStorageBytes: entitlement.plan.maxOriginalStorageBytes,
      },
    },
    {headers: {"Cache-Control": "no-store"}},
  );
}
