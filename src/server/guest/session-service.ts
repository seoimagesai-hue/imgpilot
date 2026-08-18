import {createHash, randomUUID} from "node:crypto";
import {and, eq, gt, inArray, sql} from "drizzle-orm";
import {getDb} from "@/db";
import {guestJobs, guestSessions, type GuestSession} from "@/db/schema";
import {
  getGuestAssetTtlMs,
  getGuestMaxFileBytes,
  getGuestMaxOpsPerDay,
} from "@/lib/env";
import {
  assignGuestCohort,
  GUEST_MAX_ACTIVE_JOBS,
  GUEST_OPS_WINDOW_MS,
  isGuestExpired,
  isGuestToolCode,
  type GuestPublicPolicy,
  type GuestToolCode,
} from "@/server/guest/guest-policy";
import {isGuestAvifEncodeSupported} from "@/server/guest/avif-capability";
import {GUEST_ALLOWED_MIME_TYPES} from "@/server/guest/upload-policy";
import {GuestDomainError} from "@/server/guest/errors";
import {generateGuestRawToken, hashGuestToken, verifyGuestTokenHash} from "@/server/guest/token";
import type {GuestSessionPublic} from "@/server/guest/types";
import {isAiConfigured} from "@/server/images/ai-provider";

export function getGuestPublicPolicy(avifEncodeSupported = false): GuestPublicPolicy {
  return {
    maxFileBytes: getGuestMaxFileBytes(),
    operationsPerRolling24h: getGuestMaxOpsPerDay(),
    allowedMimeTypes: GUEST_ALLOWED_MIME_TYPES,
    retentionMs: getGuestAssetTtlMs(),
    avifEncodeSupported,
    aiConfigured: isAiConfigured(),
  };
}

export async function getGuestPublicPolicyAsync(): Promise<GuestPublicPolicy> {
  return getGuestPublicPolicy(await isGuestAvifEncodeSupported());
}

async function toPublicSession(session: GuestSession): Promise<GuestSessionPublic> {
  const toolCode = isGuestToolCode(session.toolCode)
    ? session.toolCode
    : ("home" as GuestToolCode);
  const policy = await getGuestPublicPolicyAsync();
  return {
    publicId: session.publicId,
    expiresAt: session.expiresAt.toISOString(),
    createdAt: session.createdAt.toISOString(),
    toolCode,
    cohort: session.cohort,
    operationsUsed: session.operationsUsed,
    operationsLimit: getGuestMaxOpsPerDay(),
    policy,
  };
}

async function maybeRotateOpsWindow(session: GuestSession, now: Date): Promise<GuestSession> {
  if (now.getTime() - session.operationsWindowStartedAt.getTime() < GUEST_OPS_WINDOW_MS) {
    return session;
  }
  const db = getDb();
  const [updated] = await db
    .update(guestSessions)
    .set({
      operationsWindowStartedAt: now,
      operationsUsed: 0,
    })
    .where(eq(guestSessions.id, session.id))
    .returning();
  return updated ?? session;
}

export async function createGuestSession(params: {
  locale?: string;
  toolCode?: string;
  ipHash?: string | null;
  userAgent?: string | null;
}): Promise<{session: GuestSession; rawToken: string; public: GuestSessionPublic}> {
  const rawToken = generateGuestRawToken();
  const tokenHash = hashGuestToken(rawToken);
  const publicId = randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + getGuestAssetTtlMs());
  const toolCode =
    params.toolCode && isGuestToolCode(params.toolCode) ? params.toolCode : "home";
  const uaHash = params.userAgent
    ? createHash("sha256").update(params.userAgent, "utf8").digest("hex").slice(0, 32)
    : null;

  const db = getDb();
  const [session] = await db
    .insert(guestSessions)
    .values({
      publicId,
      tokenHash,
      cohort: assignGuestCohort(publicId),
      locale: params.locale === "ur" ? "ur" : "en",
      toolCode,
      operationsWindowStartedAt: now,
      operationsUsed: 0,
      ipHash: params.ipHash ?? null,
      userAgentHash: uaHash,
      createdAt: now,
      expiresAt,
    })
    .returning();

  if (!session) throw new GuestDomainError("INTERNAL_ERROR");
  return {session, rawToken, public: await toPublicSession(session)};
}

export async function resolveGuestSessionFromRawToken(
  rawToken: string | null | undefined,
): Promise<GuestSession> {
  if (!rawToken) throw new GuestDomainError("GUEST_SESSION_ACCESS_DENIED");
  const tokenHash = hashGuestToken(rawToken);
  const db = getDb();
  const [session] = await db
    .select()
    .from(guestSessions)
    .where(eq(guestSessions.tokenHash, tokenHash))
    .limit(1);
  if (!session || !verifyGuestTokenHash(rawToken, session.tokenHash)) {
    throw new GuestDomainError("GUEST_SESSION_ACCESS_DENIED");
  }
  if (isGuestExpired(session.expiresAt)) {
    throw new GuestDomainError("GUEST_SESSION_EXPIRED");
  }
  return maybeRotateOpsWindow(session, new Date());
}

export async function assertGuestCanStartOperation(session: GuestSession): Promise<void> {
  const limit = getGuestMaxOpsPerDay();
  if (session.operationsUsed >= limit) {
    throw new GuestDomainError("GUEST_LIMIT_REACHED");
  }
  const db = getDb();
  const [row] = await db
    .select({count: sql<number>`count(*)::int`})
    .from(guestJobs)
    .where(
      and(
        eq(guestJobs.sessionId, session.id),
        inArray(guestJobs.status, ["queued", "running"]),
        gt(guestJobs.expiresAt, new Date()),
      ),
    );
  if ((row?.count ?? 0) >= GUEST_MAX_ACTIVE_JOBS) {
    throw new GuestDomainError("GUEST_ACTIVE_JOB_EXISTS");
  }
}

/** Uploads may proceed while a previous job is finishing — only the daily ops cap applies. */
export async function assertGuestCanAuthorizeUpload(session: GuestSession): Promise<void> {
  const limit = getGuestMaxOpsPerDay();
  if (session.operationsUsed >= limit) {
    throw new GuestDomainError("GUEST_LIMIT_REACHED");
  }
}

export async function incrementGuestOperations(sessionId: string): Promise<void> {
  const db = getDb();
  await db
    .update(guestSessions)
    .set({operationsUsed: sql`${guestSessions.operationsUsed} + 1`})
    .where(eq(guestSessions.id, sessionId));
}

export async function scrubExpiredGuestSession(sessionId: string): Promise<void> {
  const db = getDb();
  await db
    .update(guestSessions)
    .set({
      ipHash: null,
      userAgentHash: null,
      scrubbedAt: new Date(),
    })
    .where(eq(guestSessions.id, sessionId));

  // Scrub sensitive geotag / metadata viewer results after expiry cleanup.
  await db
    .update(guestJobs)
    .set({
      options: {scrubbed: true},
      resultSummary: {scrubbed: true},
    })
    .where(
      and(
        eq(guestJobs.sessionId, sessionId),
        inArray(guestJobs.operation, [
          "geotag.write_gps",
          "metadata.inspect",
          "ai.generate_alt_text",
          "metadata.edit",
        ]),
      ),
    );
}

export {toPublicSession};
