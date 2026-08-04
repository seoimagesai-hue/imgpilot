import {setRequestLocale} from "next-intl/server";
import {listAuditLogs} from "@/server/admin/queries";
import {isAppLocale} from "@/server/auth/validation";

export const metadata = {title: "Admin · Audit logs"};

type PageProps = {
  params: Promise<{locale: string}>;
  searchParams: Promise<{page?: string}>;
};

export default async function AdminAuditPage({params, searchParams}: PageProps) {
  const {locale: rawLocale} = await params;
  const locale = isAppLocale(rawLocale) ? rawLocale : "en";
  setRequestLocale(locale);

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const limit = 50;
  const {rows, total} = await listAuditLogs({limit, offset: (page - 1) * limit});

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Audit logs</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">{total} append-only entries</p>
      </header>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Admin</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Before → After</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b last:border-0 align-top">
                <td className="px-4 py-3 whitespace-nowrap">{row.createdAt.toISOString()}</td>
                <td className="px-4 py-3">{row.adminEmail ?? row.adminUserId.slice(0, 8)}</td>
                <td className="px-4 py-3 font-mono text-xs">{row.action}</td>
                <td className="px-4 py-3">
                  {row.targetEntityType}
                  {row.targetEntityId ? (
                    <span className="block font-mono text-xs text-[var(--muted)]">
                      {row.targetEntityId.slice(0, 12)}…
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 max-w-xs">{row.reason ?? "—"}</td>
                <td className="px-4 py-3 text-xs">
                  {row.beforeSummary ?? "—"} → {row.afterSummary ?? "—"}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--muted)]">
                  No audit entries yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </main>
  );
}
