import Image from "next/image";
import {Link} from "@/i18n/navigation";
import {LandingToolWorkspace} from "@/components/guest/landing-tool-workspace";
import {Breadcrumbs} from "@/components/marketing/landing-sections";
import {JsonLd} from "@/components/marketing/json-ld";
import {ResizeJpgResetCta} from "@/components/marketing/resize-jpg-reset-cta";
import {
  RESIZE_JPG_LANDING,
  RESIZE_JPG_META,
} from "@/lib/marketing/resize-jpg-landing-content";
import type {ToolLandingDefinition} from "@/lib/marketing/tool-landing-registry";
import {getPublicAppOrigin} from "@/server/marketing/seo";

function Eyebrow({children}: {children: string}) {
  return (
    <p className="text-xs font-semibold tracking-[0.14em] text-[var(--accent)] uppercase">
      {children}
    </p>
  );
}

function BenefitIcon({
  name,
}: {
  name: (typeof RESIZE_JPG_LANDING.benefits.cards)[number]["icon"];
}) {
  const common = "h-5 w-5 text-[var(--accent)]";
  switch (name) {
    case "dimensions":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      );
    case "aspect":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="5" y="7" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.75" />
          <path d="M9 12h6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case "quality":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 4l1.8 5.2L19 11l-5.2 1.8L12 18l-1.8-5.2L5 11l5.2-1.8L12 4z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "privacy":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 3l7 3v5c0 4.5-2.8 7.8-7 9-4.2-1.2-7-4.5-7-9V6l7-3z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "browser":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.75" />
          <path d="M3 9h18" stroke="currentColor" strokeWidth="1.75" />
        </svg>
      );
    case "safe":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M7 12l3 3 7-7"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
        </svg>
      );
  }
}

function FaqAccordion({items}: {items: {q: string; a: string}[]}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <details
          key={item.q}
          className="group rounded-[18px] border border-[var(--border)] bg-white px-5 py-4 shadow-[var(--shadow-soft)] open:shadow-md"
        >
          <summary className="cursor-pointer list-none font-semibold text-[var(--foreground)] marker:content-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden">
            <span className="flex items-start justify-between gap-4">
              <span>{item.q}</span>
              <span
                aria-hidden="true"
                className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--muted)]/50 text-sm text-[var(--muted-foreground)] transition group-open:rotate-45"
              >
                +
              </span>
            </span>
          </summary>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted-foreground)]">{item.a}</p>
        </details>
      ))}
    </div>
  );
}

