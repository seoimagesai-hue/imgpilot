"use client";

import {useState, useTransition} from "react";
import {
  ADMIN_RESTORE_CONFIRM,
  ADMIN_SUSPEND_CONFIRM,
} from "@/server/admin/constants";
import {
  restoreUserAction,
  suspendUserAction,
} from "@/server/admin/actions";

type UserActionFormProps = {
  locale: string;
  userId: string;
  accountStatus: "active" | "suspended";
};

export function UserActionForm({locale, userId, accountStatus}: UserActionFormProps) {
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isSuspend = accountStatus === "active";
  const expectedConfirm = isSuspend ? ADMIN_SUSPEND_CONFIRM : ADMIN_RESTORE_CONFIRM;

  return (
    <form
      className="rounded-xl border border-[var(--border)] bg-white p-5"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const result = isSuspend
            ? await suspendUserAction(locale, userId, reason, confirmation)
            : await restoreUserAction(locale, userId, reason, confirmation);
          setMessage(result.ok ? "Saved." : (result.error ?? "Failed."));
          if (result.ok) {
            setReason("");
            setConfirmation("");
          }
        });
      }}
    >
      <h2 className="text-lg font-semibold">{isSuspend ? "Suspend user" : "Restore user"}</h2>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Type <code className="rounded bg-slate-100 px-1">{expectedConfirm}</code> and provide a
        reason. All changes are audit-logged.
      </p>
      <div className="mt-4 space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Reason</span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-[var(--border)] px-3 py-2"
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Confirmation</span>
          <input
            type="text"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] px-3 py-2"
            autoComplete="off"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={pending || confirmation !== expectedConfirm || !reason.trim()}
        className={`mt-4 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
          isSuspend ? "bg-red-700 hover:bg-red-800" : "bg-emerald-700 hover:bg-emerald-800"
        }`}
      >
        {pending ? "Saving…" : isSuspend ? "Suspend account" : "Restore account"}
      </button>
      {message ? <p className="mt-3 text-sm">{message}</p> : null}
    </form>
  );
}
