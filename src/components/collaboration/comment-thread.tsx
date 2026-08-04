"use client";

import {useTranslations} from "next-intl";
import {useCallback, useEffect, useState} from "react";
import type {CommentSubjectTypeLiteral} from "@/server/collaboration/policy";
import type {CommentItemDto, ThreadWithCommentsDto} from "@/server/collaboration/comments";

type Props = {
  projectId: string;
  subjectType: CommentSubjectTypeLiteral;
  subjectId: string;
  currentUserId?: string;
  pollIntervalMs?: number;
};

export function CommentThread({
  projectId,
  subjectType,
  subjectId,
  currentUserId,
  pollIntervalMs = 5000,
}: Props) {
  const t = useTranslations("collaboration.comments");
  const te = useTranslations("collaboration.errors");
  const [data, setData] = useState<ThreadWithCommentsDto | null>(null);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const qs = new URLSearchParams({subjectType, subjectId});
    const res = await fetch(`/api/projects/${projectId}/comments?${qs.toString()}`);
    const json = (await res.json()) as ThreadWithCommentsDto & {ok?: boolean; error?: string};
    if (json.thread) {
      setData({
        thread: json.thread,
        comments: json.comments ?? [],
        permissions: json.permissions ?? {canCreate: false, canResolve: false},
      });
    } else if (json.error) {
      setError(json.error);
    }
  }, [projectId, subjectType, subjectId]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => {
      void load();
    }, pollIntervalMs);
    return () => window.clearInterval(id);
  }, [load, pollIntervalMs]);

  const submit = async () => {
    if (!body.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/comments`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({subjectType, subjectId, body}),
      });
      const json = (await res.json()) as {ok?: boolean; error?: string};
      if (!json.ok) {
        setError(json.error ?? "INVALID_REQUEST");
        return;
      }
      setBody("");
      await load();
    } catch {
      setError("INVALID_REQUEST");
    } finally {
      setBusy(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/comments/${commentId}/delete`, {
        method: "POST",
      });
      const json = (await res.json()) as {ok?: boolean; error?: string};
      if (!json.ok) setError(json.error ?? "INVALID_REQUEST");
      else await load();
    } catch {
      setError("INVALID_REQUEST");
    } finally {
      setBusy(false);
    }
  };

  const resolve = async (action: "resolve" | "reopen") => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/threads/resolve`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({subjectType, subjectId, action}),
      });
      const json = (await res.json()) as {ok?: boolean; error?: string};
      if (!json.ok) setError(json.error ?? "INVALID_REQUEST");
      else await load();
    } catch {
      setError("INVALID_REQUEST");
    } finally {
      setBusy(false);
    }
  };

  const perms = data?.permissions ?? {canCreate: false, canResolve: false};
  const thread = data?.thread;
  const comments = data?.comments ?? [];

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">{t("title")}</h2>
        {thread ? (
          <span className="text-xs text-[var(--muted)]">
            {thread.status === "resolved" ? t("resolvedHint") : t("statusOpen", {default: "Open"})}
          </span>
        ) : null}
      </div>

      {error ? (
        <p className="mb-2 text-sm text-red-700" role="alert">
          {te(error as Parameters<typeof te>[0], {default: error})}
        </p>
      ) : null}

      <ul className="mb-4 max-h-64 space-y-3 overflow-y-auto text-sm">
        {comments.length === 0 ? (
          <li className="text-[var(--muted)]">{t("empty")}</li>
        ) : (
          comments.map((c: CommentItemDto) => (
            <li key={c.id} className="rounded-lg border border-[var(--border)] p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-[var(--muted)]">
                  {c.authorName ?? "User"} ·{" "}
                  {new Date(c.createdAt).toLocaleString()}
                </p>
                {!c.isDeleted && (c.authorUserId === currentUserId || perms.canResolve) ? (
                  <button
                    type="button"
                    className="text-xs text-[var(--muted)] hover:underline"
                    disabled={busy}
                    onClick={() => deleteComment(c.id)}
                  >
                    {t("delete")}
                  </button>
                ) : null}
              </div>
              <p className="mt-1 whitespace-pre-wrap">
                {c.isDeleted ? t("deleted") : c.body}
              </p>
            </li>
          ))
        )}
      </ul>

      {perms.canResolve && thread ? (
        <div className="mb-3 flex gap-2">
          {thread.status === "open" ? (
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
              disabled={busy}
              onClick={() => resolve("resolve")}
            >
              {t("resolve")}
            </button>
          ) : (
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
              disabled={busy}
              onClick={() => resolve("reopen")}
            >
              {t("reopen")}
            </button>
          )}
        </div>
      ) : null}

      {perms.canCreate && thread?.status !== "resolved" ? (
        <div className="space-y-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t("title")}</span>
            <textarea
              className="min-h-[80px] w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t("placeholder")}
              maxLength={4000}
            />
          </label>
          <p className="text-xs text-[var(--muted)]">{t("mentionHint")}</p>
          <button
            type="button"
            className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            disabled={busy || !body.trim()}
            onClick={submit}
          >
            {busy ? t("posting") : t("post")}
          </button>
        </div>
      ) : !perms.canCreate ? (
        <p className="text-xs text-[var(--muted)]">{t("viewOnly")}</p>
      ) : null}
    </section>
  );
}
