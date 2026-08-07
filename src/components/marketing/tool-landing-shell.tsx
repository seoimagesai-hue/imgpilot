import Image from "next/image";
import type {ReactNode} from "react";
import {GuestToolWorkspace} from "@/components/guest/guest-tool-workspace";
import type {GuestToolConfig} from "@/components/guest/tool-config";
import {JsonLd} from "@/components/marketing/json-ld";
import {Link} from "@/i18n/navigation";
import type {ToolLandingCopy} from "@/lib/marketing/tool-landing-copy";
import {absoluteUrl} from "@/server/marketing/seo";

/** Same section set as the Compress mockup — no extra marketing blocks. */
const HOW_STEP_IMAGES = [
  {
    src: "/illustrations/how-it-works-upload.png",
    alt: "Upload an image into the tool",
  },
  {
    src: "/illustrations/how-it-works-settings.png",
    alt: "Choose processing settings",
  },
  {
    src: "/illustrations/how-it-works-process.png",
    alt: "Preview the processed result",
  },
  {
    src: "/illustrations/how-it-works-download.png",
    alt: "Download the finished file",
  },
] as const;

const FLOAT_BADGES = [
  {label: "JPG", className: "bg-rose-500", pos: "-left-1 -top-3 sm:-left-3 sm:-top-4"},
  {label: "PNG", className: "bg-emerald-500", pos: "left-1/2 -top-4 -translate-x-1/2 sm:-top-5"},
  {label: "WEBP", className: "bg-violet-500", pos: "-right-1 -top-3 sm:-right-3 sm:-top-4"},
] as const;

const FEATURE_ICON_WRAP: Record<ToolLandingCopy["features"][number]["tone"], string> = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-emerald-50 text-emerald-600",
  purple: "bg-violet-50 text-violet-600",
  orange: "bg-orange-50 text-orange-600",
};

function TrustIcon({index}: {index: number}) {
  const wrap =
    index === 0
      ? "bg-blue-50 text-blue-600"
      : index === 1
        ? "bg-emerald-50 text-emerald-600"
        : "bg-orange-50 text-orange-600";
  return (
    <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${wrap}`} aria-hidden>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        {index === 0 ? (
          <path d="M12 3l7 3v5c0 4.5-2.8 7.8-7 9-4.2-1.2-7-4.5-7-9V6l7-3z" strokeLinejoin="round" />
        ) : null}
        {index === 1 ? (
          <>
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
          </>
        ) : null}
        {index === 2 ? (
          <>
            <circle cx="12" cy="12" r="8" />
            <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
          </>
        ) : null}
      </svg>
    </span>
  );
}

function FeatureGlyph({tone}: {tone: ToolLandingCopy["features"][number]["tone"]}) {
  return (
    <span
      className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${FEATURE_ICON_WRAP[tone]}`}
      aria-hidden
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        {tone === "blue" ? <path d="M7 3v12h12M17 21V9H5" strokeLinecap="round" /> : null}
        {tone === "green" ? (
          <>
            <path d="M12 20a8 8 0 1 0-8-8" strokeLinecap="round" />
            <path d="M12 12l4-2" strokeLinecap="round" />
          </>
        ) : null}
        {tone === "purple" ? (
          <>
            <rect x="3" y="5" width="18" height="12" rx="2" />
            <path d="M8 21h8M12 17v4" strokeLinecap="round" />
          </>
        ) : null}
        {tone === "orange" ? (
          <>
            <circle cx="12" cy="12" r="8" />
            <path d="M8.5 12.5l2.2 2.2 4.8-5" strokeLinecap="round" strokeLinejoin="round" />
          </>
        ) : null}
      </svg>
    </span>
  );
}

