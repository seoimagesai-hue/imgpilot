/**
 * Guest ai.generate_alt_text — no image derivative.
 */
import {eq} from "drizzle-orm";
import {getDb} from "@/db";
import {guestJobs, type GuestJob, type GuestSession, type GuestUpload} from "@/db/schema";
import {getGuestMaxFileBytes, isR2Configured} from "@/lib/env";
import {
  isGuestAiAltMime,
  type GuestAiAltOptions,
  type GuestAiAltResultSummary,
} from "@/server/guest/ai-alt-policy";
import {generateGuestAiAltText} from "@/server/guest/ai-alt-provider";
import {GuestDomainError} from "@/server/guest/errors";
import {getObjectStorageProvider} from "@/server/storage/provider";

function mapProviderError(message: string): GuestDomainError {
  switch (message) {
    case "NOT_CONFIGURED":
      return new GuestDomainError("GUEST_AI_NOT_CONFIGURED");
    case "TIMEOUT":
      return new GuestDomainError("GUEST_AI_TIMEOUT");
    case "RATE_LIMITED":
      return new GuestDomainError("GUEST_AI_RATE_LIMITED");
    case "RESPONSE_INVALID":
    case "RESULT_TOO_LARGE":
      return new GuestDomainError("GUEST_AI_RESPONSE_INVALID");
    case "PROVIDER_UNAVAILABLE":
      return new GuestDomainError("GUEST_AI_PROVIDER_UNAVAILABLE");
    default:
      return new GuestDomainError("GUEST_AI_PROVIDER_UNAVAILABLE");
  }
}

export async function executeGuestAiAltJob(params: {
  session: GuestSession;
  job: GuestJob;
  upload: GuestUpload;
  options: GuestAiAltOptions;
}): Promise<GuestJob> {
  if (!isR2Configured()) throw new GuestDomainError("STORAGE_NOT_CONFIGURED");

  const mime = params.upload.detectedMimeType ?? params.upload.declaredMimeType ?? "";
  if (!isGuestAiAltMime(mime)) {
    throw new GuestDomainError("UNSUPPORTED_MEDIA_TYPE");
  }
  if (params.upload.isAnimated) {
    throw new GuestDomainError("UNSUPPORTED_MEDIA_TYPE");
  }

  const startedAt = Date.now();
  const storage = await getObjectStorageProvider();
  let body: Buffer;
  try {
    const source = await storage.getObjectBuffer(
      params.upload.storageKey,
      getGuestMaxFileBytes(),
    );
    body = source.body;
  } catch {
    throw new GuestDomainError("OBJECT_NOT_FOUND");
  }

  let generated: Awaited<ReturnType<typeof generateGuestAiAltText>>;
  try {
    generated = await generateGuestAiAltText({
      imageBytes: body,
      options: params.options,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "PROVIDER_UNAVAILABLE";
    throw mapProviderError(msg);
  }

  const resultSummary: GuestAiAltResultSummary = {
    schemaVersion: params.options.schemaVersion,
    purpose: params.options.purpose,
    outputLanguage: params.options.outputLanguage,
    result: generated.result,
    generatedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    providerConfigured: true,
  };

  const db = getDb();
  const [updated] = await db
    .update(guestJobs)
    .set({
      status: "completed",
      completedAt: new Date(),
      outputStorageKey: null,
      resultSummary,
      errorCode: null,
      options: params.options,
    })
    .where(eq(guestJobs.id, params.job.id))
    .returning();
  if (!updated) throw new GuestDomainError("INTERNAL_ERROR");
  return updated;
}
