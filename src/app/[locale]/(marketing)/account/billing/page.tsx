import {setRequestLocale} from "next-intl/server";
import {
  countUsageInPeriod,
  resolveEntitlement,
} from "@/server/billing/entitlements";
import {getStripeConfigStatus} from "@/server/billing/stripe-client";
import {BillingActions} from "@/components/billing/billing-actions";
import {requireUser} from "@/server/auth/session";
import {isAppLocale} from "@/server/auth/validation";

type PageProps = {
  params: Promise<{locale: string}>;
  searchParams: Promise<{checkout?: string}>;
};

export default async function AccountBillingPage({params, searchParams}: PageProps) {
  const {locale: raw} = await params;
  const locale = isAppLocale(raw) ? raw : "en";
  setRequestLocale(locale);
  const session = await requireUser(locale, "/account/billing");
  const sp = await searchParams;
  const entitlement = await resolveEntitlement(session.user!.id);
  const [processingUsed, aiUsed] = await Promise.all([
    countUsageInPeriod(
      session.user!.id,
      "processing",
      entitlement.periodStart,
      entitlement.periodEnd,
    ),
    countUsageInPeriod(session.user!.id, "ai", entitlement.periodStart, entitlement.periodEnd),
  ]);
  const stripe = getStripeConfigStatus();

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Plan access comes from verified Stripe webhook state — not from the checkout redirect.
        </p>
      </header>

      {sp.checkout === "cancelled" ? (
        <p className="rounded-xl border border-[var(--border)] px-4 py-3 text-sm" role="status">
          Checkout was cancelled. No payment was made.
        </p>
      ) : null}

      {sp.checkout === "success" ? (
        <p className="rounded-xl border border-[var(--border)] px-4 py-3 text-sm" role="status">
          Checkout completed. Plan access updates after Stripe confirms the subscription.
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
          Processing used: {processingUsed} / {entitlement.plan.monthlyProcessingLimit}
        </p>
        <p>
          AI used: {aiUsed} / {entitlement.plan.monthlyAiLimit}
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
