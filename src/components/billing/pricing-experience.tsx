"use client";

import {useId, useState, type ReactNode} from "react";
import {
  Check,
  Cloud,
  FolderKanban,
  Gauge,
  Lock,
  Sparkles,
  Timer,
  Wand2,
  Zap,
  UserRound,
  Crown,
  ShieldCheck,
  Layers,
  ArrowRight,
} from "lucide-react";
import {Link} from "@/i18n/navigation";
import type {PublicPricingView} from "@/server/billing/pricing-view";
import {PricingCheckoutActions} from "@/components/billing/pricing-checkout-actions";

type BillingPeriod = "month" | "year";

const FAQ_ITEMS = [
  {
    q: "Can I use it for free?",
    a: "Yes. Guest tools work without an account, and a Free account unlocks saved history, projects and a usage dashboard.",
  },
  {
    q: "How long are files stored?",
    a: "Guest files use temporary storage and are deleted automatically after about one hour. Signed-in plans keep project assets according to your account plan.",
  },
  {
    q: "What happens after upgrade?",
    a: "Pro raises processing limits, expands bulk capacity and unlocks higher-tier SEO workflows when your account is entitled.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. When paid billing is live through Stripe, you can cancel from account billing. Access continues through the paid period already settled.",
  },
  {
    q: "When will Stripe be available?",
    a: "Paid checkout appears only after the operator configures Stripe Price IDs. Until then the Pro card shows Coming Soon instead of a purchase flow.",
  },
  {
    q: "Is my data private?",
    a: "Uploads are processed for your request. Guest outputs are temporary. We do not use fake “unlimited retention” claims — temporary guest files are designed to expire.",
  },
] as const;

function CheckItem({children}: {children: ReactNode}) {
  return (
    <li className="flex items-start gap-2.5 text-sm leading-snug text-slate-600">
      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <Check className="h-3.5 w-3.5" aria-hidden />
      </span>
      <span>{children}</span>
    </li>
  );
}

function BillingToggle({
  value,
  onChange,
}: {
  value: BillingPeriod;
  onChange: (next: BillingPeriod) => void;
}) {
  const groupId = useId();
  return (
    <div
      className="inline-flex items-center rounded-full border border-slate-200 bg-white p-1 shadow-sm"
      role="group"
      aria-labelledby={`${groupId}-label`}
    >
      <span id={`${groupId}-label`} className="sr-only">
        Billing period
      </span>
      <button
        type="button"
        aria-pressed={value === "month"}
        className={`rounded-full px-4 py-2 text-sm font-semibold transition duration-150 motion-reduce:transition-none ${
          value === "month"
            ? "bg-slate-900 text-white shadow-sm"
            : "text-slate-600 hover:text-slate-900"
        }`}
        onClick={() => onChange("month")}
      >
        Monthly
      </button>
      <button
        type="button"
        aria-pressed={value === "year"}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition duration-150 motion-reduce:transition-none ${
          value === "year"
            ? "bg-slate-900 text-white shadow-sm"
            : "text-slate-600 hover:text-slate-900"
        }`}
        onClick={() => onChange("year")}
      >
        Yearly
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wide ${
            value === "year" ? "bg-white/15 text-white" : "bg-violet-50 text-violet-700"
          }`}
        >
          Save 20%
        </span>
      </button>
    </div>
  );
}

