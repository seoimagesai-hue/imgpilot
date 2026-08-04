import {setRequestLocale} from "next-intl/server";
import {CleanupActionForm} from "@/components/admin/cleanup-action-form";
import {overviewCounts} from "@/server/admin/queries";
import {readCleanupSchedulerHeartbeat} from "@/server/ops/cleanup-scheduler";
import {isAppLocale} from "@/server/auth/validation";

export const metadata = {title: "Admin · Cleanup"};

type PageProps = {params: Promise<{locale: string}>};

export default async function AdminCleanupPage({params}: PageProps) {
  const {locale: rawLocale} = await params;
  const locale = isAppLocale(rawLocale) ? rawLocale : "en";
  setRequestLocale(locale);

  const [counts, heartbeat] = await Promise.all([overviewCounts(), Promise.resolve(readCleanupSchedulerHeartbeat())]);

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Cleanup</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Guest asset reconciliation and exact-key deletion queue.
        </p>
      </header>

      <section className="mb-8 grid gap-4 sm:grid-cols-2">
        <article className="rounded-xl border border-[var(--border)] p-5 text-sm">
          <h2 className="font-semibold">Queue</h2>
          <p className="mt-2 text-2xl font-semibold">{counts.guestCleanupPending}</p>
          <p className="text-[var(--muted)]">pending guest cleanup items</p>
        </article>
        <article className="rounded-xl border border-[var(--border)] p-5 text-sm">
          <h2 className="font-semibold">Scheduler heartbeat</h2>
          <dl className="mt-3 space-y-2">
            <div>
              <dt className="text-[var(--muted)]">Last success</dt>
              <dd>{heartbeat.lastSuccessAt ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Status</dt>
              <dd>{heartbeat.lastStatus}</dd>
            </div>
          </dl>
        </article>
      </section>

      <CleanupActionForm locale={locale} />
    </main>
  );
}
