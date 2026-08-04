/** Minimal analytics events stub for Phase 1 typecheck. */
export async function recordAnalyticsEventSafe(_input: {
  userId: string;
  projectId?: string | null;
  imageId?: string | null;
  eventType: string;
  entityType: string;
  entityId: string;
  idempotencyKey?: string;
  safeMetadata?: Record<string, unknown>;
}): Promise<void> {
  // no-op
}
