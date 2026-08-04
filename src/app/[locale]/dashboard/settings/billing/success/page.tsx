import {auth} from "@/auth";
import {setRequestLocale} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {redirect} from "@/i18n/navigation";
import {resolveEntitlement} from "@/server/billing/entitlements";

type PageProps = {
  params: Promise<{locale: string}>;
  searchParams: Promise<{session_id?: string}>;
};

export default async function BillingSuccessPage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const session = await auth();
  if (!session?.user?.id) {
    redirect({href: "/login", locale});
    return null;
  }
  const entitlement = await resolveEntitlement(session.user.id);
  const activated =
    entitlement.planCode === "pro" &&
    (entitlement.subscriptionStatus === "active" ||
      entitlement.subscriptionStatus === "trialing");

  return (
    <main className="mx-auto w-full max-w-xl space-y-4 px-4 py-10">
      <h1 className="text-2xl font-semibold">Payment is being confirmed</h1>
      <p className="text-sm text-[var(--muted-foreground)]">
        Checkout success is not entitlement proof. Access activates only after Stripe webhook
        synchronization.
      </p>
      <p className="text-sm">
        Database status: {entitlement.plan.displayName} / {entitlement.subscriptionStatus}
        {activated ? " — Pro is active." : " — still waiting for webhook confirmation."}
      </p>
      <Link href="/dashboard/settings/billing" className="inline-block underline">
        Refresh billing page
      </Link>
    </main>
  );
}
