import {setRequestLocale} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {listUsers} from "@/server/admin/queries";
import {isAppLocale} from "@/server/auth/validation";

export const metadata = {title: "Admin · Users"};

type PageProps = {
  params: Promise<{locale: string}>;
  searchParams: Promise<{q?: string; status?: string; page?: string}>;
};

export default async function AdminUsersPage({params, searchParams}: PageProps) {
  const {locale: rawLocale} = await params;
  const locale = isAppLocale(rawLocale) ? rawLocale : "en";
  setRequestLocale(locale);

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const limit = 25;
  const offset = (page - 1) * limit;
  const status =
    sp.status === "active" || sp.status === "suspended" ? sp.status : undefined;

  const {rows, total} = await listUsers({q: sp.q, status, limit, offset});
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">{total} total</p>
      </header>

      <form className="mb-6 flex flex-wrap gap-3" method="get">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Search name or email"
          className="min-w-[200px] flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <button type="submit" className="rounded-lg bg-[#0f172a] px-4 py-2 text-sm text-white">
          Filter
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((user) => (
              <tr key={user.id} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${user.id}`} className="font-medium text-[var(--accent)]">
                    {user.email}
                  </Link>
                </td>
                <td className="px-4 py-3">{user.name}</td>
                <td className="px-4 py-3">{user.role}</td>
                <td className="px-4 py-3">{user.accountStatus}</td>
                <td className="px-4 py-3">{user.createdAt.toISOString().slice(0, 10)}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--muted)]">
                  No users found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <nav className="mt-4 flex gap-2 text-sm">
          {page > 1 ? (
            <Link
              href={`/admin/users?page=${page - 1}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}${status ? `&status=${status}` : ""}`}
              className="text-[var(--accent)]"
            >
              ← Previous
            </Link>
          ) : null}
          <span className="text-[var(--muted)]">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={`/admin/users?page=${page + 1}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}${status ? `&status=${status}` : ""}`}
              className="text-[var(--accent)]"
            >
              Next →
            </Link>
          ) : null}
        </nav>
      ) : null}
    </main>
  );
}
