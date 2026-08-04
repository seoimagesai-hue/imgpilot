import Image from "next/image";
import {Link} from "@/i18n/navigation";
import {HomeCompressEntry} from "@/components/guest/home-compress-entry";
import {HomeChooseImageButton} from "@/components/marketing/home-choose-image-button";
import {HomeIcon} from "@/components/marketing/home-icons";
import {JsonLd} from "@/components/marketing/json-ld";
import type {HomepageCopy} from "@/lib/marketing/homepage-content";
import {getPublicAppOrigin} from "@/server/marketing/seo";

const TRUST_ICONS = ["user", "shield", "clock", "check"] as const;

const HOW_STEP_IMAGES = [
  {
    src: "/illustrations/how-it-works-upload.png",
    alt: "Illustration of an image card entering an upload dropzone",
  },
  {
    src: "/illustrations/how-it-works-settings.png",
    alt: "Illustration of image settings controls and format options",
  },
  {
    src: "/illustrations/how-it-works-process.png",
    alt: "Illustration of secure server processing verifying an image",
  },
  {
    src: "/illustrations/how-it-works-download.png",
    alt: "Illustration of a verified result card ready to download",
  },
] as const;

function SplitVisual({
  src,
  alt,
  priority = false,
  width,
  height,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  width: number;
  height: number;
}) {
  return (
    <div className="relative w-full overflow-hidden rounded-3xl bg-white ring-1 ring-[var(--border)]">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        sizes="(min-width: 1024px) 46vw, 100vw"
        className="h-auto w-full object-cover bg-white"
      />
    </div>
  );
}

