"use client";

import {useLocale, useTranslations} from "next-intl";
import {useActionState} from "react";
import {Link} from "@/i18n/navigation";
import {
  createOrganizationAction,
  type OrgActionState,
} from "@/server/organizations/actions";

const initial: OrgActionState = {ok: false};

export function CreateOrgForm() {
  const t = useTranslations("organizations");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(createOrganizationAction, initial);

  function errorMsg(code?: string) {
    if (!code) return null;
    try {
      return t(`errors.${code}` as "errors.INVALID_REQUEST");
    } catch {
      return t("errors.INVALID_REQUEST");
    }
  }

  return (
    <form
      action={formAction}
      className="mx-auto max-w-xl space-y-4 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm"
      noValidate
    >
      <input type="hidden" name="locale" value={locale} />

      {state.error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {errorMsg(state.error)}
        </div>
      ) : null}

      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
          {t("orgName")}
        </label>
        <input
          id="name"
          name="name"
          required
          minLength={2}
          maxLength={100}
          disabled={pending}
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
        />
      </div>

      <div>
        <label htmlFor="slug" className="mb-1.5 block text-sm font-medium">
          {t("slug")}
        </label>
        <input
          id="slug"
          name="slug"
          maxLength={48}
          disabled={pending}
          placeholder={t("slugOptional")}
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
        />
        <p className="mt-1 text-xs text-[var(--muted)]">{t("slugHint")}</p>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? t("creating") : t("createOrg")}
        </button>
        <Link
          href="/dashboard/projects"
          className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm"
        >
          {t("cancel")}
        </Link>
      </div>
    </form>
  );
}
