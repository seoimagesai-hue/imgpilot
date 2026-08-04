"use client";

import {useEffect, useId, useRef, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";
import {LanguageSwitcher} from "@/components/dashboard/language-switcher";
import {AccountHeaderControls} from "@/components/account/account-header-controls";
import {listIndexableToolLandings} from "@/lib/marketing/tool-landing-registry";
import type {UserAccessContext} from "@/server/account/access-context";

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

type MenuId = "image" | "resize" | "compress" | "convert" | "seo" | "bulk" | null;

const IMAGE_TOOLS = [
  {href: "/resize-image", label: "Resize Image"},
  {href: "/compress-image", label: "Compress Image"},
  {href: "/crop-image", label: "Crop Image"},
  {href: "/convert-image", label: "Convert Image"},
  {href: "/geotag-image", label: "Geotag Image"},
  {href: "/image-metadata", label: "Metadata Viewer"},
] as const;

const SEO_TOOLS = [
  {href: "/ai-alt-text", label: "AI Alt Text Generator"},
  {href: "/image-metadata", label: "Image Metadata Viewer"},
  {href: "/image-metadata-editor", label: "Image SEO Metadata Editor"},
  {href: "/geotag-image", label: "Geotag Image"},
] as const;

function landingLinks(prefix: string) {
  return listIndexableToolLandings()
    .filter((d) => d.slug.startsWith(prefix))
    .map((d) => ({href: `/${d.slug}`, label: d.h1}));
}

function convertColumns() {
  const all = listIndexableToolLandings().filter((d) => d.operation === "convert");
  return {
    jpg: all.filter((d) => d.targetFormat === "jpeg"),
    png: all.filter((d) => d.targetFormat === "png"),
    webp: all.filter((d) => d.targetFormat === "webp"),
    avif: all.filter((d) => d.targetFormat === "avif"),
  };
}

function BrandMark() {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white"
        style={{backgroundImage: "var(--gradient-brand)"}}
        aria-hidden
      >
        SI
      </span>
      <span className="text-lg font-semibold tracking-tight">SEO Images</span>
    </span>
  );
}

