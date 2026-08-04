import {setRequestLocale} from "next-intl/server";
import {recentUsageLedger, usageAggregates} from "@/server/admin/queries";
import {isAppLocale} from "@/server/auth/validation";

export const metadata = {title: "Admin · Usage"};

type PageProps = {
  params: Promise<{locale: string}>;
  searchParams: Promise<{page?: string}>;
};

export default async function AdminUsagePage({params, searchParams}: PageProps) {
  const {locale: rawLocale} = await params;
  const locale = isAppLocale(rawLocale) ? rawLocale : "en";
  setRequestLocale(locale);

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const limit = 25;

  const [aggregates, ledger] = await Promise.all([
    usageAggregates(),
    recentUsageLedger({limit, offset: (page - 1) * limit}),
  ]);

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Usage</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Aggregates from <code className="text-xs">billing_usage_ledger</code>.
        </p>
      </header>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">By category</h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Total quantity</th>
                <th className="px-4 py-3">Entries</th>
              </tr>
            </thead>
            <tbody>
              {aggregates.map((row) => (
                <tr key={row.category} className="border-b last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{row.category}</td>
                  <td className="px-4 py-3">{row.totalQuantity}</td>
                  <td className="px-4 py-3">{row.entryCount}</td>
                </tr>
              ))}
              {aggregates.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-[var(--muted)]">
                    No usage recorded.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Recent ledger entries</h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="px-4 py-3">Recorded</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {ledger.rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="px-4 py-3">{row.recordedAt.toISOString()}</td>
                  <td className="px-4 py-3 font-mono text-xs">{row.userId.slice(0, 8)}…</td>
                  <td className="px-4 py-3">{row.category}</td>
                  <td className="px-4 py-3">{row.quantity}</td>
                  <td className="px-4 py-3">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-sm text-[var(--muted)]">{ledger.total} total entries</p>
      </section>
    </main>
  );
}
