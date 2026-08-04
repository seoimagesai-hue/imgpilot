"use client";

import {useEffect, useState} from "react";
import {useTranslations} from "next-intl";

type Props = {
  expiresAt: string | Date;
  /** When set, replaces the default expiry label and stacks the countdown. */
  labelPrefix?: string;
  align?: "start" | "end";
};

export function ExpiryCountdown({expiresAt, labelPrefix, align = "start"}: Props) {
  const t = useTranslations("guest.expiry");
  const target = typeof expiresAt === "string" ? new Date(expiresAt).getTime() : expiresAt.getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = Math.max(0, target - now);
  const alignClass = align === "end" ? "text-start sm:text-end" : "text-start";
  if (remaining <= 0) {
    return <p className={`text-sm text-red-700 ${alignClass}`}>{t("expired")}</p>;
  }
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  const clock = `${mins}:${secs.toString().padStart(2, "0")}`;

  if (labelPrefix) {
    return (
      <p className={`text-sm text-[var(--muted-foreground)] ${alignClass}`}>
        <span className="block">{labelPrefix}</span>
        <span className="mt-0.5 block font-semibold tabular-nums text-[var(--foreground)]">
          {clock}
        </span>
      </p>
    );
  }

  return (
    <p className={`text-sm text-[var(--muted-foreground)] ${alignClass}`}>
      {t("label")} {clock}
    </p>
  );
}