export function PublicHeader({access}: {access?: UserAccessContext} = {}) {
  const resolvedAccess = access ?? FALLBACK_GUEST_ACCESS;
  const t = useTranslations("guest.nav");
  const locale = useLocale();
  const [open, setOpen] = useState<MenuId>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const menuBaseId = useId();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(null);
        setMobileOpen(false);
      }
    }
    function onClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(null);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  const resizeLinks = [
    ...landingLinks("resize-").filter((l) => !l.href.includes("to-")),
    {href: "/resize-image", label: "Resize Image (all formats)"},
  ];
  const compressLinks = [
    ...landingLinks("compress-"),
    {href: "/compress-image", label: "Compress Image (all formats)"},
  ];
  const convert = convertColumns();

  function MenuButton({id, label}: {id: Exclude<MenuId, null>; label: string}) {
    const expanded = open === id;
    return (
      <button
        type="button"
        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-medium transition ${
          expanded
            ? "bg-[var(--accent-soft)] text-[var(--accent)]"
            : "text-[var(--body)] hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]"
        }`}
        aria-expanded={expanded}
        aria-haspopup="true"
        aria-controls={`${menuBaseId}-${id}`}
        onClick={() => setOpen(expanded ? null : id)}
      >
        {label}
        <span aria-hidden className={`text-[10px] transition ${expanded ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>
    );
  }

  return (
    <header
      ref={rootRef}
      className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/85 backdrop-blur-md"
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-[var(--accent)] focus:px-3 focus:py-2 focus:text-[var(--accent-foreground)]"
      >
        Skip to content
      </a>
      <div className="marketing-container flex min-h-[74px] items-center justify-between gap-3">
        <Link href="/" className="shrink-0">
          <BrandMark />
          <span className="sr-only">{t("brand")}</span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label={t("tools")}>
          <MenuButton id="image" label="Image Tools" />
          <MenuButton id="resize" label="Resize" />
          <MenuButton id="compress" label="Compress" />
          <MenuButton id="convert" label="Convert" />
          <MenuButton id="seo" label="SEO Tools" />
          <MenuButton id="bulk" label="Bulk Tools" />
          <Link
            href="/pricing"
            className="rounded-lg px-2.5 py-2 text-sm font-medium text-[var(--body)] hover:text-[var(--foreground)]"
          >
            {t("pricing")}
          </Link>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <AccountHeaderControls access={resolvedAccess} />
        </div>

        <button
          type="button"
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm lg:hidden"
          aria-expanded={mobileOpen}
          aria-controls={`${menuBaseId}-mobile`}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? "Close" : "Menu"}
        </button>
      </div>

      {open ? (
        <div id={`${menuBaseId}-${open}`} className="hidden border-t border-[var(--border)] bg-white lg:block">
          <div className="marketing-container grid gap-4 py-5 md:grid-cols-2 lg:grid-cols-4">
            {open === "image"
              ? IMAGE_TOOLS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-xl border border-[var(--border)] px-3 py-3 hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
                    onClick={() => setOpen(null)}
                  >
                    {item.label}
                  </Link>
                ))
              : null}
            {open === "resize"
              ? resizeLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-xl border border-[var(--border)] px-3 py-3 hover:bg-[var(--accent-soft)]"
                    onClick={() => setOpen(null)}
                  >
                    {item.label}
                  </Link>
                ))
              : null}
            {open === "compress"
              ? compressLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-xl border border-[var(--border)] px-3 py-3 hover:bg-[var(--accent-soft)]"
                    onClick={() => setOpen(null)}
                  >
                    {item.label}
                  </Link>
                ))
              : null}
            {open === "convert"
              ? (["jpg", "png", "webp", "avif"] as const).map((col) => (
                  <div key={col} className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                      To {col.toUpperCase()}
                    </p>
                    {convert[col].map((d) => (
                      <Link
                        key={d.slug}
                        href={`/${d.slug}`}
                        className="block rounded-lg px-2 py-1.5 text-sm hover:bg-[var(--accent-soft)]"
                        onClick={() => setOpen(null)}
                      >
                        {d.h1}
                      </Link>
                    ))}
                  </div>
                ))
              : null}
            {open === "seo"
              ? SEO_TOOLS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-xl border border-[var(--border)] px-3 py-3 hover:bg-[var(--accent-soft)]"
                    onClick={() => setOpen(null)}
                  >
                    {item.label}
                  </Link>
                ))
              : null}
            {open === "bulk" ? (
              <Link
                href="/bulk-image-tools"
                className="rounded-xl border border-[var(--border)] px-3 py-3 hover:bg-[var(--accent-soft)]"
                onClick={() => setOpen(null)}
              >
                Bulk Compress, Resize & Convert
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      {mobileOpen ? (
        <div id={`${menuBaseId}-mobile`} className="border-t border-[var(--border)] bg-white lg:hidden">
          <div className="marketing-container space-y-3 py-4" dir={locale === "ur" ? "rtl" : "ltr"}>
            <details>
              <summary className="cursor-pointer py-2 font-medium">Image Tools</summary>
              <div className="flex flex-col gap-1 pb-2 ps-3">
                {IMAGE_TOOLS.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                    {item.label}
                  </Link>
                ))}
              </div>
            </details>
            <details>
              <summary className="cursor-pointer py-2 font-medium">Resize</summary>
              <div className="flex flex-col gap-1 pb-2 ps-3">
                {resizeLinks.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                    {item.label}
                  </Link>
                ))}
              </div>
            </details>
            <details>
              <summary className="cursor-pointer py-2 font-medium">Compress</summary>
              <div className="flex flex-col gap-1 pb-2 ps-3">
                {compressLinks.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                    {item.label}
                  </Link>
                ))}
              </div>
            </details>
            <details>
              <summary className="cursor-pointer py-2 font-medium">Convert</summary>
              <div className="flex flex-col gap-1 pb-2 ps-3">
                {listIndexableToolLandings()
                  .filter((d) => d.operation === "convert")
                  .map((d) => (
                    <Link key={d.slug} href={`/${d.slug}`} onClick={() => setMobileOpen(false)}>
                      {d.h1}
                    </Link>
                  ))}
              </div>
            </details>
            <details>
              <summary className="cursor-pointer py-2 font-medium">SEO Tools</summary>
              <div className="flex flex-col gap-1 pb-2 ps-3">
                {SEO_TOOLS.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                    {item.label}
                  </Link>
                ))}
              </div>
            </details>
            <Link href="/bulk-image-tools" className="block py-2 font-medium" onClick={() => setMobileOpen(false)}>
              Bulk Tools
            </Link>
            <Link href="/pricing" className="block py-2" onClick={() => setMobileOpen(false)}>
              {t("pricing")}
            </Link>
            <div className="pt-2" onClick={() => setMobileOpen(false)}>
              <AccountHeaderControls access={resolvedAccess} />
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
  return (
    <footer className="mt-auto bg-[var(--footer)] text-slate-300">
      <div className="marketing-container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="space-y-3 xl:col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-1">
          <BrandMark />
          <p className="text-sm leading-relaxed text-slate-400">
            Private online tools for compressing, resizing, converting and preparing images for the web.
          </p>
        </div>
        <FooterCol
          title="Image Tools"
          links={[
            {href: "/compress-image", label: "Compress Image"},
            {href: "/resize-image", label: "Resize Image"},
            {href: "/crop-image", label: "Crop Image"},
            {href: "/convert-image", label: "Convert Image"},
            {href: "/bulk-image-tools", label: "Bulk Image Tools"},
          ]}
        />
        <FooterCol
          title="Popular Formats"
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
          title="SEO Tools"
          links={[
            {href: "/ai-alt-text", label: "AI Alt Text Generator"},
            {href: "/image-metadata", label: "Image Metadata Viewer"},
            {href: "/image-metadata-editor", label: "Image SEO Metadata Editor"},
            {href: "/geotag-image", label: "Geotag Image"},
          ]}
        />
        <FooterCol
          title="Company"
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
          title="Resources"
          links={[
            {href: "/docs", label: "Documentation"},
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
          <p className="text-sm text-slate-400">© {year} SEO Images. All rights reserved.</p>
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
