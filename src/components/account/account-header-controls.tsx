"use client";

import {useEffect, useId, useRef, useState, useTransition} from "react";
import {useLocale, useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";
import {logoutAction} from "@/server/auth/actions";
import type {UserAccessContext} from "@/server/account/access-context";

type Props = {
  access: UserAccessContext;
};

function initials(access: UserAccessContext): string {
  const seed = (access.displayName || access.email || "?").trim();
  const parts = seed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return seed.slice(0, 2).toUpperCase();
}

function UsageBar({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number;
}) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
        <span>{label}</span>
        <span>
          {used} / {limit > 0 ? limit : "—"}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[var(--accent)]"
          style={{width: `${pct}%`}}
          aria-hidden
        />
      </div>
    </div>
  );
}

export function AccountHeaderControls({access}: Props) {
  const t = useTranslations("account.header");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  if (!access.signedIn) {
    return (
      <>
        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--body)]">
            {t("signIn")}
          </Link>
          <Link href="/register" className="btn-primary px-4 text-sm">
            {t("createAccount")}
          </Link>
        </div>
        <div className="flex flex-wrap gap-2 pt-2 lg:hidden">
          <Link href="/login" className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
            {t("signIn")}
          </Link>
          <Link href="/register" className="btn-primary text-sm">
            {t("createAccount")}
          </Link>
        </div>
      </>
    );
  }

  const opsUsed = access.limits.standardOperationsUsed;
  const opsLimit = access.limits.standardOperationsLimit;

  return (
    <div ref={rootRef} className="relative flex items-center gap-2">
      <p className="hidden text-xs text-[var(--muted-foreground)] xl:block" aria-live="polite">
        {t("usageChip", {used: opsUsed, limit: opsLimit})}
      </p>
      <button
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-semibold text-[var(--accent-foreground)]"
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        aria-label={t("openMenu")}
        onClick={() => setOpen((v) => !v)}
      >
        {initials(access)}
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label={t("menuTitle")}
          className="absolute end-0 top-[calc(100%+0.5rem)] z-50 w-[min(100vw-2rem,400px)] rounded-2xl border border-[var(--border)] bg-white p-4 shadow-lg"
        >
          <div className="space-y-1 border-b border-[var(--border)] pb-3">
            <p className="truncate font-semibold">{access.displayName || t("account")}</p>
            <p className="truncate text-sm text-[var(--muted-foreground)]">{access.email}</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {access.planName}
              {access.entitlementState ? ` · ${access.entitlementState}` : ""}
            </p>
            <Link
              href="/account/billing"
              className="mt-2 inline-block text-sm font-medium text-[var(--accent)]"
              onClick={() => setOpen(false)}
            >
              {t("managePlan")}
            </Link>
          </div>

          <div className="space-y-3 border-b border-[var(--border)] py-3">
            <UsageBar label={t("ops")} used={opsUsed} limit={opsLimit} />
            <UsageBar
              label={t("ai")}
              used={access.limits.aiOperationsUsed}
              limit={access.limits.aiOperationsLimit}
            />
            <Link
              href="/account/usage"
              className="text-sm font-medium text-[var(--accent)]"
              onClick={() => setOpen(false)}
            >
              {t("viewUsage")}
            </Link>
          </div>

          <nav className="flex flex-col gap-1 pt-2 text-sm">
            <Link href="/account/settings" className="rounded-lg px-2 py-2 hover:bg-[var(--accent-soft)]" onClick={() => setOpen(false)}>
              {t("settings")}
            </Link>
            <Link href="/account/usage" className="rounded-lg px-2 py-2 hover:bg-[var(--accent-soft)]" onClick={() => setOpen(false)}>
              {t("usageLimits")}
            </Link>
            <Link href="/account/billing" className="rounded-lg px-2 py-2 hover:bg-[var(--accent-soft)]" onClick={() => setOpen(false)}>
              {t("billing")}
            </Link>
            <Link href="/account/history" className="rounded-lg px-2 py-2 hover:bg-[var(--accent-soft)]" onClick={() => setOpen(false)}>
              {t("history")}
            </Link>
            <Link href="/docs" className="rounded-lg px-2 py-2 hover:bg-[var(--accent-soft)]" onClick={() => setOpen(false)}>
              {t("help")}
            </Link>
            <button
              type="button"
              disabled={pending}
              className="rounded-lg px-2 py-2 text-start hover:bg-[var(--accent-soft)] disabled:opacity-60"
              onClick={() => {
                startTransition(async () => {
                  await logoutAction(locale);
                });
              }}
            >
              {t("signOut")}
            </button>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
