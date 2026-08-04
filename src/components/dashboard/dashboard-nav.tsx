"use client";

import {useTranslations} from "next-intl";
import {Link, usePathname} from "@/i18n/navigation";
import {cn} from "@/lib/utils";
import {dashboardNavItems} from "./nav-items";

type DashboardNavProps = {
  onNavigate?: () => void;
  className?: string;
};

export function DashboardNav({onNavigate, className}: DashboardNavProps) {
  const t = useTranslations("navigation");
  const common = useTranslations("common");
  const pathname = usePathname();

  return (
    <nav className={cn("space-y-1", className)} aria-label={common("mainNavigation")}>
      {dashboardNavItems.map(({key, href, icon: Icon}) => {
        const isActive =
          key === "dashboard"
            ? pathname === "/dashboard"
            : key === "projects"
              ? pathname === "/dashboard/projects" ||
                (pathname.startsWith("/dashboard/projects/") &&
                  !pathname.includes("/analytics"))
              : key === "usage"
                ? pathname === "/dashboard/analytics" || pathname.endsWith("/analytics")
                : key === "billing"
                  ? pathname.includes("/settings/billing")
                  : key === "developer"
                    ? pathname.includes("/settings/developer")
                    : key === "integrations"
                      ? pathname.includes("/settings/integrations")
                      : key === "automation"
                        ? pathname.includes("/settings/automation")
                        : false;
        return (
          <Link
            key={key}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm",
              isActive
                ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                : "text-[var(--muted)] hover:bg-gray-50",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span>{t(key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
