import {setRequestLocale} from "next-intl/server";
import {listStripeEvents} from "@/server/admin/queries";
import {isAppLocale} from "@/server/auth/validation";

export const metadata = {title: "Admin · Payments"};

type PageProps = {
  params: Promise<{locale: string}>;
  searchParams: Promise<{page?: string}>;
};

export default async function AdminPaymentsPage({params, searchParams}: PageProps) {
  const {locale: rawLocale} = await params;
  const locale = isAppLocale(rawLocale) ? rawLocale : "en";
  setRequestLocale(locale);

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const limit = 25;
  const {rows, total} = await listStripeEvents({limit, offset: (page - 1) * limit});

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Payments</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Local mirror of Stripe webhook events ({total} total). No secret payloads stored.
        </p>
      </header>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="px-4 py-3">Event type</th>
              <th className="px-4 py-3">Stripe event ID</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Processing</th>
              <th className="px-4 py-3">Livemode</th>
              <th className="px-4 py-3">Failure</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{row.eventType}</td>
                <td className="px-4 py-3 font-mono text-xs">{row.stripeEventId}</td>
                <td className="px-4 py-3">{row.eventCreatedAt.toISOString()}</td>
                <td className="px-4 py-3">{row.processingStatus}</td>
                <td className="px-4 py-3">{row.livemode ? "live" : "test"}</td>
                <td className="px-4 py-3">{row.failureCode ?? "—"}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--muted)]">
                  No Stripe events recorded.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </main>
  );
}
