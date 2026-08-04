"use client";

import {useState} from "react";
import {useLocale} from "next-intl";
import {Link} from "@/i18n/navigation";

export function PricingCheckoutActions(props: {
  checkoutAvailable: boolean;
  monthlyAvailable: boolean;
  annualAvailable: boolean;
}) {
  const locale = useLocale();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function start(interval: "month" | "year") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify({interval, locale}),
      });
      const body = (await res.json()) as {ok?: boolean; url?: string; error?: string};
      if (res.status === 401) {
        window.location.href = `/${locale}/login?callbackUrl=/${locale}/pricing`;
        return;
      }
      if (!res.ok || !body.url) {
        setError(
          body.error === "STRIPE_NOT_CONFIGURED" || body.error === "PRICE_UNAVAILABLE"
            ? "Paid checkout is not configured yet."
            : "Could not start checkout.",
        );
        return;
      }
      window.location.href = body.url;
    } catch {
      setError("Could not start checkout.");
    } finally {
      setBusy(false);
    }
  }

  if (!props.checkoutAvailable) {
    return (
      <div className="space-y-2 text-sm">
        <p>Upgrade unavailable until Stripe Price IDs are configured.</p>
        <Link href="/dashboard/settings/billing" className="underline">
          Account billing
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {props.monthlyAvailable ? (
        <button
          type="button"
          disabled={busy}
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
          onClick={() => void start("month")}
        >
          Upgrade monthly
        </button>
      ) : null}
      {props.annualAvailable ? (
        <button
          type="button"
          disabled={busy}
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
          onClick={() => void start("year")}
        >
          Upgrade annual
        </button>
      ) : null}
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
