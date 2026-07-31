"use client";

import {useTranslations} from "next-intl";
import {formatByteSize} from "@/lib/format-bytes";
import {
  isNearImageSlotLimit,
  isNearStorageLimit,
  isProjectImageSlotsFull,
  isProjectStorageFull,
  type QuotaPolicySummary,
} from "@/server/images/quota-policy";
import type {ProjectQuotaUsageDto} from "@/server/images/quota-service";

export type ProjectQuotaSummaryProps = {
  usage: ProjectQuotaUsageDto;
  policy: QuotaPolicySummary;
  locale: string;
};

function usageSnapshot(usage: ProjectQuotaUsageDto) {
  return {
    activeImageCount: usage.activeImageCount,
    reservedImageSlots: usage.reservedImageSlots,
    activeOriginalBytes: usage.activeOriginalBytes,
    reservedUploadBytes: usage.reservedUploadBytes,
    replacementCandidateBytes: usage.replacementCandidateBytes,
    cleanupPendingBytes: usage.cleanupPendingBytes,
  };
}

export function ProjectQuotaSummary({usage, policy, locale}: ProjectQuotaSummaryProps) {
  const t = useTranslations("images.quota");
  const snapshot = usageSnapshot(usage);

  const nearImage = isNearImageSlotLimit(snapshot);
  const nearStorage = isNearStorageLimit(snapshot);
  const fullImages = isProjectImageSlotsFull(snapshot);
  const fullStorage = isProjectStorageFull(snapshot);

  return (
    <section
      className="rounded-2xl border border-[var(--border)] bg-white p-4 text-sm shadow-sm"
      aria-labelledby="project-quota-summary-heading"
    >
      <h2 id="project-quota-summary-heading" className="text-base font-semibold">
        {t("summaryTitle")}
      </h2>

      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-[var(--muted)]">{t("activeImages")}</dt>
          <dd className="font-medium">
            {t("activeImagesValue", {
              used: usage.logicalImageSlots,
              max: policy.maxImagesPerProject,
            })}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">{t("storageUsed")}</dt>
          <dd className="font-medium">
            {t("storageUsedValue", {
              used: formatByteSize(usage.effectiveUsageBytes, locale),
              max: formatByteSize(policy.maxProjectStorageBytes, locale),
            })}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">{t("availableSlots")}</dt>
          <dd className="font-medium">{usage.availableImageSlots.toLocaleString(locale)}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">{t("availableStorage")}</dt>
          <dd className="font-medium">
            {formatByteSize(usage.availableStorageBytes, locale)}
          </dd>
        </div>
      </dl>

      {usage.reservedUploadBytes > 0 ? (
        <p className="mt-3 text-[var(--muted)]">
          <span className="font-medium text-[var(--foreground)]">{t("reservedUploads")}: </span>
          {formatByteSize(usage.reservedUploadBytes, locale)}
        </p>
      ) : null}

      {usage.cleanupPendingBytes > 0 ? (
        <p className="mt-2 text-[var(--muted)]">
          <span className="font-medium text-[var(--foreground)]">{t("cleanupPending")}: </span>
          {formatByteSize(usage.cleanupPendingBytes, locale)}
        </p>
      ) : null}

      {fullImages ? (
        <p className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-amber-950" role="status">
          {t("imageLimitFull")}
        </p>
      ) : fullStorage ? (
        <p className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-amber-950" role="status">
          {t("storageLimitFull")}
        </p>
      ) : null}

      {!fullImages && nearImage ? (
        <p className="mt-3 text-amber-900" role="status">
          {t("nearImageLimit")}
        </p>
      ) : null}

      {!fullStorage && nearStorage ? (
        <p className="mt-2 text-amber-900" role="status">
          {t("nearStorageLimit")}
        </p>
      ) : null}

      {usage.inconsistencyFlag ? (
        <p className="mt-3 text-[var(--muted)]" role="note">
          {t("inconsistencyNote")}
        </p>
      ) : null}
    </section>
  );
}
