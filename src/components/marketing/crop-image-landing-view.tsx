import Image from "next/image";
import {Link} from "@/i18n/navigation";
import {GuestToolWorkspace} from "@/components/guest/guest-tool-workspace";
import {cropToolConfig} from "@/components/guest/tools/crop-tool";
import {
  CropImageHeroUploadCta,
  CropImageResetCta,
  CropImageViewRatiosCta,
} from "@/components/marketing/crop-image-ctas";
import {Breadcrumbs} from "@/components/marketing/landing-sections";
import {JsonLd} from "@/components/marketing/json-ld";
import {getCropImageCopy} from "@/lib/marketing/crop-image-landing-content";
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
  name: ReturnType<typeof getCropImageCopy>["benefits"]["cards"][number]["icon"];
}) {
  const common = "h-5 w-5 text-[var(--accent)]";
  switch (name) {
    case "precise":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="7" y="7" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
        </svg>
      );
    case "ratios":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="5" width="8" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
          <rect x="13" y="8" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
        </svg>
      );
    case "composition":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.75" />
          <path d="M9 4v16M15 4v16M3 10h18M3 14h18" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
        </svg>
      );
    case "social":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="8" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="16" cy="8" r="2" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="15.5" cy="15.5" r="2.5" stroke="currentColor" strokeWidth="1.75" />
          <path
            d="M10.2 10.2l3.2-1.2M10 10.8l3.8 3.2"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
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
    case "formats":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
          <rect x="14" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
          <rect x="3" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
          <rect x="14" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
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

