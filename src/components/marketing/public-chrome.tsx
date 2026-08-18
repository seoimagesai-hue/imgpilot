"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
} from "react";
import {useLocale, useTranslations} from "next-intl";
import {ChevronDown, LayoutGrid} from "lucide-react";
import {Link} from "@/i18n/navigation";
import {isRtlLocale} from "@/i18n/routing";
import {LanguageSwitcher} from "@/components/dashboard/language-switcher";
import {logoutAction} from "@/server/auth/actions";
import type {UserAccessContext} from "@/server/account/access-context";
import {
  DesktopMegaMenu,
  MEGA_MAX_WIDTH_PX,
  type DesktopMegaId,
} from "@/components/marketing/desktop-mega-menu";
import {
  APP_GRID_SECTIONS,
  BULK_TOOLS_ITEMS,
  COMPRESS_COLUMNS,
  CONVERT_COLUMNS,
  IMAGE_TOOLS_COLUMNS,
  RESIZE_COLUMNS,
  SEO_TOOLS_ITEMS,
  type NavLinkItem,
} from "@/lib/marketing/public-nav-catalog";

const FALLBACK_GUEST_ACCESS: UserAccessContext = {
  state: "guest",
  signedIn: false,
  planName: "Guest",
  planCode: "guest",
  entitlementState: null,
  displayName: null,
  email: null,
  limits: {
    maxFileBytes: 10 * 1024 * 1024,
    maxBulkFiles: 5,
    maxBatchBytes: 25 * 1024 * 1024,
    standardOperationsLimit: 5,
    standardOperationsUsed: 0,
    aiOperationsLimit: 5,
    aiOperationsUsed: 0,
    storageBytesLimit: 0,
    storageBytesUsed: 0,
    retentionHours: 1,
    periodEnd: null,
  },
  capabilities: {
    bulkCompress: true,
    bulkResize: true,
    bulkConvert: true,
    bulkAi: false,
    zipDownload: true,
    savedHistory: false,
    savedFiles: false,
  },
};

type MenuId = "image" | "compress" | "resize" | "convert" | "seo" | "bulk" | null;
type PanelId = "none" | MenuId | "account" | "apps";

function BrandMark({tone = "default"}: {tone?: "default" | "onDark"} = {}) {
  const logoSrc =
    tone === "onDark"
      ? "/brand/img-pilot-logo-horizontal-on-dark.svg"
      : "/brand/img-pilot-logo-horizontal.svg";
  return (
    <span className="inline-flex items-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- brand SVG lockup */}
      <img
        src={logoSrc}
        alt="Img Pilot"
        width={160}
        height={40}
        className="h-9 w-auto max-w-[10.5rem]"
        decoding="async"
      />
    </span>
  );
}

function MegaLink({item, onNavigate}: {item: NavLinkItem; onNavigate: () => void}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className="group flex gap-3 rounded-xl px-2.5 py-2.5 transition hover:bg-[var(--accent-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
    >
      <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-[var(--accent)] shadow-sm group-hover:border-[var(--accent)]/30">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-[var(--foreground)]">{item.title}</span>
        <span className="mt-0.5 block text-xs leading-snug text-[var(--muted-foreground)]">
          {item.description}
        </span>
      </span>
    </Link>
  );
}

function initials(access: UserAccessContext): string {
  const seed = (access.displayName || access.email || "?").trim();
  const parts = seed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return seed.slice(0, 2).toUpperCase();
}

function UsageBar({label, used, limit}: {label: string; used: number; limit: number}) {
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
        <div className="h-full rounded-full bg-[var(--accent)]" style={{width: `${pct}%`}} aria-hidden />
      </div>
    </div>
  );
}

type ChromeProps = {
  access: UserAccessContext;
  panel: PanelId;
  setPanel: (panel: PanelId) => void;
  menuBaseId: string;
};

function AppGridButton({
  open,
  controlsId,
  onToggle,
}: {
  open: boolean;
  controlsId: string;
  onToggle: () => void;
}) {
  const t = useTranslations("chrome");
  return (
    <button
      type="button"
      className={`inline-flex h-10 w-10 items-center justify-center rounded-[12px] border transition duration-150 motion-reduce:transition-none ${
        open
          ? "border-[color-mix(in_srgb,var(--accent)_35%,white)] bg-[var(--accent-soft)] text-[var(--accent)]"
          : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
      }`}
      aria-expanded={open}
      aria-haspopup="dialog"
      aria-controls={controlsId}
      aria-label={t("openAppGrid")}
      onClick={onToggle}
    >
      <LayoutGrid className="h-4 w-4" aria-hidden />
    </button>
  );
}

