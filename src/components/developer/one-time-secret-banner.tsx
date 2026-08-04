"use client";

import {useState} from "react";
import {useTranslations} from "next-intl";
import {AlertTriangle, Check, Copy} from "lucide-react";

type OneTimeSecretBannerProps = {
  title: string;
  value: string;
  onDismiss?: () => void;
};

/**
 * Displays a raw API key / webhook secret exactly once. The value is passed
 * in from server-action state that only ever holds it in memory for this
 * single render pass — it is never re-fetched or persisted client-side.
 */
export function OneTimeSecretBanner({title, value, onDismiss}: OneTimeSecretBannerProps) {
  const t = useTranslations("developer.oneTime");
  const [copied, setCopied] = useState(false);

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — user can still select + copy manually
    }
  }

  return (
    <div
      role="alert"
      className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-amber-900">{title}</h3>
          <p className="mt-1 text-sm text-amber-800">{t("warning")}</p>
          <div className="mt-3 flex items-stretch gap-2">
            <code className="min-w-0 flex-1 overflow-x-auto whitespace-pre rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm">
              {value}
            </code>
            <button
              type="button"
              onClick={() => void copyValue()}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
            >
              {copied ? (
                <>
                  <Check className="size-4" aria-hidden="true" />
                  {t("copied")}
                </>
              ) : (
                <>
                  <Copy className="size-4" aria-hidden="true" />
                  {t("copy")}
                </>
              )}
            </button>
          </div>
          {onDismiss ? (
            <button
              type="button"
              onClick={onDismiss}
              className="mt-3 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-100"
            >
              {t("done")}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