function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-3">
      {FAQ_ITEMS.map((item, index) => {
        const expanded = open === index;
        const panelId = `pricing-faq-${index}`;
        return (
          <div
            key={item.q}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_-24px_rgba(15,23,42,0.4)]"
          >
            <h3>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start text-base font-semibold text-slate-900 transition hover:bg-slate-50"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setOpen(expanded ? null : index)}
              >
                {item.q}
                <span
                  aria-hidden
                  className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition duration-200 motion-reduce:transition-none ${
                    expanded ? "rotate-45 bg-[var(--accent-soft)] text-[var(--accent)]" : ""
                  }`}
                >
                  +
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              hidden={!expanded}
              className="border-t border-slate-100 px-5 pb-5 pt-3 text-sm leading-relaxed text-slate-600"
            >
              {item.a}
            </div>
          </div>
        );
      })}
    </div>
  );
}

type CompareCell = boolean | string;

const COMPARE_ROWS: {
  label: string;
  guest: CompareCell;
  free: CompareCell;
  pro: CompareCell;
}[] = [
  {label: "Image Compression", guest: true, free: true, pro: true},
  {label: "Resize", guest: true, free: true, pro: true},
  {label: "Crop", guest: true, free: true, pro: true},
  {label: "Convert", guest: true, free: true, pro: true},
  {label: "Geotag", guest: true, free: true, pro: true},
  {label: "Metadata Viewer", guest: true, free: true, pro: true},
  {label: "Metadata Editor", guest: true, free: true, pro: true},
  {label: "Bulk Processing", guest: "Limited", free: "Higher", pro: "Large batches"},
  {label: "AI Alt Text", guest: false, free: "When configured", pro: "Higher allowance"},
  {label: "Saved History", guest: false, free: true, pro: true},
  {label: "Projects", guest: false, free: true, pro: true},
  {label: "Priority Processing", guest: false, free: false, pro: true},
  {label: "Commercial Usage", guest: "Personal / trial", free: "Creator", pro: "Supported"},
  {label: "Support", guest: "Docs", free: "Account help", pro: "Priority queue"},
  {label: "Storage", guest: "Temporary", free: "Account projects", pro: "Expanded projects"},
  {label: "Retention", guest: "~1 hour", free: "Project assets", pro: "Project assets"},
];

function CompareValue({value}: {value: CompareCell}) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center text-emerald-600" aria-label="Included">
        <Check className="h-4 w-4" aria-hidden />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="text-slate-300" aria-label="Not included">
        —
      </span>
    );
  }
  return <span className="text-sm font-medium text-slate-700">{value}</span>;
}

export function PricingExperience({view}: {view: PublicPricingView}) {
  const [period, setPeriod] = useState<BillingPeriod>("month");
  const free = view.plans.find((p) => p.code === "free") ?? view.plans[0]!;
  const pro = view.plans.find((p) => p.code === "pro") ?? view.plans[1]!;
  const guestOps = view.guest.display.standardOpsPerPeriod ?? 5;
  const guestRetention = view.guest.display.retentionHours ?? 1;

  return (
    <main id="main-content" className="bg-[var(--background)] text-slate-900">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200/70">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(37,99,235,0.14),_transparent_55%),radial-gradient(ellipse_at_80%_20%,_rgba(124,58,237,0.12),_transparent_40%)]"
        />
        <div className="marketing-container relative space-y-8 py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-3xl space-y-5 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
              Pricing
            </p>
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
              Choose the right plan for your workflow
            </h1>
            <p className="mx-auto max-w-2xl text-pretty text-base leading-relaxed text-slate-600 sm:text-lg">
              Start for free and upgrade only when you need higher limits, larger batches, project
              history and AI-powered SEO tools.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <BillingToggle value={period} onChange={setPeriod} />
            <p className="text-xs text-slate-500">
              {view.paidLaunchReady
                ? `Paid checkout uses ${period === "year" ? "annual" : "monthly"} billing when available.`
                : "Billing toggle is ready — paid Stripe checkout appears once Price IDs are configured."}
            </p>
          </div>
        </div>
      </section>

      {/* Cards */}
      <section className="marketing-container py-14 sm:py-16" aria-labelledby="plans-heading">
        <h2 id="plans-heading" className="sr-only">
          Plans
        </h2>
        <div className="grid items-stretch gap-6 lg:grid-cols-3 lg:gap-5">
          {/* Guest */}
          <article className="group flex flex-col rounded-[24px] border border-slate-200 bg-white p-7 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.45)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_28px_50px_-28px_rgba(37,99,235,0.35)] motion-reduce:transform-none motion-reduce:transition-none">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <UserRound className="h-5 w-5" aria-hidden />
            </div>
            <h3 className="mt-5 text-2xl font-semibold tracking-tight">{view.guest.displayName}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Perfect for quick one-time image tasks
            </p>
            <ul className="mt-6 flex-1 space-y-3">
              <CheckItem>No account required</CheckItem>
              <CheckItem>Temporary storage</CheckItem>
              <CheckItem>{guestOps} operations/day</CheckItem>
              <CheckItem>Auto delete after {guestRetention} hour</CheckItem>
              <CheckItem>Download immediately</CheckItem>
            </ul>
            <Link
              href="/compress-image"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Start using tools
            </Link>
          </article>

          {/* Free */}
          <article className="group flex flex-col rounded-[24px] border border-slate-200 bg-white p-7 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.45)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_28px_50px_-28px_rgba(37,99,235,0.35)] motion-reduce:transform-none motion-reduce:transition-none">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
              <FolderKanban className="h-5 w-5" aria-hidden />
            </div>
            <h3 className="mt-5 text-2xl font-semibold tracking-tight">{free.displayName}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">Best for regular creators</p>
            <ul className="mt-6 flex-1 space-y-3">
              <CheckItem>Saved history</CheckItem>
              <CheckItem>Projects</CheckItem>
              <CheckItem>Higher limits</CheckItem>
              <CheckItem>Bulk tools</CheckItem>
              <CheckItem>Usage dashboard</CheckItem>
              <CheckItem>Future AI support</CheckItem>
            </ul>
            <Link
              href="/register"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Create free account
            </Link>
          </article>

          {/* Pro */}
          <article className="relative flex flex-col rounded-[24px] p-[1px] shadow-[0_28px_60px_-28px_rgba(37,99,235,0.55)] transition duration-200 hover:-translate-y-1.5 motion-reduce:transform-none motion-reduce:transition-none lg:-mt-4 lg:mb-[-1rem]">
            <div
              aria-hidden
              className="absolute inset-0 rounded-[24px]"
              style={{backgroundImage: "var(--gradient-brand)"}}
            />
            <div className="relative flex h-full flex-col rounded-[23px] bg-gradient-to-b from-white via-white to-[var(--accent-soft)] p-7 sm:p-8">
              <div className="absolute -top-3 end-6">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-white shadow-md"
                  style={{backgroundImage: "var(--gradient-brand)"}}
                >
                  <Crown className="h-3.5 w-3.5" aria-hidden />
                  Most Popular
                </span>
              </div>
              <div
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm"
                style={{backgroundImage: "var(--gradient-brand)"}}
              >
                <Sparkles className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">{pro.displayName}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                For professionals who need higher limits and stronger SEO workflows.
              </p>
              <p className="mt-4 text-xs font-medium text-slate-500">
                {period === "year" ? "Yearly billing preferred · Save 20%" : "Monthly billing preferred"}
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                <CheckItem>Everything in Free</CheckItem>
                <CheckItem>Much higher limits</CheckItem>
                <CheckItem>Large bulk processing</CheckItem>
                <CheckItem>Faster processing priority</CheckItem>
                <CheckItem>AI SEO tools</CheckItem>
                <CheckItem>Commercial usage</CheckItem>
                <CheckItem>Future API access</CheckItem>
              </ul>
              <div className="mt-8">
                <PricingCheckoutActions
                  checkoutAvailable={pro.checkoutAvailable}
                  monthlyAvailable={pro.monthlyCheckoutAvailable}
                  annualAvailable={pro.annualCheckoutAvailable}
                  preferredInterval={period}
                />
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* Comparison */}
      <section className="border-y border-slate-200/80 bg-white py-16" aria-labelledby="compare-heading">
        <div className="marketing-container space-y-8">
          <div className="max-w-2xl space-y-3">
            <h2 id="compare-heading" className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Compare features side by side
            </h2>
            <p className="text-slate-600">
              Honest capability matrix — no fake unlimited claims. Exact allowances follow the active
              plan definition.
            </p>
          </div>
          <div className="overflow-x-auto rounded-[24px] border border-slate-200 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.5)]">
            <table className="min-w-[720px] w-full border-collapse text-left">
              <caption className="sr-only">Plan feature comparison</caption>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th scope="col" className="px-5 py-4 text-sm font-semibold text-slate-500">
                    Feature
                  </th>
                  <th scope="col" className="px-5 py-4 text-sm font-semibold text-slate-900">
                    Guest
                  </th>
                  <th scope="col" className="px-5 py-4 text-sm font-semibold text-slate-900">
                    Free
                  </th>
                  <th scope="col" className="px-5 py-4 text-sm font-semibold text-[var(--accent)]">
                    Pro
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-slate-100 last:border-0">
                    <th scope="row" className="px-5 py-3.5 text-sm font-medium text-slate-800">
                      {row.label}
                    </th>
                    <td className="px-5 py-3.5">
                      <CompareValue value={row.guest} />
                    </td>
                    <td className="px-5 py-3.5">
                      <CompareValue value={row.free} />
                    </td>
                    <td className="bg-[var(--accent-soft)]/40 px-5 py-3.5">
                      <CompareValue value={row.pro} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Why upgrade */}
      <section className="marketing-container py-16" aria-labelledby="why-heading">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <h2 id="why-heading" className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Why upgrade
          </h2>
          <p className="text-slate-600">
            Move from one-off downloads to a calmer, higher-capacity image workflow.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Faster Workflow",
              body: "Keep going without re-upload friction for everyday creator tasks.",
              icon: Zap,
              tone: "bg-blue-50 text-blue-700",
            },
            {
              title: "Save Hours",
              body: "Batch compress, resize and convert instead of repeating the same steps.",
              icon: Timer,
              tone: "bg-violet-50 text-violet-700",
            },
            {
              title: "Higher Limits",
              body: "More operations and larger batches when guest caps become too tight.",
              icon: Gauge,
              tone: "bg-cyan-50 text-cyan-700",
            },
            {
              title: "Professional SEO",
              body: "Prepare alt text, metadata and publish-ready assets with clearer control.",
              icon: Wand2,
              tone: "bg-amber-50 text-amber-700",
            },
          ].map((item) => (
            <article
              key={item.title}
              className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_16px_36px_-30px_rgba(15,23,42,0.45)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_44px_-28px_rgba(37,99,235,0.35)] motion-reduce:transform-none"
            >
              <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${item.tone}`}>
                <item.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Security */}
      <section className="border-y border-slate-200/80 bg-slate-50 py-16" aria-labelledby="security-heading">
        <div className="marketing-container grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_50px_-34px_rgba(15,23,42,0.55)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/illustrations/privacy-protection.png"
              alt="Illustration of private image uploads and protected cloud storage"
              width={960}
              height={720}
              className="h-auto w-full object-cover"
            />
          </div>
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
              Security
            </p>
            <h2 id="security-heading" className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Built for private, temporary and protected image work
            </h2>
            <ul className="space-y-4">
              {[
                {icon: Lock, title: "Private uploads", body: "Files are processed for your request — not published as open galleries."},
                {icon: Timer, title: "Temporary guest storage", body: "Guest outputs are designed to expire automatically after a short window."},
                {icon: ShieldCheck, title: "Automatic deletion", body: "Expired guest assets are cleaned up so temporary work does not linger."},
                {icon: Cloud, title: "Secure processing", body: "Server-side validation and trusted storage keys protect active project assets."},
                {icon: Layers, title: "Cloud storage protection", body: "Object access is mediated by the app — not guessed public file paths."},
              ].map((row) => (
                <li key={row.title} className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--accent)] shadow-sm">
                    <row.icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">{row.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{row.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Trusted by */}
      <section className="marketing-container py-16" aria-labelledby="trust-heading">
        <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-10 text-center shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)] sm:px-10">
          <h2 id="trust-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Trusted by thousands of creators and teams
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">
            No invented company logos. Real people use Img Pilot every day for fast, private image
            work.
          </p>
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {["Creators", "Developers", "Agencies", "Designers", "Marketing teams"].map((label) => (
              <li
                key={label}
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-y border-slate-200/80 bg-white py-16" aria-labelledby="faq-heading">
        <div className="marketing-container grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-3">
            <h2 id="faq-heading" className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Frequently asked questions
            </h2>
            <p className="text-slate-600">
              Clear answers about free access, retention, upgrades and privacy.
            </p>
          </div>
          <FaqAccordion />
        </div>
      </section>

      {/* Final CTA */}
      <section className="marketing-container py-16 sm:py-20">
        <div
          className="relative overflow-hidden rounded-[28px] px-6 py-12 text-center text-white sm:px-10 sm:py-16"
          style={{backgroundImage: "var(--gradient-brand)"}}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.16),transparent_35%)]"
          />
          <div className="relative mx-auto max-w-2xl space-y-5">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Ready to optimize every image?
            </h2>
            <p className="text-base text-white/85">
              Start free in the browser, then create an account when you need history and higher
              capacity.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-white px-6 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-slate-50"
              >
                Start Free
              </Link>
              <Link
                href="/compress-image"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/35 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
              >
                View Image Tools
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            {!view.paidLaunchReady ? (
              <p className="text-xs text-white/75" role="status">
                Paid Pro checkout unlocks after Stripe Price IDs are configured. Currency:{" "}
                {view.currency}.
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