function AppGridPanel({
  id,
  onNavigate,
}: {
  id: string;
  onNavigate: () => void;
}) {
  const t = useTranslations("chrome");
  return (
    <div
      id={id}
      role="dialog"
      aria-label={t("appGridTitle")}
      className="absolute end-0 top-[calc(100%+0.55rem)] z-50 w-[min(100vw-1.5rem,640px)] rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.45)]"
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {APP_GRID_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1.5">
            <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
              {section.title}
            </p>
            {section.items.map((item) => (
                <MegaLink
                  key={`${section.title}-${item.title}`}
                  item={item}
                  onNavigate={onNavigate}
                />
              ))}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-3">
        <p className="text-xs text-[var(--muted-foreground)]">{t("languageHint")}</p>
        <LanguageSwitcher />
      </div>
    </div>
  );
}

function AccountMenuPanel({
  access,
  id,
  onNavigate,
}: {
  access: UserAccessContext;
  id: string;
  onNavigate: () => void;
}) {
  const t = useTranslations("account.header");
  const locale = useLocale();
  const [pending, startTransition] = useTransition();

  return (
    <div
      id={id}
      role="dialog"
      aria-label={t("menuTitle")}
      className="absolute end-0 top-[calc(100%+0.55rem)] z-50 w-[min(100vw-1.5rem,400px)] rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.45)]"
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
          onClick={onNavigate}
        >
          {t("managePlan")}
        </Link>
      </div>

      <div className="space-y-3 border-b border-[var(--border)] py-3">
        <UsageBar
          label={t("ops")}
          used={access.limits.standardOperationsUsed}
          limit={access.limits.standardOperationsLimit}
        />
        <UsageBar
          label={t("ai")}
          used={access.limits.aiOperationsUsed}
          limit={access.limits.aiOperationsLimit}
        />
        <Link
          href="/account/usage"
          className="text-sm font-medium text-[var(--accent)]"
          onClick={onNavigate}
        >
          {t("viewUsage")}
        </Link>
      </div>

      <nav className="flex flex-col gap-0.5 pt-2 text-sm">
        {(
          [
            ["/account/settings", t("settings")],
            ["/account/usage", t("usageLimits")],
            ["/account/billing", t("billing")],
            ["/account/history", t("history")],
            ["/docs", t("help")],
          ] as const
        ).map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className="rounded-lg px-2 py-2 hover:bg-[var(--accent-soft)]"
            onClick={onNavigate}
          >
            {label}
          </Link>
        ))}
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
  );
}

