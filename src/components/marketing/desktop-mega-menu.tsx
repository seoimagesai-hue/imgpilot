"use client";

import type {CSSProperties, ReactNode} from "react";
import type {LucideIcon} from "lucide-react";
import {ArrowLeft, ArrowRight, Layers, Maximize2, Minimize2} from "lucide-react";
import {useLocale} from "next-intl";
import {Link} from "@/i18n/navigation";
import {isRtlLocale} from "@/i18n/routing";
import {
  BULK_TOOLS_ITEMS,
  COMPRESS_COLUMNS,
  CONVERT_COLUMNS,
  IMAGE_TOOLS_COLUMNS,
  RESIZE_COLUMNS,
  SEO_TOOLS_ITEMS,
  type NavLinkItem,
} from "@/lib/marketing/public-nav-catalog";

export type DesktopMegaId = "image" | "compress" | "resize" | "convert" | "seo" | "bulk";

const ICON_TONES = [
  "bg-blue-50 text-blue-700",
  "bg-violet-50 text-violet-700",
  "bg-cyan-50 text-cyan-700",
  "bg-amber-50 text-amber-700",
] as const;

const PANEL_SHADOW =
  "shadow-[0_8px_16px_-8px_rgba(15,23,42,0.12),0_28px_56px_-24px_rgba(37,99,235,0.34)]";

function ArrowIcon({className}: {className?: string}) {
  const locale = useLocale();
  const Icon = isRtlLocale(locale) ? ArrowLeft : ArrowRight;
  return <Icon className={className} aria-hidden />;
}

function FormatBadge({label}: {label: string}) {
  return (
    <span
      className="inline-flex min-w-[2.75rem] items-center justify-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-slate-700"
      dir="ltr"
    >
      {label}
    </span>
  );
}

function parseConvertBadge(title: string): {from: string; to: string} | null {
  const match = title.match(/^(.+?)\s+to\s+(.+)$/i);
  if (!match) return null;
  return {from: match[1]!.trim(), to: match[2]!.trim()};
}

function formatBadgeFromTitle(title: string): string {
  const m = title.match(/\b(JPG|JPEG|PNG|WebP|AVIF)\b/i);
  if (!m) return "IMG";
  const raw = m[1]!.toUpperCase();
  return raw === "JPEG" ? "JPG" : raw === "WEBP" ? "WebP" : raw;
}

