"use client";

import {useActionState, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import {createWordpressPublishAction, type WordpressActionState} from "@/server/wordpress/actions";
import type {MetadataLanguage} from "@/server/projects/validation";

const initial: WordpressActionState = {ok: false};

export type PublishFormApprovedMetadata = {
  title: string | null;
  altText: string | null;
  caption: string | null;
  description: string | null;
};

export type PublishFormConnectionOption = {
  id: string;
  name: string;
  siteHost: string;
};

export type PublishFormDerivativeOption = {
  id: string;
  label: string;
};

type PublishFormProps = {
  projectId: string;
  imageId: string;
  connections: PublishFormConnectionOption[];
  derivatives: PublishFormDerivativeOption[];
  approvedMetadataByLanguage: Partial<Record<MetadataLanguage, PublishFormApprovedMetadata>>;
};

export function PublishForm({
  projectId,
  imageId,
  connections,
  derivatives,
  approvedMetadataByLanguage,
}: PublishFormProps) {
  const t = useTranslations("wordpress.publish");
  const tErr = useTranslations("wordpress.errors");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(createWordpressPublishAction, initial);

  const availableLanguages = Object.keys(approvedMetadataByLanguage) as MetadataLanguage[];
  const [language, setLanguage] = useState<MetadataLanguage | "">(availableLanguages[0] ?? "");
  const [filenameMode, setFilenameMode] = useState<"keep" | "suggestion">("keep");

  function msg(code?: string) {
    if (!code) return null;
    try {
      return tErr(code as "INTERNAL_ERROR");
    } catch {
      return tErr("INTERNAL_ERROR");
    }
  }

  const preview = language ? approvedMetadataByLanguage[language] : undefined;

  if (connections.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 text-sm text-[var(--muted)] shadow-sm">
        {t("noActiveConnections")}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm" noValidate>
      <h2 className="text-lg font-semibold">{t("title")}</h2>
      <p className="text-sm text-[var(--muted)]">{t("subtitle")}</p>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="imageId" value={imageId} />

      {state.error ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {msg(state.error)}
        </div>
      ) : null}
      {state.ok && state.job ? (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {t("createdNotice")}
        </div>
      ) : null}

      <div>
        <label htmlFor="wp-publish-connection" className="mb-1.5 block text-sm font-medium">
          {t("connection")}
        </label>
        <select
          id="wp-publish-connection"
          name="connectionId"
          required
          disabled={pending}
          defaultValue={connections[0]?.id}
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
        >
          {connections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.siteHost})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="wp-publish-derivative" className="mb-1.5 block text-sm font-medium">
          {t("derivative")}
        </label>
        <select
          id="wp-publish-derivative"
          name="derivativeId"
          disabled={pending}
          defaultValue=""
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
        >
          <option value="">{t("originalOption")}</option>
          {derivatives.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="wp-publish-language" className="mb-1.5 block text-sm font-medium">
          {t("language")}
        </label>
        <select
          id="wp-publish-language"
          name="language"
          required
          disabled={pending || availableLanguages.length === 0}
          value={language}
          onChange={(e) => setLanguage(e.target.value as MetadataLanguage)}
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
        >
          {availableLanguages.length === 0 ? <option value="">—</option> : null}
          {availableLanguages.map((lang) => (
            <option key={lang} value={lang}>
              {lang.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-medium">{t("filenameMode")}</span>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
            <input
              type="radio"
              name="filenameMode"
              value="keep"
              checked={filenameMode === "keep"}
              onChange={() => setFilenameMode("keep")}
              disabled={pending}
            />
            {t("filenameModeKeep")}
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
            <input
              type="radio"
              name="filenameMode"
              value="suggestion"
              checked={filenameMode === "suggestion"}
              onChange={() => setFilenameMode("suggestion")}
              disabled={pending}
            />
            {t("filenameModeSuggestion")}
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-gray-50 p-4">
        <h3 className="text-sm font-semibold">{t("metadataPreview")}</h3>
        {preview ? (
          <dl className="mt-2 space-y-1 text-sm">
            <div>
              <dt className="inline text-[var(--muted)]">{t("previewTitle")}: </dt>
              <dd className="inline">{preview.title ?? "—"}</dd>
            </div>
            <div>
              <dt className="inline text-[var(--muted)]">{t("previewAlt")}: </dt>
              <dd className="inline">{preview.altText ?? "—"}</dd>
            </div>
            <div>
              <dt className="inline text-[var(--muted)]">{t("previewCaption")}: </dt>
              <dd className="inline">{preview.caption ?? "—"}</dd>
            </div>
            <div>
              <dt className="inline text-[var(--muted)]">{t("previewDescription")}: </dt>
              <dd className="inline">{preview.description ?? "—"}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-2 text-sm text-[var(--muted)]">{t("noApprovedMetadata")}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending || !preview}
        className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? t("publishing") : t("confirm")}
      </button>
    </form>
  );
}
