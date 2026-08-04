"use client";

import {useActionState, useMemo, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import {createWebflowPublishAction, type WebflowActionState} from "@/server/webflow/actions";
import type {MetadataLanguage} from "@/server/projects/validation";
import {CmsItemSearch, type WebflowCmsItemOption} from "@/components/webflow/cms-item-search";

const initial: WebflowActionState = {ok: false};

export type PublishFormApprovedMetadata = {
  title: string | null;
  altText: string | null;
  caption: string | null;
  description: string | null;
};

export type PublishFormConnectionOption = {
  id: string;
  name: string;
  siteLabel: string | null;
};

export type PublishFormMappingOption = {
  id: string;
  connectionId: string;
  collectionId: string;
  collectionNameSafe: string | null;
  hasAltField: boolean;
  hasTitleField: boolean;
  hasCaptionField: boolean;
  hasDescriptionField: boolean;
  isStale: boolean;
};

export type PublishFormDerivativeOption = {
  id: string;
  label: string;
};

type PublishFormProps = {
  projectId: string;
  imageId: string;
  workspaceType: "personal" | "organization";
  workspaceId: string;
  connections: PublishFormConnectionOption[];
  mappings: PublishFormMappingOption[];
  derivatives: PublishFormDerivativeOption[];
  approvedMetadataByLanguage: Partial<Record<MetadataLanguage, PublishFormApprovedMetadata>>;
};

export function PublishForm({
  projectId,
  imageId,
  workspaceType,
  workspaceId,
  connections,
  mappings,
  derivatives,
  approvedMetadataByLanguage,
}: PublishFormProps) {
  const t = useTranslations("webflow.publish");
  const tErr = useTranslations("webflow.errors");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(createWebflowPublishAction, initial);

  const availableLanguages = Object.keys(approvedMetadataByLanguage) as MetadataLanguage[];
  const [connectionId, setConnectionId] = useState(connections[0]?.id ?? "");
  const connectionMappings = useMemo(
    () => mappings.filter((m) => m.connectionId === connectionId),
    [mappings, connectionId],
  );
  const [fieldMappingId, setFieldMappingId] = useState(connectionMappings[0]?.id ?? "");
  const [selectedItem, setSelectedItem] = useState<WebflowCmsItemOption | null>(null);
  const [language, setLanguage] = useState<MetadataLanguage | "">(availableLanguages[0] ?? "");
  const [filenameMode, setFilenameMode] = useState<"keep" | "suggestion">("keep");

  const selectedMapping = mappings.find((m) => m.id === fieldMappingId) ?? null;

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
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{t("scopeNote")}</p>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="imageId" value={imageId} />
      <input type="hidden" name="collectionId" value={selectedMapping?.collectionId ?? ""} />
      <input type="hidden" name="cmsItemId" value={selectedItem?.id ?? ""} />
      <input type="hidden" name="cmsItemNameSafe" value={selectedItem?.title ?? ""} />

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
        <label htmlFor="webflow-publish-connection" className="mb-1.5 block text-sm font-medium">
          {t("connection")}
        </label>
        <select
          id="webflow-publish-connection"
          name="connectionId"
          required
          disabled={pending}
          value={connectionId}
          onChange={(e) => {
            const nextConnectionId = e.target.value;
            setConnectionId(nextConnectionId);
            const nextMapping = mappings.find((m) => m.connectionId === nextConnectionId);
            setFieldMappingId(nextMapping?.id ?? "");
            setSelectedItem(null);
          }}
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
        >
          {connections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} {c.siteLabel ? `(${c.siteLabel})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="webflow-publish-mapping" className="mb-1.5 block text-sm font-medium">
          {t("collectionMapping")}
        </label>
        <select
          id="webflow-publish-mapping"
          name="fieldMappingId"
          required
          disabled={pending || connectionMappings.length === 0}
          value={fieldMappingId}
          onChange={(e) => {
            setFieldMappingId(e.target.value);
            setSelectedItem(null);
          }}
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
        >
          {connectionMappings.length === 0 ? <option value="">{t("noMappings")}</option> : null}
          {connectionMappings.map((m) => (
            <option key={m.id} value={m.id}>
              {(m.collectionNameSafe || m.collectionId) + (m.isStale ? ` — ${t("mappingStale")}` : "")}
            </option>
          ))}
        </select>
        {connectionMappings.length === 0 ? (
          <p className="mt-1 text-xs text-amber-700">{t("createMappingHint")}</p>
        ) : null}
      </div>

      {selectedMapping ? (
        <CmsItemSearch
          connectionId={connectionId}
          collectionId={selectedMapping.collectionId}
          workspaceType={workspaceType}
          workspaceId={workspaceId}
          selected={selectedItem}
          onSelect={setSelectedItem}
          disabled={pending}
        />
      ) : null}

      <div>
        <label htmlFor="webflow-publish-derivative" className="mb-1.5 block text-sm font-medium">
          {t("derivative")}
        </label>
        <select
          id="webflow-publish-derivative"
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
        <p className="mt-1 text-xs text-[var(--muted)]">{t("assetSizeNote")}</p>
      </div>

      <div>
        <label htmlFor="webflow-publish-language" className="mb-1.5 block text-sm font-medium">
          {t("language")}
        </label>
        <select
          id="webflow-publish-language"
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
        {preview && selectedMapping ? (
          <dl className="mt-2 space-y-1 text-sm">
            <div>
              <dt className="inline text-[var(--muted)]">{t("previewImage")}: </dt>
              <dd className="inline">{t("previewImageValue")}</dd>
            </div>
            <div>
              <dt className="inline text-[var(--muted)]">{t("previewAlt")}: </dt>
              <dd className="inline">{selectedMapping.hasAltField ? preview.altText ?? "—" : t("fieldNotMapped")}</dd>
            </div>
            <div>
              <dt className="inline text-[var(--muted)]">{t("previewTitle")}: </dt>
              <dd className="inline">{selectedMapping.hasTitleField ? preview.title ?? "—" : t("fieldNotMapped")}</dd>
            </div>
            <div>
              <dt className="inline text-[var(--muted)]">{t("previewCaption")}: </dt>
              <dd className="inline">{selectedMapping.hasCaptionField ? preview.caption ?? "—" : t("fieldNotMapped")}</dd>
            </div>
            <div>
              <dt className="inline text-[var(--muted)]">{t("previewDescription")}: </dt>
              <dd className="inline">
                {selectedMapping.hasDescriptionField ? preview.description ?? "—" : t("fieldNotMapped")}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-2 text-sm text-[var(--muted)]">{t("noApprovedMetadata")}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending || !preview || !selectedItem || !selectedMapping}
        className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? t("publishing") : t("confirm")}
      </button>
    </form>
  );
}
