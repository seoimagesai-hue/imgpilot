"use client";

import {useLocale, useTranslations} from "next-intl";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useRouter} from "@/i18n/navigation";
import {formatByteSize} from "@/lib/format-bytes";
import {UPLOAD_CONCURRENCY, mapWithConcurrency, putFileToPresignedUrl} from "@/lib/direct-upload";
import type {QuotaPolicySummary} from "@/server/images/quota-policy";
import type {ProjectQuotaUsageDto} from "@/server/images/quota-service";
import {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_BYTES_PER_IMAGE,
  MAX_FILES_PER_BATCH,
  expectedMimeForExtension,
  getExtension,
  isAllowedImageExtension,
  isAllowedImageMimeType,
  isRejectedExtension,
} from "@/server/images/policy";
import {isR2ConfiguredClientHint} from "@/components/images/storage-hint";

type Props = {
  projectId: string;
  storageConfigured: boolean;
  quotaUsage?: ProjectQuotaUsageDto;
  quotaPolicy?: QuotaPolicySummary;
};

type UploadPhase =
  | "waiting"
  | "authorizing"
  | "uploading"
  | "confirming"
  | "uploaded"
  | "validating"
  | "validated"
  | "validation_failed"
  | "failed"
  | "cancelled";

type SelectedFile = {
  id: string;
  file: File;
  previewUrl: string | null;
  validationError: string | null;
  phase: UploadPhase;
  progress: number | null;
  errorCode: string | null;
  imageId: string | null;
  abortController: AbortController | null;
};

const ACCEPT = ALLOWED_IMAGE_EXTENSIONS.map((ext) => `.${ext}`).join(",");

