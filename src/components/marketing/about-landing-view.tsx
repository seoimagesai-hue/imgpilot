import {isRtlLocale} from "@/i18n/routing";
import Image from "next/image";
import {Link} from "@/i18n/navigation";
import {Breadcrumbs} from "@/components/marketing/landing-sections";
import {JsonLd} from "@/components/marketing/json-ld";
import {getAboutCopy} from "@/lib/marketing/about-landing-content";
import {absoluteUrl, getPublicAppOrigin} from "@/server/marketing/seo";

function Eyebrow({children}: {children: string}) {
  return (
    <p className="text-xs font-semibold tracking-[0.14em] text-[var(--accent)] uppercase">
      {children}
    </p>
  );
}

function WhyIcon({
  name,
}: {
  name: ReturnType<typeof getAboutCopy>["why"]["cards"][number]["icon"];
}) {
  const common = "h-5 w-5 text-[var(--accent)]";
  switch (name) {
    case "fast":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"
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
    case "secure":
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
    case "formats":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
          <rect x="14" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
          <rect x="3" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
          <rect x="14" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
        </svg>
      );
    case "batch":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M8 7h13M8 12h13M8 17h13M3 7h.01M3 12h.01M3 17h.01"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      );
    case "install":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 3v10M8 9l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4 15v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      );
    case "responsive":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="5" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
          <rect x="14" y="8" width="7" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
        </svg>
      );
    case "privacy":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.75" />
          <path
            d="M8 10V7a4 4 0 0 1 8 0v3"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
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

