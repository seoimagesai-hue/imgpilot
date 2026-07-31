"use client";

import {useTranslations} from "next-intl";
import {useRouter} from "@/i18n/navigation";
import {useState} from "react";

type Props = {
  projectId: string;
  imageId: string;
};

export function RetryValidationButton({projectId, imageId}: Props) {
  const t = useTranslations("images");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onRetry() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/images/${imageId}/validate`, {
        method: "POST",
      });
      const json = (await res.json()) as {ok: boolean; error?: string};
      if (!json.ok) {
        setError(t(`validationErrors.${json.error ?? "DECODE_FAILED"}` as "validationErrors.DECODE_FAILED"));
        return;
      }
      router.refresh();
    } catch {
      setError(t("validationErrors.VALIDATION_UNAVAILABLE"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        className="text-sm underline disabled:opacity-50"
        disabled={busy}
        onClick={() => void onRetry()}
      >
        {busy ? t("phases.validating") : t("retryValidation")}
      </button>
      {error ? (
        <p className="text-xs text-red-700" role="status">
          {error}
        </p>
      ) : null}
    </div>
  );
}
