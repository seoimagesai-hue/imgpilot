import {setRequestLocale} from "next-intl/server";
import {getStripeConfigStatus} from "@/server/billing/stripe-client";
import {isAppLocale} from "@/server/auth/validation";

export const metadata = {title: "Admin · Stripe status"};

type PageProps = {params: Promise<{locale: string}>};

export default async function AdminStripePage({params}: PageProps) {
  const {locale: rawLocale} = await params;
  const locale = isAppLocale(rawLocale) ? rawLocale : "en";
  setRequestLocale(locale);

  const stripe = getStripeConfigStatus();

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Stripe status</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Boolean configuration flags only — no secret values displayed.
        </p>
      </header>

      <dl className="max-w-lg space-y-4 rounded-xl border border-[var(--border)] p-5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--muted)]">Billing configured</dt>
          <dd className="font-medium">{stripe.configured ? "yes" : "no"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--muted)]">Mode</dt>
          <dd className="font-medium">{stripe.mode}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--muted)]">Publishable key configured</dt>
          <dd className="font-medium">{stripe.publishableConfigured ? "yes" : "no"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--muted)]">Pro monthly price configured</dt>
          <dd className="font-medium">{stripe.proMonthlyConfigured ? "yes" : "no"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--muted)]">Pro annual price configured</dt>
          <dd className="font-medium">{stripe.proAnnualConfigured ? "yes" : "no"}</dd>
        </div>
      </dl>
    </main>
  );
}
