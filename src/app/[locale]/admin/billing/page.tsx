import {setRequestLocale} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {getStripeConfigStatus} from "@/server/billing/stripe-client";
import {listConsumerPricingPlans} from "@/server/billing/plan-catalog";
import {isAppLocale} from "@/server/auth/validation";

export const metadata = {title: "Admin · Billing"};

type PageProps = {params: Promise<{locale: string}>};

export default async function AdminBillingPage({params}: PageProps) {
  const {locale: rawLocale} = await params;
  const locale = isAppLocale(rawLocale) ? rawLocale : "en";
  setRequestLocale(locale);

  const stripe = getStripeConfigStatus();
  const consumerPlans = listConsumerPricingPlans();

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Stripe remains authoritative. Admin surfaces are read-only except event resync (future).
        </p>
      </header>

      <section className="mb-8 grid gap-4 sm:grid-cols-2">
        <article className="rounded-xl border border-[var(--border)] p-5">
          <h2 className="font-semibold">Stripe configuration</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--muted)]">Configured</dt>
              <dd>{stripe.configured ? "yes" : "no"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--muted)]">Mode</dt>
              <dd>{stripe.mode}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--muted)]">Publishable key</dt>
              <dd>{stripe.publishableConfigured ? "set" : "missing"}</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm">
            <Link href="/admin/stripe" className="text-[var(--accent)]">
              Stripe status →
            </Link>
          </p>
        </article>

        <article className="rounded-xl border border-[var(--border)] p-5">
          <h2 className="font-semibold">Consumer checkout plans</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {consumerPlans.map((plan) => (
              <li key={plan.code}>
                {plan.displayName} <span className="text-[var(--muted)]">({plan.code})</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="rounded-xl border border-[var(--border)] p-5 text-sm">
        <h2 className="font-semibold">Related admin pages</h2>
        <ul className="mt-3 list-inside list-disc space-y-1 text-[var(--accent)]">
          <li>
            <Link href="/admin/subscriptions">Subscriptions</Link>
          </li>
          <li>
            <Link href="/admin/payments">Payments / Stripe events</Link>
          </li>
          <li>
            <Link href="/admin/usage">Usage ledger</Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
