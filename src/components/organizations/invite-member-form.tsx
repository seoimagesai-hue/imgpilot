"use client";

import {useLocale, useTranslations} from "next-intl";
import {useActionState, useEffect, useState} from "react";
import {
  inviteMemberAction,
  type OrgActionState,
} from "@/server/organizations/actions";

const initial: OrgActionState = {ok: false};

type InviteMemberFormProps = {
  slug: string;
};

export function InviteMemberForm({slug}: InviteMemberFormProps) {
  const t = useTranslations("organizations");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(inviteMemberAction, initial);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCopied(false);
  }, [state.inviteLink]);

  function errorMsg(code?: string) {
    if (!code) return null;
    try {
      return t(`errors.${code}` as "errors.INVALID_REQUEST");
    } catch {
      return t("errors.INVALID_REQUEST");
    }
  }

  async function copyLink() {
    if (!state.inviteLink || typeof window === "undefined") return;
    const absolute = new URL(state.inviteLink, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">{t("invite")}</h2>
      <p className="text-sm text-[var(--muted)]">{t("inviteEmailHint")}</p>

      <form action={formAction} className="space-y-4" noValidate>
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="slug" value={slug} />

        {state.error ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          >
            {errorMsg(state.error)}
          </div>
        ) : null}

        <div>
          <label htmlFor="invite-email" className="mb-1.5 block text-sm font-medium">
            {t("inviteEmail")}
          </label>
          <input
            id="invite-email"
            name="email"
            type="email"
            required
            disabled={pending}
            className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
          />
        </div>

        <div>
          <label htmlFor="invite-role" className="mb-1.5 block text-sm font-medium">
            {t("role")}
          </label>
          <select
            id="invite-role"
            name="role"
            disabled={pending}
            defaultValue="viewer"
            className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
          >
            <option value="admin">{t("admin")}</option>
            <option value="editor">{t("editor")}</option>
            <option value="viewer">{t("viewer")}</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? t("inviting") : t("invite")}
        </button>
      </form>

      {state.ok && state.inviteLink ? (
        <div
          role="status"
          className="space-y-2 rounded-xl border border-[var(--border)] bg-gray-50 p-4"
        >
          <p className="text-sm font-medium">{t("copyInviteLink")}</p>
          <p className="break-all text-xs text-[var(--muted)]">{state.inviteLink}</p>
          <button
            type="button"
            onClick={copyLink}
            className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
          >
            {copied ? t("copied") : t("copyInviteLink")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
