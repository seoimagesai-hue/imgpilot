import {and, eq, sql} from "drizzle-orm";
import type Stripe from "stripe";
import {getDb} from "@/db";
import {
  billingAccounts,
  billingSubscriptions,
  stripeEvents,
} from "@/db/schema";
import {
  normalizePlanCode,
  resolvePlanFromPriceId,
} from "@/server/billing/plan-catalog";
import {rebuildEntitlementFromSubscription} from "@/server/billing/entitlements";
import {getStripeClient, isStripeBillingConfigured} from "@/server/billing/stripe-client";

function ts(seconds: number | null | undefined): Date | null {
  if (seconds == null) return null;
  return new Date(seconds * 1000);
}

async function linkUserFromCheckoutSession(session: Stripe.Checkout.Session): Promise<string | null> {
  const metaUser = session.metadata?.userId;
  if (metaUser && typeof metaUser === "string") return metaUser;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  if (!customerId) return null;
  const db = getDb();
  const [row] = await db
    .select()
    .from(billingAccounts)
    .where(eq(billingAccounts.stripeCustomerId, customerId))
    .limit(1);
  return row?.userId ?? null;
}

async function upsertSubscriptionFromStripe(params: {
  userId: string;
  billingAccountId: string;
  subscription: Stripe.Subscription;
}): Promise<void> {
  const item = params.subscription.items.data[0];
  const priceId = item?.price?.id ?? null;
  const mapped = priceId ? resolvePlanFromPriceId(priceId) : null;
  const planCode = mapped ? normalizePlanCode(mapped.plan.code) : "free";
  const interval = mapped?.interval ?? null;
  const productId =
    typeof item?.price?.product === "string"
      ? item?.price?.product
      : item?.price?.product?.id ?? null;

  const db = getDb();
  const existing = await db
    .select()
    .from(billingSubscriptions)
    .where(eq(billingSubscriptions.stripeSubscriptionId, params.subscription.id))
    .limit(1);

  const values = {
    userId: params.userId,
    billingAccountId: params.billingAccountId,
    stripeSubscriptionId: params.subscription.id,
    stripePriceId: priceId,
    stripeProductId: productId,
    planCode,
    status: params.subscription.status,
    billingInterval: interval,
    currentPeriodStart: ts(item?.current_period_start),
    currentPeriodEnd: ts(item?.current_period_end),
    cancelAtPeriodEnd: Boolean(params.subscription.cancel_at_period_end),
    cancelAt: ts(params.subscription.cancel_at),
    cancelledAt: ts(params.subscription.canceled_at),
    trialStart: ts(params.subscription.trial_start),
    trialEnd: ts(params.subscription.trial_end),
    endedAt: ts(params.subscription.ended_at),
    updatedAt: new Date(),
    lastStripeEventCreatedAt: new Date(),
  };

  if (existing[0]) {
    await db
      .update(billingSubscriptions)
      .set(values)
      .where(eq(billingSubscriptions.id, existing[0].id));
  } else {
    await db.insert(billingSubscriptions).values(values);
  }

  if (!mapped && priceId) {
    console.warn("[billing] unknown Stripe price mapped to free", {hasPrice: true});
  }

  await rebuildEntitlementFromSubscription(params.userId);
}

export async function processStripeEvent(event: Stripe.Event): Promise<{
  ok: boolean;
  duplicate?: boolean;
  skipped?: boolean;
}> {
  const db = getDb();
  const [inserted] = await db
    .insert(stripeEvents)
    .values({
      stripeEventId: event.id,
      eventType: event.type,
      eventCreatedAt: new Date(event.created * 1000),
      livemode: event.livemode,
      processingStatus: "processing",
      attemptCount: 1,
    })
    .onConflictDoNothing()
    .returning();

  if (!inserted) {
    const [row] = await db
      .select()
      .from(stripeEvents)
      .where(eq(stripeEvents.stripeEventId, event.id))
      .limit(1);
    if (row?.processingStatus === "processed") {
      return {ok: true, duplicate: true};
    }
    await db
      .update(stripeEvents)
      .set({
        attemptCount: sql`${stripeEvents.attemptCount} + 1`,
        processingStatus: "processing",
        updatedAt: new Date(),
      })
      .where(eq(stripeEvents.stripeEventId, event.id));
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = await linkUserFromCheckoutSession(session);
        if (!userId) break;
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        if (!subId || !isStripeBillingConfigured()) break;
        const stripe = getStripeClient();
        const subscription = await stripe.subscriptions.retrieve(subId);
        const [account] = await db
          .select()
          .from(billingAccounts)
          .where(eq(billingAccounts.userId, userId))
          .limit(1);
        if (!account) break;
        if (!account.stripeCustomerId && session.customer) {
          const customerId =
            typeof session.customer === "string" ? session.customer : session.customer.id;
          await db
            .update(billingAccounts)
            .set({stripeCustomerId: customerId, updatedAt: new Date()})
            .where(eq(billingAccounts.id, account.id));
        }
        await upsertSubscriptionFromStripe({
          userId,
          billingAccountId: account.id,
          subscription,
        });
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;
        const [account] = await db
          .select()
          .from(billingAccounts)
          .where(eq(billingAccounts.stripeCustomerId, customerId))
          .limit(1);
        if (!account) {
          console.warn("[billing] subscription event for unknown customer");
          break;
        }
        await upsertSubscriptionFromStripe({
          userId: account.userId,
          billingAccountId: account.id,
          subscription,
        });
        break;
      }
      case "invoice.paid":
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null;
        };
        const subRaw = invoice.subscription;
        const subId = typeof subRaw === "string" ? subRaw : subRaw?.id;
        if (!subId || !isStripeBillingConfigured()) break;
        const stripe = getStripeClient();
        const subscription = await stripe.subscriptions.retrieve(subId);
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;
        const [account] = await db
          .select()
          .from(billingAccounts)
          .where(eq(billingAccounts.stripeCustomerId, customerId))
          .limit(1);
        if (!account) break;
        await db
          .update(billingSubscriptions)
          .set({
            latestInvoiceStatus: invoice.status ?? event.type,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(billingSubscriptions.userId, account.userId),
              eq(billingSubscriptions.stripeSubscriptionId, subId),
            ),
          );
        await upsertSubscriptionFromStripe({
          userId: account.userId,
          billingAccountId: account.id,
          subscription,
        });
        break;
      }
      default:
        // Acknowledge unsupported events without failing webhook.
        break;
    }

    await db
      .update(stripeEvents)
      .set({
        processingStatus: "processed",
        processedAt: new Date(),
        updatedAt: new Date(),
        failureCode: null,
        failureMessageSafe: null,
      })
      .where(eq(stripeEvents.stripeEventId, event.id));
    return {ok: true};
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 180) : "processing_failed";
    await db
      .update(stripeEvents)
      .set({
        processingStatus: "failed",
        failureCode: "PROCESSING_FAILED",
        failureMessageSafe: message,
        updatedAt: new Date(),
      })
      .where(eq(stripeEvents.stripeEventId, event.id));
    throw error;
  }
}
