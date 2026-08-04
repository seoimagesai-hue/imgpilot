/**
 * Analytics policy — Prompt 20.
 */
export const ANALYTICS_DATE_RANGES = ["7d", "30d", "90d", "all"] as const;
export type AnalyticsDateRange = (typeof ANALYTICS_DATE_RANGES)[number];

export const ANALYTICS_ACTIVITY_LIMIT = 25;
export const ANALYTICS_ATTENTION_LIMIT = 20;
export const ANALYTICS_TREND_MAX_DAYS = 90;

/** Timestamps and day buckets are UTC. */
export const ANALYTICS_TIMEZONE_POLICY = "utc" as const;

export type AnalyticsFreshness = {
  currentState: "request_time";
  trends: "request_time_utc_days";
  workerSummary: "heartbeat_snapshot";
  timezone: typeof ANALYTICS_TIMEZONE_POLICY;
};

export function getAnalyticsPolicy(): AnalyticsFreshness & {
  externalSdk: false;
  billing: false;
  adminGlobal: false;
  fabricatedHistory: false;
  chartLibrary: "css_svg";
} {
  return {
    currentState: "request_time",
    trends: "request_time_utc_days",
    workerSummary: "heartbeat_snapshot",
    timezone: ANALYTICS_TIMEZONE_POLICY,
    externalSdk: false,
    billing: false,
    adminGlobal: false,
    fabricatedHistory: false,
    chartLibrary: "css_svg",
  };
}

export function resolveRangeStart(range: AnalyticsDateRange, now = new Date()): Date | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

export function utcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function zeroFilledUtcDays(start: Date, end: Date): string[] {
  const days: string[] = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  while (cursor <= last) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

export type AnalyticsEventType =
  | "project_created"
  | "image_uploaded"
  | "image_validated"
  | "image_validation_failed"
  | "image_deleted"
  | "image_replaced"
  | "derivative_completed"
  | "processing_failed"
  | "metadata_generated"
  | "metadata_approved"
  | "ai_batch_started"
  | "ai_batch_completed"
  | "ai_batch_review_ready"
  | "export_completed"
  | "export_failed"
  | "quota_limit_reached"
  | "wordpress_connection_activated"
  | "wordpress_publish_completed"
  | "wordpress_publish_failed"
  | "shopify_connection_activated"
  | "shopify_publish_completed"
  | "shopify_publish_failed"
  | "webflow_connection_activated"
  | "webflow_publish_completed"
  | "webflow_publish_failed"
  | "cloudinary_connection_activated"
  | "cloudinary_publish_completed"
  | "cloudinary_publish_failed"
  | "workflow_run_completed";
