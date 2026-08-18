import Image from "next/image";
import {Link} from "@/i18n/navigation";
import {HomeCompressEntry} from "@/components/guest/home-compress-entry";
import {HomeChooseImageButton} from "@/components/marketing/home-choose-image-button";
import {HomeIcon} from "@/components/marketing/home-icons";
import {JsonLd} from "@/components/marketing/json-ld";
import type {HomepageCopy} from "@/lib/marketing/homepage-content";
import {absoluteUrl} from "@/server/marketing/seo";

const TRUST_ICONS = ["user", "shield", "clock", "check"] as const;
const STAT_ICONS = ["bulk", "shield", "clock", "check"] as const;

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
  const pageUrl = absoluteUrl(locale, "/");
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Img Pilot",
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

      {/* Hero — title + upload tool centered, matching compress-style workspace */}
      <section className="home-hero-bg">
        <div className="marketing-container relative z-[1] py-10 sm:py-12 lg:py-16">
          <div className="mx-auto max-w-3xl space-y-4 text-center">
            <p className="inline-flex rounded-full border border-blue-100 bg-white/90 px-3.5 py-1 text-sm font-semibold text-[var(--accent)] shadow-sm">
              {copy.heroBadge}
            </p>
            <h1 className="text-[clamp(2.1rem,4vw,3.25rem)] font-bold tracking-tight text-slate-900">
              {copy.h1}
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              {copy.heroParagraph}
            </p>
          </div>

          <div id="hero-upload" className="mx-auto mt-8 w-full max-w-[920px] sm:mt-10">
            <HomeCompressEntry
              heading={copy.uploadHeading}
              support={copy.uploadSupport}
              chooseLabel={copy.chooseImage}
              pasteHint={copy.pasteHint}
              formatLimitLine={copy.formatLimitLine.replace("{maxFileSize}", maxFileSizeLabel)}
              privacyLine={copy.privacyLine}
              defaultActionLabel=""
              maxMb={maxMb}
            />
          </div>

          <ul className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {copy.trust.map((item, index) => (
              <li
                key={item.title}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-700"
              >
                <HomeIcon name={TRUST_ICONS[index]!} className="!h-9 !w-9 !rounded-xl" />
                <span>{item.title}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-slate-200/80 bg-[#f8fafc]">
        <div className="marketing-container grid gap-4 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6 lg:py-10">
          {copy.stats.map((item, index) => (
            <div key={item.title} className="flex items-start gap-3 rounded-2xl bg-white px-4 py-4 shadow-[var(--shadow-soft)] ring-1 ring-slate-200/70">
              <HomeIcon name={STAT_ICONS[index]!} />
              <div>
                <p className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">{item.title}</p>
                <p className="mt-1 text-sm text-slate-500">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tools */}
      <section id="popular-tools" className="section-space bg-white">
        <div className="marketing-container space-y-10">
          <div className="mx-auto max-w-3xl space-y-3 text-center">
            <p className="eyebrow">{copy.toolsEyebrow}</p>
            <h2 className="section-title">{copy.toolsHeading}</h2>
            <p className="section-lead">{copy.toolsDescription}</p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {copy.tools.map((tool) => (
              <li key={tool.href}>
                <Link
                  href={tool.href}
                  className="tool-card group flex h-full flex-col gap-3 rounded-[22px] border border-slate-200 bg-white px-5 py-5 shadow-[var(--shadow-soft)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <HomeIcon name={tool.icon} />
                    <span
                      aria-hidden
                      className="text-lg text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[var(--accent)]"
                    >
                      →
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{tool.title}</h3>
                  <p className="flex-1 text-sm leading-relaxed text-slate-600">{tool.body}</p>
                  <span className="sr-only">{copy.openTool}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex justify-center">
            <Link
              href="/#popular-tools"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
            >
              {copy.exploreAllTools} <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Format shortcuts */}
      <section className="section-space bg-[#f8fafc]">
        <div className="marketing-container space-y-8">
          <div className="mx-auto max-w-3xl space-y-3 text-center">
            <p className="eyebrow">{copy.formatEyebrow}</p>
            <h2 className="section-title">{copy.formatHeading}</h2>
            <p className="section-lead">{copy.formatDescription}</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
            {copy.formats.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="tool-card flex h-full items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-3.5 shadow-sm"
                >
                  <span className="min-w-0">
                    <span
                      className="mb-1 inline-block rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-blue-700"
                      dir="ltr"
                    >
                      {item.badge}
                    </span>
                    <span className="block truncate text-sm font-semibold text-slate-800">{item.label}</span>
                  </span>
                  <span aria-hidden className="shrink-0 text-[var(--accent)]">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section className="section-space bg-white">
        <div className="marketing-container space-y-12">
          <div className="mx-auto max-w-3xl space-y-3 text-center">
            <p className="eyebrow">{copy.howEyebrow}</p>
            <h2 className="section-title">{copy.howHeading}</h2>
          </div>
          <ol className="relative grid gap-8 md:grid-cols-2 xl:grid-cols-4 xl:gap-6">
            <div
              aria-hidden
              className="pointer-events-none absolute left-[12%] right-[12%] top-8 hidden border-t-2 border-dashed border-slate-200 xl:block"
            />
            {copy.steps.map((step, index) => (
              <li key={step.title} className="relative flex flex-col items-center text-center">
                <span className="relative z-[1] mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[image:var(--gradient-brand)] text-lg font-bold text-white shadow-[0_12px_28px_-14px_rgba(37,99,235,0.85)]">
                  {index + 1}
                </span>
                <div className="mb-4 w-full overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-200">
                  <Image
                    src={HOW_STEP_IMAGES[index]!.src}
                    alt={HOW_STEP_IMAGES[index]!.alt}
                    width={600}
                    height={450}
                    sizes="(min-width: 1280px) 22vw, (min-width: 768px) 40vw, 100vw"
                    className="h-auto w-full object-cover"
                  />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Before / after */}
      <section className="section-space bg-[var(--hero-deep)] text-white">
        <div className="marketing-container grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] xl:gap-14">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">
              {copy.beforeEyebrow}
            </p>
            <h2 className="section-title text-white">{copy.beforeHeading}</h2>
            <p className="text-base leading-relaxed text-slate-300">{copy.beforeParagraph}</p>
            <ul className="space-y-2 text-sm text-slate-200">
              {copy.beforeBullets.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-0.5 text-emerald-400" aria-hidden>
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-sm text-slate-400">{copy.beforeCaption}</p>
          </div>
          <div className="overflow-hidden rounded-[28px] bg-white/5 p-2 ring-1 ring-white/10">
            <div className="overflow-hidden rounded-[22px] bg-white">
              <Image
                src="/illustrations/before-after-comparison.png"
                alt="Example product comparison showing an original image beside a smaller optimized result"
                width={1400}
                height={900}
                sizes="(min-width: 1024px) 48vw, 100vw"
                className="h-auto w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-space bg-[#f8fafc]">
        <div className="marketing-container">
          <div className="overflow-hidden rounded-[32px] bg-[image:var(--gradient-brand)] px-6 py-12 text-center text-white shadow-[0_30px_80px_-40px_rgba(37,99,235,0.65)] sm:px-12 sm:py-16">
            <div className="mx-auto max-w-2xl space-y-6">
              <h2 className="text-[clamp(1.85rem,3vw,2.75rem)] font-bold tracking-tight">
                {copy.finalHeading}
              </h2>
              <p className="text-base text-blue-50 sm:text-lg">{copy.finalParagraph}</p>
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                <HomeChooseImageButton
                  label={copy.finalPrimary}
                  className="!bg-white !text-blue-700 hover:!bg-blue-50"
                />
                <Link
                  href="/#popular-tools"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  {copy.finalSecondary}
                </Link>
              </div>
              <p className="text-sm text-blue-100/90">{copy.finalTrust}</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ (kept for SEO; compact) */}
      <section id="faq" className="section-space bg-white">
        <div className="marketing-container prose-container space-y-6">
          <h2 className="section-title text-center">{copy.faqHeading}</h2>
          <div className="space-y-3">
            {copy.faqs.map((item) => (
              <details key={item.q} className="group rounded-2xl border border-slate-200 bg-[#f8fafc] px-5 py-4">
                <summary className="cursor-pointer list-none font-semibold text-slate-900 marker:content-none">
                  <span className="flex items-center justify-between gap-3">
                    {item.q}
                    <span className="text-slate-400 transition group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
