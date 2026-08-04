"use client";

import {useFormatter, useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";
import type {AiMetadataBatchDto} from "@/server/images/ai-metadata-batch-actions";

type Props = {
  projectId: string;
  batches: AiMetadataBatchDto[];
};

export function BatchList({projectId, batches}: Props) {
  const t = useTranslations("aiBatches");
  const format = useFormatter();

  if (!batches.length) {
    return (
      <p className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--muted)]">
        {t("list.empty")}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-white shadow-sm">
      {batches.map((batch) => {
        const reviewReady = batch.draftCount + batch.reviewedCount > 0;
        return (
          <li key={batch.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-1">
              <p className="font-medium">
                {t(`templates.${batch.templateCode}`)} ·{" "}
                {batch.language === "ur" ? t("languageUrdu") : t("languageEnglish")}
              </p>
              <p className="text-sm text-[var(--muted)]">
                {format.dateTime(new Date(batch.createdAt), {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
              <p className="text-sm">
                <span className="font-medium">{t("list.status")}:</span>{" "}
                {t(`status.${batch.status}` as "status.running")}
              </p>
              <p className="text-xs text-[var(--muted)]">
                {t("list.counters", {
                  eligible: batch.eligibleCount,
                  draft: batch.draftCount,
                  failed: batch.failedCount,
                  skipped: batch.skippedCount,
                })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/dashboard/projects/${projectId}/ai-batches/${batch.id}`}
                className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm hover:bg-gray-50"
              >
                {t("list.viewProgress")}
              </Link>
              {reviewReady ? (
                <Link
                  href={`/dashboard/projects/${projectId}/ai-batches/${batch.id}/review`}
                  className="rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white"
                >
                  {t("list.reviewDrafts")}
                </Link>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
