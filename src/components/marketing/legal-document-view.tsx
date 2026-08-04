import Image from "next/image";
import {Link} from "@/i18n/navigation";
import {LegalStickyToc, type LegalTocItem} from "@/components/marketing/legal-toc";
import {Breadcrumbs} from "@/components/marketing/landing-sections";
import {JsonLd} from "@/components/marketing/json-ld";
import {getPublicAppOrigin} from "@/server/marketing/seo";

export type LegalMetaCard = {label: string; value: string};
export type LegalSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  callout?: string;
  cards?: {title: string; body: string}[];
};

export type LegalDocModel = {
  path: string;
  metaTitle: string;
  metaDescription: string;
  breadcrumbCurrent: string;
  hero: {
    badge: string;
    h1: string;
    paragraph: string;
    heroImageSrc: string;
    heroImageAlt: string;
  };
  metaCards: LegalMetaCard[];
  tocLabel: string;
  sections: LegalSection[];
  contact: {
    title: string;
    body: string;
    cta: string;
  };
};

const sectionPad = "py-14 md:py-20";

export function LegalDocumentView({locale, doc}: {locale: string; doc: LegalDocModel}) {
  const origin = getPublicAppOrigin();
  const pageUrl = `${origin}/${locale}${doc.path}`;
  const isRtl = locale === "ur";
  const crumbs = [
    {href: "/", label: isRtl ? "ہوم" : "Home"},
    {label: doc.breadcrumbCurrent},
  ];
  const tocItems: LegalTocItem[] = doc.sections.map((section) => ({
    id: section.id,
    label: section.title,
  }));

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: doc.hero.h1,
      description: doc.metaDescription,
      url: pageUrl,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {name: crumbs[0]!.label, path: "/"},
        {name: doc.breadcrumbCurrent, path: doc.path},
      ].map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        item: `${origin}/${locale}${crumb.path === "/" ? "" : crumb.path}`,
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
              {doc.hero.badge}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{doc.hero.h1}</h1>
            <p className="text-base leading-relaxed text-[var(--muted-foreground)] sm:text-[17px]">
              {doc.hero.paragraph}
            </p>
          </div>
          <div className="overflow-hidden rounded-[20px] bg-white ring-1 ring-[var(--border)]">
            <Image
              src={doc.hero.heroImageSrc}
              alt={doc.hero.heroImageAlt}
              width={1600}
              height={1100}
              priority
              sizes="(min-width: 1024px) 46vw, 100vw"
              className="h-auto w-full bg-white object-cover"
            />
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[#f8fafc] py-8">
        <div className="marketing-container">
          <ul className="grid gap-4 sm:grid-cols-3">
            {doc.metaCards.map((card) => (
              <li
                key={card.label}
                className="rounded-[18px] border border-[var(--border)] bg-white px-5 py-4 shadow-[var(--shadow-soft)]"
              >
                <p className="text-xs font-semibold tracking-[0.12em] text-[var(--accent)] uppercase">
                  {card.label}
                </p>
                <p className="mt-2 text-[15px] font-medium leading-relaxed">{card.value}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={sectionPad}>
        <div className="marketing-container grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:gap-12">
          <LegalStickyToc items={tocItems} ariaLabel={doc.tocLabel} heading={doc.tocLabel} />
          <div className="space-y-10">
            {doc.sections.map((section) => (
              <article
                key={section.id}
                id={section.id}
                className="scroll-mt-28 rounded-[20px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8"
              >
                <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{section.title}</h2>
                {section.paragraphs?.length ? (
                  <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-[var(--muted-foreground)] sm:text-base">
                    {section.paragraphs.map((p) => (
                      <p key={p.slice(0, 48)}>{p}</p>
                    ))}
                  </div>
                ) : null}
                {section.bullets?.length ? (
                  <ul className="mt-4 space-y-2">
                    {section.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex gap-3 text-[15px] leading-relaxed text-[var(--muted-foreground)]"
                      >
                        <span className="mt-1 text-[var(--accent)]" aria-hidden="true">
                          •
                        </span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {section.cards?.length ? (
                  <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                    {section.cards.map((card) => (
                      <li
                        key={card.title}
                        className="rounded-[16px] border border-[var(--border)] bg-[#f8fafc] p-4"
                      >
                        <h3 className="font-semibold">{card.title}</h3>
                        <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted-foreground)]">
                          {card.body}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {section.callout ? (
                  <aside className="mt-5 rounded-[16px] border border-[var(--accent)]/20 bg-[var(--accent-soft)] px-4 py-3 text-[15px] leading-relaxed text-[var(--muted-foreground)]">
                    {section.callout}
                  </aside>
                ) : null}
              </article>
            ))}

            <div
              id="questions"
              className="scroll-mt-28 rounded-[22px] border border-[var(--border)] bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_55%,#f5f3ff_100%)] px-6 py-8 text-center shadow-[var(--shadow-soft)] sm:px-10"
            >
              <h2 className="text-2xl font-semibold tracking-tight">{doc.contact.title}</h2>
              <p className="mx-auto mt-3 max-w-[560px] text-[15px] leading-relaxed text-[var(--muted-foreground)]">
                {doc.contact.body}
              </p>
              <Link
                href="/contact"
                className="btn-primary mt-6 inline-flex min-h-11 items-center justify-center px-6 text-sm"
              >
                {doc.contact.cta}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
