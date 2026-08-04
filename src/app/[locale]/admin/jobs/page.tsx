import {setRequestLocale} from "next-intl/server";
import {jobsAggregates} from "@/server/admin/queries";
import {isAppLocale} from "@/server/auth/validation";

export const metadata = {title: "Admin · Jobs"};

type PageProps = {params: Promise<{locale: string}>};

export default async function AdminJobsPage({params}: PageProps) {
  const {locale: rawLocale} = await params;
  const locale = isAppLocale(rawLocale) ? rawLocale : "en";
  setRequestLocale(locale);

  const aggregates = await jobsAggregates();
  const total = aggregates.reduce((sum, row) => sum + row.count, 0);

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Processing jobs</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Authenticated project processing jobs ({total} total). Storage keys are not shown.
        </p>
      </header>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Count</th>
            </tr>
          </thead>
          <tbody>
            {aggregates.map((row) => (
              <tr key={row.status} className="border-b last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{row.status}</td>
                <td className="px-4 py-3">{row.count}</td>
              </tr>
            ))}
            {aggregates.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-[var(--muted)]">
                  No processing jobs recorded.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </main>
  );
}
