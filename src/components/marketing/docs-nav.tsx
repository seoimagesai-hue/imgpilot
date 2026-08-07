"use client";

import {useTranslations} from "next-intl";
import {Link, usePathname} from "@/i18n/navigation";

/** Only routes that have `app/.../docs/<slug>/page.tsx` implementations. */
export const DOCS_NAV = [
  {href: "/docs", key: "hub"},
  {href: "/docs/api", key: "api"},
  {href: "/docs/webhooks", key: "webhooks"},
  {href: "/docs/wordpress", key: "wordpress"},
  {href: "/docs/shopify", key: "shopify"},
  {href: "/docs/webflow", key: "webflow"},
  {href: "/docs/cloudinary", key: "cloudinary"},
  {href: "/docs/ai-batches", key: "aiBatches"},
  {href: "/docs/automation", key: "automation"},
  {href: "/docs/collaboration", key: "collaboration"},
] as const;

export function DocsSidebar() {
  const t = useTranslations("marketing.docs");
  const pathname = usePathname();

  return (
    <nav aria-label={t("navLabel")} className="space-y-1">
      {DOCS_NAV.map((item) => {
        const label = item.key === "hub" ? t("hubTitle") : t(item.key);
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-lg px-3 py-2 text-sm ${
              active
                ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent)]"
                : "text-[var(--muted)] hover:bg-white"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DocsPager({current}: {current: string}) {
  const t = useTranslations("marketing.docs");
  const idx = DOCS_NAV.findIndex((d) => d.href === current);
  const prev = idx > 0 ? DOCS_NAV[idx - 1] : null;
  const next = idx >= 0 && idx < DOCS_NAV.length - 1 ? DOCS_NAV[idx + 1] : null;
  const label = (key: (typeof DOCS_NAV)[number]["key"]) =>
    key === "hub" ? t("hubTitle") : t(key);

  return (
    <div className="mt-12 flex flex-wrap justify-between gap-4 border-t border-[var(--border)] pt-6 text-sm">
      {prev ? (
        <Link href={prev.href} className="font-semibold text-[var(--accent)]">
          ← {t("prev")}: {label(prev.key)}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={next.href} className="ms-auto font-semibold text-[var(--accent)]">
          {t("next")}: {label(next.key)} →
        </Link>
      ) : null}
    </div>
  );
}
