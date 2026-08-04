import {eq} from "drizzle-orm";
import {getTranslations, setRequestLocale} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {getDb} from "@/db";
import {organizationInvitations, organizations} from "@/db/schema";
import {isAppLocale} from "@/server/auth/validation";
import {requireUser} from "@/server/auth/session";
import {
  acceptInvitationAction,
  declineInvitationAction,
} from "@/server/organizations/actions";
import {hashInviteToken} from "@/server/organizations/invitations";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{locale: string; token: string}>;
  searchParams: Promise<{error?: string}>;
};

export default async function InvitationPage({params, searchParams}: Props) {
  const {locale: raw, token} = await params;
  const locale = isAppLocale(raw) ? raw : "en";
  setRequestLocale(locale);
  await requireUser(locale, `/dashboard/invitations/${token}`);

  const sp = await searchParams;
  const t = await getTranslations("organizations");

  const hash = hashInviteToken(token);
  const db = getDb();
  const [row] = await db
    .select({
      invitation: organizationInvitations,
      organization: organizations,
    })
    .from(organizationInvitations)
    .innerJoin(organizations, eq(organizations.id, organizationInvitations.organizationId))
    .where(eq(organizationInvitations.tokenHash, hash))
    .limit(1);

  const errorCode = sp.error?.trim();

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("invitationTitle")}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{t("invitationSubtitle")}</p>
      </header>

      {errorCode ? (
        <p
          role="alert"
          className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {(() => {
            try {
              return t(`errors.${errorCode}` as "errors.INVALID_REQUEST");
            } catch {
              return t("errors.INVALID_REQUEST");
            }
          })()}
        </p>
      ) : null}

      {!row ? (
        <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <p className="text-sm text-[var(--muted)]">{t("errors.INVITATION_NOT_FOUND")}</p>
          <Link
            href="/dashboard/projects"
            className="mt-4 inline-flex rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm"
          >
            {t("backToProjects")}
          </Link>
        </section>
      ) : (
        <section className="max-w-lg space-y-4 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-[var(--muted)]">{t("orgName")}</dt>
              <dd className="mt-1 font-medium">{row.organization.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-[var(--muted)]">{t("role")}</dt>
              <dd className="mt-1 font-medium">{t(row.invitation.role)}</dd>
            </div>
            <div>
              <dt className="text-sm text-[var(--muted)]">{t("inviteEmail")}</dt>
              <dd className="mt-1">{row.invitation.emailNormalized}</dd>
            </div>
            <div>
              <dt className="text-sm text-[var(--muted)]">{t("status")}</dt>
              <dd className="mt-1 capitalize">{row.invitation.status}</dd>
            </div>
          </dl>

          {row.invitation.status === "pending" ? (
            <div className="flex flex-wrap gap-3 pt-2">
              <form action={acceptInvitationAction}>
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="token" value={token} />
                <button
                  type="submit"
                  className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white"
                >
                  {t("accept")}
                </button>
              </form>
              <form action={declineInvitationAction}>
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="token" value={token} />
                <button
                  type="submit"
                  className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm"
                >
                  {t("decline")}
                </button>
              </form>
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)]">{t("invitationNotPending")}</p>
          )}
        </section>
      )}
    </main>
  );
}
