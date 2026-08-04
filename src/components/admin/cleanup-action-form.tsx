"use client";

import {useState, useTransition} from "react";
import {ADMIN_CLEANUP_CONFIRM} from "@/server/admin/constants";
import {triggerCleanupAction} from "@/server/admin/actions";

type CleanupActionFormProps = {
  locale: string;
};

export function CleanupActionForm({locale}: CleanupActionFormProps) {
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="rounded-xl border border-[var(--border)] bg-white p-5"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const result = await triggerCleanupAction(locale, confirmation);
          setMessage(result.ok ? "Cleanup job completed." : (result.error ?? "Failed."));
          if (result.ok) setConfirmation("");
        });
      }}
    >
      <h2 className="text-lg font-semibold">Trigger guest cleanup</h2>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Runs reconcile + cleanup batch (same as cron). Type{" "}
        <code className="rounded bg-slate-100 px-1">{ADMIN_CLEANUP_CONFIRM}</code> to confirm.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 text-sm">
          <span className="mb-1 block font-medium">Confirmation</span>
          <input
            type="text"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] px-3 py-2"
            autoComplete="off"
          />
        </label>
        <button
          type="submit"
          disabled={pending || confirmation !== ADMIN_CLEANUP_CONFIRM}
          className="rounded-lg bg-[#0f172a] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Running…" : "Run cleanup"}
        </button>
      </div>
      {message ? <p className="mt-3 text-sm">{message}</p> : null}
    </form>
  );
}
