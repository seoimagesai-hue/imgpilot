import {auth} from "@/auth";
import {setRequestLocale} from "next-intl/server";
import {redirect} from "@/i18n/navigation";
import {
  countUsageInPeriod,
  resolveEntitlement,
} from "@/server/billing/entitlements";
import {getStripeConfigStatus} from "@/server/billing/stripe-client";
import {BillingActions} from "@/components/billing/billing-actions";

type PageProps = {
  params: Promise<{locale: string}>;
  searchParams: Promise<{checkout?: string}>;
};

export default async function BillingSettingsPage({params, searchParams}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const session = await auth();
  if (!session?.user?.id) {
    redirect({href: "/login", locale});
    return null;
  }
  const sp = await searchParams;
  const entitlement = await resolveEntitlement(session.user.id);
  const [processingUsed, aiUsed] = await Promise.all([
    countUsageInPeriod(
      session.user.id,
      "processing",
      entitlement.periodStart,
      entitlement.periodEnd,
    ),
    countUsageInPeriod(session.user.id, "ai", entitlement.periodStart, entitlement.periodEnd),
  ]);
  const stripe = getStripeConfigStatus();

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Plan access comes from verified Stripe webhook state — not from the checkout redirect.
        </p>
      </header>

      {sp.checkout === "cancelled" ? (
        <p className="rounded-xl border border-[var(--border)] px-4 py-3 text-sm" role="status">
          Checkout was cancelled. No payment was made.
        </p>
      ) : null}

      {!stripe.configured || !(stripe.proMonthlyConfigured || stripe.proAnnualConfigured) ? (
        <p className="rounded-xl border border-[var(--border)] px-4 py-3 text-sm" role="status">
          Stripe checkout is not configured yet. Free-plan limits still apply.
        </p>
      ) : null}

      <section className="space-y-2 rounded-2xl border border-[var(--border)] p-5 text-sm">
        <p>
          <span className="font-medium">Current plan:</span> {entitlement.plan.displayName}
        </p>
        <p>
          <span className="font-medium">Status:</span> {entitlement.subscriptionStatus} (
          {entitlement.entitlementState})
        </p>
        <p>
          <span className="font-medium">Period ends:</span>{" "}
          {entitlement.periodEnd.toISOString().slice(0, 10)}
        </p>
        <p>
          <span className="font-medium">Cancel at period end:</span>{" "}
          {entitlement.cancelAtPeriodEnd ? "Yes" : "No"}
        </p>
        <p>
          Processing used: {processingUsed} / {entitlement.plan.monthlyProcessingLimit}
        </p>
        <p>
          AI used: {aiUsed} / {entitlement.plan.monthlyAiLimit} (provider must also be configured)
        </p>
        <p>
          Projects: up to {entitlement.plan.maxProjects}; writes allowed:{" "}
          {entitlement.writesAllowed ? "yes" : "no"}
        </p>
      </section>

      <BillingActions
        canUpgrade={
          entitlement.planCode === "free" &&
          stripe.configured &&
          (stripe.proMonthlyConfigured || stripe.proAnnualConfigured)
        }
        canManagePortal={stripe.configured}
      />
    </main>
  );
}
