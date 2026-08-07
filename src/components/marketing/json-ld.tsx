import {absoluteUrl} from "@/server/marketing/seo";

export function JsonLd({data}: {data: Record<string, unknown> | Record<string, unknown>[]}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{__html: JSON.stringify(data)}}
    />
  );
}

export function landingJsonLd(params: {
  locale: string;
  path: string;
  title: string;
  description: string;
  breadcrumbs: {name: string; path: string}[];
  faqs: {q: string; a: string}[];
}) {
  const pageUrl = absoluteUrl(params.locale, params.path);

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: params.breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(params.locale, crumb.path),
    })),
  };

  const faq =
    params.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: params.faqs.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.a,
            },
          })),
        }
      : null;

  const webpage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: params.title,
    description: params.description,
    url: pageUrl,
  };

  return [webpage, breadcrumb, faq].filter(Boolean) as Record<string, unknown>[];
}
