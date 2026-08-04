import {getTranslations, setRequestLocale} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {isAppLocale} from "@/server/auth/validation";
import {reassignBillingOwnerAction} from "@/server/organizations/actions";
import {listOrganizationMembers} from "@/server/organizations/members";
import {requireOrgPageAccess} from "@/server/organizations/page-access";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{locale: string; slug: string}>;
};

export default async function OrganizationSettingsPage({params}: Props) {
  const {locale: raw, slug} = await params;
  const locale = isAppLocale(raw) ? raw : "en";
  setRequestLocale(locale);

  const {org} = await requireOrgPageAccess(
    locale,
    slug,
    "billing.reassign",
    `/dashboard/orgs/${slug}/settings`,
  );

  const members = await listOrganizationMembers(org.id);
  const owners = members.filter((m) => m.role === "owner");
  const t = await getTranslations("organizations");

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <p className="text-sm text-[var(--muted)]">
          <Link href={`/dashboard/orgs/${org.slug}`} className="hover:underline">
            {org.name}
          </Link>
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{t("settings")}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{t("settingsSubtitle")}</p>
      </header>

      <section className="max-w-xl space-y-4 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">{t("billingOwner")}</h2>
        <p className="text-sm text-[var(--muted)]">
          {t("currentBillingOwner")}:{" "}
          <span className="font-mono text-[var(--foreground)]">{org.billingOwnerUserId}</span>
        </p>

        <form action={reassignBillingOwnerAction} className="space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="slug" value={org.slug} />

          <div>
            <label htmlFor="billing-owner" className="mb-1.5 block text-sm font-medium">
              {t("reassignBillingOwner")}
            </label>
            <select
              id="billing-owner"
              name="targetUserId"
              required
              defaultValue={org.billingOwnerUserId}
              className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
            >
              {owners.map((owner) => (
                <option key={owner.userId} value={owner.userId}>
                  {owner.name || owner.email} ({owner.email})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-[var(--muted)]">{t("billingOwnerHint")}</p>
          </div>

          <button
            type="submit"
            className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white"
          >
            {t("saveBillingOwner")}
          </button>
        </form>
      </section>
    </main>
  );
}
