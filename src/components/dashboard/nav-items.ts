import {
  BarChart3,
  CreditCard,
  FolderKanban,
  LayoutDashboard,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type DashboardNavKey =
  | "dashboard"
  | "projects"
  | "usage"
  | "billing"
  | "settings";

export type DashboardNavItem = {
  key: DashboardNavKey;
  href: "/dashboard" | "/dashboard/projects" | "/dashboard#usage" | "/dashboard#billing" | "/dashboard#settings";
  icon: LucideIcon;
};

export const dashboardNavItems: DashboardNavItem[] = [
  {key: "dashboard", href: "/dashboard", icon: LayoutDashboard},
  {key: "projects", href: "/dashboard/projects", icon: FolderKanban},
  {key: "usage", href: "/dashboard#usage", icon: BarChart3},
  {key: "billing", href: "/dashboard#billing", icon: CreditCard},
  {key: "settings", href: "/dashboard#settings", icon: Settings},
];
