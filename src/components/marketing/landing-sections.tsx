import {Link} from "@/i18n/navigation";
import {getToolLanding} from "@/lib/marketing/tool-landing-registry";

export function Breadcrumbs({
  items,
}: {
  items: {href?: string; label: string}[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3 text-sm text-[var(--muted-foreground)]">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
            {index > 0 ? <span aria-hidden>/</span> : null}
            {item.href ? (
              <Link href={item.href} className="hover:text-[var(--foreground)]">
                {item.label}
              </Link>
            ) : (
              <span className="text-[var(--foreground)]">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function RelatedTools({slugs}: {slugs: string[]}) {
  const items = slugs
    .slice(0, 6)
    .map((slug) => {
      if (slug.startsWith("/")) {
        return {href: slug, label: slug.replace(/^\//, "").replace(/-/g, " ")};
      }
      const knownGenerics: Record<string, string> = {
        "compress-image": "Compress Image",
        "resize-image": "Resize Image",
        "crop-image": "Crop Image",
        "convert-image": "Convert Image",
        "bulk-image-tools": "Bulk Image Tools",
      };
      if (knownGenerics[slug]) {
        return {href: `/${slug}`, label: knownGenerics[slug]};
      }
      const landing = getToolLanding(slug);
      if (!landing || landing.redirectTo) return null;
      return {href: `/${landing.slug}`, label: landing.h1};
    })
    .filter(Boolean) as {href: string; label: string}[];

  if (!items.length) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">Related tools</h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="card-surface block px-4 py-4 text-sm font-medium hover:border-[var(--accent)]"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ToolFaq({items}: {items: {q: string; a: string}[]}) {
  if (!items.length) return null;
  return (
    <section className="prose-container space-y-3">
      <h2 className="text-xl font-semibold">FAQ</h2>
      <div className="space-y-2">
        {items.map((item) => (
          <details key={item.q} className="card-surface px-4 py-3">
            <summary className="cursor-pointer font-medium">{item.q}</summary>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
