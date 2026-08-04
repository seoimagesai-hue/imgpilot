import {auth} from "@/auth";
import {resolveUserAccessContext, guestAccessContext} from "@/server/account/access-context";
import {PublicFooter, PublicHeader} from "@/components/marketing/public-chrome";
import {PostLoginBanner} from "@/components/account/post-login-banner";

export async function MarketingChrome({children}: {children: React.ReactNode}) {
  const session = await auth();
  const access = session?.user?.id
    ? await resolveUserAccessContext({
        userId: session.user.id,
        name: session.user.name,
        email: session.user.email,
      })
    : guestAccessContext();

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]">
      <PublicHeader access={access} />
      <PostLoginBanner signedIn={access.signedIn} />
      <div className="flex-1">{children}</div>
      <PublicFooter signedIn={access.signedIn} />
    </div>
  );
}
