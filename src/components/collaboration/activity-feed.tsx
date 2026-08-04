"use client";

import {useLocale, useTranslations} from "next-intl";
import {useCallback, useState} from "react";
import type {ActivityFeedItem} from "@/server/collaboration/activity";

type Props = {
  projectId: string;
  initialItems: ActivityFeedItem[];
  initialHasMore: boolean;
};

export function ActivityFeed({projectId, initialItems, initialHasMore}: Props) {
  const t = useTranslations("collaboration");
  const ta = useTranslations("collaboration.activity");
  const locale = useLocale();
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const format = new Intl.DateTimeFormat(locale === "ur" ? "ur-PK" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });

  const verbLabel = (verb: string) => {
    const dotted = `verbs.${verb}` as Parameters<typeof t>[0];
    try {
      return t(dotted);
    } catch {
      return verb;
    }
  };

  const loadMore = useCallback(async () => {
    if (!hasMore || loading || items.length === 0) return;
    setLoading(true);
    setError(null);
    const cursor = items[items.length - 1]?.id;
    try {
      const res = await fetch(
        `/api/projects/${projectId}/activity?cursor=${encodeURIComponent(cursor)}`,
      );
      const json = (await res.json()) as {
        ok?: boolean;
        items?: ActivityFeedItem[];
        hasMore?: boolean;
        error?: string;
      };
      if (!json.ok || !json.items) {
        setError(json.error ?? "INVALID_REQUEST");
        return;
      }
      setItems((prev) => [...prev, ...json.items!]);
      setHasMore(Boolean(json.hasMore));
    } catch {
      setError("INVALID_REQUEST");
    } finally {
      setLoading(false);
    }
  }, [hasMore, items, loading, projectId]);

  if (items.length === 0) {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">{ta("title")}</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">{ta("empty")}</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">{ta("title")}</h2>
      {error ? (
        <p className="mb-3 text-sm text-red-700" role="alert">
          {t(`errors.${error}` as Parameters<typeof t>[0], {default: error})}
        </p>
      ) : null}
      <ol className="space-y-4">
        {items.map((item) => (
          <li key={item.id} className="border-b border-[var(--border)] pb-4 last:border-0">
            <p className="font-medium">{verbLabel(item.verb)}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{item.summarySafe}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {item.actorName ? `${item.actorName} · ` : ""}
              {format.format(new Date(item.occurredAt))} UTC
            </p>
          </li>
        ))}
      </ol>
      {hasMore ? (
        <button
          type="button"
          className="mt-4 rounded-lg border border-[var(--border)] px-3 py-2 text-sm disabled:opacity-50"
          onClick={loadMore}
          disabled={loading}
        >
          {loading ? ta("loading") : ta("loadMore")}
        </button>
      ) : null}
    </section>
  );
}
