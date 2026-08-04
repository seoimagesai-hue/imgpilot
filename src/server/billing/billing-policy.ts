/**
 * Billing entitlement state mapping from Stripe subscription status.
 * Browser is never authoritative.
 */

export type EntitlementState = "enabled" | "restricted" | "grace_period" | "disabled";

export function freePlanPeriodBounds(now = new Date()): {start: Date; end: Date} {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return {start, end};
}

export function isWriteEntitlementAllowed(state: EntitlementState): boolean {
  return state === "enabled" || state === "grace_period";
}

/**
 * Full paid access: trialing, active (incl. cancel_at_period_end until period ends).
 * Grace: past_due within gracePeriodEndsAt.
 * Free fallback: unpaid, canceled, incomplete*, paused, unknown.
 */
export function mapEntitlementState(params: {
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
  gracePeriodEndsAt: Date | null;
  now?: Date;
}): EntitlementState {
  const now = params.now ?? new Date();
  const status = (params.status || "").toLowerCase();

  if (status === "active" || status === "trialing") {
    if (
      params.cancelAtPeriodEnd &&
      params.currentPeriodEnd &&
      params.currentPeriodEnd.getTime() <= now.getTime()
    ) {
      return "disabled";
    }
    return "enabled";
  }

  if (status === "past_due") {
    if (params.gracePeriodEndsAt && params.gracePeriodEndsAt.getTime() > now.getTime()) {
      return "grace_period";
    }
    return "restricted";
  }

  if (
    status === "unpaid" ||
    status === "canceled" ||
    status === "cancelled" ||
    status === "incomplete" ||
    status === "incomplete_expired" ||
    status === "paused" ||
    status === "inactive" ||
    !status
  ) {
    return "disabled";
  }

  // Unknown Stripe status → least privilege
  return "disabled";
}
