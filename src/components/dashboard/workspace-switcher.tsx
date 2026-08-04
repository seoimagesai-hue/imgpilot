"use client";

import {useLocale, useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";
import {setActiveWorkspaceAction} from "@/server/organizations/actions";
import type {WorkspaceSummary} from "@/server/organizations/workspace";

type WorkspaceSwitcherProps = {
  workspaces: WorkspaceSummary[];
  active: WorkspaceSummary;
  onNavigate?: () => void;
};

export function WorkspaceSwitcher({workspaces, active, onNavigate}: WorkspaceSwitcherProps) {
  const t = useTranslations("organizations");
  const locale = useLocale();

  return (
    <div className="mb-6 space-y-2">
      <p className="px-1 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
        {t("workspace")}
      </p>
      <ul className="space-y-1" role="list">
        {workspaces.map((ws) => {
          const isActive =
            ws.type === active.type &&
            (ws.type === "personal" ? active.type === "personal" : ws.slug === active.slug);
          return (
            <li key={ws.type === "personal" ? "personal" : ws.id}>
              <form action={setActiveWorkspaceAction}>
                <input type="hidden" name="locale" value={locale} />
                <input
                  type="hidden"
                  name="type"
                  value={ws.type === "personal" ? "personal" : "organization"}
                />
                {ws.type === "organization" ? (
                  <input type="hidden" name="slug" value={ws.slug} />
                ) : null}
                <button
                  type="submit"
                  onClick={onNavigate}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-start text-sm ${
                    isActive
                      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "text-[var(--muted)] hover:bg-gray-50"
                  }`}
                >
                  <span className="truncate">
                    {ws.type === "personal" ? t("personal") : ws.displayName}
                  </span>
                  {ws.type === "organization" ? (
                    <span className="ms-2 shrink-0 text-xs opacity-70">{t(ws.role)}</span>
                  ) : null}
                </button>
              </form>
            </li>
          );
        })}
      </ul>
      <Link
        href="/dashboard/orgs/new"
        onClick={onNavigate}
        className="block rounded-xl border border-dashed border-[var(--border)] px-3 py-2 text-center text-sm text-[var(--muted)] hover:bg-gray-50"
      >
        {t("createOrg")}
      </Link>
      {active.type === "organization" ? (
        <Link
          href={`/dashboard/orgs/${active.slug}`}
          onClick={onNavigate}
          className="block rounded-xl px-3 py-2 text-sm text-[var(--accent)] hover:bg-gray-50"
        >
          {t("orgOverview")}
        </Link>
      ) : null}
    </div>
  );
}
