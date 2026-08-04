/**
 * Prompt 25 — outbound webhook event emission.
 * Emitting an event is idempotent per (workspace, deduplicationKey): calling
 * it twice for the same logical occurrence creates the event/deliveries once.
 */
import {and, eq, sql} from "drizzle-orm";
import {getDb} from "@/db";
import {
  webhookDeliveries,
  webhookEndpoints,
  webhookEvents,
  type ApiWorkspaceType,
  type WebhookEvent,
} from "@/db/schema";
import {WEBHOOK_EVENT_TYPES, isValidWebhookEventType, type WebhookEventType} from "@/server/webhooks/event-types";

export {WEBHOOK_EVENT_TYPES, isValidWebhookEventType, type WebhookEventType};

export type EmitWebhookEventInput = {
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  eventType: WebhookEventType;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  /** Caller-supplied stable key so retried triggers don't double-emit. */
  deduplicationKey: string;
  occurredAt?: Date;
};

export type EmitWebhookEventResult = {
  event: WebhookEvent;
  deliveriesCreated: number;
  deduplicated: boolean;
};

export async function emitWebhookEvent(
  input: EmitWebhookEventInput,
): Promise<EmitWebhookEventResult> {
  if (!isValidWebhookEventType(input.eventType)) {
    throw new Error(`Unknown webhook event type: ${input.eventType}`);
  }

  const db = getDb();
  const [inserted] = await db
    .insert(webhookEvents)
    .values({
      workspaceType: input.workspaceType,
      workspaceId: input.workspaceId,
      eventType: input.eventType,
      entityType: input.entityType,
      entityId: input.entityId,
      payload: input.payload,
      occurredAt: input.occurredAt ?? new Date(),
      deduplicationKey: input.deduplicationKey,
    })
    .onConflictDoNothing()
    .returning();

  if (!inserted) {
    const [existing] = await db
      .select()
      .from(webhookEvents)
      .where(
        and(
          eq(webhookEvents.workspaceType, input.workspaceType),
          eq(webhookEvents.workspaceId, input.workspaceId),
          eq(webhookEvents.deduplicationKey, input.deduplicationKey),
        ),
      )
      .limit(1);
    if (!existing) {
      throw new Error("Failed to emit or locate webhook event after dedup conflict.");
    }
    return {event: existing, deliveriesCreated: 0, deduplicated: true};
  }

  const subscribedEndpoints = await db
    .select({id: webhookEndpoints.id})
    .from(webhookEndpoints)
    .where(
      and(
        eq(webhookEndpoints.workspaceType, input.workspaceType),
        eq(webhookEndpoints.workspaceId, input.workspaceId),
        eq(webhookEndpoints.status, "active"),
        sql`${webhookEndpoints.subscribedEvents} @> ${JSON.stringify([input.eventType])}::jsonb`,
      ),
    );

  if (subscribedEndpoints.length === 0) {
    return {event: inserted, deliveriesCreated: 0, deduplicated: false};
  }

  const now = new Date();
  await db.insert(webhookDeliveries).values(
    subscribedEndpoints.map((endpoint) => ({
      webhookEventId: inserted.id,
      endpointId: endpoint.id,
      attemptNumber: 1,
      status: "queued" as const,
      scheduledAt: now,
    })),
  );

  return {event: inserted, deliveriesCreated: subscribedEndpoints.length, deduplicated: false};
}