function HeaderRight({access, panel, setPanel, menuBaseId}: ChromeProps) {
  const t = useTranslations("account.header");
  const appsId = `${menuBaseId}-apps`;
  const accountId = `${menuBaseId}-account`;
  const opsLeft = Math.max(
    0,
    access.limits.standardOperationsLimit - access.limits.standardOperationsUsed,
  );

  if (!access.signedIn) {
    return (
      <div className="relative flex items-center gap-1.5">
        <Link
          href="/login"
          className="inline-flex h-10 items-center rounded-[12px] px-3.5 text-sm font-semibold text-slate-700 transition duration-150 hover:bg-slate-50 hover:text-slate-900 motion-reduce:transition-none"
        >
          {t("signIn")}
        </Link>
        <Link
          href="/register"
          className="inline-flex h-10 items-center rounded-[12px] px-4 text-sm font-semibold text-white shadow-[0_8px_18px_-8px_rgba(37,99,235,0.65)] transition duration-150 hover:brightness-105 motion-reduce:transition-none"
          style={{backgroundImage: "var(--gradient-brand)"}}
        >
          {t("createAccount")}
        </Link>
        <AppGridButton
          open={panel === "apps"}
          controlsId={appsId}
          onToggle={() => setPanel(panel === "apps" ? "none" : "apps")}
        />
        {panel === "apps" ? (
          <AppGridPanel id={appsId} onNavigate={() => setPanel("none")} />
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative flex items-center gap-1.5">
      <p
        className="hidden h-10 items-center rounded-full border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-600 xl:inline-flex"
        aria-live="polite"
      >
        {t("usageLeft", {left: opsLeft})}
      </p>
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-semibold text-[var(--accent-foreground)] shadow-[0_8px_18px_-8px_rgba(37,99,235,0.55)]"
        aria-expanded={panel === "account"}
        aria-controls={accountId}
        aria-haspopup="dialog"
        aria-label={t("openMenu")}
        onClick={() => setPanel(panel === "account" ? "none" : "account")}
      >
        {initials(access)}
      </button>
      <AppGridButton
        open={panel === "apps"}
        controlsId={appsId}
        onToggle={() => setPanel(panel === "apps" ? "none" : "apps")}
      />
      {panel === "account" ? (
        <AccountMenuPanel
          access={access}
          id={accountId}
          onNavigate={() => setPanel("none")}
        />
      ) : null}
      {panel === "apps" ? (
        <AppGridPanel id={appsId} onNavigate={() => setPanel("none")} />
      ) : null}
    </div>
  );
}

export function PublicHeader({access}: {access?: UserAccessContext} = {}) {
  const resolvedAccess = access ?? FALLBACK_GUEST_ACCESS;
  const tNav = useTranslations("guest.nav");
  const tChrome = useTranslations("chrome");
  const tAccount = useTranslations("account.header");
  const locale = useLocale();
  const [panel, setPanel] = useState<PanelId>("none");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaAlign, setMegaAlign] = useState<CSSProperties | undefined>(undefined);
  const rootRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const triggerRefs = useRef<Partial<Record<DesktopMegaId, HTMLButtonElement | null>>>({});
  const lastMegaTrigger = useRef<DesktopMegaId | null>(null);
  const menuBaseId = useId();
  const openMenu: MenuId =
    panel === "image" ||
    panel === "compress" ||
    panel === "resize" ||
    panel === "convert" ||
    panel === "seo" ||
    panel === "bulk"
      ? panel
      : null;
  const opsLeft = Math.max(
    0,
    resolvedAccess.limits.standardOperationsLimit - resolvedAccess.limits.standardOperationsUsed,
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      const prior = lastMegaTrigger.current;
      const shouldRestore = Boolean(openMenu && prior);
      setPanel("none");
      setMobileOpen(false);
      if (shouldRestore && prior) {
        queueMicrotask(() => triggerRefs.current[prior]?.focus());
      }
    }
    function onClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setPanel("none");
      }
    }
    const wide = window.matchMedia("(min-width: 1536px)");
    function onViewport() {
      if (wide.matches) setMobileOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    wide.addEventListener("change", onViewport);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
      wide.removeEventListener("change", onViewport);
    };
  }, [openMenu]);

  useLayoutEffect(() => {
    if (!openMenu || !navRef.current) {
      setMegaAlign(undefined);
      return;
    }
    const trigger = triggerRefs.current[openMenu];
    if (!trigger) {
      setMegaAlign(undefined);
      return;
    }

    function place() {
      const navEl = navRef.current;
      const btn = triggerRefs.current[openMenu!];
      if (!navEl || !btn) return;
      const navRect = navEl.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      const panelW = Math.min(window.innerWidth - 32, MEGA_MAX_WIDTH_PX[openMenu!]);
      let left = btnRect.left - navRect.left + btnRect.width / 2 - panelW / 2;
      const minLeft = 16 - navRect.left;
      const maxLeft = window.innerWidth - 16 - panelW - navRect.left;
      left = Math.min(Math.max(left, minLeft), maxLeft);
      setMegaAlign({left, width: panelW});
    }

    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [openMenu, locale]);

  function MenuButton({id, label}: {id: DesktopMegaId; label: string}) {
    const expanded = openMenu === id;
    return (
      <button
        ref={(el) => {
          triggerRefs.current[id] = el;
        }}
        type="button"
        className={`group inline-flex h-10 shrink-0 items-center gap-1 whitespace-nowrap rounded-[10px] px-2.5 text-[13px] font-semibold tracking-[-0.01em] transition-colors duration-150 motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
          expanded
            ? "bg-[var(--accent-soft)] text-[var(--accent)]"
            : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
        }`}
        aria-expanded={expanded}
        aria-haspopup="true"
        aria-controls={`${menuBaseId}-${id}`}
        onClick={() => {
          if (expanded) {
            setPanel("none");
            return;
          }
          lastMegaTrigger.current = id;
          setPanel(id);
        }}
      >
        <span>{label}</span>
        <ChevronDown
          aria-hidden
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-150 motion-reduce:transition-none ${
            expanded
              ? "rotate-180 text-[var(--accent)]"
              : "text-slate-400 group-hover:text-slate-500"
          }`}
        />
      </button>
    );
  }

  return (
    <header
      ref={rootRef}
      className="sticky top-0 z-40 overflow-visible border-b border-slate-200/70 bg-white/95 shadow-[0_8px_24px_-20px_rgba(15,23,42,0.35)] backdrop-blur-md"
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-[var(--accent)] focus:px-3 focus:py-2 focus:text-[var(--accent-foreground)]"
      >
        Skip to content
      </a>
      <div className="marketing-container relative flex h-[72px] items-center gap-2 sm:gap-3">
        {/*
          Keep logo + auth as true shrink-0 islands. Long locale labels make the
          center mega-nav wider than lg/xl; collapse until 2xl so it never
          paints under the brand or Sign in controls.
        */}
        <Link
          href="/"
          className="relative z-20 shrink-0 bg-white/95 pe-1 backdrop-blur-sm"
          onClick={() => setPanel("none")}
        >
          <BrandMark />
          <span className="sr-only">{tNav("brand")}</span>
        </Link>

        <nav
          ref={navRef}
          className="relative z-10 hidden min-w-0 flex-1 items-center justify-center gap-0.5 overflow-visible px-1 2xl:flex"
          aria-label={tNav("tools")}
        >
          <MenuButton id="image" label={tChrome("imageTools")} />
          <MenuButton id="compress" label={tChrome("compress")} />
          <MenuButton id="resize" label={tChrome("resize")} />
          <MenuButton id="convert" label={tChrome("convert")} />
          <MenuButton id="seo" label={tChrome("seoTools")} />
          <MenuButton id="bulk" label={tChrome("bulkTools")} />
          <span className="mx-1 h-4 w-px shrink-0 bg-slate-200" aria-hidden />
          <Link
            href="/pricing"
            className="inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-[10px] px-2.5 text-[13px] font-semibold tracking-[-0.01em] text-slate-600 transition-colors duration-150 hover:bg-slate-100/80 hover:text-slate-900 motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            onClick={() => setPanel("none")}
          >
            {tNav("pricing")}
          </Link>

          {openMenu ? (
            <DesktopMegaMenu
              menu={openMenu}
              panelId={`${menuBaseId}-${openMenu}`}
              onNavigate={() => setPanel("none")}
              alignStyle={megaAlign}
            />
          ) : null}
        </nav>

        <div className="relative z-20 ms-auto flex shrink-0 items-center justify-end gap-1.5 bg-white/95 ps-1 backdrop-blur-sm">
          {/* Auth/app controls stay visible mid-width; mega-nav collapses until 2xl. */}
          <div className="hidden md:block">
            <HeaderRight
              access={resolvedAccess}
              panel={panel}
              setPanel={setPanel}
              menuBaseId={menuBaseId}
            />
          </div>
          <button
            type="button"
            className="inline-flex h-10 items-center rounded-[12px] border border-slate-200 px-3 text-sm font-semibold text-slate-700 2xl:hidden"
            aria-expanded={mobileOpen}
            aria-controls={`${menuBaseId}-mobile`}
            onClick={() => {
              setMobileOpen((v) => !v);
              setPanel("none");
            }}
          >
            {mobileOpen ? tChrome("close") : tChrome("menu")}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div
          id={`${menuBaseId}-mobile`}
          className="max-h-[min(80vh,720px)] overflow-y-auto border-t border-[var(--border)] bg-white 2xl:hidden"
        >
          <div className="marketing-container space-y-2 py-4" dir={isRtlLocale(locale) ? "rtl" : "ltr"}>
            {(
              [
                ["Image Tools", IMAGE_TOOLS_COLUMNS.filter((c) => c.title === "Optimize" || c.title === "Edit & create").flatMap((c) => c.items)],
                ["Compress", COMPRESS_COLUMNS.flatMap((c) => c.items)],
                ["Resize", RESIZE_COLUMNS.flatMap((c) => c.items)],
                ["Convert", CONVERT_COLUMNS.flatMap((c) => c.items)],
                ["SEO Tools", SEO_TOOLS_ITEMS],
                ["Bulk Tools", BULK_TOOLS_ITEMS],
              ] as const
            ).map(([label, items]) => (
              <details key={label} className="rounded-xl border border-[var(--border)] px-3">
                <summary className="cursor-pointer py-3 font-medium">{label}</summary>
                <div className="flex flex-col gap-1 pb-3 ps-1">
                  {items.map((item) => (
                    <Link
                      key={`${label}-${item.title}`}
                      href={item.href}
                      className="rounded-lg px-2 py-2 text-sm hover:bg-[var(--accent-soft)]"
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              </details>
            ))}
            <Link
              href="/pricing"
              className="block rounded-xl border border-[var(--border)] px-3 py-3 font-medium"
              onClick={() => setMobileOpen(false)}
            >
              {tNav("pricing")}
            </Link>
            <div className="space-y-2 border-t border-[var(--border)] pt-3">
              {resolvedAccess.signedIn ? (
                <>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {tAccount("usageLeft", {left: opsLeft})}
                  </p>
                  <Link
                    href="/account"
                    className="block rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
                    onClick={() => setMobileOpen(false)}
                  >
                    {tAccount("account")}
                  </Link>
                  <Link
                    href="/account/billing"
                    className="block rounded-lg px-3 py-2 text-sm"
                    onClick={() => setMobileOpen(false)}
                  >
                    {tAccount("billing")}
                  </Link>
                  <Link
                    href="/account/settings"
                    className="block rounded-lg px-3 py-2 text-sm"
                    onClick={() => setMobileOpen(false)}
                  >
                    {tAccount("settings")}
                  </Link>
                </>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/login"
                    className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
                    onClick={() => setMobileOpen(false)}
                  >
                    {tAccount("signIn")}
                  </Link>
                  <Link
                    href="/register"
                    className="btn-primary text-sm"
                    onClick={() => setMobileOpen(false)}
                  >
                    {tAccount("createAccount")}
                  </Link>
                </div>
              )}
              <div className="pt-1">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function FooterCol({title, links}: {title: string; links: {href: string; label: string}[]}) {
  return (
    <div className="space-y-3 text-sm">
      <p className="font-semibold text-white">{title}</p>
      <ul className="space-y-2 text-slate-300">
        {links.map((link) => (
          <li key={`${title}-${link.href}-${link.label}`}>
            <Link href={link.href} className="hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PublicFooter({signedIn = false}: {signedIn?: boolean} = {}) {
  const year = new Date().getFullYear();
  const tChrome = useTranslations("chrome");
  return (
    <footer className="mt-auto bg-[var(--footer)] text-slate-300">
      <div className="marketing-container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="space-y-3 sm:col-span-2 lg:col-span-3 xl:col-span-1">
          <BrandMark tone="onDark" />
          <p className="text-sm leading-relaxed text-slate-400">{tChrome("footerBlurb")}</p>
        </div>
        <FooterCol
          title={tChrome("imageTools")}
          links={[
            {href: "/compress-image", label: "Compress Image"},
            {href: "/resize-image", label: "Resize Image"},
            {href: "/crop-image", label: "Crop Image"},
            {href: "/convert-image", label: "Convert Image"},
            {href: "/rotate-image", label: "Rotate Image"},
            {href: "/watermark-image", label: "Watermark Image"},
            {href: "/blur-region", label: "Blur Region"},
            {href: "/meme-generator", label: "Meme Generator"},
            {href: "/bulk-image-tools", label: "Bulk Image Tools"},
          ]}
        />
        <FooterCol
          title={tChrome("popularFormats")}
          links={[
            {href: "/compress-jpg", label: "Compress JPG"},
            {href: "/compress-png", label: "Compress PNG"},
            {href: "/resize-jpg", label: "Resize JPG"},
            {href: "/resize-png", label: "Resize PNG"},
            {href: "/png-to-webp", label: "PNG to WebP"},
            {href: "/jpg-to-webp", label: "JPG to WebP"},
            {href: "/webp-to-jpg", label: "WebP to JPG"},
          ]}
        />
        <FooterCol
          title={tChrome("seoTools")}
          links={[
            {href: "/image-metadata", label: "Image Metadata Viewer"},
            {href: "/image-metadata-editor", label: "Image SEO Metadata Editor"},
            {href: "/geotag-image", label: "Geotag Image"},
          ]}
        />
        <FooterCol
          title={tChrome("company")}
          links={[
            {href: "/pricing", label: "Pricing"},
            {href: "/about", label: "About"},
            {href: "/contact", label: "Contact"},
            {href: "/privacy", label: "Privacy Policy"},
            {href: "/terms", label: "Terms of Service"},
            {href: "/cookies", label: "Cookie Policy"},
          ]}
        />
        <FooterCol
          title={tChrome("resources")}
          links={[
            {href: "/search", label: "Search Tools"},
            {href: "/#supported-formats", label: "Supported Formats"},
            {href: "/#faq", label: "Frequently Asked Questions"},
            {
              href: signedIn ? "/account" : "/login",
              label: signedIn ? "Account" : "Account Login",
            },
          ]}
        />
      </div>
      <div className="border-t border-white/10">
        <div className="marketing-container flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-400">
            © {year} Img Pilot. {tChrome("rights")}
          </p>
          <div className="[&_label]:text-slate-300 [&_select]:border-white/20 [&_select]:bg-[#111827] [&_select]:text-white">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </footer>
  );
}

/** @deprecated Prefer PublicHeader / PublicFooter */
export {PublicHeader as ConsumerHeader, PublicFooter as ConsumerFooter};

export function ConsumerToolNav() {
  return null;
}
