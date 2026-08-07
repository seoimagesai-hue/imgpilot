"use client";

import {usePathname, useRouter} from "@/i18n/navigation";
import {Link} from "@/i18n/navigation";

const NAV_ITEMS = [
  {href: "/admin", label: "Overview", exact: true},
  {href: "/admin/users", label: "Users"},
  {href: "/admin/plans", label: "Plans"},
  {href: "/admin/limits", label: "Limits"},
  {href: "/admin/billing", label: "Billing"},
  {href: "/admin/subscriptions", label: "Subscriptions"},
  {href: "/admin/payments", label: "Payments"},
  {href: "/admin/stripe", label: "Stripe status"},
  {href: "/admin/usage", label: "Usage"},
  {href: "/admin/jobs", label: "Jobs"},
  {href: "/admin/guests", label: "Guest sessions"},
  {href: "/admin/cleanup", label: "Cleanup"},
  {href: "/admin/system", label: "System"},
  {href: "/admin/audit", label: "Audit logs"},
  {href: "/admin/settings", label: "Settings"},
] as const;

function isActive(href: string, currentPath: string, exact?: boolean): boolean {
  if (exact) return currentPath === href || currentPath === `${href}/`;
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden min-h-screen w-64 shrink-0 border-e border-slate-800 bg-[#0f172a] p-5 text-slate-100 lg:block"
      aria-label="Admin navigation"
    >
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Platform ops</p>
        <p className="mt-1 text-lg font-semibold text-white">Img Pilot Admin</p>
      </div>
      <nav className="space-y-1">
        {NAV_ITEMS.map(({href, label, ...rest}) => {
          const active = isActive(href, pathname, "exact" in rest ? rest.exact : false);
          return (
            <Link
              key={href}
              href={href}
              className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-slate-800 font-medium text-white"
                  : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function AdminMobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const activeHref =
    NAV_ITEMS.find((item) => isActive(item.href, pathname, "exact" in item ? item.exact : false))
      ?.href ?? "/admin";

  return (
    <div className="border-b border-[var(--border)] bg-white p-3 lg:hidden">
      <label htmlFor="admin-nav" className="sr-only">
        Admin section
      </label>
      <select
        id="admin-nav"
        className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
        value={activeHref}
        onChange={(e) => {
          router.push(e.target.value);
        }}
      >
        {NAV_ITEMS.map(({href, label}) => (
          <option key={href} value={href}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
