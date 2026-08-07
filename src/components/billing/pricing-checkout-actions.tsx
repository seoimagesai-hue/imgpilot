"use client";

import {useState} from "react";
import {useLocale} from "next-intl";

export function PricingCheckoutActions(props: {
  checkoutAvailable: boolean;
  monthlyAvailable: boolean;
  annualAvailable: boolean;
  preferredInterval?: "month" | "year";
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
      <div className="space-y-2">
        <button
          type="button"
          disabled
          className="inline-flex h-12 w-full cursor-not-allowed items-center justify-center rounded-2xl bg-slate-900/80 px-4 text-sm font-semibold text-white opacity-80"
        >
          Coming Soon
        </button>
        <p className="text-center text-xs text-slate-500">
          Stripe Price IDs are not configured yet.
        </p>
      </div>
    );
  }

  const preferred = props.preferredInterval ?? "month";
  const interval: "month" | "year" =
    preferred === "year" && props.annualAvailable
      ? "year"
      : preferred === "month" && props.monthlyAvailable
        ? "month"
        : props.monthlyAvailable
          ? "month"
          : "year";

  const canStart =
    (interval === "month" && props.monthlyAvailable) ||
    (interval === "year" && props.annualAvailable);

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={busy || !canStart}
        className="inline-flex h-12 w-full items-center justify-center rounded-2xl px-4 text-sm font-semibold text-white shadow-[0_12px_28px_-12px_rgba(37,99,235,0.85)] transition duration-150 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
        style={{backgroundImage: "var(--gradient-brand)"}}
        onClick={() => void start(interval)}
      >
        {busy ? "Starting…" : "Upgrade to Pro"}
      </button>
      {error ? (
        <p className="text-center text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
