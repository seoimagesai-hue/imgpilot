"use client";

import {useTranslations} from "next-intl";

type Props = {
  used: number;
  limit: number;
  maxMb: number;
  variant?: "default" | "premium";
  title?: string;
  body?: string;
};

export function GuestLimitBanner({used, limit, maxMb, variant = "default", title, body}: Props) {
  const t = useTranslations("guest.limitsBanner");
  const remaining = Math.max(0, limit - used);

  if (variant === "premium") {
    const usageLine =
      used === 0
        ? t("usedToday", {used, limit})
        : t("remaining", {remaining, limit});
    return (
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[var(--foreground)]">{title ?? t("guestUsage")}</p>
        {body === undefined ? (
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t("windowBody", {limit})}</p>
        ) : body ? (
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{body}</p>
        ) : null}
        <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{usageLine}</p>
        <p className="sr-only">{t("body", {used, limit, maxMb})}</p>
      </div>
    );
  }

  return (
    <aside className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 px-4 py-3 text-sm">
      <p className="font-medium">{title ?? t("title")}</p>
      <p className="mt-1 text-[var(--muted-foreground)]">
        {body ?? t("body", {used, limit, maxMb})}
      </p>
    </aside>
  );
}
