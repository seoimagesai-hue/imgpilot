"use client";

import {useTranslations} from "next-intl";
import {useEffect, useRef, useState} from "react";
import {useRouter} from "@/i18n/navigation";

type Props = {
  projectId: string;
  imageId: string;
  imageName: string;
  open: boolean;
  onClose: () => void;
  onDeleted: (imageId: string) => void;
};

export function ImageDeleteDialog({
  projectId,
  imageId,
  imageName,
  open,
  onClose,
  onDeleted,
}: Props) {
  const t = useTranslations("images");
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (open) setError(null);
  }, [open, imageId]);

  const handleClose = () => {
    if (busy) return;
    onClose();
  };

  async function confirmDelete() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/images/${imageId}/delete`, {
        method: "POST",
      });
      const json = (await res.json()) as {ok: boolean; error?: string; cleanupPending?: boolean};
      if (!json.ok) {
        setError(
          t(`lifecycleErrors.${json.error ?? "IMAGE_NOT_DELETABLE"}` as "lifecycleErrors.IMAGE_NOT_DELETABLE"),
        );
        return;
      }
      onDeleted(imageId);
      onClose();
      router.refresh();
    } catch {
      setError(t("lifecycleErrors.STORAGE_UNAVAILABLE"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="w-[min(28rem,calc(100%-2rem))] rounded-2xl border border-[var(--border)] bg-white p-0 shadow-xl backdrop:bg-black/40"
      onClose={handleClose}
      onCancel={(event) => {
        event.preventDefault();
        handleClose();
      }}
    >
      <div className="space-y-4 p-4">
        <h2 className="text-lg font-semibold">{t("delete.confirmTitle")}</h2>
        <p className="text-sm">{t("delete.confirmBody", {name: imageName})}</p>
        <p className="text-sm font-medium text-red-800">{t("delete.irreversibleWarning")}</p>
        {error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
            disabled={busy}
            onClick={handleClose}
          >
            {t("delete.cancel")}
          </button>
          <button
            type="button"
            className="rounded-xl bg-red-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            disabled={busy}
            onClick={() => void confirmDelete()}
          >
            {busy ? t("delete.deleting") : t("delete.confirmButton")}
          </button>
        </div>
      </div>
    </dialog>
  );
}
