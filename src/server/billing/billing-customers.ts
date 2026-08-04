import {eq} from "drizzle-orm";
import {getDb} from "@/db";
import {billingAccounts, users} from "@/db/schema";
import {getClientEnv} from "@/lib/env";
import {getStripeClient, isStripeBillingConfigured} from "@/server/billing/stripe-client";

export type BillingAccountRow = {
  id: string;
  userId: string;
  stripeCustomerId: string | null;
};

export async function getOrCreateBillingAccount(userId: string): Promise<BillingAccountRow> {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(billingAccounts)
    .where(eq(billingAccounts.userId, userId))
    .limit(1);
  if (existing) {
    return {
      id: existing.id,
      userId: existing.userId,
      stripeCustomerId: existing.stripeCustomerId,
    };
  }
  const [inserted] = await db
    .insert(billingAccounts)
    .values({userId})
    .onConflictDoNothing()
    .returning();
  if (inserted) {
    return {
      id: inserted.id,
      userId: inserted.userId,
      stripeCustomerId: inserted.stripeCustomerId,
    };
  }
  const [again] = await db
    .select()
    .from(billingAccounts)
    .where(eq(billingAccounts.userId, userId))
    .limit(1);
  if (!again) throw new Error("BILLING_ACCOUNT_CREATE_FAILED");
  return {
    id: again.id,
    userId: again.userId,
    stripeCustomerId: again.stripeCustomerId,
  };
}

/** Ensure Stripe Customer exists and is stored. No-op when billing unconfigured. */
export async function ensureStripeCustomerForUser(userId: string): Promise<{
  account: BillingAccountRow;
  stripeCustomerId: string;
}> {
  if (!isStripeBillingConfigured()) {
    throw new Error("STRIPE_NOT_CONFIGURED");
  }
  const account = await getOrCreateBillingAccount(userId);
  if (account.stripeCustomerId) {
    return {account, stripeCustomerId: account.stripeCustomerId};
  }

  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const email = user?.email ?? undefined;
  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email: email || undefined,
    metadata: {userId},
  });

  const [updated] = await db
    .update(billingAccounts)
    .set({stripeCustomerId: customer.id, updatedAt: new Date()})
    .where(eq(billingAccounts.id, account.id))
    .returning();

  return {
    account: {
      id: updated?.id ?? account.id,
      userId,
      stripeCustomerId: customer.id,
    },
    stripeCustomerId: customer.id,
  };
}

export function appBaseUrl(): string {
  return (getClientEnv().NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}
