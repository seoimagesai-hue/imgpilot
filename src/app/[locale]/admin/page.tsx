import {setRequestLocale} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {overviewCounts} from "@/server/admin/queries";
import {isAppLocale} from "@/server/auth/validation";

export const metadata = {title: "Admin overview"};

type PageProps = {params: Promise<{locale: string}>};

function StatCard({label, value, href}: {label: string; value: number | string; href?: string}) {
  const inner = (
    <article className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </article>
  );
  if (href) {
    return (
      <Link href={href} className="block transition hover:opacity-90">
        {inner}
      </Link>
    );
  }
  return inner;
}

export default async function AdminOverviewPage({params}: PageProps) {
  const {locale: rawLocale} = await params;
  const locale = isAppLocale(rawLocale) ? rawLocale : "en";
  setRequestLocale(locale);

  const counts = await overviewCounts();

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-2 text-[var(--muted)]">Platform operations snapshot.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Users (total)" value={counts.usersTotal} href="/admin/users" />
        <StatCard label="Users (active)" value={counts.usersActive} href="/admin/users" />
        <StatCard label="Users (suspended)" value={counts.usersSuspended} href="/admin/users" />
        <StatCard label="Guest sessions" value={counts.guestSessionsCount} href="/admin/guests" />
        <StatCard label="Subscriptions" value={counts.subscriptionsCount} href="/admin/subscriptions" />
        <StatCard label="Usage ledger (today)" value={counts.usageLedgerToday} href="/admin/usage" />
        <StatCard label="Failed processing jobs" value={counts.failedProcessingJobs} href="/admin/jobs" />
        <StatCard label="Guest cleanup pending" value={counts.guestCleanupPending} href="/admin/cleanup" />
      </section>

      <section className="mt-8 rounded-xl border border-[var(--border)] bg-white p-5">
        <h2 className="text-lg font-semibold">Cleanup scheduler heartbeat</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[var(--muted)]">Last success</dt>
            <dd>{counts.cleanupHeartbeat.lastSuccessAt ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Last attempt</dt>
            <dd>{counts.cleanupHeartbeat.lastAttemptAt ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Status</dt>
            <dd>{counts.cleanupHeartbeat.lastStatus}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Last batch</dt>
            <dd>
              processed {counts.cleanupHeartbeat.processed ?? 0} · ok{" "}
              {counts.cleanupHeartbeat.succeeded ?? 0} · failed {counts.cleanupHeartbeat.failed ?? 0}
            </dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
