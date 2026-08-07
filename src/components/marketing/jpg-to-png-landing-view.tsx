import {isRtlLocale} from "@/i18n/routing";
import Image from "next/image";
import {Link} from "@/i18n/navigation";
import {LandingToolWorkspace} from "@/components/guest/landing-tool-workspace";
import {
  JpgToPngHeroUploadCta,
  JpgToPngResetCta,
} from "@/components/marketing/jpg-to-png-ctas";
import {Breadcrumbs} from "@/components/marketing/landing-sections";
import {JsonLd} from "@/components/marketing/json-ld";
import {getJpgToPngCopy} from "@/lib/marketing/jpg-to-png-landing-content";
import type {ToolLandingDefinition} from "@/lib/marketing/tool-landing-registry";
import {absoluteUrl, getPublicAppOrigin} from "@/server/marketing/seo";

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
  name: ReturnType<typeof getJpgToPngCopy>["benefits"]["cards"][number]["icon"];
}) {
  const common = "h-5 w-5 text-[var(--accent)]";
  switch (name) {
    case "compat":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
          <path d="M3 12h18M12 3c2.5 2.8 3.8 5.8 3.8 9S14.5 18.2 12 21c-2.5-2.8-3.8-5.8-3.8-9S9.5 5.8 12 3z" stroke="currentColor" strokeWidth="1.75" />
        </svg>
      );
    case "size":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 17L17 7M9 7h8v8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "docs":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
          <path d="M14 3v5h5M9 13h6M9 17h6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case "share":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="18" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="6" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="18" cy="19" r="2.5" stroke="currentColor" strokeWidth="1.75" />
          <path d="M8.2 10.8l7.6-4.6M8.2 13.2l7.6 4.6" stroke="currentColor" strokeWidth="1.75" />
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
    case "safe":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 12l3 3 7-7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
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
          <summary className="cursor-pointer list-none font-semibold marker:content-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden">
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

const sectionPad = "py-14 md:py-20";

export function JpgToPngLandingView({
  landing,
  locale,
}: {
  landing: ToolLandingDefinition;
  locale: string;
}) {
  const copy = getJpgToPngCopy(locale);
  const origin = getPublicAppOrigin();
  const path = "/jpg-to-png";
  const pageUrl = absoluteUrl(locale, path);
  const isRtl = isRtlLocale(locale);

  const crumbs = [
    {href: "/", label: isRtl ? "ہوم" : "Home"},
    {href: copy.breadcrumbParent.href, label: copy.breadcrumbParent.label},
    {label: copy.breadcrumbCurrent},
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: copy.h1,
      description: copy.metaDescription,
      url: pageUrl,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Web",
      offers: {"@type": "Offer", price: "0", priceCurrency: "USD"},
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {name: crumbs[0]!.label, path: "/"},
        {name: copy.breadcrumbParent.label, path: copy.breadcrumbParent.href},
        {name: copy.breadcrumbCurrent, path},
      ].map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        item: absoluteUrl(locale, crumb.path),
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
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Img Pilot",
      url: origin,
    },
  ];

  return (
    <main
      id="main-content"
      className="pb-0 [&_.marketing-container]:px-5"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <JsonLd data={jsonLd} />

      <div className="marketing-container pt-6">
        <Breadcrumbs items={crumbs} />
      </div>

      <section className="marketing-container pt-16 pb-10 md:pt-[72px] md:pb-12">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-12">
          <div className={`max-w-[820px] space-y-5 ${isRtl ? "text-right" : ""}`}>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-sm font-medium shadow-[var(--shadow-soft)]">
              <span
                className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]"
                aria-hidden="true"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M7 7h6v6M17 17H11v-6M13 7l4 4M11 17l-4-4"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              {copy.hero.badge}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{copy.h1}</h1>
            <p className="text-base leading-relaxed text-[var(--muted-foreground)] sm:text-[17px]">
              {copy.hero.paragraph}
            </p>
            <ul className="flex flex-wrap gap-2" aria-label={isRtl ? "اعتماد کے نکات" : "Trust points"}>
              {copy.hero.trust.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-medium sm:text-sm"
                >
                  {item}
                </li>
              ))}
            </ul>
            <JpgToPngHeroUploadCta label={copy.hero.uploadCta} />
          </div>
          <div className="overflow-hidden rounded-[20px] bg-white ring-1 ring-[var(--border)]">
            <Image
              src="/illustrations/jpg-to-png-hero.webp"
              alt={copy.hero.heroImageAlt}
              width={1600}
              height={1100}
              priority
              sizes="(min-width: 1024px) 46vw, 100vw"
              className="h-auto w-full bg-white object-cover"
            />
          </div>
        </div>
      </section>

      <section
        id="tool-workspace"
        aria-label={copy.h1}
        className="border-y border-[var(--border)] bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_55%)] py-10 md:py-12"
      >
        <div className="marketing-container">
          <LandingToolWorkspace
            landing={landing}
            presentation={{
              statusBarVariant: "premium",
              guestBarTitle: copy.guestBar.title,
              guestBarBody: "",
              guestDeletionTitle: copy.guestBar.deletionTitle,
              guestCountdownLabel: copy.guestBar.countdownLabel,
              dropLabel: copy.upload.heading,
              supportLabel: copy.upload.supporting,
              browseLabel: copy.upload.chooseLabel,
              formatsHint: copy.upload.formatsHint,
              uploadFeatures: copy.upload.features,
              enableExternalReset: true,
            }}
          />
        </div>
      </section>

      <section className="border-b border-[var(--border)] bg-white py-8" aria-label={isRtl ? "اعتماد کی پٹی" : "Trust strip"}>
        <div className="marketing-container">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {copy.hero.trust.map((item) => (
              <li
                key={`strip-${item}`}
                className="flex items-center gap-3 rounded-[16px] border border-[var(--border)] bg-[#f8fafc] px-4 py-3 text-sm font-medium"
              >
                <span
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]"
                  aria-hidden="true"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={sectionPad}>
        <div className="marketing-container grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div className={`max-w-[820px] space-y-4 ${isRtl ? "text-right lg:order-2" : ""}`}>
            <Eyebrow>{copy.intro.eyebrow}</Eyebrow>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{copy.intro.title}</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-[var(--muted-foreground)] sm:text-base">
              {copy.intro.paragraphs.map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}
            </div>
          </div>
          <div className={`overflow-hidden rounded-[20px] bg-white ring-1 ring-[var(--border)] ${isRtl ? "lg:order-1" : ""}`}>
            <Image
              src="/illustrations/jpg-to-png-compare.webp"
              alt={copy.intro.imageAlt}
              width={1600}
              height={1000}
              sizes="(min-width: 1024px) 46vw, 100vw"
              className="h-auto w-full bg-white object-cover"
            />
          </div>
        </div>
      </section>

      <section className={`${sectionPad} bg-[#f8fafc]`}>
        <div className="marketing-container space-y-8">
          <div className="mx-auto max-w-[820px] space-y-3 text-center">
            <Eyebrow>{copy.comparison.eyebrow}</Eyebrow>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{copy.comparison.title}</h2>
            <p className="text-[15px] leading-relaxed text-[var(--muted-foreground)]">{copy.comparison.intro}</p>
          </div>
          <div className="overflow-x-auto rounded-[18px] border border-[var(--border)] bg-white shadow-[var(--shadow-soft)]">
            <table className="min-w-full text-start text-[15px]">
              <caption className="sr-only">{copy.comparison.title}</caption>
              <thead className="bg-[#f8fafc] text-sm font-semibold">
                <tr>
                  <th scope="col" className="px-4 py-3 sm:px-5">
                    {copy.comparison.columns[0]}
                  </th>
                  <th scope="col" className="px-4 py-3 sm:px-5">
                    {copy.comparison.columns[1]}
                  </th>
                  <th scope="col" className="px-4 py-3 sm:px-5">
                    {copy.comparison.columns[2]}
                  </th>
                </tr>
              </thead>
              <tbody>
                {copy.comparison.rows.map((row) => (
                  <tr key={row.label} className="border-t border-[var(--border)]">
                    <th scope="row" className="px-4 py-3.5 font-semibold sm:px-5">
                      {row.label}
                    </th>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)] sm:px-5">{row.jpg}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)] sm:px-5">{row.png}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mx-auto max-w-[820px] text-center text-[15px] leading-relaxed text-[var(--muted-foreground)]">
            {copy.comparison.explanation}
          </p>
        </div>
      </section>

      <section className={sectionPad}>
        <div className="marketing-container space-y-8">
          <div className="mx-auto max-w-[820px] space-y-3 text-center">
            <Eyebrow>{copy.benefits.eyebrow}</Eyebrow>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{copy.benefits.title}</h2>
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
                <p className="mt-2 flex-1 text-[15px] leading-relaxed text-[var(--muted-foreground)]">{card.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={`${sectionPad} bg-[#f8fafc]`}>
        <div className="marketing-container space-y-8">
          <div className="mx-auto max-w-[820px] space-y-3 text-center">
            <Eyebrow>{copy.howTo.eyebrow}</Eyebrow>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{copy.howTo.title}</h2>
          </div>
          <ol className="grid gap-6 md:grid-cols-3">
            {copy.howTo.steps.map((step, index) => (
              <li
                key={step.title}
                className="rounded-[18px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-soft)]"
              >
                <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--gradient-brand)] text-sm font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted-foreground)]">{step.body}</p>
              </li>
            ))}
          </ol>
          <div className="overflow-hidden rounded-[20px] bg-white ring-1 ring-[var(--border)]">
            <Image
              src="/illustrations/jpg-to-png-steps.webp"
              alt={copy.howTo.imageAlt}
              width={1800}
              height={700}
              sizes="(min-width: 1200px) 1200px, 100vw"
              className="h-auto w-full bg-white object-cover"
            />
          </div>
        </div>
      </section>

      <section className={sectionPad}>
        <div className="marketing-container">
          <div className={`mx-auto max-w-[820px] space-y-4 ${isRtl ? "text-right" : ""}`}>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{copy.whyPng.title}</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-[var(--muted-foreground)] sm:text-base">
              {copy.whyPng.paragraphs.map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}
            </div>
            <ul className="space-y-3 rounded-[18px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-soft)]">
              {copy.whyPng.points.map((point) => (
                <li key={point} className="flex gap-3 text-[15px] text-[var(--muted-foreground)]">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <aside className="rounded-[18px] border border-[var(--accent)]/20 bg-[var(--accent-soft)] px-5 py-4">
              <p className="text-[15px] leading-relaxed text-[var(--muted-foreground)]">{copy.whyPng.note}</p>
            </aside>
          </div>
        </div>
      </section>

      <section className={`${sectionPad} bg-[#f8fafc]`}>
        <div className="marketing-container space-y-8">
          <div className="mx-auto max-w-[820px] space-y-3 text-center">
            <Eyebrow>{copy.useCases.eyebrow}</Eyebrow>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{copy.useCases.title}</h2>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {copy.useCases.cards.map((card) => (
              <li
                key={card.title}
                className="rounded-[18px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-soft)]"
              >
                <h3 className="text-lg font-semibold">{card.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted-foreground)]">{card.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={sectionPad}>
        <div className="marketing-container">
          <div className="mx-auto max-w-[820px] space-y-5">
            <Eyebrow>{copy.tips.eyebrow}</Eyebrow>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{copy.tips.title}</h2>
            <ul className="space-y-3 rounded-[18px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-soft)]">
              {copy.tips.items.map((tip) => (
                <li key={tip} className="flex gap-3 text-[15px] leading-relaxed text-[var(--muted-foreground)]">
                  <span
                    className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]"
                    aria-hidden="true"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className={`${sectionPad} bg-[#f8fafc]`}>
        <div className="marketing-container">
          <div className="mx-auto max-w-[820px] space-y-6">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{copy.faqHeading}</h2>
            <FaqAccordion items={copy.faqs} />
          </div>
        </div>
      </section>

      <section className={sectionPad}>
        <div className="marketing-container space-y-8">
          <div className="mx-auto max-w-[820px] space-y-3 text-center">
            <Eyebrow>{copy.related.eyebrow}</Eyebrow>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{copy.related.title}</h2>
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
                        d={isRtl ? "M17 17L7 7M15 7H7v8" : "M7 17L17 7M9 7h8v8"}
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <h3 className="text-lg font-semibold">{tool.title}</h3>
                  <p className="mt-2 text-[15px] text-[var(--muted-foreground)]">{tool.body}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={`${sectionPad} bg-[#f8fafc]`}>
        <div className="marketing-container">
          <div className="rounded-[22px] border border-[var(--border)] bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_55%,#f5f3ff_100%)] px-6 py-10 text-center shadow-[var(--shadow-soft)] sm:px-10 sm:py-12">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{copy.cta.title}</h2>
            <p className="mx-auto mt-3 max-w-[640px] text-[15px] leading-relaxed text-[var(--muted-foreground)] sm:text-base">
              {copy.cta.body}
            </p>
            <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <JpgToPngResetCta label={copy.cta.primaryLabel} />
              <Link
                href={copy.cta.secondaryHref}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-white px-6 text-sm font-semibold shadow-sm transition hover:bg-[var(--muted)]/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
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