export function ResizeJpgLandingView({
  landing,
  locale,
}: {
  landing: ToolLandingDefinition;
  locale: string;
}) {
  const copy = RESIZE_JPG_LANDING;
  const origin = getPublicAppOrigin();
  const path = "/resize-jpg";
  const pageUrl = `${origin}/${locale}${path}`;

  const crumbs = [
    {href: "/", label: "Home"},
    {href: copy.breadcrumbParent.href, label: copy.breadcrumbParent.label},
    {label: RESIZE_JPG_META.h1},
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: RESIZE_JPG_META.h1,
      description: RESIZE_JPG_META.description,
      url: pageUrl,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {name: "Home", path: "/"},
        {name: copy.breadcrumbParent.label, path: copy.breadcrumbParent.href},
        {name: RESIZE_JPG_META.h1, path},
      ].map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        item: `${origin}/${locale}${crumb.path === "/" ? "" : crumb.path}`,
      })),
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

      <div className="marketing-container pt-6">
        <Breadcrumbs items={crumbs} />
      </div>

      {/* Hero */}
      <section className="marketing-container pt-[72px] pb-10 md:pb-12">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-12">
          <div className="max-w-[820px] space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--foreground)] shadow-[var(--shadow-soft)]">
              <span
                className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]"
                aria-hidden="true"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              {copy.hero.badge}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
              {RESIZE_JPG_META.h1}
            </h1>
            <p className="text-base leading-relaxed text-[var(--muted-foreground)] sm:text-[17px]">
              {copy.hero.description}
            </p>
            <ul className="flex flex-wrap gap-2" aria-label="Trust points">
              {copy.hero.trust.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--foreground)] sm:text-sm"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative w-full overflow-hidden rounded-[20px] bg-white ring-1 ring-[var(--border)]">
            <Image
              src={copy.hero.heroImage.src}
              alt={copy.hero.heroImage.alt}
              width={copy.hero.heroImage.width}
              height={copy.hero.heroImage.height}
              priority
              sizes="(min-width: 1024px) 46vw, 100vw"
              className="h-auto w-full bg-white object-cover"
            />
          </div>
        </div>
      </section>

      {/* Tool */}
      <section
        id="tool-workspace"
        aria-label="Resize JPG tool"
        className="border-y border-[var(--border)] bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_55%)] py-10 md:py-12"
      >
        <div className="marketing-container">
          <LandingToolWorkspace
            landing={landing}
            presentation={{
              statusBarVariant: "premium",
              guestBarTitle: copy.guestBar.title,
              guestCountdownLabel: copy.guestBar.countdownLabel,
              dropLabel: copy.upload.heading,
              supportLabel: copy.upload.supporting,
              browseLabel: copy.upload.chooseLabel,
              formatsHint: copy.upload.formatsHint,
              uploadFeatures: [...copy.upload.features],
              showPopularSizes: true,
              showQualityNote: true,
              enableExternalReset: true,
            }}
          />
        </div>
      </section>

      {/* Intro */}
      <section className="section-space">
        <div className="marketing-container grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="max-w-[820px] space-y-4">
            <Eyebrow>{copy.intro.eyebrow}</Eyebrow>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
              {copy.intro.title}
            </h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-[var(--muted-foreground)] sm:text-base">
              {copy.intro.paragraphs.map((p) => (
                <p key={p.slice(0, 48)}>{p}</p>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-[20px] bg-white ring-1 ring-[var(--border)]">
            <Image
              src={copy.intro.image.src}
              alt={copy.intro.image.alt}
              width={copy.intro.image.width}
              height={copy.intro.image.height}
              sizes="(min-width: 1024px) 46vw, 100vw"
              className="h-auto w-full bg-white object-cover"
            />
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="section-space bg-[#f8fafc]">
        <div className="marketing-container space-y-8">
          <div className="mx-auto max-w-[820px] space-y-3 text-center">
            <Eyebrow>{copy.benefits.eyebrow}</Eyebrow>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
              {copy.benefits.title}
            </h2>
            <p className="text-[15px] leading-relaxed text-[var(--muted-foreground)] sm:text-base">
              {copy.benefits.intro}
            </p>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {copy.benefits.cards.map((card) => (
              <li
                key={card.title}
                className="flex h-full flex-col rounded-[18px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-soft)]"
              >
                <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)]">
                  <BenefitIcon name={card.icon} />
                </span>
                <h3 className="text-lg font-semibold">{card.title}</h3>
                <p className="mt-2 flex-1 text-[15px] leading-relaxed text-[var(--muted-foreground)]">
                  {card.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section className="section-space">
        <div className="marketing-container space-y-8">
          <div className="mx-auto max-w-[820px] space-y-3 text-center">
            <Eyebrow>{copy.howTo.eyebrow}</Eyebrow>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
              {copy.howTo.title}
            </h2>
          </div>
          <ol className="grid gap-6 md:grid-cols-3">
            {copy.howTo.steps.map((step, index) => (
              <li
                key={step.title}
                className="relative rounded-[18px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-soft)]"
              >
                <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--gradient-brand)] text-sm font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted-foreground)]">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
          <div className="overflow-hidden rounded-[20px] bg-white ring-1 ring-[var(--border)]">
            <Image
              src={copy.howTo.image.src}
              alt={copy.howTo.image.alt}
              width={copy.howTo.image.width}
              height={copy.howTo.image.height}
              sizes="(min-width: 1200px) 1200px, 100vw"
              className="h-auto w-full bg-white object-cover"
            />
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="section-space bg-[#f8fafc]">
        <div className="marketing-container space-y-8">
          <div className="mx-auto max-w-[820px] space-y-3 text-center">
            <Eyebrow>{copy.useCases.eyebrow}</Eyebrow>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
              {copy.useCases.title}
            </h2>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {copy.useCases.cards.map((card) => (
              <li
                key={card.title}
                className="rounded-[18px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-soft)]"
              >
                <h3 className="text-lg font-semibold">{card.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted-foreground)]">
                  {card.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Dimensions */}
      <section className="section-space">
        <div className="marketing-container">
          <div className="mx-auto max-w-[820px] space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
              {copy.dimensions.title}
            </h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-[var(--muted-foreground)] sm:text-base">
              {copy.dimensions.paragraphs.map((p) => (
                <p key={p.slice(0, 48)}>{p}</p>
              ))}
            </div>
            <aside className="rounded-[18px] border border-[var(--accent)]/20 bg-[var(--accent-soft)] px-5 py-4">
              <p className="font-semibold text-[var(--foreground)]">{copy.dimensions.noteTitle}</p>
              <p className="mt-1 text-[15px] leading-relaxed text-[var(--muted-foreground)]">
                {copy.dimensions.noteBodyBefore}
                <Link
                  href={copy.dimensions.noteLinkHref}
                  className="font-semibold text-[var(--accent)] underline-offset-2 hover:underline"
                >
                  {copy.dimensions.noteLinkLabel}
                </Link>
                {copy.dimensions.noteBodyAfter}
              </p>
            </aside>
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="section-space bg-[#f8fafc]">
        <div className="marketing-container">
          <div className="mx-auto max-w-[820px] space-y-5">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
              {copy.tips.title}
            </h2>
            <ul className="space-y-3 rounded-[18px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-soft)]">
              {copy.tips.items.map((tip) => (
                <li key={tip} className="flex gap-3 text-[15px] leading-relaxed text-[var(--muted-foreground)]">
                  <span
                    className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]"
                    aria-hidden="true"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 12l5 5L20 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-space">
        <div className="marketing-container">
          <div className="mx-auto max-w-[820px] space-y-6">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
              Frequently Asked Questions
            </h2>
            <FaqAccordion items={[...copy.faqs]} />
          </div>
        </div>
      </section>

      {/* Related */}
      <section className="section-space bg-[#f8fafc]">
        <div className="marketing-container space-y-8">
          <div className="mx-auto max-w-[820px] space-y-3 text-center">
            <Eyebrow>{copy.related.eyebrow}</Eyebrow>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
              {copy.related.title}
            </h2>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {copy.related.tools.map((tool) => (
              <li key={tool.href}>
                <Link
                  href={tool.href}
                  className="flex h-full flex-col rounded-[18px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-soft)] transition hover:border-[var(--accent)]/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <span
                    className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]"
                    aria-hidden="true"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M7 17L17 7M9 7h8v8"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">{tool.title}</h3>
                  <p className="mt-2 text-[15px] text-[var(--muted-foreground)]">{tool.body}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-space">
        <div className="marketing-container">
          <div className="rounded-[22px] border border-[var(--border)] bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_55%,#f5f3ff_100%)] px-6 py-10 text-center shadow-[var(--shadow-soft)] sm:px-10 sm:py-12">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
              {copy.cta.title}
            </h2>
            <p className="mx-auto mt-3 max-w-[640px] text-[15px] leading-relaxed text-[var(--muted-foreground)] sm:text-base">
              {copy.cta.body}
            </p>
            <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <ResizeJpgResetCta label={copy.cta.primaryLabel} />
              <Link
                href={copy.cta.secondaryHref}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-white px-6 text-sm font-semibold text-[var(--foreground)] shadow-sm transition hover:bg-[var(--muted)]/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {copy.cta.secondaryLabel}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
