"use client";

import {useCallback, useEffect, useState} from "react";
import {ActivityFeed} from "@/components/collaboration/activity-feed";
import type {ActivityFeedItem} from "@/server/collaboration/activity";

type Props = {
  projectId: string;
  initialItems: ActivityFeedItem[];
  initialHasMore: boolean;
  pollIntervalMs?: number;
};

export function ActivityFeedPoller({
  projectId,
  initialItems,
  initialHasMore,
  pollIntervalMs = 30000,
}: Props) {
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/activity`);
      const json = (await res.json()) as {
        ok?: boolean;
        items?: ActivityFeedItem[];
        hasMore?: boolean;
      };
      if (json.ok && json.items) {
        setItems(json.items);
        setHasMore(Boolean(json.hasMore));
      }
    } catch {
      // best-effort polling
    }
  }, [projectId]);

  useEffect(() => {
    if (pollIntervalMs <= 0) return;
    const id = window.setInterval(() => {
      void refresh();
    }, pollIntervalMs);
    return () => window.clearInterval(id);
  }, [pollIntervalMs, refresh]);

  return <ActivityFeed projectId={projectId} initialItems={items} initialHasMore={hasMore} />;
}
