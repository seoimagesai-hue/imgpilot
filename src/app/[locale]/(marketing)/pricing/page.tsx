import {setRequestLocale} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {getPublicPricingView} from "@/server/billing/pricing-view";
import {PricingCheckoutActions} from "@/components/billing/pricing-checkout-actions";

type PageProps = {params: Promise<{locale: string}>};

function formatBytes(n: number): string {
  if (n >= 1024 * 1024 * 1024) return `${Math.round(n / (1024 * 1024 * 1024))} GiB`;
  if (n >= 1024 * 1024) return `${Math.round(n / (1024 * 1024))} MiB`;
  return `${n} B`;
}

export default async function PricingPage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const view = getPublicPricingView();
  const cards = [view.guest, ...view.plans];

  return (
    <main className="mx-auto w-full max-w-5xl space-y-10 px-4 py-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Pricing</h1>
        <p className="max-w-2xl text-[var(--muted-foreground)]">
          Guest tools stay free. Free accounts unlock projects. Pro raises account limits when
          Stripe Price IDs are configured. Dollar amounts are never invented in this app.
        </p>
        {!view.paidLaunchReady ? (
          <p className="rounded-xl border border-[var(--border)] px-4 py-3 text-sm" role="status">
            Paid checkout is currently unavailable (Stripe Price IDs not configured). Free tools and
            Free accounts continue to work. Currency: {view.currency}. AI generation remains
            unavailable until a provider key is configured.
          </p>
        ) : null}
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        {cards.map((card) => (
          <article
            key={card.code}
            className="flex flex-col rounded-2xl border border-[var(--border)] p-5"
          >
            <h2 className="text-xl font-semibold">{card.displayName}</h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">{card.description}</p>
            <ul className="mt-4 flex-1 space-y-2 text-sm">
              <li>Max file: {formatBytes(card.display.maxFileBytes)}</li>
              <li>Bulk files: {card.display.bulkFiles}</li>
              <li>Bulk batch: {formatBytes(card.display.batchBytes)}</li>
              <li>
                Standard ops:{" "}
                {card.display.standardOpsPerPeriod == null
                  ? "—"
                  : card.code === "guest"
                    ? `${card.display.standardOpsPerPeriod} / 24h`
                    : `${card.display.standardOpsPerPeriod} / month`}
              </li>
              <li>
                AI allowance:{" "}
                {card.display.aiOpsPerPeriod
                  ? `${card.display.aiOpsPerPeriod} / month (provider required)`
                  : "Not included / unavailable"}
              </li>
              <li>ZIP: {card.display.zipDownload ? "Yes" : "No"}</li>
              <li>Saved history: {card.display.savedHistory ? "Yes" : "No"}</li>
              <li>Bulk AI: {card.display.bulkAi ? "Yes" : "No"}</li>
              {card.display.retentionHours != null ? (
                <li>Retention: {card.display.retentionHours} hour(s)</li>
              ) : null}
              {card.display.maxProjects != null ? (
                <li>Projects: {card.display.maxProjects}</li>
              ) : null}
            </ul>
            <div className="mt-5">
              {card.code === "guest" ? (
                <Link href="/compress-image" className="underline">
                  Start free
                </Link>
              ) : card.code === "free" ? (
                <Link href="/register" className="underline">
                  Create free account
                </Link>
              ) : (
                <PricingCheckoutActions
                  checkoutAvailable={card.checkoutAvailable}
                  monthlyAvailable={card.monthlyCheckoutAvailable}
                  annualAvailable={card.annualCheckoutAvailable}
                />
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-2 text-sm text-[var(--muted-foreground)]">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Honest limits</h2>
        <p>No “unlimited” claims. Exact Size resize remains locked. Teams/API/CMS are not sold on this page.</p>
        <p>
          Taxes and final Stripe amounts appear only on Stripe Checkout when Price IDs are
          configured by the operator.
        </p>
      </section>
    </main>
  );
}
