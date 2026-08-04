import {
  BarChart3,
  CreditCard,
  FolderKanban,
  LayoutDashboard,
  Settings,
  Code2,
  Plug,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export type DashboardNavKey =
  | "dashboard"
  | "projects"
  | "usage"
  | "billing"
  | "developer"
  | "integrations"
  | "automation"
  | "settings";

export type DashboardNavItem = {
  key: DashboardNavKey;
  href:
    | "/dashboard"
    | "/dashboard/projects"
    | "/dashboard/analytics"
    | "/dashboard/settings/billing"
    | "/dashboard/settings/developer"
    | "/dashboard/settings/integrations"
    | "/dashboard/settings/automation"
    | "/dashboard#settings";
  icon: LucideIcon;
};

export const dashboardNavItems: DashboardNavItem[] = [
  {key: "dashboard", href: "/dashboard", icon: LayoutDashboard},
  {key: "projects", href: "/dashboard/projects", icon: FolderKanban},
  {key: "usage", href: "/dashboard/analytics", icon: BarChart3},
  {key: "billing", href: "/dashboard/settings/billing", icon: CreditCard},
  {key: "developer", href: "/dashboard/settings/developer", icon: Code2},
  {key: "integrations", href: "/dashboard/settings/integrations", icon: Plug},
  {key: "automation", href: "/dashboard/settings/automation", icon: Workflow},
  {key: "settings", href: "/dashboard#settings", icon: Settings},
];
