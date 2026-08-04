import {describe, expect, it} from "vitest";
import {mapEntitlementState} from "@/server/billing/billing-policy";
import {
  getPlan,
  isPaidCheckoutAvailable,
  listConsumerPricingPlans,
  normalizePlanCode,
  resolvePlanFromPriceId,
} from "@/server/billing/plan-catalog";
import {getPublicPricingView} from "@/server/billing/pricing-view";
import {verifyCronSecret, getCronSecret} from "@/server/ops/cleanup-scheduler";

describe("billing plan catalog (prompt 12)", () => {
  it("exposes free + pro for consumer pricing", () => {
    const plans = listConsumerPricingPlans();
    expect(plans.map((p) => p.code)).toEqual(["free", "pro"]);
  });

  it("normalizes professional to pro", () => {
    expect(normalizePlanCode("professional")).toBe("pro");
    expect(getPlan("professional")?.code).toBe("pro");
  });

  it("does not invent checkout when price ids missing", () => {
    expect(isPaidCheckoutAvailable("pro", "month", {})).toBe(false);
    expect(resolvePlanFromPriceId("price_missing", {})).toBeNull();
  });

  it("maps known pro price id from env", () => {
    const mapped = resolvePlanFromPriceId("price_TestProMonthly123", {
      STRIPE_PRICE_PRO_MONTHLY: "price_TestProMonthly123",
    });
    expect(mapped?.plan.code).toBe("pro");
    expect(mapped?.interval).toBe("month");
  });
});

describe("entitlement status mapping", () => {
  const future = new Date(Date.now() + 86_400_000);
  const past = new Date(Date.now() - 86_400_000);

  it("enables active and trialing", () => {
    expect(
      mapEntitlementState({
        status: "active",
        cancelAtPeriodEnd: false,
        currentPeriodEnd: future,
        gracePeriodEndsAt: null,
      }),
    ).toBe("enabled");
    expect(
      mapEntitlementState({
        status: "trialing",
        cancelAtPeriodEnd: false,
        currentPeriodEnd: future,
        gracePeriodEndsAt: null,
      }),
    ).toBe("enabled");
  });

  it("keeps cancel-at-period-end enabled until period ends", () => {
    expect(
      mapEntitlementState({
        status: "active",
        cancelAtPeriodEnd: true,
        currentPeriodEnd: future,
        gracePeriodEndsAt: null,
      }),
    ).toBe("enabled");
    expect(
      mapEntitlementState({
        status: "active",
        cancelAtPeriodEnd: true,
        currentPeriodEnd: past,
        gracePeriodEndsAt: null,
      }),
    ).toBe("disabled");
  });

  it("applies past_due grace then restricted", () => {
    expect(
      mapEntitlementState({
        status: "past_due",
        cancelAtPeriodEnd: false,
        currentPeriodEnd: future,
        gracePeriodEndsAt: future,
      }),
    ).toBe("grace_period");
    expect(
      mapEntitlementState({
        status: "past_due",
        cancelAtPeriodEnd: false,
        currentPeriodEnd: future,
        gracePeriodEndsAt: past,
      }),
    ).toBe("restricted");
  });

  it("falls back for canceled/unknown", () => {
    expect(
      mapEntitlementState({
        status: "canceled",
        cancelAtPeriodEnd: false,
        currentPeriodEnd: past,
        gracePeriodEndsAt: null,
      }),
    ).toBe("disabled");
    expect(
      mapEntitlementState({
        status: "mystery",
        cancelAtPeriodEnd: false,
        currentPeriodEnd: null,
        gracePeriodEndsAt: null,
      }),
    ).toBe("disabled");
  });
});

describe("public pricing view", () => {
  it("marks paid launch not ready without price ids and avoids unlimited claims shape", () => {
    const view = getPublicPricingView();
    expect(view.currency).toBe("USD");
    expect(view.pricesApproved).toBe(false);
    expect(view.guest.display.bulkAi).toBe(false);
    expect(view.guest.display.savedHistory).toBe(false);
    expect(view.plans.some((p) => p.code === "free")).toBe(true);
    expect(view.plans.some((p) => p.code === "pro")).toBe(true);
  });
});

describe("cron auth", () => {
  it("rejects missing/mismatched secrets", () => {
    const prev = process.env.CRON_SECRET;
    process.env.CRON_SECRET = "test-cron-secret-value";
    expect(getCronSecret()).toBe("test-cron-secret-value");
    expect(verifyCronSecret(null)).toBe(false);
    expect(verifyCronSecret("wrong")).toBe(false);
    expect(verifyCronSecret("test-cron-secret-value")).toBe(true);
    process.env.CRON_SECRET = prev;
  });
});