export function HomepageView({
  copy,
  locale,
  maxFileSizeLabel,
  maxMb,
}: {
  copy: HomepageCopy;
  locale: string;
  maxFileSizeLabel: string;
  maxMb: number;
}) {
  const origin = getPublicAppOrigin();
  const pageUrl = `${origin}/${locale}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "SEO Images",
      url: pageUrl,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: copy.metaTitle,
      description: copy.metaDescription,
      url: pageUrl,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: copy.faqs.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {"@type": "Answer", text: item.a},
      })),
    },
  ];

  return (
    <main id="main-content" className="pb-0">
      <JsonLd data={jsonLd} />

      {/* 1 Hero */}
      <section className="home-hero-bg">
        <div className="marketing-container relative z-[1] section-space space-y-8">
          <div className="mx-auto max-w-3xl space-y-4 text-center">
            <p className="inline-flex rounded-full border border-[var(--border)] bg-white/80 px-3 py-1 text-sm font-medium text-[var(--accent)]">
              {copy.heroBadge}
            </p>
            <h1 className="text-[clamp(2.25rem,4vw,3.75rem)] font-bold tracking-tight text-[var(--foreground)]">
              {copy.h1}
            </h1>
            <p className="section-lead mx-auto max-w-2xl">{copy.heroParagraph}</p>
          </div>

          <div className="relative mx-auto max-w-[860px]">
            <div id="hero-upload" className="relative gradient-border-card px-4 py-5 shadow-[var(--shadow-lift)] sm:px-8 sm:py-8">
              <HomeCompressEntry
                heading={copy.uploadHeading}
                support={copy.uploadSupport}
                chooseLabel={copy.chooseImage}
                pasteHint={copy.pasteHint}
                formatLimitLine={copy.formatLimitLine.replace("{maxFileSize}", maxFileSizeLabel)}
                privacyLine={copy.privacyLine}
                defaultActionLabel={copy.defaultActionLabel}
                maxMb={maxMb}
              />
            </div>
          </div>

          {/* 2 Trust strip */}
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {copy.trust.map((item, index) => (
              <li key={item.title} className="card-surface flex gap-3 px-4 py-4">
                <HomeIcon name={TRUST_ICONS[index]!} />
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm text-[var(--body)]">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3 Popular tools */}
      <section id="popular-tools" className="section-space bg-white">
        <div className="marketing-container space-y-8">
          <div className="mx-auto max-w-3xl space-y-3 text-center">
            <p className="eyebrow">{copy.toolsEyebrow}</p>
            <h2 className="section-title">{copy.toolsHeading}</h2>
            <p className="section-lead">{copy.toolsDescription}</p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {copy.tools.map((tool) => (
              <li key={tool.href}>
                <Link href={tool.href} className="tool-card card-surface flex h-full flex-col gap-3 px-5 py-5">
                  <HomeIcon name={tool.icon} />
                  <h3 className="text-lg font-semibold">{tool.title}</h3>
                  <p className="flex-1 text-sm text-[var(--body)]">{tool.body}</p>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent)]">
                    {copy.openTool} <span aria-hidden>→</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 4 Format actions */}
      <section className="section-space bg-[var(--accent-soft)]">
        <div className="marketing-container space-y-8">
          <div className="mx-auto max-w-3xl space-y-3 text-center">
            <p className="eyebrow">{copy.formatEyebrow}</p>
            <h2 className="section-title">{copy.formatHeading}</h2>
            <p className="section-lead">{copy.formatDescription}</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {copy.formats.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="tool-card flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-white px-4 py-4"
                >
                  <span className="space-y-1">
                    <span
                      className="inline-block rounded-md bg-[var(--violet-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--violet)]"
                      dir="ltr"
                    >
                      {item.badge}
                    </span>
                    <span className="block font-medium">{item.label}</span>
                  </span>
                  <span aria-hidden className="text-[var(--accent)]">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 5 Platform */}
      <section className="section-space bg-white">
        <div className="marketing-container grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] xl:gap-14">
          <SplitVisual
            src="/illustrations/unified-image-workspace.png"
            alt="Illustration of one image flowing through compress, resize, crop, convert and SEO paths into a single download"
            width={1200}
            height={900}
          />
          <div className="space-y-4">
            <p className="eyebrow">{copy.platformEyebrow}</p>
            <h2 className="section-title">{copy.platformHeading}</h2>
            <p className="section-lead">{copy.platformP1}</p>
            <p className="section-lead">{copy.platformP2}</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {copy.platformFeatures.map((feature) => (
                <li key={feature} className="flex gap-2 text-sm text-[var(--body)]">
                  <span className="mt-1 text-[var(--success)]" aria-hidden>
                    ✓
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 6 Why */}
      <section className="section-space bg-[var(--accent-soft)]">
        <div className="marketing-container space-y-8">
          <div className="mx-auto max-w-3xl space-y-3 text-center">
            <p className="eyebrow">{copy.whyEyebrow}</p>
            <h2 className="section-title">{copy.whyHeading}</h2>
            <p className="section-lead">{copy.whyIntro}</p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {copy.benefits.map((item) => (
              <li key={item.title} className="card-surface px-5 py-5">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-[var(--body)]">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 7 How it works */}
      <section className="section-space bg-white">
        <div className="marketing-container space-y-10">
          <div className="mx-auto max-w-3xl space-y-3 text-center">
            <p className="eyebrow">{copy.howEyebrow}</p>
            <h2 className="section-title">{copy.howHeading}</h2>
          </div>
          <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {copy.steps.map((step, index) => (
              <li key={step.title} className="card-surface relative overflow-hidden px-4 pb-6 pt-4">
                <div className="mb-4 overflow-hidden rounded-2xl bg-white ring-1 ring-[var(--border)]">
                  <Image
                    src={HOW_STEP_IMAGES[index]!.src}
                    alt={HOW_STEP_IMAGES[index]!.alt}
                    width={600}
                    height={450}
                    sizes="(min-width: 1280px) 22vw, (min-width: 768px) 40vw, 100vw"
                    className="h-auto w-full object-cover bg-white"
                  />
                </div>
                <span
                  className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{backgroundImage: "var(--gradient-brand)"}}
                >
                  {index + 1}
                </span>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-[var(--body)]">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 8 Before/after */}
      <section className="section-space bg-[var(--hero-deep)] text-white">
        <div className="marketing-container grid items-center gap-10 lg:grid-cols-[1fr_1.05fr] xl:gap-14">
          <div className="space-y-4">
            <h2 className="section-title text-white">{copy.beforeHeading}</h2>
            <p className="text-base leading-relaxed text-slate-300">{copy.beforeParagraph}</p>
            <p className="text-sm text-slate-400">{copy.beforeCaption}</p>
          </div>
          <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-white/10">
            <Image
              src="/illustrations/before-after-comparison.png"
              alt="Example product comparison showing an original image beside a smaller optimized result"
              width={1400}
              height={900}
              sizes="(min-width: 1024px) 48vw, 100vw"
              className="h-auto w-full object-cover bg-white"
            />
          </div>
        </div>
      </section>

      {/* 9 Use cases */}
      <section className="section-space bg-white">
        <div className="marketing-container space-y-8">
          <div className="mx-auto max-w-3xl space-y-3 text-center">
            <p className="eyebrow">{copy.useEyebrow}</p>
            <h2 className="section-title">{copy.useHeading}</h2>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {copy.useCases.map((item) => (
              <li key={item.title} className="card-surface px-5 py-5">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-[var(--body)]">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 10 SEO toolkit */}
      <section className="section-space bg-[var(--background)]">
        <div className="marketing-container grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] xl:gap-14">
          <div className="space-y-4">
            <p className="eyebrow">{copy.seoEyebrow}</p>
            <h2 className="section-title">{copy.seoHeading}</h2>
            <p className="section-lead">{copy.seoP1}</p>
            <p className="section-lead">{copy.seoP2}</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {copy.seoLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="font-medium text-[var(--accent)] hover:underline">
                    {item.label} →
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-sm text-[var(--muted-foreground)]">{copy.seoDisclaimer}</p>
          </div>
          <SplitVisual
            src="/illustrations/image-seo-toolkit.png"
            alt="Illustration of image SEO metadata fields next to an image thumbnail"
            width={1200}
            height={900}
          />
        </div>
      </section>

      {/* 11 Bulk */}
      <section className="section-space bg-[var(--violet-soft)]">
        <div className="marketing-container grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] xl:gap-14">
          <SplitVisual
            src="/illustrations/bulk-image-processing.png"
            alt="Illustration of multiple images moving through one processing workflow into a ZIP archive"
            width={1200}
            height={900}
          />
          <div className="space-y-4">
            <p className="eyebrow">{copy.bulkEyebrow}</p>
            <h2 className="section-title">{copy.bulkHeading}</h2>
            <p className="section-lead">{copy.bulkParagraph}</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {copy.bulkBullets.map((item) => (
                <li key={item} className="text-sm text-[var(--body)]">
                  • {item}
                </li>
              ))}
            </ul>
            <Link href="/bulk-image-tools" className="btn-primary inline-flex">
              {copy.bulkCta}
            </Link>
            <p className="text-sm text-[var(--muted-foreground)]">{copy.bulkNotice}</p>
          </div>
        </div>
      </section>

      {/* 12 Privacy */}
      <section className="section-space">
        <div className="marketing-container">
          <div className="overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#0B1220_0%,#1E3A8A_100%)] px-6 py-10 text-white sm:px-10">
            <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] xl:gap-12">
              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-wide text-sky-300">{copy.privacyEyebrow}</p>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{copy.privacyHeading}</h2>
                <p className="text-slate-200">{copy.privacyP1}</p>
                <p className="text-slate-300">{copy.privacyP2}</p>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {copy.privacyFacts.map((fact) => (
                    <li key={fact} className="text-sm text-slate-200">
                      ✓ {fact}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/privacy"
                  className="btn-primary inline-flex shadow-none"
                  style={{backgroundImage: "none", background: "#fff", color: "#0F172A"}}
                >
                  {copy.privacyCta}
                </Link>
              </div>
              <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-white/10">
                <Image
                  src="/illustrations/privacy-protection.png"
                  alt="Illustration of a private image protected by a shield with short-lived temporary retention"
                  width={1200}
                  height={900}
                  sizes="(min-width: 1024px) 42vw, 100vw"
                  className="h-auto w-full object-cover bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 13 Formats */}
      <section id="supported-formats" className="section-space bg-white">
        <div className="marketing-container space-y-8">
          <div className="mx-auto max-w-3xl space-y-3 text-center">
            <h2 className="section-title">{copy.formatsHeading}</h2>
            <p className="section-lead">{copy.formatsParagraph}</p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {copy.formatCards.map((item) => (
              <li key={item.title}>
                <Link href={item.href} className="tool-card card-surface block h-full px-5 py-5">
                  <h3 className="text-lg font-semibold" dir="ltr">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--body)]">{item.body}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 14 FAQ */}
      <section id="faq" className="section-space bg-[var(--background)]">
        <div className="marketing-container prose-container space-y-6">
          <h2 className="section-title text-center">{copy.faqHeading}</h2>
          <div className="space-y-3">
            {copy.faqs.map((item) => (
              <details key={item.q} className="card-surface group px-5 py-4">
                <summary className="cursor-pointer list-none font-semibold marker:content-none">
                  <span className="flex items-center justify-between gap-3">
                    {item.q}
                    <span className="text-[var(--muted-foreground)] transition group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 text-sm text-[var(--body)]">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 15 Final CTA */}
      <section className="section-space bg-[var(--footer)] text-white">
        <div className="marketing-container mx-auto max-w-3xl space-y-5 text-center">
          <h2 className="section-title text-white">{copy.finalHeading}</h2>
          <p className="text-slate-300">{copy.finalParagraph}</p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <HomeChooseImageButton label={copy.finalPrimary} />
            <Link
              href="/#popular-tools"
              className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              {copy.finalSecondary}
            </Link>
          </div>
          <p className="text-sm text-slate-400">{copy.finalTrust}</p>
        </div>
      </section>
    </main>
  );
}
