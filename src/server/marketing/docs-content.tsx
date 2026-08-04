import type {Metadata} from "next";
import {DocsPager} from "@/components/marketing/docs-nav";
import type {AppLocale} from "@/i18n/routing";
import {DOCS, type DocDefinition, type DocSlug} from "@/server/marketing/docs-data";
import {buildPublicMetadata} from "@/server/marketing/seo";

export type {DocSlug};

export function docsMetadata(slug: DocSlug, locale: AppLocale): Metadata {
  const doc = DOCS[slug];
  return buildPublicMetadata({
    locale,
    path: doc.path,
    title: doc.title,
    description: doc.description,
  });
}

function DocSections({doc}: {doc: DocDefinition}) {
  return (
    <article className="prose max-w-none">
      <h1>{doc.title}</h1>
      <p className="text-[var(--muted)]">{doc.description}</p>
      {doc.sections.map((section) => (
        <section key={section.h}>
          <h2>{section.h}</h2>
          {section.p.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </section>
      ))}
    </article>
  );
}

export function DocsArticle({slug, locale}: {slug: DocSlug; locale: AppLocale}) {
  void locale;
  const doc = DOCS[slug];
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <DocSections doc={doc} />
      <DocsPager current={doc.path} />
    </main>
  );
}
