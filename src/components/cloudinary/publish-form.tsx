"use client";

import {useActionState, useMemo, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import {createCloudinaryPublishAction, type CloudinaryActionState} from "@/server/cloudinary/actions";
import type {CloudinaryDeliveryType} from "@/db/schema";
import type {MetadataLanguage} from "@/server/projects/validation";

const initial: CloudinaryActionState = {ok: false};

/** Fixed preset list — mirrors `ALL_TRANSFORMATION_PRESETS` in `server/cloudinary/policy.ts`. Never arbitrary strings. */
const TRANSFORMATION_PRESET_OPTIONS = ["original", "thumbnail", "small", "medium", "large"] as const;
type TransformationPresetOption = (typeof TRANSFORMATION_PRESET_OPTIONS)[number];

export type PublishFormApprovedMetadata = {
  title: string | null;
  altText: string | null;
  caption: string | null;
  description: string | null;
};

export type PublishFormConnectionOption = {
  id: string;
  name: string;
  cloudNameSafe: string | null;
  defaultDeliveryType: CloudinaryDeliveryType;
  publicDeliveryAcknowledgedAt: Date | string | null;
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

/**
 * Publish-to-Cloudinary form. Mirrors `components/webflow/publish-form.tsx`
 * but has no CMS field mapping step — Cloudinary always receives all four
 * approved metadata fields (alt, caption, title, description) as context.
 * `upload` (public) delivery is only offered once the selected connection
 * has acknowledged the public-delivery risk; a warning is always shown when
 * `upload` is the effective delivery type.
 */
export function PublishForm({projectId, imageId, connections, derivatives, approvedMetadataByLanguage}: PublishFormProps) {
  const t = useTranslations("cloudinary.publish");
  const tc = useTranslations("cloudinary");
  const tErr = useTranslations("cloudinary.errors");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(createCloudinaryPublishAction, initial);

  const availableLanguages = Object.keys(approvedMetadataByLanguage) as MetadataLanguage[];
  const [connectionId, setConnectionId] = useState(connections[0]?.id ?? "");
  const selectedConnection = useMemo(
    () => connections.find((c) => c.id === connectionId) ?? null,
    [connections, connectionId],
  );
  const [deliveryType, setDeliveryType] = useState<CloudinaryDeliveryType>(
    connections[0]?.defaultDeliveryType ?? "upload",
  );
  const [language, setLanguage] = useState<MetadataLanguage | "">(availableLanguages[0] ?? "");
  const [filenameMode, setFilenameMode] = useState<"keep" | "suggestion">("keep");
  const [presets, setPresets] = useState<TransformationPresetOption[]>([...TRANSFORMATION_PRESET_OPTIONS]);

  function togglePreset(preset: TransformationPresetOption) {
    setPresets((prev) => (prev.includes(preset) ? prev.filter((p) => p !== preset) : [...prev, preset]));
  }

  function msg(code?: string) {
    if (!code) return null;
    try {
      return tErr(code as "INTERNAL_ERROR");
    } catch {
      return tErr("INTERNAL_ERROR");
    }
  }

  const preview = language ? approvedMetadataByLanguage[language] : undefined;
  const publicNotAcknowledged = deliveryType === "upload" && !selectedConnection?.publicDeliveryAcknowledgedAt;

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
      <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-900">{t("r2SourceOfTruthNote")}</p>
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
        <label htmlFor="cloudinary-publish-connection" className="mb-1.5 block text-sm font-medium">
          {t("connection")}
        </label>
        <select
          id="cloudinary-publish-connection"
          name="connectionId"
          required
          disabled={pending}
          value={connectionId}
          onChange={(e) => {
            const nextId = e.target.value;
            setConnectionId(nextId);
            const next = connections.find((c) => c.id === nextId);
            setDeliveryType(next?.defaultDeliveryType ?? "upload");
          }}
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
        >
          {connections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} {c.cloudNameSafe ? `(${c.cloudNameSafe})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="cloudinary-publish-derivative" className="mb-1.5 block text-sm font-medium">
          {t("derivative")}
        </label>
        <select
          id="cloudinary-publish-derivative"
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
        <label htmlFor="cloudinary-publish-language" className="mb-1.5 block text-sm font-medium">
          {t("language")}
        </label>
        <select
          id="cloudinary-publish-language"
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

      <div>
        <span className="mb-1.5 block text-sm font-medium">{t("deliveryType")}</span>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
            <input
              type="radio"
              name="deliveryType"
              value="upload"
              checked={deliveryType === "upload"}
              onChange={() => setDeliveryType("upload")}
              disabled={pending}
            />
            {tc("deliveryTypeUpload")}
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
            <input
              type="radio"
              name="deliveryType"
              value="signed"
              checked={deliveryType === "signed"}
              onChange={() => setDeliveryType("signed")}
              disabled={pending}
            />
            {tc("deliveryTypeSigned")}
          </label>
        </div>
        {deliveryType === "upload" ? (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {publicNotAcknowledged ? t("publicDeliveryNotAcknowledgedWarning") : t("publicDeliveryWarning")}
          </p>
        ) : null}
      </div>

      <fieldset>
        <legend className="mb-1.5 block text-sm font-medium">{t("transformationPresets")}</legend>
        <p className="mb-2 text-xs text-[var(--muted)]">{t("transformationPresetsHint")}</p>
        <div className="flex flex-wrap gap-2">
          {TRANSFORMATION_PRESET_OPTIONS.map((preset) => (
            <label
              key={preset}
              className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                name="transformationPresets"
                value={preset}
                checked={presets.includes(preset)}
                onChange={() => togglePreset(preset)}
                disabled={pending}
              />
              {tc(`transformationPresetLabels.${preset}` as "transformationPresetLabels.original")}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="rounded-xl border border-[var(--border)] bg-gray-50 p-4">
        <h3 className="text-sm font-semibold">{t("metadataPreview")}</h3>
        {preview ? (
          <dl className="mt-2 space-y-1 text-sm">
            <div>
              <dt className="inline text-[var(--muted)]">{t("previewAlt")}: </dt>
              <dd className="inline">{preview.altText ?? "—"}</dd>
            </div>
            <div>
              <dt className="inline text-[var(--muted)]">{t("previewTitle")}: </dt>
              <dd className="inline">{preview.title ?? "—"}</dd>
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
        disabled={pending || !preview || publicNotAcknowledged}
        className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? t("publishing") : t("confirm")}
      </button>
    </form>
  );
}
