import {notFound} from "next/navigation";
import {redirect} from "@/i18n/navigation";
import {LandingToolWorkspace} from "@/components/guest/landing-tool-workspace";
import {Breadcrumbs, RelatedTools} from "@/components/marketing/landing-sections";
import {JsonLd, landingJsonLd} from "@/components/marketing/json-ld";
import {LandingMotif} from "@/components/marketing/landing-motif";
import {
  LandingBenefitCards,
  LandingBottomCta,
  LandingFaqSection,
  LandingHowTo,
  LandingTechnical,
  LandingWhy,
} from "@/components/marketing/landing-seo-sections";
import {getLandingPageModel} from "@/lib/marketing/resolve-landing";
import {
  getToolLanding,
  listRenderableToolLandingSlugs,
  listToolLandingRedirects,
} from "@/lib/marketing/tool-landing-registry";
import {buildPublicMetadata} from "@/server/marketing/seo";
import type {AppLocale} from "@/i18n/routing";
import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";

type PageProps = {params: Promise<{locale: string; slug: string}>};

export function generateStaticParams() {
  const dedicated = new Set([
    "resize-jpg",
    "compress-jpg",
    "compress-png",
    "compress-webp",
    "resize-png",
    "resize-webp",
    "crop-jpg",
    "crop-png",
    "crop-webp",
    "jpg-to-webp",
    "webp-to-jpg",
    "png-to-jpg",
    "png-to-webp",
    "webp-to-png",
  ]);
  const renderable = listRenderableToolLandingSlugs()
    .filter((slug) => !dedicated.has(slug))
    .map((slug) => ({slug}));
  const redirects = listToolLandingRedirects()
    .filter((r) => !dedicated.has(r.from))
    .map((r) => ({slug: r.from}));
  return [...renderable, ...redirects];
}

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale, slug} = await params;
  const landing = getToolLanding(slug);
  if (!landing) return {};
  if (landing.redirectTo) {
    const primary = getToolLanding(landing.redirectTo);
    if (!primary) return {};
    return buildPublicMetadata({
      locale: locale as AppLocale,
      path: `/${primary.slug}`,
      title: primary.title,
      description: primary.description,
      index: false,
    });
  }
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: `/${landing.slug}`,
    title: landing.title,
    description: landing.description,
    index: landing.indexable,
  });
}

export default async function ToolLandingSlugPage({params}: PageProps) {
  const {locale, slug} = await params;
  setRequestLocale(locale);
  if (
    slug === "resize-jpg" ||
    slug === "compress-jpg" ||
    slug === "compress-png" ||
    slug === "compress-webp" ||
    slug === "resize-png" ||
    slug === "resize-webp" ||
    slug === "crop-jpg" ||
    slug === "crop-png" ||
    slug === "crop-webp" ||
    slug === "jpg-to-webp" ||
    slug === "webp-to-jpg" ||
    slug === "png-to-jpg" ||
    slug === "png-to-webp" ||
    slug === "webp-to-png"
  ) {
    notFound();
  }
  const raw = getToolLanding(slug);
  if (!raw) notFound();
  if (raw.redirectTo) {
    redirect({href: `/${raw.redirectTo}`, locale});
  }

  const model = getLandingPageModel(slug);
  if (!model) notFound();

  const parent =
    model.operation === "compress"
      ? {href: "/compress-image", label: "Compress Image"}
      : model.operation === "resize"
        ? {href: "/resize-image", label: "Resize Image"}
        : model.operation === "crop"
          ? {href: "/crop-image", label: "Crop Image"}
          : {href: "/convert-image", label: "Convert Image"};

  const crumbs = [
    {href: "/", label: "Home"},
    {href: parent.href, label: parent.label},
    {label: model.h1},
  ];

  const jsonLd = landingJsonLd({
    locale,
    path: `/${model.slug}`,
    title: model.title,
    description: model.description,
    breadcrumbs: [
      {name: "Home", path: "/"},
      {name: parent.label, path: parent.href},
      {name: model.h1, path: `/${model.slug}`},
    ],
    faqs: model.seo.faqs,
  });

  return (
    <main id="main-content" className="pb-16">
      <JsonLd data={jsonLd} />
      <div className="marketing-container pt-6">
        <Breadcrumbs items={crumbs} />
        <header className="mx-auto max-w-3xl space-y-3 pb-6 text-center">
          <LandingMotif operation={model.operation} />
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{model.h1}</h1>
          <p className="text-[var(--muted-foreground)]">{model.seo.intro}</p>
          <p className="text-sm text-[var(--muted-foreground)]">
            Private temporary storage · Guest files deleted after about one hour · No account required for free limits
          </p>
        </header>
      </div>

      {/* Upload tool stays immediately under hero intro */}
      <div id="tool-workspace">
        <LandingToolWorkspace landing={model} />
      </div>

      <div className="marketing-container space-y-12 pt-12">
        <LandingWhy title="Why use this tool" body={model.seo.why} />
        <LandingBenefitCards items={model.seo.benefits} />
        <LandingHowTo steps={model.seo.howTo} />
        <LandingTechnical title={model.seo.technicalTitle} body={model.seo.technical} />
        <LandingFaqSection items={model.seo.faqs} />
        <RelatedTools slugs={model.related} />
        <LandingBottomCta label={model.seo.ctaLabel} />
      </div>
    </main>
  );
}
