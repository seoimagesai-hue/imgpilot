import {getFormatter, getTranslations, setRequestLocale} from "next-intl/server";
import {isAppLocale} from "@/server/auth/validation";
import {Link} from "@/i18n/navigation";
import {InviteMemberForm} from "@/components/organizations/invite-member-form";
import {
  changeMemberRoleAction,
  removeMemberAction,
  revokeInvitationAction,
  transferOwnershipAction,
} from "@/server/organizations/actions";
import {listPendingInvitations} from "@/server/organizations/invitations";
import {listOrganizationMembers} from "@/server/organizations/members";
import {requireOrgPageAccess} from "@/server/organizations/page-access";
import {hasOrgPermission} from "@/server/organizations/permissions";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{locale: string; slug: string}>;
};

export default async function OrganizationMembersPage({params}: Props) {
  const {locale: raw, slug} = await params;
  const locale = isAppLocale(raw) ? raw : "en";
  setRequestLocale(locale);

  const {session, org, access} = await requireOrgPageAccess(
    locale,
    slug,
    "members.view",
    `/dashboard/orgs/${slug}/members`,
  );

  const members = await listOrganizationMembers(org.id);
  const pending = await listPendingInvitations(org.id);
  const t = await getTranslations("organizations");
  const format = await getFormatter();

  const canInvite = hasOrgPermission(access.role, "members.invite");
  const canChangeRole = hasOrgPermission(access.role, "members.change_role");
  const canRemove = hasOrgPermission(access.role, "members.remove");
  const canTransfer = hasOrgPermission(access.role, "ownership.transfer");
  const actorId = session.user!.id!;

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <p className="text-sm text-[var(--muted)]">
          <Link href={`/dashboard/orgs/${org.slug}`} className="hover:underline">
            {org.name}
          </Link>
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{t("members")}</h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="border-b border-[var(--border)] text-start text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("member")}</th>
                  <th className="px-4 py-3 font-medium">{t("role")}</th>
                  <th className="px-4 py-3 font-medium">{t("joined")}</th>
                  <th className="px-4 py-3 font-medium">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{member.name || member.email}</div>
                      <div className="text-xs text-[var(--muted)]">{member.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      {canChangeRole && member.userId !== actorId && !(access.role === "admin" && member.role === "owner") ? (
                        <form action={changeMemberRoleAction} className="flex items-center gap-2">
                          <input type="hidden" name="locale" value={locale} />
                          <input type="hidden" name="slug" value={org.slug} />
                          <input type="hidden" name="targetUserId" value={member.userId} />
                          <select
                            name="role"
                            defaultValue={member.role}
                            className="rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm"
                          >
                            {access.role === "owner" ? (
                              <option value="owner">{t("owner")}</option>
                            ) : null}
                            <option value="admin">{t("admin")}</option>
                            <option value="editor">{t("editor")}</option>
                            <option value="viewer">{t("viewer")}</option>
                          </select>
                          <button
                            type="submit"
                            className="rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
                          >
                            {t("updateRole")}
                          </button>
                        </form>
                      ) : (
                        t(member.role)
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {format.dateTime(member.joinedAt, {dateStyle: "medium"})}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {canRemove && member.userId !== actorId ? (
                          <form action={removeMemberAction}>
                            <input type="hidden" name="locale" value={locale} />
                            <input type="hidden" name="slug" value={org.slug} />
                            <input type="hidden" name="targetUserId" value={member.userId} />
                            <button
                              type="submit"
                              className="rounded-lg border border-red-200 px-2 py-1.5 text-xs text-red-700"
                            >
                              {t("remove")}
                            </button>
                          </form>
                        ) : null}
                        {canTransfer &&
                        access.role === "owner" &&
                        member.userId !== actorId &&
                        member.role !== "owner" ? (
                          <form action={transferOwnershipAction}>
                            <input type="hidden" name="locale" value={locale} />
                            <input type="hidden" name="slug" value={org.slug} />
                            <input type="hidden" name="targetUserId" value={member.userId} />
                            <button
                              type="submit"
                              className="rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
                            >
                              {t("transferOwnership")}
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {pending.length > 0 ? (
            <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">{t("pendingInvites")}</h2>
              <ul className="space-y-3">
                {pending.map((invite) => (
                  <li
                    key={invite.id}
                    className="flex flex-col gap-2 rounded-xl border border-[var(--border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">{invite.emailNormalized}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {t(invite.role)} · {t("expires")}{" "}
                        {format.dateTime(invite.expiresAt, {dateStyle: "medium"})}
                      </p>
                    </div>
                    {canInvite ? (
                      <form action={revokeInvitationAction}>
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="slug" value={org.slug} />
                        <input type="hidden" name="invitationId" value={invite.id} />
                        <button
                          type="submit"
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-700"
                        >
                          {t("revoke")}
                        </button>
                      </form>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        {canInvite ? <InviteMemberForm slug={org.slug} /> : null}
      </div>
    </main>
  );
}
