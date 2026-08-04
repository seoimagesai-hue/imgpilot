"use client";

import {useState} from "react";
import {useLocale} from "next-intl";

export function BillingActions(props: {canUpgrade: boolean; canManagePortal: boolean}) {
  const locale = useLocale();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function checkout(interval: "month" | "year") {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify({interval, locale}),
      });
      const body = (await res.json()) as {url?: string; error?: string};
      if (!res.ok || !body.url) {
        setMessage(
          body.error === "STRIPE_NOT_CONFIGURED" || body.error === "PRICE_UNAVAILABLE"
            ? "Paid checkout is not configured."
            : body.error === "ALREADY_SUBSCRIBED"
              ? "An active subscription already exists."
              : "Checkout failed.",
        );
        return;
      }
      window.location.href = body.url;
    } finally {
      setBusy(false);
    }
  }

  async function portal() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify({locale}),
      });
      const body = (await res.json()) as {url?: string; error?: string};
      if (!res.ok || !body.url) {
        setMessage("Billing portal is unavailable.");
        return;
      }
      window.location.href = body.url;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      {props.canUpgrade ? (
        <>
          <button
            type="button"
            disabled={busy}
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm"
            onClick={() => void checkout("month")}
          >
            Upgrade to Pro (monthly)
          </button>
          <button
            type="button"
            disabled={busy}
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm"
            onClick={() => void checkout("year")}
          >
            Upgrade to Pro (annual)
          </button>
        </>
      ) : null}
      {props.canManagePortal ? (
        <button
          type="button"
          disabled={busy}
          className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm"
          onClick={() => void portal()}
        >
          Manage subscription
        </button>
      ) : null}
      {message ? (
        <p className="w-full text-sm text-red-700" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}