export function ImageUploadPanel({
  projectId,
  storageConfigured,
  quotaUsage,
  quotaPolicy,
}: Props) {
  const t = useTranslations("images");
  const locale = useLocale();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<SelectedFile[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  const revokeAll = useCallback((items: SelectedFile[]) => {
    for (const item of items) {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    }
  }, []);

  useEffect(() => {
    return () => {
      revokeAll(selectedRef.current);
    };
  }, [revokeAll]);

  const acceptedLabel = useMemo(() => ALLOWED_IMAGE_EXTENSIONS.join(", "), []);

  const pendingUploadCount = useMemo(
    () =>
      selected.filter(
        (item) =>
          !item.validationError &&
          item.phase !== "validated" &&
          item.phase !== "uploaded" &&
          item.phase !== "validating",
      ).length,
    [selected],
  );

  const selectedTotalBytes = useMemo(
    () =>
      selected
        .filter((item) => !item.validationError)
        .reduce((sum, item) => sum + item.file.size, 0),
    [selected],
  );

  const quotaBlockedReason = useMemo(() => {
    if (!quotaUsage) return null;
    if (pendingUploadCount > quotaUsage.availableImageSlots) {
      return t("errors.quotaSlotsExceeded");
    }
    if (selectedTotalBytes > quotaUsage.availableStorageBytes) {
      return t("errors.quotaStorageExceeded");
    }
    return null;
  }, [pendingUploadCount, quotaUsage, selectedTotalBytes, t]);

  const updateItem = useCallback((id: string, patch: Partial<SelectedFile>) => {
    setSelected((prev) => prev.map((item) => (item.id === id ? {...item, ...patch} : item)));
  }, []);

  const validateFile = useCallback(
    (file: File): string | null => {
      const ext = getExtension(file.name);
      if (!ext || isRejectedExtension(ext) || !isAllowedImageExtension(ext)) {
        return t("errors.fileTypeRejected");
      }
      if (file.type && (file.type === "image/svg+xml" || !isAllowedImageMimeType(file.type))) {
        return t("errors.mimeInvalid");
      }
      if (file.size <= 0) return t("errors.fileTooSmall");
      if (file.size > MAX_BYTES_PER_IMAGE) {
        return t("errors.fileTooLarge", {max: formatByteSize(MAX_BYTES_PER_IMAGE, locale)});
      }
      if (file.name.length > 255) return t("errors.filenameTooLong");
      return null;
    },
    [locale, t],
  );

  const addFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    setFormError(null);
    const incoming = Array.from(fileList);
    if (selected.length + incoming.length > MAX_FILES_PER_BATCH) {
      setFormError(t("errors.batchTooLarge", {max: MAX_FILES_PER_BATCH}));
      return;
    }

    if (quotaUsage && selected.length + incoming.length > quotaUsage.availableImageSlots) {
      setFormError(t("errors.quotaSlotsExceeded"));
      return;
    }

    const incomingBytes = incoming.reduce((sum, file) => sum + file.size, 0);
    if (
      quotaUsage &&
      selectedTotalBytes + incomingBytes > quotaUsage.availableStorageBytes
    ) {
      setFormError(t("errors.quotaStorageExceeded"));
      return;
    }

    const next: SelectedFile[] = incoming.map((file) => {
      const validationError = validateFile(file);
      const canPreview =
        !validationError && file.type.startsWith("image/") && file.type !== "image/svg+xml";
      return {
        id: crypto.randomUUID(),
        file,
        previewUrl: canPreview ? URL.createObjectURL(file) : null,
        validationError,
        phase: "waiting",
        progress: null,
        errorCode: null,
        imageId: null,
        abortController: null,
      };
    });
    setSelected((prev) => [...prev, ...next]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeFile = (id: string) => {
    setSelected((prev) => {
      const target = prev.find((item) => item.id === id);
      target?.abortController?.abort();
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const clearSelection = () => {
    setSelected((prev) => {
      for (const item of prev) item.abortController?.abort();
      revokeAll(prev);
      return [];
    });
    setFormError(null);
  };

  const cancelAll = () => {
    setSelected((prev) =>
      prev.map((item) => {
        if (item.phase === "uploading" || item.phase === "authorizing" || item.phase === "confirming") {
          item.abortController?.abort();
          return {...item, phase: "cancelled", errorCode: "UPLOAD_CANCELLED", abortController: null};
        }
        return item;
      }),
    );
    setBusy(false);
  };

  const resolveMime = (file: File): string => {
    if (file.type && isAllowedImageMimeType(file.type)) return file.type;
    return expectedMimeForExtension(getExtension(file.name)) ?? "application/octet-stream";
  };

  const startUpload = async () => {
    setFormError(null);
    if (!storageConfigured) {
      setFormError(t("errors.storageNotConfigured"));
      return;
    }

    const valid = selected.filter((item) => !item.validationError && item.phase !== "uploaded");
    if (!valid.length) {
      setFormError(t("errors.noValidFiles"));
      return;
    }

    if (quotaUsage && valid.length > quotaUsage.availableImageSlots) {
      setFormError(t("errors.quotaSlotsExceeded"));
      return;
    }

    const validBytes = valid.reduce((sum, item) => sum + item.file.size, 0);
    if (quotaUsage && validBytes > quotaUsage.availableStorageBytes) {
      setFormError(t("errors.quotaStorageExceeded"));
      return;
    }

    setBusy(true);
    for (const item of valid) {
      updateItem(item.id, {phase: "authorizing", errorCode: null, progress: null});
    }

    try {
      const authorizeRes = await fetch(`/api/projects/${projectId}/images/uploads/authorize`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          files: valid.map((item) => ({
            clientId: item.id,
            originalFilename: item.file.name,
            mimeType: resolveMime(item.file),
            sizeBytes: item.file.size,
          })),
        }),
      });
      const authorizeJson = (await authorizeRes.json()) as {
        ok: boolean;
        error?: string;
        results?: Array<{
          ok: boolean;
          clientId: string;
          imageId?: string;
          uploadUrl?: string;
          headers?: Record<string, string>;
          error?: string;
        }>;
      };

      if (!authorizeJson.ok || !authorizeJson.results) {
        setFormError(t(`uploadErrors.${authorizeJson.error ?? "STORAGE_NOT_CONFIGURED"}`));
        setSelected((prev) =>
          prev.map((item) =>
            valid.some((v) => v.id === item.id)
              ? {...item, phase: "failed", errorCode: authorizeJson.error ?? "STORAGE_NOT_CONFIGURED"}
              : item,
          ),
        );
        setBusy(false);
        return;
      }

      const authorized = authorizeJson.results.filter((r) => r.ok && r.uploadUrl && r.imageId);
      for (const result of authorizeJson.results) {
        if (!result.ok) {
          updateItem(result.clientId, {
            phase: "failed",
            errorCode: result.error ?? "INVALID_UPLOAD_REQUEST",
          });
        }
      }

      await mapWithConcurrency(authorized, UPLOAD_CONCURRENCY, async (authItem) => {
        const local = selectedRef.current.find((item) => item.id === authItem.clientId);
        if (!local) return;
        const controller = new AbortController();
        updateItem(local.id, {
          phase: "uploading",
          imageId: authItem.imageId!,
          abortController: controller,
          progress: 0,
        });

        try {
          const contentType = authItem.headers?.["Content-Type"] ?? resolveMime(local.file);
          await putFileToPresignedUrl({
            url: authItem.uploadUrl!,
            file: local.file,
            contentType,
            signal: controller.signal,
            onProgress: (loaded, total) => {
              updateItem(local.id, {progress: total ? Math.round((loaded / total) * 100) : null});
            },
          });

          updateItem(local.id, {phase: "confirming", progress: 100, abortController: null});
          const confirmRes = await fetch(
            `/api/projects/${projectId}/images/uploads/${authItem.imageId}/confirm`,
            {method: "POST"},
          );
          const confirmJson = (await confirmRes.json()) as {ok: boolean; error?: string};
          if (!confirmJson.ok) {
            updateItem(local.id, {
              phase: "failed",
              errorCode: confirmJson.error ?? "CONFIRMATION_FAILED",
            });
            return;
          }

          updateItem(local.id, {phase: "validating", errorCode: null, abortController: null});
          const validateRes = await fetch(
            `/api/projects/${projectId}/images/${authItem.imageId}/validate`,
            {method: "POST"},
          );
          const validateJson = (await validateRes.json()) as {
            ok: boolean;
            status?: string;
            error?: string;
            inProgress?: boolean;
          };
          if (!validateJson.ok) {
            updateItem(local.id, {
              phase: "validation_failed",
              errorCode: validateJson.error ?? "DECODE_FAILED",
            });
            return;
          }
          if (validateJson.status === "validating" || validateJson.inProgress) {
            updateItem(local.id, {phase: "validating", errorCode: null});
            return;
          }
          updateItem(local.id, {phase: "validated", errorCode: null, abortController: null});
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            updateItem(local.id, {phase: "cancelled", errorCode: "UPLOAD_CANCELLED"});
            return;
          }
          updateItem(local.id, {phase: "failed", errorCode: "UPLOAD_FAILED"});
        }
      });

      const latest = selectedRef.current;
      const uploaded = latest.filter(
        (item) => item.phase === "validated" || item.phase === "uploaded" || item.phase === "validating",
      ).length;
      const failed = latest.filter(
        (item) =>
          item.phase === "failed" ||
          item.phase === "cancelled" ||
          item.phase === "validation_failed",
      ).length;
      if (failed && uploaded) setFormError(t("someUploadsFailed", {failed, uploaded}));
      else if (failed && !uploaded) setFormError(t("allUploadsFailed"));
      else if (uploaded) setFormError(t("allUploadsCompleted", {count: uploaded}));

      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const canStart =
    storageConfigured &&
    !busy &&
    !quotaBlockedReason &&
    selected.some(
      (item) =>
        !item.validationError &&
        item.phase !== "validated" &&
        item.phase !== "uploaded" &&
        item.phase !== "validating",
    );

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted)]" aria-live="polite">
        {t("directSecureUploadHint")}
      </p>
      <p className="sr-only">{isR2ConfiguredClientHint(storageConfigured)}</p>

      <div
        className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--accent-soft)]/40 p-6 text-center"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          addFiles(event.dataTransfer.files);
        }}
      >
        <p className="font-medium">{t("dragAndDrop")}</p>
        <p className="mt-2 text-sm text-[var(--muted)]">{t("orBrowse")}</p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          disabled={busy}
          onChange={(event) => addFiles(event.target.files)}
        />
        <button
          type="button"
          className="mt-4 rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {t("browseFiles")}
        </button>
      </div>

      <ul className="space-y-1 text-sm text-[var(--muted)]">
        <li>{t("supportedFormats", {types: acceptedLabel})}</li>
        <li>{t("maxFileSize", {max: formatByteSize(MAX_BYTES_PER_IMAGE, locale)})}</li>
        <li>{t("maxFiles", {max: MAX_FILES_PER_BATCH})}</li>
        <li>{t("mimeTypes", {types: ALLOWED_IMAGE_MIME_TYPES.join(", ")})}</li>
        <li>{t("concurrencyHint", {count: UPLOAD_CONCURRENCY})}</li>
      </ul>

      {quotaUsage && quotaPolicy ? (
        <div className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm">
          <p className="font-medium">{t("quota.uploadRemaining")}</p>
          <ul className="mt-1 space-y-0.5 text-[var(--muted)]">
            <li>
              {t("quota.uploadSlotsRemaining", {count: quotaUsage.availableImageSlots})}
            </li>
            <li>
              {t("quota.uploadStorageRemaining", {
                size: formatByteSize(quotaUsage.availableStorageBytes, locale),
              })}
            </li>
          </ul>
        </div>
      ) : null}

      {selected.length > 0 ? (
        <p className="text-sm text-[var(--muted)]">
          {t("quota.selectedTotalBytes")}: {formatByteSize(selectedTotalBytes, locale)}
        </p>
      ) : null}

      {quotaBlockedReason ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950" role="alert">
          {quotaBlockedReason}
        </p>
      ) : null}

      {!storageConfigured ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {t("storageUnavailableNotice")}
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--accent-soft)] px-3 py-2 text-sm">
          {t("doNotCloseDuringUpload")}
        </div>
      )}

      {selected.length > 0 ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-medium">{t("selectedImages", {count: selected.length})}</h3>
            <div className="flex gap-3 text-sm">
              {busy ? (
                <button type="button" className="underline" onClick={cancelAll}>
                  {t("cancelUpload")}
                </button>
              ) : (
                <button type="button" className="underline" onClick={clearSelection}>
                  {t("clearSelection")}
                </button>
              )}
            </div>
          </div>
          <ul className="space-y-2" aria-live="polite">
            {selected.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-white p-3"
              >
                {item.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.previewUrl} alt="" className="h-14 w-14 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-xs text-[var(--muted)]">
                    {getExtension(item.file.name) || "?"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.file.name}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {formatByteSize(item.file.size, locale)}
                    {item.file.type ? ` · ${item.file.type}` : null}
                  </p>
                  <p className="mt-1 text-xs">
                    {item.validationError
                      ? item.validationError
                      : t(`phases.${item.phase}`)}
                    {item.phase === "uploading" && item.progress != null
                      ? ` (${item.progress}%)`
                      : null}
                  </p>
                  {item.errorCode ? (
                    <p className="mt-1 text-xs text-red-700">
                      {item.phase === "validation_failed"
                        ? t(`validationErrors.${item.errorCode}` as "validationErrors.DECODE_FAILED")
                        : t(`uploadErrors.${item.errorCode}` as "uploadErrors.UPLOAD_FAILED")}
                    </p>
                  ) : null}
                  {item.phase === "uploading" ? (
                    <div
                      className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--border)]"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={item.progress ?? undefined}
                    >
                      <div
                        className="h-full bg-[var(--accent)]"
                        style={{width: `${item.progress ?? 0}%`}}
                      />
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="text-sm underline"
                  onClick={() => removeFile(item.id)}
                  disabled={item.phase === "authorizing" || item.phase === "confirming"}
                >
                  {t("remove")}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {formError ? (
        <p className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm" role="status">
          {formError}
        </p>
      ) : null}

      <button
        type="button"
        disabled={!canStart}
        onClick={() => void startUpload()}
        className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? t("uploading") : t("upload")}
      </button>
      <p className="text-xs text-[var(--muted)]">{t("originalUnmodified")}</p>
    </div>
  );
}
