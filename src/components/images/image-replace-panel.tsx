"use client";

import {useTranslations} from "next-intl";
import {useId, useRef, useState} from "react";
import {useRouter} from "@/i18n/navigation";
import {putFileToPresignedUrl} from "@/lib/direct-upload";
import {
  expectedMimeForExtension,
  getExtension,
  isAllowedImageMimeType,
} from "@/server/images/policy";

type ReplacePhase =
  | "idle"
  | "uploading"
  | "confirming"
  | "validating"
  | "validated"
  | "promoting"
  | "complete"
  | "error";

type Props = {
  projectId: string;
  imageId: string;
  onComplete: () => void;
};

function resolveMime(file: File): string {
  if (file.type && isAllowedImageMimeType(file.type)) return file.type;
  return expectedMimeForExtension(getExtension(file.name)) ?? "application/octet-stream";
}

export function ImageReplacePanel({projectId, imageId, onComplete}: Props) {
  const t = useTranslations("images");
  const router = useRouter();
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [phase, setPhase] = useState<ReplacePhase>("idle");
  const [replacementId, setReplacementId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canCancel =
    replacementId !== null && phase !== "promoting" && phase !== "complete" && !busy;

  const reset = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPhase("idle");
    setReplacementId(null);
    setSelectedName(null);
    setProgress(null);
    setError(null);
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  async function cancelReplacement() {
    if (!replacementId || busy) return;
    setBusy(true);
    setError(null);
    try {
      await fetch(
        `/api/projects/${projectId}/images/${imageId}/replace/${replacementId}/cancel`,
        {method: "POST"},
      );
    } catch {
      /* best-effort cancel */
    } finally {
      reset();
      router.refresh();
    }
  }

  async function startReplace(file: File) {
    setBusy(true);
    setError(null);
    setSelectedName(file.name);
    setPhase("uploading");
    setProgress(0);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const beginRes = await fetch(`/api/projects/${projectId}/images/${imageId}/replace/begin`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          originalFilename: file.name,
          mimeType: resolveMime(file),
          sizeBytes: file.size,
        }),
        signal: controller.signal,
      });
      const beginJson = (await beginRes.json()) as {
        ok: boolean;
        error?: string;
        replacementId?: string;
        uploadUrl?: string;
        headers?: Record<string, string>;
      };

      if (!beginJson.ok || !beginJson.replacementId || !beginJson.uploadUrl) {
        setPhase("error");
        setError(
          t(`lifecycleErrors.${beginJson.error ?? "IMAGE_NOT_REPLACEABLE"}` as "lifecycleErrors.IMAGE_NOT_REPLACEABLE"),
        );
        return;
      }

      setReplacementId(beginJson.replacementId);
      const contentType = beginJson.headers?.["Content-Type"] ?? resolveMime(file);
      await putFileToPresignedUrl({
        url: beginJson.uploadUrl,
        file,
        contentType,
        signal: controller.signal,
        onProgress: (loaded, total) => {
          setProgress(total ? Math.round((loaded / total) * 100) : null);
        },
      });

      setPhase("confirming");
      const confirmRes = await fetch(
        `/api/projects/${projectId}/images/${imageId}/replace/${beginJson.replacementId}/confirm`,
        {method: "POST", signal: controller.signal},
      );
      const confirmJson = (await confirmRes.json()) as {ok: boolean; error?: string};
      if (!confirmJson.ok) {
        setPhase("error");
        setError(
          t(`lifecycleErrors.${confirmJson.error ?? "CONFIRMATION_FAILED"}` as "lifecycleErrors.CONFIRMATION_FAILED"),
        );
        return;
      }

      setPhase("validating");
      const validateRes = await fetch(
        `/api/projects/${projectId}/images/${imageId}/replace/${beginJson.replacementId}/validate`,
        {method: "POST", signal: controller.signal},
      );
      const validateJson = (await validateRes.json()) as {
        ok: boolean;
        error?: string;
        failureCode?: string;
        status?: string;
        inProgress?: boolean;
      };
      if (!validateJson.ok) {
        setPhase("error");
        const code = validateJson.failureCode ?? validateJson.error ?? "REPLACEMENT_VALIDATION_FAILED";
        setError(t(`validationErrors.${code}` as "validationErrors.DECODE_FAILED"));
        return;
      }
      if (validateJson.status === "validating" || validateJson.inProgress) {
        setPhase("validating");
        setError(t("replace.validationInProgress"));
        return;
      }

      setPhase("validated");
      setProgress(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        reset();
        return;
      }
      setPhase("error");
      setError(t("lifecycleErrors.STORAGE_UNAVAILABLE"));
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  async function promoteReplacement() {
    if (!replacementId || busy) return;
    setBusy(true);
    setError(null);
    setPhase("promoting");
    try {
      const res = await fetch(
        `/api/projects/${projectId}/images/${imageId}/replace/${replacementId}/promote`,
        {method: "POST"},
      );
      const json = (await res.json()) as {ok: boolean; error?: string; cleanupPending?: boolean};
      if (!json.ok) {
        setPhase("error");
        setError(
          t(`lifecycleErrors.${json.error ?? "REPLACEMENT_NOT_READY"}` as "lifecycleErrors.REPLACEMENT_NOT_READY"),
        );
        return;
      }
      setPhase("complete");
      onComplete();
      router.refresh();
    } catch {
      setPhase("error");
      setError(t("lifecycleErrors.STORAGE_UNAVAILABLE"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--accent-soft)]/30 p-3">
      <h3 className="text-sm font-semibold">{t("replace.title")}</h3>
      <p className="text-xs text-[var(--muted)]">{t("replace.description")}</p>
      <p className="text-xs text-[var(--muted)]">{t("quota.replacementTemporary")}</p>

      {phase === "idle" ? (
        <>
          <input
            ref={fileRef}
            id={inputId}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void startReplace(file);
            }}
          />
          <label
            htmlFor={inputId}
            className="inline-block cursor-pointer rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
          >
            {t("replace.selectFile")}
          </label>
        </>
      ) : null}

      {selectedName ? (
        <p className="text-sm">
          {t("replace.selectedFile")}: <span className="font-medium">{selectedName}</span>
        </p>
      ) : null}

      {phase === "uploading" ? (
        <p className="text-sm" role="status">
          {t("replace.uploading")}
          {progress !== null ? ` (${progress}%)` : null}
        </p>
      ) : null}
      {phase === "confirming" ? (
        <p className="text-sm" role="status">
          {t("phases.confirming")}
        </p>
      ) : null}
      {phase === "validating" ? (
        <p className="text-sm" role="status">
          {t("replace.validating")}
        </p>
      ) : null}
      {phase === "validated" ? (
        <div className="space-y-2">
          <p className="text-sm text-green-800" role="status">
            {t("replace.validatedReady")}
          </p>
          <p className="text-xs text-[var(--muted)]">{t("replace.promoteWarning")}</p>
          <button
            type="button"
            className="rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            disabled={busy}
            onClick={() => void promoteReplacement()}
          >
            {busy ? t("replace.promoting") : t("replace.promoteButton")}
          </button>
        </div>
      ) : null}
      {phase === "promoting" ? (
        <p className="text-sm" role="status">
          {t("replace.promoting")}
        </p>
      ) : null}
      {phase === "complete" ? (
        <p className="text-sm text-green-800" role="status">
          {t("replace.complete")}
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {canCancel ? (
        <button
          type="button"
          className="text-sm underline disabled:opacity-50"
          disabled={busy}
          onClick={() => void cancelReplacement()}
        >
          {t("replace.cancel")}
        </button>
      ) : null}

      {phase === "error" || phase === "complete" ? (
        <button type="button" className="text-sm underline" onClick={reset}>
          {t("replace.startOver")}
        </button>
      ) : null}
    </section>
  );
}