function ToolRow({
  item,
  toneIndex,
  onNavigate,
}: {
  item: NavLinkItem;
  toneIndex: number;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  const tone = ICON_TONES[toneIndex % ICON_TONES.length];
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className="group flex items-start gap-3 rounded-xl px-2.5 py-2.5 transition-colors duration-150 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] motion-reduce:transition-none"
    >
      <span
        className={`mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}
      >
        <Icon className="h-4 w-4 transition-transform duration-150 group-hover:-translate-y-px motion-reduce:transform-none" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-slate-900">{item.title}</span>
          <ArrowIcon className="h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[var(--accent)] rtl:group-hover:-translate-x-0.5 motion-reduce:transform-none" />
        </span>
        <span className="mt-0.5 block text-xs leading-snug text-slate-500">{item.description}</span>
      </span>
    </Link>
  );
}

function FeaturedCard({
  href,
  title,
  description,
  eyebrow,
  icon: Icon,
  onNavigate,
}: {
  href: string;
  title: string;
  description: string;
  eyebrow: string;
  icon: LucideIcon;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="group flex h-full flex-col rounded-2xl bg-[var(--accent-soft)] p-5 transition duration-150 hover:bg-blue-100/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] motion-reduce:transition-none"
    >
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[var(--accent)] shadow-sm">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
        {eyebrow}
      </p>
      <p className="mt-1.5 flex items-center justify-between gap-2 text-lg font-semibold text-slate-900">
        <span>{title}</span>
        <ArrowIcon className="h-4 w-4 text-[var(--accent)] transition-transform duration-150 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 motion-reduce:transform-none" />
      </p>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
    </Link>
  );
}

function FormatItem({
  href,
  badge,
  title,
  description,
  onNavigate,
}: {
  href: string;
  badge: string;
  title: string;
  description: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="group flex items-start gap-3 rounded-xl px-2.5 py-2.5 transition-colors duration-150 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] motion-reduce:transition-none"
    >
      <FormatBadge label={badge} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-slate-900">{title}</span>
          <ArrowIcon className="h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[var(--accent)] rtl:group-hover:-translate-x-0.5 motion-reduce:transform-none" />
        </span>
        <span className="mt-0.5 block text-xs leading-snug text-slate-500">{description}</span>
      </span>
    </Link>
  );
}

function ConvertPair({
  href,
  from,
  to,
  onNavigate,
}: {
  href: string;
  from: string;
  to: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="group flex items-center justify-between gap-3 rounded-xl px-2.5 py-2.5 transition-colors duration-150 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] motion-reduce:transition-none"
    >
      <span className="inline-flex items-center gap-1.5" dir="ltr">
        <FormatBadge label={from} />
        <span className="text-slate-400" aria-hidden>
          →
        </span>
        <FormatBadge label={to} />
      </span>
      <ArrowIcon className="h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[var(--accent)] rtl:group-hover:-translate-x-0.5 motion-reduce:transform-none" />
      <span className="sr-only">
        {from} to {to}
      </span>
    </Link>
  );
}

function PanelShell({
  panelId,
  label,
  widthClass,
  alignStyle,
  children,
}: {
  panelId: string;
  label: string;
  widthClass: string;
  alignStyle?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div
      id={panelId}
      role="region"
      aria-label={label}
      style={alignStyle}
      className={`absolute top-[calc(100%+14px)] z-50 max-h-[min(78vh,640px)] w-[min(calc(100vw-2rem),var(--mega-w))] overflow-y-auto rounded-[20px] border border-slate-200 bg-white p-5 sm:p-6 ${PANEL_SHADOW} ${widthClass} ${
        alignStyle ? "" : "left-1/2 -translate-x-1/2"
      }`}
    >
      {children}
    </div>
  );
}

const RESIZE_DESC: Record<string, string> = {
  "/resize-jpg": "Change the dimensions of JPG photographs and web images.",
  "/resize-png": "Resize PNG graphics while preserving transparency.",
  "/resize-webp": "Adjust WebP dimensions for efficient web delivery.",
};

function ResizePanel({onNavigate}: {onNavigate: () => void}) {
  const formatItems = RESIZE_COLUMNS[0]?.items ?? [];
  return (
    <div className="grid gap-6 md:grid-cols-[1.05fr_1fr]">
      <FeaturedCard
        href="/resize-image"
        eyebrow="Resize Images"
        title="Resize Image"
        description="Resize JPG, PNG and WebP images by width, height or fit-inside settings."
        icon={Maximize2}
        onNavigate={onNavigate}
      />
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          Resize by format
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Change image dimensions while preserving clarity and aspect ratio.
        </p>
        <div className="mt-3 space-y-1">
          {formatItems.map((item) => (
            <FormatItem
              key={item.href}
              href={item.href}
              badge={formatBadgeFromTitle(item.title)}
              title={item.title}
              description={RESIZE_DESC[item.href] ?? item.description}
              onNavigate={onNavigate}
            />
          ))}
        </div>
        <Link
          href="/resize-image"
          onClick={onNavigate}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          View all resize tools
          <ArrowIcon className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function CompressPanel({onNavigate}: {onNavigate: () => void}) {
  const formatItems = COMPRESS_COLUMNS[0]?.items ?? [];
  return (
    <div className="grid gap-6 md:grid-cols-[1.05fr_1fr]">
      <FeaturedCard
        href="/compress-image"
        eyebrow="Compress Images"
        title="Compress Image"
        description="Reduce file size for JPG, PNG and WebP while keeping usable quality."
        icon={Minimize2}
        onNavigate={onNavigate}
      />
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          Compress by format
        </p>
        <div className="mt-3 space-y-1">
          {formatItems.map((item) => (
            <FormatItem
              key={item.href}
              href={item.href}
              badge={formatBadgeFromTitle(item.title)}
              title={item.title}
              description={item.description}
              onNavigate={onNavigate}
            />
          ))}
        </div>
        <Link
          href="/bulk-image-tools"
          onClick={onNavigate}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          Bulk Compress
          <ArrowIcon className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function ConvertPanel({onNavigate}: {onNavigate: () => void}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {CONVERT_COLUMNS.map((col) => (
        <div key={col.title}>
          <p className="mb-2 px-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            {col.title}
          </p>
          <div className="space-y-0.5">
            {col.items.map((item) => {
              const badges = parseConvertBadge(item.title);
              if (!badges) return null;
              return (
                <ConvertPair
                  key={item.href}
                  href={item.href}
                  from={badges.from}
                  to={badges.to}
                  onNavigate={onNavigate}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

const IMAGE_TOOL_COLUMN_TITLES = ["Optimize", "Edit & create"] as const;

function ImageToolsPanel({onNavigate}: {onNavigate: () => void}) {
  const columns = IMAGE_TOOLS_COLUMNS.filter((c) =>
    (IMAGE_TOOL_COLUMN_TITLES as readonly string[]).includes(c.title),
  );

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {columns.map((col) => (
        <div key={col.title}>
          <p className="mb-2 px-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            {col.title}
          </p>
          <div className="space-y-0.5">
            {col.items.map((item, index) => (
              <ToolRow
                key={item.href + item.title}
                item={item}
                toneIndex={index}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SeoPanel({onNavigate}: {onNavigate: () => void}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {SEO_TOOLS_ITEMS.map((item, index) => (
        <ToolRow
          key={item.href + item.title}
          item={item}
          toneIndex={index}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}

function BulkPanel({onNavigate}: {onNavigate: () => void}) {
  const overview =
    BULK_TOOLS_ITEMS.find((i) => i.title === "Bulk Image Tools overview") ?? BULK_TOOLS_ITEMS[3]!;
  const actions = BULK_TOOLS_ITEMS.filter((i) => i.title !== "Bulk Image Tools overview");

  return (
    <div className="grid gap-6 md:grid-cols-[1.1fr_1fr]">
      <FeaturedCard
        href={overview.href}
        eyebrow="Bulk Image Tools"
        title="Bulk overview"
        description={overview.description}
        icon={Layers}
        onNavigate={onNavigate}
      />
      <div>
        <div className="space-y-1">
          {actions.map((item, index) => (
            <ToolRow key={item.title} item={item} toneIndex={index} onNavigate={onNavigate} />
          ))}
        </div>
        <p className="mt-4 px-2.5 text-xs text-slate-500">Guest batch limits apply.</p>
      </div>
    </div>
  );
}

const WIDTH: Record<DesktopMegaId, string> = {
  image: "[--mega-w:720px]",
  compress: "[--mega-w:760px]",
  resize: "[--mega-w:780px]",
  convert: "[--mega-w:880px]",
  seo: "[--mega-w:720px]",
  bulk: "[--mega-w:760px]",
};

export const MEGA_MAX_WIDTH_PX: Record<DesktopMegaId, number> = {
  image: 720,
  compress: 760,
  resize: 780,
  convert: 880,
  seo: 720,
  bulk: 760,
};

const LABELS: Record<DesktopMegaId, string> = {
  image: "Image tools menu",
  compress: "Compress tools menu",
  resize: "Resize tools menu",
  convert: "Convert tools menu",
  seo: "SEO tools menu",
  bulk: "Bulk tools menu",
};

export function DesktopMegaMenu({
  menu,
  panelId,
  onNavigate,
  alignStyle,
}: {
  menu: DesktopMegaId;
  panelId: string;
  onNavigate: () => void;
  alignStyle?: CSSProperties;
}) {
  let body: ReactNode = null;
  if (menu === "image") body = <ImageToolsPanel onNavigate={onNavigate} />;
  else if (menu === "compress") body = <CompressPanel onNavigate={onNavigate} />;
  else if (menu === "resize") body = <ResizePanel onNavigate={onNavigate} />;
  else if (menu === "convert") body = <ConvertPanel onNavigate={onNavigate} />;
  else if (menu === "seo") body = <SeoPanel onNavigate={onNavigate} />;
  else body = <BulkPanel onNavigate={onNavigate} />;

  return (
    <PanelShell
      panelId={panelId}
      label={LABELS[menu]}
      widthClass={WIDTH[menu]}
      alignStyle={alignStyle}
    >
      {body}
    </PanelShell>
  );
}
