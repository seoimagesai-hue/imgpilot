"use client";

import {useLocale, useTranslations} from "next-intl";
import {useState} from "react";
import {transferProjectToOrgAction} from "@/server/organizations/actions";

type OrgOption = {
  id: string;
  slug: string;
  displayName: string;
};

type MoveProjectToOrgFormProps = {
  projectId: string;
  organizations: OrgOption[];
};

export function MoveProjectToOrgForm({projectId, organizations}: MoveProjectToOrgFormProps) {
  const t = useTranslations("organizations");
  const locale = useLocale();
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id ?? "");
  const selected = organizations.find((o) => o.id === organizationId) ?? organizations[0];

  if (organizations.length === 0) return null;

  return (
    <section className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">{t("moveToOrg")}</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">{t("moveToOrgHint")}</p>
      <form action={transferProjectToOrgAction} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="slug" value={selected?.slug ?? ""} />
        <div className="min-w-0 flex-1">
          <label htmlFor="target-org" className="mb-1.5 block text-sm font-medium">
            {t("targetOrganization")}
          </label>
          <select
            id="target-org"
            name="organizationId"
            required
            value={organizationId}
            onChange={(event) => setOrganizationId(event.target.value)}
            className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
          >
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.displayName}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white"
        >
          {t("moveToOrg")}
        </button>
      </form>
    </section>
  );
}
