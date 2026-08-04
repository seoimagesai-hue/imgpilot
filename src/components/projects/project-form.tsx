"use client";

import {useLocale, useTranslations} from "next-intl";
import {useActionState} from "react";
import {Link} from "@/i18n/navigation";
import {
  createProjectAction,
  updateProjectAction,
  type ProjectActionState,
} from "@/server/projects/actions";
import type {MetadataLanguage} from "@/server/projects/validation";

const initial: ProjectActionState = {ok: false};

type ProjectFormProps = {
  mode: "create" | "edit";
  projectId?: string;
  organizationId?: string;
  defaults?: {
    name: string;
    websiteUrl: string;
    description: string;
    metadataLanguage: MetadataLanguage;
  };
};

export function ProjectForm({mode, projectId, organizationId, defaults}: ProjectFormProps) {
  const t = useTranslations("projects");
  const locale = useLocale();
  const action = mode === "create" ? createProjectAction : updateProjectAction;
  const [state, formAction, pending] = useActionState(action, initial);

  function msg(code?: string) {
    if (!code) return null;
    try {
      return t(`errors.${code}` as "errors.genericFailure");
    } catch {
      return t("errors.genericFailure");
    }
  }

  return (
    <form action={formAction} className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm" noValidate>
      <input type="hidden" name="locale" value={locale} />
      {projectId ? <input type="hidden" name="projectId" value={projectId} /> : null}
      {organizationId && mode === "create" ? (
        <input type="hidden" name="organizationId" value={organizationId} />
      ) : null}

      {state.error && !state.fieldErrors ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {msg(state.error)}
        </div>
      ) : null}

      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
          {t("name")}
        </label>
        <input
          id="name"
          name="name"
          required
          minLength={2}
          maxLength={100}
          disabled={pending}
          defaultValue={defaults?.name}
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
        />
        {state.fieldErrors?.name ? <p className="mt-1 text-sm text-red-700">{msg(state.fieldErrors.name)}</p> : null}
      </div>

      <div>
        <label htmlFor="websiteUrl" className="mb-1.5 block text-sm font-medium">
          {t("websiteUrl")}
        </label>
        <input
          id="websiteUrl"
          name="websiteUrl"
          type="text"
          inputMode="url"
          disabled={pending}
          placeholder="https://"
          defaultValue={defaults?.websiteUrl}
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
        />
        <p className="mt-1 text-xs text-[var(--muted)]">{t("websiteUrlHint")}</p>
        {state.fieldErrors?.websiteUrl ? (
          <p className="mt-1 text-sm text-red-700">{msg(state.fieldErrors.websiteUrl)}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="description" className="mb-1.5 block text-sm font-medium">
          {t("description")}
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          maxLength={2000}
          disabled={pending}
          defaultValue={defaults?.description}
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
        />
        {state.fieldErrors?.description ? (
          <p className="mt-1 text-sm text-red-700">{msg(state.fieldErrors.description)}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="metadataLanguage" className="mb-1.5 block text-sm font-medium">
          {t("metadataLanguage")}
        </label>
        <select
          id="metadataLanguage"
          name="metadataLanguage"
          required
          disabled={pending}
          defaultValue={defaults?.metadataLanguage ?? "en"}
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
        >
          <option value="en">{t("langEnglish")}</option>
          <option value="ur">{t("langUrdu")}</option>
        </select>
        <p className="mt-1 text-xs text-[var(--muted)]">{t("metadataLanguageHint")}</p>
        {state.fieldErrors?.metadataLanguage ? (
          <p className="mt-1 text-sm text-red-700">{msg(state.fieldErrors.metadataLanguage)}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? t("saving") : mode === "create" ? t("create") : t("saveChanges")}
        </button>
        <Link
          href={projectId ? `/dashboard/projects/${projectId}` : "/dashboard/projects"}
          className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm"
        >
          {t("cancel")}
        </Link>
      </div>
    </form>
  );
}
