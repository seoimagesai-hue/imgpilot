import {notFound} from "next/navigation";
import {setRequestLocale} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {UserActionForm} from "@/components/admin/user-action-form";
import {getUserDetail} from "@/server/admin/queries";
import {isAppLocale} from "@/server/auth/validation";

export const metadata = {title: "Admin · User detail"};

type PageProps = {
  params: Promise<{locale: string; userId: string}>;
};

export default async function AdminUserDetailPage({params}: PageProps) {
  const {locale: rawLocale, userId} = await params;
  const locale = isAppLocale(rawLocale) ? rawLocale : "en";
  setRequestLocale(locale);

  const user = await getUserDetail(userId);
  if (!user) notFound();

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <p className="mb-4 text-sm">
        <Link href="/admin/users" className="text-[var(--accent)]">
          ← Users
        </Link>
      </p>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">{user.email}</h1>
        <p className="mt-1 text-[var(--muted)]">{user.name}</p>
      </header>

      <section className="mb-8 grid gap-4 sm:grid-cols-2">
        <dl className="rounded-xl border border-[var(--border)] bg-white p-5 text-sm">
          <div className="grid gap-3">
            <div>
              <dt className="text-[var(--muted)]">Role</dt>
              <dd className="font-medium">{user.role}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Account status</dt>
              <dd className="font-medium">{user.accountStatus}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Created</dt>
              <dd>{user.createdAt.toISOString()}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Email verified</dt>
              <dd>{user.emailVerified?.toISOString() ?? "—"}</dd>
            </div>
          </div>
        </dl>

        <dl className="rounded-xl border border-[var(--border)] bg-white p-5 text-sm">
          <div className="grid gap-3">
            <div>
              <dt className="text-[var(--muted)]">Plan</dt>
              <dd>{user.entitlement?.planCode ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Subscription status</dt>
              <dd>{user.entitlement?.subscriptionStatus ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Stripe customer</dt>
              <dd>{user.billingAccount?.hasStripeCustomer ? "Linked" : "None"}</dd>
            </div>
            {user.accountStatus === "suspended" ? (
              <>
                <div>
                  <dt className="text-[var(--muted)]">Suspended at</dt>
                  <dd>{user.suspendedAt?.toISOString() ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[var(--muted)]">Reason</dt>
                  <dd>{user.suspensionReason ?? "—"}</dd>
                </div>
              </>
            ) : null}
          </div>
        </dl>
      </section>

      {user.role !== "super_admin" ? (
        <UserActionForm
          locale={locale}
          userId={user.id}
          accountStatus={user.accountStatus as "active" | "suspended"}
        />
      ) : (
        <p className="text-sm text-[var(--muted)]">Super-admin accounts cannot be suspended here.</p>
      )}
    </main>
  );
}
