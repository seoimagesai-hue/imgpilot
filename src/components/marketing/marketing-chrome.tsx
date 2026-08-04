import {auth} from "@/auth";
import {
  resolveUserAccessContext,
  guestAccessContext,
  type UserAccessContext,
} from "@/server/account/access-context";
import {PublicFooter, PublicHeader} from "@/components/marketing/public-chrome";
import {PostLoginBanner} from "@/components/account/post-login-banner";

/** Static guest projection — never throws; used when auth/env/billing are unavailable. */
function staticGuestAccess(): UserAccessContext {
  return {
    state: "guest",
    signedIn: false,
    planName: "Guest",
    planCode: "guest",
    entitlementState: null,
    displayName: null,
    email: null,
    limits: {
      maxFileBytes: 10 * 1024 * 1024,
      maxBulkFiles: 5,
      maxBatchBytes: 25 * 1024 * 1024,
      standardOperationsLimit: 5,
      standardOperationsUsed: 0,
      aiOperationsLimit: 5,
      aiOperationsUsed: 0,
      storageBytesLimit: 0,
      storageBytesUsed: 0,
      retentionHours: 1,
      periodEnd: null,
    },
    capabilities: {
      bulkCompress: true,
      bulkResize: true,
      bulkConvert: true,
      bulkAi: false,
      zipDownload: true,
      savedHistory: false,
      savedFiles: false,
    },
  };
}

function authSecretConfigured(): boolean {
  const secret = process.env.AUTH_SECRET?.trim() ?? "";
  return secret.length >= 32;
}

export async function MarketingChrome({children}: {children: React.ReactNode}) {
  let access = staticGuestAccess();

  try {
    if (authSecretConfigured()) {
      const session = await auth();
      if (session?.user?.id) {
        access = await resolveUserAccessContext({
          userId: session.user.id,
          name: session.user.name,
          email: session.user.email,
        });
      } else {
        try {
          access = guestAccessContext();
        } catch {
          access = staticGuestAccess();
        }
      }
    } else {
      try {
        access = guestAccessContext();
      } catch {
        access = staticGuestAccess();
      }
    }
  } catch (err) {
    console.error(
      "[marketing] chrome access resolve failed",
      err instanceof Error ? err.message : err,
    );
    access = staticGuestAccess();
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]">
      <PublicHeader access={access} />
      <PostLoginBanner signedIn={access.signedIn} />
      <div className="flex-1">{children}</div>
      <PublicFooter signedIn={access.signedIn} />
    </div>
  );
}
