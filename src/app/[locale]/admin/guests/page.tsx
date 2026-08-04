import {setRequestLocale} from "next-intl/server";
import {listGuestSessions} from "@/server/admin/queries";
import {isAppLocale} from "@/server/auth/validation";

export const metadata = {title: "Admin · Guest sessions"};

type PageProps = {
  params: Promise<{locale: string}>;
  searchParams: Promise<{page?: string}>;
};

export default async function AdminGuestsPage({params, searchParams}: PageProps) {
  const {locale: rawLocale} = await params;
  const locale = isAppLocale(rawLocale) ? rawLocale : "en";
  setRequestLocale(locale);

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const limit = 25;
  const {rows, total} = await listGuestSessions({limit, offset: (page - 1) * limit});

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Guest sessions</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Scrubbed rows only — no tokens, IP hashes, or storage keys ({total} total).
        </p>
      </header>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="px-4 py-3">Public ID</th>
              <th className="px-4 py-3">Tool</th>
              <th className="px-4 py-3">Cohort</th>
              <th className="px-4 py-3">Ops used</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Expired</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{row.publicId}</td>
                <td className="px-4 py-3">{row.toolCode}</td>
                <td className="px-4 py-3">{row.cohort}</td>
                <td className="px-4 py-3">{row.operationsUsed}</td>
                <td className="px-4 py-3">{row.createdAt.toISOString()}</td>
                <td className="px-4 py-3">{row.expiresAt.toISOString()}</td>
                <td className="px-4 py-3">{row.expired ? "yes" : "no"}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[var(--muted)]">
                  No guest sessions.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </main>
  );
}
