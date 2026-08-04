import {setRequestLocale} from "next-intl/server";
import {listSubscriptions} from "@/server/admin/queries";
import {isAppLocale} from "@/server/auth/validation";

export const metadata = {title: "Admin · Subscriptions"};

type PageProps = {
  params: Promise<{locale: string}>;
  searchParams: Promise<{page?: string}>;
};

export default async function AdminSubscriptionsPage({params, searchParams}: PageProps) {
  const {locale: rawLocale} = await params;
  const locale = isAppLocale(rawLocale) ? rawLocale : "en";
  setRequestLocale(locale);

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const limit = 25;
  const {rows, total} = await listSubscriptions({limit, offset: (page - 1) * limit});

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Subscriptions</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">{total} rows from local Stripe sync</p>
      </header>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Interval</th>
              <th className="px-4 py-3">Period end</th>
              <th className="px-4 py-3">Cancel at period end</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b last:border-0">
                <td className="px-4 py-3">{row.userEmail}</td>
                <td className="px-4 py-3">{row.planCode}</td>
                <td className="px-4 py-3">{row.status}</td>
                <td className="px-4 py-3">{row.billingInterval ?? "—"}</td>
                <td className="px-4 py-3">
                  {row.currentPeriodEnd?.toISOString().slice(0, 10) ?? "—"}
                </td>
                <td className="px-4 py-3">{row.cancelAtPeriodEnd ? "yes" : "no"}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--muted)]">
                  No subscriptions synced yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </main>
  );
}
