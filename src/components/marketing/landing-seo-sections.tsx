import type {LandingBenefitCard, LandingFaq} from "@/lib/marketing/tool-landing-content";

export function LandingWhy({title, body}: {title: string; body: string}) {
  return (
    <section className="prose-container space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-[var(--muted-foreground)]">{body}</p>
    </section>
  );
}

export function LandingBenefitCards({items}: {items: LandingBenefitCard[]}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Benefits</h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.title} className="card-surface px-4 py-4">
            <h3 className="font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function LandingHowTo({steps}: {steps: string[]}) {
  return (
    <section className="prose-container space-y-3">
      <h2 className="text-xl font-semibold">How it works</h2>
      <ol className="list-decimal space-y-2 ps-5 text-[var(--muted-foreground)]">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </section>
  );
}

export function LandingTechnical({title, body}: {title: string; body: string}) {
  return (
    <section className="prose-container space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-[var(--muted-foreground)]">{body}</p>
    </section>
  );
}

export function LandingBottomCta({label, href = "#tool-workspace"}: {label: string; href?: string}) {
  return (
    <section className="card-surface flex flex-col items-start gap-3 px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
      <p className="font-medium">Need another file?</p>
      <a href={href} className="btn-primary text-sm">
        {label}
      </a>
    </section>
  );
}

export function LandingFaqSection({items}: {items: LandingFaq[]}) {
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
