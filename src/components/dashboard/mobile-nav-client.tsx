"use client";

import {Menu, X} from "lucide-react";
import {useTranslations} from "next-intl";
import {useEffect, useId, useState} from "react";
import {Link} from "@/i18n/navigation";
import {DashboardNav} from "./dashboard-nav";
import {LanguageSwitcher} from "./language-switcher";
import {WorkspaceSwitcher} from "./workspace-switcher";
import type {WorkspaceSummary} from "@/server/organizations/workspace";

type MobileNavClientProps = {
  workspaces: WorkspaceSummary[];
  activeWorkspace: WorkspaceSummary;
};

export function MobileNavClient({workspaces, activeWorkspace}: MobileNavClientProps) {
  const common = useTranslations("common");
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="border-b border-[var(--border)] bg-white lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <span className="grid size-9 place-items-center rounded-lg bg-[var(--accent)] text-sm font-bold text-white">
            SI
          </span>
          {common("brand")}
        </Link>
        <button
          type="button"
          className="rounded-lg border border-[var(--border)] p-2"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? common("closeMenu") : common("openMenu")}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
        </button>
      </div>
      {open ? (
        <div id={panelId} className="space-y-4 border-t border-[var(--border)] px-4 py-4">
          <WorkspaceSwitcher
            workspaces={workspaces}
            active={activeWorkspace}
            onNavigate={() => setOpen(false)}
          />
          <DashboardNav onNavigate={() => setOpen(false)} />
          <LanguageSwitcher />
        </div>
      ) : null}
    </div>
  );
}