function BenefitIcon({kind}: {kind: "privacy" | "speed"}) {
  return (
    <span
      className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
        kind === "privacy" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
      }`}
      aria-hidden
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        {kind === "privacy" ? (
          <path d="M12 3l7 3v5c0 4.5-2.8 7.8-7 9-4.2-1.2-7-4.5-7-9V6l7-3z" strokeLinejoin="round" />
        ) : (
          <>
            <path d="M12 20a8 8 0 1 0-8-8" strokeLinecap="round" />
            <path d="M12 12l4-2" strokeLinecap="round" />
          </>
        )}
      </svg>
    </span>
  );
}

function StepArrow() {
  return (
    <span
      aria-hidden
      className="absolute -right-3 top-1/2 z-[1] hidden -translate-y-1/2 text-[var(--accent)] xl:block"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function ToolLandingShell({
  locale,
  copy,
  toolConfig,
  workspace,
}: {
  locale: string;
  copy: ToolLandingCopy;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toolConfig?: GuestToolConfig<any>;
  /** Optional custom workspace (bulk / special pages). Defaults to GuestToolWorkspace. */
  workspace?: ReactNode;
}) {
  const pageUrl = absoluteUrl(locale, copy.path);
  const jsonLd = [
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

  const marketingPresentation = {
    ...toolConfig?.presentation,
    landingChrome: "marketing" as const,
    dropLabel: toolConfig?.presentation?.dropLabel ?? "Drop an image here or click to upload",
    supportLabel: toolConfig?.presentation?.supportLabel ?? "",
    browseLabel: toolConfig?.presentation?.browseLabel ?? "Choose an Image",
    formatsHint:
      toolConfig?.presentation?.formatsHint ?? "You can also paste an image with Ctrl + V",
    ...(copy.path === "/compress-image" ? {marketingCompressPresets: true} : null),
  };

  return (
    <main id="main-content" className="bg-white pb-0">
      <JsonLd data={jsonLd} />

      {/* 1. Hero — copy left, upload right */}
      <section className="border-b border-slate-200/70 bg-gradient-to-b from-[#f5f9ff] via-white to-white">
        <div className="marketing-container space-y-8 py-8 sm:py-12 lg:py-14">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link href="/" className="hover:text-slate-800">
                  Home
                </Link>
              </li>
              <li aria-hidden className="text-slate-400">
                &gt;
              </li>
              <li className="font-medium text-slate-700">{copy.breadcrumbCurrent}</li>
            </ol>
          </nav>

          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:gap-14">
            <div className="space-y-5">
              <h1 className="text-balance text-[clamp(2rem,3.8vw,3.25rem)] font-bold tracking-tight text-slate-900">
                {copy.h1}
              </h1>
              <p className="text-lg font-semibold text-[var(--accent)] sm:text-xl">{copy.subtitle}</p>
              <p className="max-w-xl text-base leading-relaxed text-slate-600">{copy.paragraph}</p>
              <ul className="flex flex-wrap gap-x-5 gap-y-3 pt-1">
                {copy.trust.map((label, index) => (
                  <li key={label} className="inline-flex items-center gap-2.5 text-sm font-medium text-slate-700">
                    <TrustIcon index={index} />
                    <span>{label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative mx-auto w-full max-w-[540px] pt-4 lg:mx-0 lg:max-w-none">
              {FLOAT_BADGES.map((badge) => (
                <span
                  key={badge.label}
                  className={`home-float absolute z-[2] inline-flex rounded-lg px-2.5 py-1 text-[10px] font-bold tracking-wide text-white shadow-md ${badge.className} ${badge.pos}`}
                  dir="ltr"
                >
                  {badge.label}
                </span>
              ))}
              <div
                id="tool-workspace"
                className="relative rounded-[28px] border border-slate-200 bg-white p-2 shadow-[0_28px_70px_-40px_rgba(37,99,235,0.55)] sm:p-3"
              >
                {workspace ??
                  (toolConfig ? (
                    <GuestToolWorkspace
                      config={{
                        ...toolConfig,
                        hideToolHeader: true,
                        presentation: marketingPresentation,
                      }}
                    />
                  ) : null)}
              </div>
              {copy.workspaceNote ? (
                <p className="mt-4 text-center text-xs leading-relaxed text-slate-500 sm:text-[13px]">
                  {copy.workspaceNote}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Features */}
      <section className="bg-white py-16 sm:py-20">
        <div className="marketing-container space-y-12">
          <h2 className="text-center text-[clamp(1.6rem,2.6vw,2.15rem)] font-bold tracking-tight text-slate-900">
            {copy.featuresHeading}
          </h2>
          <ul className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
            {copy.features.map((feature) => (
              <li key={feature.title} className="px-2 text-center">
                <FeatureGlyph tone={feature.tone} />
                <h3
                  className={`text-base font-semibold ${
                    feature.tone === "green" ? "text-[var(--accent)]" : "text-slate-900"
                  }`}
                >
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3. How it works */}
      <section className="bg-[#f8fafc] py-16 sm:py-20">
        <div className="marketing-container space-y-12">
          <h2 className="text-center text-[clamp(1.6rem,2.6vw,2.15rem)] font-bold tracking-tight text-slate-900">
            {copy.howHeading}
          </h2>
          <ol className="relative grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {copy.howSteps.map((step, index) => {
              const art = HOW_STEP_IMAGES[index] ?? HOW_STEP_IMAGES[0];
              return (
                <li key={step.title} className="relative rounded-2xl bg-white px-5 py-6 text-center shadow-sm">
                  {index < copy.howSteps.length - 1 ? <StepArrow /> : null}
                  <span className="mx-auto mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <div className="relative mx-auto mb-4 h-28 w-full max-w-[180px]">
                    <Image src={art.src} alt={art.alt} fill className="object-contain" sizes="180px" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* 4. Privacy / speed */}
      <section className="bg-white py-14 sm:py-16">
        <div className="marketing-container grid gap-4 md:grid-cols-2">
          {copy.benefitCards.map((card) => (
            <article
              key={card.title}
              className="flex items-start gap-4 rounded-3xl border border-slate-200/80 bg-[#f3f7fc] px-5 py-6 sm:px-6"
            >
              <BenefitIcon kind={card.kind} />
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{card.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 5. FAQ */}
      <section className="bg-[#f8fafc] py-16 sm:py-20">
        <div className="marketing-container mx-auto max-w-3xl space-y-8">
          <h2 className="text-center text-[clamp(1.6rem,2.6vw,2.15rem)] font-bold tracking-tight text-slate-900">
            {copy.faqHeading}
          </h2>
          <div className="space-y-3">
            {copy.faqs.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
              >
                <summary className="cursor-pointer list-none font-semibold text-slate-900 marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-3">
                    {item.q}
                    <span className="text-[var(--accent)] transition group-open:rotate-180" aria-hidden>
                      ▾
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
