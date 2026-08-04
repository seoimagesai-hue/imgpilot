import Image from "next/image";
import {Link} from "@/i18n/navigation";
import {PublicFooter, PublicHeader} from "@/components/marketing/public-chrome";

const SUGGESTIONS = [
  {href: "/compress-jpg", title: "Compress JPG"},
  {href: "/resize-jpg", title: "Resize JPG"},
  {href: "/convert-image", title: "Image Converter"},
  {href: "/compress-image", title: "Image Compressor"},
] as const;

export default function LocaleNotFound() {
  return (
    <>
      <PublicHeader />
      <main
        id="main-content"
        className="pb-16 [&_.marketing-container]:px-5"
      >
        <section className="marketing-container grid items-center gap-10 pt-16 pb-10 lg:grid-cols-2 lg:gap-12 md:pt-[72px]">
          <div className="max-w-[640px] space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-sm font-medium shadow-[var(--shadow-soft)]">
              404
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Page Not Found</h1>
            <p className="text-base leading-relaxed text-[var(--muted-foreground)] sm:text-[17px]">
              The page you&apos;re looking for may have been moved, renamed or no longer exists.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/" className="btn-primary inline-flex min-h-11 items-center justify-center px-6 text-sm">
                Go Home
              </Link>
              <Link
                href="/search"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-white px-6 text-sm font-semibold shadow-sm transition hover:bg-[var(--muted)]/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Explore Tools
              </Link>
              <Link
                href="/search"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-white px-6 text-sm font-semibold shadow-sm transition hover:bg-[var(--muted)]/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Search Images
              </Link>
            </div>
          </div>
          <div className="overflow-hidden rounded-[20px] bg-white ring-1 ring-[var(--border)]">
            <Image
              src="/illustrations/not-found-hero.webp"
              alt="Broken browser window and search icons illustrating a missing page"
              width={1600}
              height={1100}
              priority
              sizes="(min-width: 1024px) 46vw, 100vw"
              className="h-auto w-full bg-white object-cover"
            />
          </div>
        </section>

        <section className="marketing-container">
          <h2 className="mb-5 text-xl font-semibold">Popular Tools</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SUGGESTIONS.map((tool) => (
              <li key={tool.href}>
                <Link
                  href={tool.href}
                  className="flex h-full flex-col rounded-[18px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-soft)] transition hover:border-[var(--accent)]/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <span className="text-base font-semibold">{tool.title}</span>
                  <span className="mt-2 text-sm text-[var(--muted-foreground)]">Open tool</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