export function AboutLandingView({locale}: {locale: string}) {
  const copy = getAboutCopy(locale);
  const origin = getPublicAppOrigin();
  const path = "/about";
  const pageUrl = absoluteUrl(locale, path);
  const isRtl = isRtlLocale(locale);

  const crumbs = [
    {href: "/", label: isRtl ? "ہوم" : "Home"},
    {label: copy.breadcrumbCurrent},
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: copy.hero.h1,
      description: copy.metaDescription,
      url: pageUrl,
      isPartOf: {
        "@type": "WebSite",
        name: "Img Pilot",
        url: origin,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Img Pilot",
      url: origin,
      description: copy.metaDescription,
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
        item: absoluteUrl(locale, crumb.path),
      })),
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
                    d="M12 3l7 3v5c0 4.5-2.8 7.8-7 9-4.2-1.2-7-4.5-7-9V6l7-3z"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              {copy.hero.badge}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{copy.hero.h1}</h1>
            <p className="text-base leading-relaxed text-[var(--muted-foreground)] sm:text-[17px]">
              {copy.hero.paragraph}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/" className="btn-primary inline-flex min-h-11 w-full items-center justify-center px-6 text-sm sm:w-auto">
                {copy.hero.exploreCta}
              </Link>
              <Link
                href="/contact"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-[var(--border)] bg-white px-6 text-sm font-semibold shadow-sm transition hover:bg-[var(--muted)]/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:w-auto"
              >
                {copy.hero.contactCta}
              </Link>
            </div>
          </div>
          <div className="overflow-hidden rounded-[20px] bg-white ring-1 ring-[var(--border)]">
            <Image
              src="/illustrations/about-hero.webp"
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

      <section id="mission" className={`${sectionPad} bg-[#f8fafc]`}>
        <div className="marketing-container">
          <div className={`mx-auto max-w-[820px] space-y-4 ${isRtl ? "text-right" : ""}`}>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{copy.mission.title}</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-[var(--muted-foreground)] sm:text-base">
              {copy.mission.paragraphs.map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="story" className={sectionPad}>
        <div className="marketing-container">
          <div className={`mx-auto max-w-[820px] space-y-4 ${isRtl ? "text-right" : ""}`}>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{copy.story.title}</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-[var(--muted-foreground)] sm:text-base">
              {copy.story.paragraphs.map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="why" className={`${sectionPad} bg-[#f8fafc]`}>
        <div className="marketing-container space-y-8">
          <div className="mx-auto max-w-[820px] space-y-3 text-center">
            <Eyebrow>{copy.why.eyebrow}</Eyebrow>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{copy.why.title}</h2>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {copy.why.cards.map((card) => (
              <li
                key={card.title}
                className="flex h-full flex-col rounded-[18px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-soft)]"
              >
                <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)]">
                  <WhyIcon name={card.icon} />
                </span>
                <h3 className="text-lg font-semibold">{card.title}</h3>
                <p className="mt-2 flex-1 text-[15px] leading-relaxed text-[var(--muted-foreground)]">{card.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="values" className={sectionPad}>
        <div className="marketing-container space-y-8">
          <div className="mx-auto max-w-[820px] space-y-3 text-center">
            <Eyebrow>{copy.values.eyebrow}</Eyebrow>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{copy.values.title}</h2>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {copy.values.cards.map((card) => (
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

      <section id="different" className={`${sectionPad} bg-[#f8fafc]`}>
        <div className="marketing-container space-y-8">
          <div className={`mx-auto max-w-[820px] space-y-3 ${isRtl ? "text-right" : "text-center"}`}>
            <Eyebrow>{copy.different.eyebrow}</Eyebrow>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{copy.different.title}</h2>
            <p className="text-[15px] leading-relaxed text-[var(--muted-foreground)] sm:text-base">
              {copy.different.intro}
            </p>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2">
            {copy.different.cards.map((card) => (
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

      <section id="formats" className={sectionPad}>
        <div className="marketing-container space-y-10">
          <div className="mx-auto max-w-[820px] space-y-3 text-center">
            <Eyebrow>{copy.formats.eyebrow}</Eyebrow>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{copy.formats.title}</h2>
            <p className="text-[15px] leading-relaxed text-[var(--muted-foreground)] sm:text-base">
              {copy.formats.intro}
            </p>
          </div>
          <ul className="grid gap-6 sm:grid-cols-3">
            {copy.formats.current.map((card) => (
              <li
                key={card.title}
                className="flex h-full flex-col rounded-[18px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-soft)]"
              >
                <span className="mb-3 inline-flex w-fit rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--accent)]">
                  {isRtl ? "ابھی دستیاب" : "Available now"}
                </span>
                <h3 className="text-lg font-semibold" dir="ltr">
                  {card.title}
                </h3>
                <p className="mt-2 flex-1 text-[15px] leading-relaxed text-[var(--muted-foreground)]">{card.body}</p>
              </li>
            ))}
          </ul>
          <div className="space-y-5">
            <p className="text-center text-xs font-semibold tracking-[0.14em] text-[var(--muted-foreground)] uppercase">
              {copy.formats.futureEyebrow}
            </p>
            <ul className="mx-auto grid max-w-[820px] gap-6 sm:grid-cols-2">
              {copy.formats.future.map((card) => (
                <li
                  key={card.title}
                  className="flex h-full flex-col rounded-[18px] border border-dashed border-[var(--border)] bg-[#f8fafc] p-6"
                >
                  <span className="mb-3 inline-flex w-fit rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[var(--muted-foreground)] ring-1 ring-[var(--border)]">
                    {isRtl ? "جلد" : "Coming later"}
                  </span>
                  <h3 className="text-lg font-semibold" dir="ltr">
                    {card.title}
                  </h3>
                  <p className="mt-2 flex-1 text-[15px] leading-relaxed text-[var(--muted-foreground)]">{card.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="security" className={`${sectionPad} bg-[#f8fafc]`}>
        <div className="marketing-container">
          <div className="mx-auto grid max-w-[980px] gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:items-start lg:gap-12">
            <div className={`space-y-4 ${isRtl ? "text-right" : ""}`}>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{copy.security.title}</h2>
              <div className="space-y-4 text-[15px] leading-relaxed text-[var(--muted-foreground)] sm:text-base">
                {copy.security.paragraphs.map((p) => (
                  <p key={p.slice(0, 40)}>{p}</p>
                ))}
              </div>
            </div>
            <ul className="space-y-3 rounded-[18px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-soft)]">
              {copy.security.points.map((point) => (
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
          </div>
        </div>
      </section>

      <section className={sectionPad}>
        <div className="marketing-container">
          <div className="mx-auto max-w-[820px] space-y-6">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{copy.faqHeading}</h2>
            <FaqAccordion items={copy.faqs} />
          </div>
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
              <Link href="/" className="btn-primary inline-flex min-h-11 items-center justify-center px-6 text-sm">
                {copy.cta.exploreCta}
              </Link>
              <Link
                href="/contact"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-white px-6 text-sm font-semibold shadow-sm transition hover:bg-[var(--muted)]/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {copy.cta.contactCta}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
