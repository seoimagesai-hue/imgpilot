import {isRtlLocale} from "@/i18n/routing";
import Image from "next/image";
import {Link} from "@/i18n/navigation";
import {ContactMailtoForm} from "@/components/marketing/contact-mailto-form";
import {Breadcrumbs} from "@/components/marketing/landing-sections";
import {JsonLd} from "@/components/marketing/json-ld";
import {getContactCopy} from "@/lib/marketing/contact-landing-content";
import {absoluteUrl, getPublicAppOrigin} from "@/server/marketing/seo";

function Eyebrow({children}: {children: string}) {
  return (
    <p className="text-xs font-semibold tracking-[0.14em] text-[var(--accent)] uppercase">
      {children}
    </p>
  );
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

export function ContactLandingView({
  locale,
  supportEmail,
}: {
  locale: string;
  supportEmail: string | null;
}) {
  const copy = getContactCopy(locale);
  const origin = getPublicAppOrigin();
  const path = "/contact";
  const pageUrl = absoluteUrl(locale, path);
  const isRtl = isRtlLocale(locale);

  const crumbs = [
    {href: "/", label: isRtl ? "ہوم" : "Home"},
    {label: copy.breadcrumbCurrent},
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      name: copy.hero.h1,
      description: copy.metaDescription,
      url: pageUrl,
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Img Pilot",
      url: origin,
      ...(supportEmail
        ? {contactPoint: [{"@type": "ContactPoint", email: supportEmail, contactType: "customer support"}]}
        : {}),
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
              {copy.hero.badge}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{copy.hero.h1}</h1>
            <p className="text-base leading-relaxed text-[var(--muted-foreground)] sm:text-[17px]">
              {copy.hero.paragraph}
            </p>
            {supportEmail ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                {isRtl ? "ای میل: " : "Email: "}
                <a className="font-medium text-[var(--accent)] underline" href={`mailto:${supportEmail}`}>
                  {supportEmail}
                </a>
              </p>
            ) : null}
          </div>
          <div className="overflow-hidden rounded-[20px] bg-white ring-1 ring-[var(--border)]">
            <Image
              src="/illustrations/contact-hero.webp"
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

      <section id="contact-form" className={`${sectionPad} bg-[#f8fafc]`}>
        <div className="marketing-container grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
          <div>
            <h2 className="mb-5 text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{copy.form.title}</h2>
            <ContactMailtoForm
              supportEmail={supportEmail}
              labels={{
                name: copy.form.name,
                email: copy.form.email,
                subject: copy.form.subject,
                message: copy.form.message,
                submit: copy.form.submit,
                unavailable: copy.form.unavailable,
                required: copy.form.required,
              }}
            />
          </div>
          <div className="space-y-6">
            <div className={`space-y-3 ${isRtl ? "text-right" : ""}`}>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{copy.response.title}</h2>
              {copy.response.paragraphs.map((p) => (
                <p key={p.slice(0, 40)} className="text-[15px] leading-relaxed text-[var(--muted-foreground)]">
                  {p}
                </p>
              ))}
            </div>
            <ul className="space-y-3 rounded-[18px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-soft)]">
              {copy.response.points.map((point) => (
                <li key={point} className="flex gap-3 text-[15px] leading-relaxed text-[var(--muted-foreground)]">
                  <span
                    className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <aside className="rounded-[18px] border border-[var(--accent)]/20 bg-[var(--accent-soft)] px-5 py-4">
              <h3 className="font-semibold">{copy.business.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted-foreground)]">{copy.business.body}</p>
            </aside>
          </div>
        </div>
      </section>

      <section className={sectionPad}>
        <div className="marketing-container space-y-8">
          <div className="mx-auto max-w-[820px] space-y-3 text-center">
            <Eyebrow>{copy.support.eyebrow}</Eyebrow>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{copy.support.title}</h2>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {copy.support.cards.map((card) => (
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

      <section className={`${sectionPad} bg-[#f8fafc]`}>
        <div className="marketing-container">
          <div className="mx-auto max-w-[820px] space-y-6">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{copy.faqHeading}</h2>
            <FaqAccordion items={copy.faqs} />
          </div>
        </div>
      </section>

      <section className={sectionPad}>
        <div className="marketing-container">
          <div className="rounded-[22px] border border-[var(--border)] bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_55%,#f5f3ff_100%)] px-6 py-10 text-center shadow-[var(--shadow-soft)] sm:px-10 sm:py-12">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{copy.cta.title}</h2>
            <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Link href="/search" className="btn-primary inline-flex min-h-11 items-center justify-center px-6 text-sm">
                {copy.cta.exploreCta}
              </Link>
              <Link
                href="/"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-white px-6 text-sm font-semibold shadow-sm transition hover:bg-[var(--muted)]/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {copy.cta.homeCta}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
