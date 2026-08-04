import Image from "next/image";
import {Breadcrumbs} from "@/components/marketing/landing-sections";
import {JsonLd} from "@/components/marketing/json-ld";
import {ToolSearchClient} from "@/components/marketing/tool-search-client";
import {getPublicAppOrigin} from "@/server/marketing/seo";

export function SearchLandingView({locale}: {locale: string}) {
  const isRtl = locale === "ur";
  const origin = getPublicAppOrigin();
  const path = "/search";
  const pageUrl = `${origin}/${locale}${path}`;

  const copy = isRtl
    ? {
        crumb: "تلاش",
        badge: "TOOL SEARCH",
        h1: "امیج ٹولز تلاش کریں",
        paragraph: "کنورٹ، کمپریس، ری سائز، کراپ اور بلک ٹولز فوراً تلاش کریں۔",
        metaTitle: "ٹول تلاش | SEO Images",
        metaDescription: "SEO Images کے امیج ٹولز تلاش کریں — تیز فلٹرنگ اور مقبول تجاویز کے ساتھ۔",
        heroAlt: "امیج ٹول تلاش انٹرفیس کی مثال",
        labels: {
          placeholder: "ٹول تلاش کریں…",
          popular: "مقبول ٹولز",
          recent: "حالیہ ٹولز",
          categories: "زمرے",
          results: "نتائج",
          empty: "کوئی ٹول نہیں ملا۔ دوسرا لفظ آزمائیں۔",
          shortcuts: "کی بورڈ شارٹ کٹس",
          slash: "/ فوکس",
          esc: "Esc چھوڑیں",
        },
      }
    : {
        crumb: "Search",
        badge: "TOOL SEARCH",
        h1: "Find an Image Tool",
        paragraph: "Search convert, compress, resize, crop and bulk tools instantly.",
        metaTitle: "Search Tools | SEO Images",
        metaDescription:
          "Find SEO Images tools fast with instant filtering, popular suggestions and categories.",
        heroAlt: "Image tool search interface illustration",
        labels: {
          placeholder: "Search image tools…",
          popular: "Popular tools",
          recent: "Recent tools",
          categories: "Categories",
          results: "Results",
          empty: "No tools matched. Try another keyword.",
          shortcuts: "Keyboard shortcuts",
          slash: "/ to focus",
          esc: "Esc to blur",
        },
      };

  const crumbs = [
    {href: "/", label: isRtl ? "ہوم" : "Home"},
    {label: copy.crumb},
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: copy.h1,
      description: copy.metaDescription,
      url: pageUrl,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {name: crumbs[0]!.label, path: "/"},
        {name: copy.crumb, path},
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
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-12">
          <div className={`max-w-[820px] space-y-4 ${isRtl ? "text-right" : ""}`}>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-sm font-medium shadow-[var(--shadow-soft)]">
              {copy.badge}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{copy.h1}</h1>
            <p className="text-base leading-relaxed text-[var(--muted-foreground)] sm:text-[17px]">
              {copy.paragraph}
            </p>
          </div>
          <div className="overflow-hidden rounded-[20px] bg-white ring-1 ring-[var(--border)]">
            <Image
              src="/illustrations/search-hero.webp"
              alt={copy.heroAlt}
              width={1600}
              height={1100}
              priority
              sizes="(min-width: 1024px) 46vw, 100vw"
              className="h-auto w-full bg-white object-cover"
            />
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--border)] bg-[#f8fafc] py-14 md:py-20">
        <div className="marketing-container">
          <ToolSearchClient labels={copy.labels} />
        </div>
      </section>
    </main>
  );
}

export function getSearchMeta(locale: string) {
  if (locale === "ur") {
    return {
      title: "ٹول تلاش | SEO Images",
      description: "SEO Images کے امیج ٹولز تلاش کریں — تیز فلٹرنگ اور مقبول تجاویز کے ساتھ۔",
    };
  }
  return {
    title: "Search Tools | SEO Images",
    description: "Find SEO Images tools fast with instant filtering, popular suggestions and categories.",
  };
}
