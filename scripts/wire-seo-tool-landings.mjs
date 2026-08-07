import fs from "node:fs";
import path from "node:path";

const root = path.join("src", "app", "[locale]", "(marketing)", "(seo-landings)");

function formatPage(slug) {
  const routePath = `/${slug}`;
  return `import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";
import {SeoFormatToolLanding} from "@/components/marketing/seo-tool-landing";
import {getSeoToolLandingCopy} from "@/lib/marketing/seo-tool-landing-copy";
import type {AppLocale} from "@/i18n/routing";
import {buildPublicMetadata} from "@/server/marketing/seo";

type PageProps = {params: Promise<{locale: string}>};
const PATH = "${routePath}";
const SLUG = "${slug}";

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const copy = getSeoToolLandingCopy(PATH);
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: PATH,
    title: copy.metaTitle,
    description: copy.metaDescription,
    index: true,
  });
}

export default async function Page({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <SeoFormatToolLanding slug={SLUG} locale={locale} />;
}
`;
}

function bulkPage(slug, tool) {
  const routePath = `/${slug}`;
  return `import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";
import {SeoBulkToolLanding} from "@/components/marketing/seo-tool-landing";
import {getSeoToolLandingCopy} from "@/lib/marketing/seo-tool-landing-copy";
import type {AppLocale} from "@/i18n/routing";
import {buildPublicMetadata} from "@/server/marketing/seo";

type PageProps = {params: Promise<{locale: string}>};
const PATH = "${routePath}" as const;

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const copy = getSeoToolLandingCopy(PATH);
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: PATH,
    title: copy.metaTitle,
    description: copy.metaDescription,
    index: true,
  });
}

export default async function Page({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <SeoBulkToolLanding locale={locale} path={PATH} initialTool="${tool}" />;
}
`;
}

const formatSlugs = [
  "compress-jpg",
  "compress-png",
  "compress-webp",
  "resize-jpg",
  "resize-png",
  "resize-webp",
  "crop-jpg",
  "crop-png",
  "crop-webp",
  "jpg-to-webp",
  "jpg-to-png",
  "jpg-to-avif",
  "png-to-jpg",
  "png-to-webp",
  "png-to-avif",
  "webp-to-jpg",
  "webp-to-png",
  "webp-to-avif",
];

const bulks = [
  ["bulk-compress", "compress"],
  ["bulk-resize", "resize"],
  ["bulk-convert", "convert"],
];

for (const slug of formatSlugs) {
  const dir = path.join(root, slug);
  fs.mkdirSync(dir, {recursive: true});
  fs.writeFileSync(path.join(dir, "page.tsx"), formatPage(slug));
  console.log("W", slug);
}

for (const [slug, tool] of bulks) {
  const dir = path.join(root, slug);
  fs.mkdirSync(dir, {recursive: true});
  fs.writeFileSync(path.join(dir, "page.tsx"), bulkPage(slug, tool));
  console.log("W", slug);
}

console.log("done", formatSlugs.length + bulks.length);
