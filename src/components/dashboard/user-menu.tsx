"use client";

import {useLocale} from "next-intl";
import {useTransition} from "react";
import {logoutAction} from "@/server/auth/actions";

type UserMenuProps = {
  name?: string | null;
  email?: string | null;
  signedInLabel: string;
  signOutLabel: string;
};

export function UserMenu({name, email, signedInLabel, signOutLabel}: UserMenuProps) {
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const display = name || email || "";

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm">
      <div className="min-w-0">
        <p className="text-[var(--muted)]">{signedInLabel}</p>
        <p className="truncate font-medium">{display}</p>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            await logoutAction(locale);
          });
        }}
        className="rounded-lg border border-[var(--border)] px-3 py-1.5 disabled:opacity-60"
      >
        {signOutLabel}
      </button>
    </div>
  );
}