export function CropImageLandingView({locale}: {locale: string}) {
  const copy = getCropImageCopy(locale);
  const origin = getPublicAppOrigin();
  const path = "/crop-image";
  const pageUrl = `${origin}/${locale}${path}`;
  const isRtl = locale === "ur";

  const crumbs = [
    {href: "/", label: isRtl ? "ہوم" : "Home"},
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
        {name: copy.breadcrumbCurrent, path},
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
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "SEO Images",
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
                    d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4"
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <CropImageHeroUploadCta label={copy.hero.uploadCta} />
              <CropImageViewRatiosCta label={copy.hero.viewRatiosCta} />
            </div>
          </div>
          <div className="overflow-hidden rounded-[20px] bg-white ring-1 ring-[var(--border)]">
            <Image
              src="/illustrations/crop-image-hero.webp"
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
          <GuestToolWorkspace
            config={{
              ...cropToolConfig,
              hideToolHeader: true,
              presentation: {
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
              },
            }}
          />
        </div>
      </section>

      <section
        className="border-b border-[var(--border)] bg-white py-8"
        aria-label={isRtl ? "اعتماد کی پٹی" : "Trust strip"}
      >
        <div className="marketing-container">
          <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
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
                    <path
                      d="M5 12l5 5L20 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="crop-ratios" className={`${sectionPad} bg-[#f8fafc]`}>
        <div className="marketing-container space-y-8">
          <div className="mx-auto max-w-[820px] space-y-3 text-center">
            <Eyebrow>{copy.ratios.eyebrow}</Eyebrow>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{copy.ratios.title}</h2>
            <p className="text-[15px] leading-relaxed text-[var(--muted-foreground)] sm:text-base">
              {copy.ratios.intro}
            </p>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {copy.ratios.cards.map((card) => (
              <li key={card.id}>
                <a
                  href="#tool-workspace"
                  className="flex h-full flex-col rounded-[18px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-soft)] transition hover:border-[var(--accent)]/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <span className="mb-3 inline-flex w-fit rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--accent)]">
                    {card.ratio}
                  </span>
                  <h3 className="text-lg font-semibold">{card.title}</h3>
                  <p className="mt-2 flex-1 text-[15px] leading-relaxed text-[var(--muted-foreground)]">{card.body}</p>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="crop-image-tools" className={sectionPad}>
        <div className="marketing-container space-y-8">
          <div className="mx-auto max-w-[820px] space-y-3 text-center">
            <Eyebrow>{copy.tools.eyebrow}</Eyebrow>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{copy.tools.title}</h2>
            <p className="text-[15px] leading-relaxed text-[var(--muted-foreground)] sm:text-base">
              {copy.tools.intro}
            </p>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {copy.tools.cards.map((card) => (
              <li key={card.href}>
                <Link
                  href={card.href}
                  className="flex h-full flex-col rounded-[18px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-soft)] transition hover:border-[var(--accent)]/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <h3 className="text-lg font-semibold">{card.title}</h3>
                  <p className="mt-2 flex-1 text-[15px] leading-relaxed text-[var(--muted-foreground)]">{card.body}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="why-crop" className={`${sectionPad} bg-[#f8fafc]`}>
        <div className="marketing-container">
          <div className={`mx-auto max-w-[820px] space-y-4 ${isRtl ? "text-right" : ""}`}>
            <Eyebrow>{copy.intro.eyebrow}</Eyebrow>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{copy.intro.title}</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-[var(--muted-foreground)] sm:text-base">
              {copy.intro.paragraphs.map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={sectionPad}>
        <div className="marketing-container space-y-8">
          <div className={`mx-auto max-w-[820px] space-y-4 ${isRtl ? "text-right" : "text-center"}`}>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{copy.howItWorks.title}</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-[var(--muted-foreground)] sm:text-base">
              {copy.howItWorks.paragraphs.map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}
            </div>
          </div>
          <ul className="mx-auto grid max-w-[820px] gap-3 rounded-[18px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-soft)]">
            {copy.howItWorks.points.map((point) => (
              <li key={point} className="flex gap-3 text-[15px] leading-relaxed text-[var(--muted-foreground)]">
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
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <div className="overflow-hidden rounded-[20px] bg-white ring-1 ring-[var(--border)]">
            <Image
              src="/illustrations/crop-image-steps.webp"
              alt={copy.howItWorks.imageAlt}
              width={1800}
              height={700}
              sizes="(min-width: 1200px) 1200px, 100vw"
              className="h-auto w-full bg-white object-cover"
            />
          </div>
        </div>
      </section>

      <section id="composition-guide" className={`${sectionPad} bg-[#f8fafc]`}>
        <div className="marketing-container">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
            <div className={`max-w-[820px] space-y-4 ${isRtl ? "text-right" : ""}`}>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{copy.composition.title}</h2>
              <div className="space-y-4 text-[15px] leading-relaxed text-[var(--muted-foreground)] sm:text-base">
                {copy.composition.paragraphs.map((p) => (
                  <p key={p.slice(0, 40)}>{p}</p>
                ))}
              </div>
              <aside className="rounded-[18px] border border-[var(--accent)]/20 bg-[var(--accent-soft)] px-5 py-4">
                <p className="text-[15px] leading-relaxed text-[var(--muted-foreground)]">{copy.composition.note}</p>
              </aside>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {copy.composition.points.map((point) => (
                <li
                  key={point.title}
                  className="rounded-[18px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-soft)]"
                >
                  <h3 className="font-semibold">{point.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted-foreground)]">{point.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className={sectionPad}>
        <div className="marketing-container space-y-8">
          <div className="mx-auto max-w-[820px] space-y-3 text-center">
            <Eyebrow>{copy.benefits.eyebrow}</Eyebrow>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{copy.benefits.title}</h2>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
            <Eyebrow>{copy.useCases.eyebrow}</Eyebrow>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{copy.useCases.title}</h2>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {copy.useCases.cards.map((card) => (
              <li
                key={card.title}
                className="flex h-full flex-col rounded-[18px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-soft)]"
              >
                <h3 className="text-lg font-semibold">{card.title}</h3>
                <p className="mt-2 flex-1 text-[15px] leading-relaxed text-[var(--muted-foreground)]">{card.body}</p>
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
              <CropImageResetCta label={copy.cta.primaryLabel} />
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
