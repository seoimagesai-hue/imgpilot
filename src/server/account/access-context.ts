/**
 * Safe public projection of guest vs account limits for UI.
 * Browser cannot elevate limits — all enforcement stays server-side.
 */
import {getGuestMaxFileBytes, getGuestMaxOpsPerDay} from "@/lib/env";
import {
  AUTH_PUBLIC_BULK_MAX_BATCH_BYTES_DEFAULT,
  AUTH_PUBLIC_BULK_MAX_FILES_DEFAULT,
  GUEST_BULK_MAX_BATCH_BYTES_DEFAULT,
  GUEST_BULK_MAX_FILES_DEFAULT,
} from "@/lib/guest/bulk-policy";
import {
  GUEST_ASSET_TTL_MS,
} from "@/server/guest/guest-policy";
import {
  countUsageInPeriod,
  resolveEntitlement,
} from "@/server/billing/entitlements";

export type AccessState = "guest" | "free" | "pro";

export type UserAccessLimits = {
  maxFileBytes: number;
  maxBulkFiles: number;
  maxBatchBytes: number;
  standardOperationsLimit: number;
  standardOperationsUsed: number;
  aiOperationsLimit: number;
  aiOperationsUsed: number;
  storageBytesLimit: number;
  storageBytesUsed: number;
  retentionHours: number;
  periodEnd: string | null;
};

export type UserAccessCapabilities = {
  bulkCompress: boolean;
  bulkResize: boolean;
  bulkConvert: boolean;
  bulkAi: boolean;
  zipDownload: boolean;
  savedHistory: boolean;
  savedFiles: boolean;
};

export type UserAccessContext = {
  state: AccessState;
  signedIn: boolean;
  planName: string;
  planCode: string;
  entitlementState: string | null;
  displayName: string | null;
  email: string | null;
  limits: UserAccessLimits;
  capabilities: UserAccessCapabilities;
};

function mapPlanState(planCode: string): AccessState {
  if (planCode === "free") return "free";
  if (
    planCode === "pro" ||
    planCode === "professional" ||
    planCode === "agency" ||
    planCode === "starter"
  ) {
    return "pro";
  }
  // Unknown signed-in plans: least privilege label (limits still come from entitlement snapshot).
  return "free";
}

export function guestAccessContext(): UserAccessContext {
  const maxFileBytes = getGuestMaxFileBytes();
  const ops = getGuestMaxOpsPerDay();
  return {
    state: "guest",
    signedIn: false,
    planName: "Guest",
    planCode: "guest",
    entitlementState: null,
    displayName: null,
    email: null,
    limits: {
      maxFileBytes,
      maxBulkFiles: GUEST_BULK_MAX_FILES_DEFAULT,
      maxBatchBytes: GUEST_BULK_MAX_BATCH_BYTES_DEFAULT,
      standardOperationsLimit: ops,
      standardOperationsUsed: 0,
      aiOperationsLimit: ops,
      aiOperationsUsed: 0,
      storageBytesLimit: 0,
      storageBytesUsed: 0,
      retentionHours: Math.round(GUEST_ASSET_TTL_MS / (60 * 60 * 1000)),
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

export async function resolveUserAccessContext(input: {
  userId: string | null | undefined;
  name?: string | null;
  email?: string | null;
}): Promise<UserAccessContext> {
  if (!input.userId) {
    return guestAccessContext();
  }

  try {
    const entitlement = await resolveEntitlement(input.userId);
    const [processingUsed, aiUsed] = await Promise.all([
      countUsageInPeriod(
        input.userId,
        "processing",
        entitlement.periodStart,
        entitlement.periodEnd,
      ),
      countUsageInPeriod(input.userId, "ai", entitlement.periodStart, entitlement.periodEnd),
    ]);

    const state = mapPlanState(entitlement.planCode);
    const plan = entitlement.plan;

    return {
      state,
      signedIn: true,
      planName: plan.displayName,
      planCode: entitlement.planCode,
      entitlementState: entitlement.entitlementState,
      displayName: input.name ?? null,
      email: input.email ?? null,
      limits: {
        maxFileBytes: getGuestMaxFileBytes(),
        maxBulkFiles: AUTH_PUBLIC_BULK_MAX_FILES_DEFAULT,
        maxBatchBytes: AUTH_PUBLIC_BULK_MAX_BATCH_BYTES_DEFAULT,
        standardOperationsLimit: plan.monthlyProcessingLimit,
        standardOperationsUsed: processingUsed,
        aiOperationsLimit: plan.monthlyAiLimit,
        aiOperationsUsed: aiUsed,
        storageBytesLimit: plan.maxOriginalStorageBytes + plan.maxGeneratedStorageBytes,
        storageBytesUsed: 0,
        retentionHours: 24 * 30,
        periodEnd: entitlement.periodEnd.toISOString(),
      },
      capabilities: {
        bulkCompress: plan.bulkProcessingEnabled,
        bulkResize: plan.bulkProcessingEnabled,
        bulkConvert: plan.bulkProcessingEnabled,
        bulkAi: plan.aiMetadataEnabled,
        zipDownload: true,
        savedHistory: true,
        savedFiles: false,
      },
    };
  } catch {
    // Least privilege if billing stack unavailable
    const guest = guestAccessContext();
    return {
      ...guest,
      state: "free",
      signedIn: true,
      planName: "Free",
      planCode: "free",
      displayName: input.name ?? null,
      email: input.email ?? null,
      limits: {
        ...guest.limits,
        maxBulkFiles: AUTH_PUBLIC_BULK_MAX_FILES_DEFAULT,
        maxBatchBytes: AUTH_PUBLIC_BULK_MAX_BATCH_BYTES_DEFAULT,
        standardOperationsLimit: 200,
        aiOperationsLimit: 50,
        retentionHours: 24 * 30,
      },
      capabilities: {
        ...guest.capabilities,
        savedHistory: true,
        savedFiles: false,
      },
    };
  }
}
