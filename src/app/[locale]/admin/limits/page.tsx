import {setRequestLocale} from "next-intl/server";
import {formatByteSize} from "@/lib/format-bytes";
import {
  GUEST_ASSET_TTL_MS,
  GUEST_MAX_FILE_BYTES_DEFAULT,
  GUEST_MAX_OPS_PER_ROLLING_24H_DEFAULT,
  GUEST_OPS_WINDOW_MS,
} from "@/server/guest/guest-policy";
import {
  AUTH_PUBLIC_BULK_MAX_BATCH_BYTES_DEFAULT,
  AUTH_PUBLIC_BULK_MAX_FILES_DEFAULT,
  GUEST_BULK_MAX_BATCH_BYTES_DEFAULT,
  GUEST_BULK_MAX_FILES_DEFAULT,
  GUEST_BULK_MAX_ZIP_BYTES_DEFAULT,
} from "@/lib/guest/bulk-policy";
import {listActivePlans} from "@/server/billing/plan-catalog";
import {isAppLocale} from "@/server/auth/validation";

export const metadata = {title: "Admin · Limits"};

type PageProps = {params: Promise<{locale: string}>};

export default async function AdminLimitsPage({params}: PageProps) {
  const {locale: rawLocale} = await params;
  const locale = isAppLocale(rawLocale) ? rawLocale : "en";
  setRequestLocale(locale);

  const plans = listActivePlans();

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Limits</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Read-only guest policy constants and authenticated plan limits.
        </p>
      </header>

      <section className="mb-8 rounded-xl border border-[var(--border)] p-5">
        <h2 className="text-lg font-semibold">Guest single-file policy</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[var(--muted)]">Max file size</dt>
            <dd>{formatByteSize(GUEST_MAX_FILE_BYTES_DEFAULT, locale)}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Ops per rolling window</dt>
            <dd>{GUEST_MAX_OPS_PER_ROLLING_24H_DEFAULT}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Ops window</dt>
            <dd>{Math.round(GUEST_OPS_WINDOW_MS / 3600000)}h</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Asset TTL</dt>
            <dd>{Math.round(GUEST_ASSET_TTL_MS / 60000)} min</dd>
          </div>
        </dl>
      </section>

      <section className="mb-8 rounded-xl border border-[var(--border)] p-5">
        <h2 className="text-lg font-semibold">Guest bulk policy</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[var(--muted)]">Max files</dt>
            <dd>{GUEST_BULK_MAX_FILES_DEFAULT}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Max batch bytes</dt>
            <dd>{formatByteSize(GUEST_BULK_MAX_BATCH_BYTES_DEFAULT, locale)}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Max ZIP bytes</dt>
            <dd>{formatByteSize(GUEST_BULK_MAX_ZIP_BYTES_DEFAULT, locale)}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Auth public bulk max files</dt>
            <dd>{AUTH_PUBLIC_BULK_MAX_FILES_DEFAULT}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Auth public bulk max batch</dt>
            <dd>{formatByteSize(AUTH_PUBLIC_BULK_MAX_BATCH_BYTES_DEFAULT, locale)}</dd>
          </div>
        </dl>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Authenticated plan limits</h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Processing/mo</th>
                <th className="px-4 py-3">AI/mo</th>
                <th className="px-4 py-3">Export/mo</th>
                <th className="px-4 py-3">Bulk</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.code} className="border-b last:border-0">
                  <td className="px-4 py-3">{plan.displayName}</td>
                  <td className="px-4 py-3">{plan.monthlyProcessingLimit}</td>
                  <td className="px-4 py-3">{plan.monthlyAiLimit}</td>
                  <td className="px-4 py-3">{plan.monthlyExportLimit}</td>
                  <td className="px-4 py-3">{plan.bulkProcessingEnabled ? "yes" : "no"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
