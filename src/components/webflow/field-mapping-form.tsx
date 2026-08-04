"use client";

import {useActionState, useEffect, useRef, useState} from "react";
import {useFormatter, useLocale, useTranslations} from "next-intl";
import {
  getWebflowCollectionAction,
  listWebflowCollectionsAction,
  upsertWebflowFieldMappingAction,
  type WebflowActionState,
} from "@/server/webflow/actions";
import type {WebflowCollectionField} from "@/server/webflow/client";
import type {WebflowFieldMappingSafeDto} from "@/server/webflow/field-mappings";

const initial: WebflowActionState = {ok: false};

const IMAGE_FIELD_TYPES = new Set(["Image", "ImageRef"]);
const TEXT_FIELD_TYPES = new Set(["PlainText", "RichText"]);

type FieldMappingFormProps = {
  connectionId: string;
  workspaceType: "personal" | "organization";
  workspaceId: string;
  hasSite: boolean;
  existingMappings: WebflowFieldMappingSafeDto[];
};

function fieldLabel(field: WebflowCollectionField): string {
  return field.displayNameSafe || field.slug || field.id;
}

export function FieldMappingForm({
  connectionId,
  workspaceType,
  workspaceId,
  hasSite,
  existingMappings,
}: FieldMappingFormProps) {
  const t = useTranslations("webflow.fieldMapping");
  const tErr = useTranslations("webflow.errors");
  const format = useFormatter();
  const locale = useLocale();

  const [collectionsState, loadCollectionsAction, collectionsPending] = useActionState(
    listWebflowCollectionsAction,
    initial,
  );
  const [collectionState, loadFieldsAction, fieldsPending] = useActionState(getWebflowCollectionAction, initial);
  const [saveState, saveAction, savePending] = useActionState(upsertWebflowFieldMappingAction, initial);

  const [collectionId, setCollectionId] = useState("");
  const [imageFieldId, setImageFieldId] = useState("");
  const [altFieldId, setAltFieldId] = useState("");
  const [titleFieldId, setTitleFieldId] = useState("");
  const [captionFieldId, setCaptionFieldId] = useState("");
  const [descriptionFieldId, setDescriptionFieldId] = useState("");
  const loadedOnce = useRef(false);
  const prefilledFor = useRef<string>("");

  useEffect(() => {
    if (!hasSite || loadedOnce.current) return;
    loadedOnce.current = true;
    const formData = new FormData();
    formData.set("connectionId", connectionId);
    formData.set("workspaceType", workspaceType);
    formData.set("workspaceId", workspaceId);
    loadCollectionsAction(formData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSite, connectionId]);

  function msg(code?: string) {
    if (!code) return null;
    try {
      return tErr(code as "INTERNAL_ERROR");
    } catch {
      return tErr("INTERNAL_ERROR");
    }
  }

  function handleDiscoverFields() {
    if (!collectionId) return;
    const formData = new FormData();
    formData.set("connectionId", connectionId);
    formData.set("collectionId", collectionId);
    formData.set("workspaceType", workspaceType);
    formData.set("workspaceId", workspaceId);
    loadFieldsAction(formData);
  }

  const fields = collectionState.ok ? collectionState.collection?.fields ?? [] : [];
  const imageFields = fields.filter((f) => IMAGE_FIELD_TYPES.has(f.type));
  const textFields = fields.filter((f) => TEXT_FIELD_TYPES.has(f.type));

  useEffect(() => {
    if (!collectionState.ok || !collectionState.collection) return;
    if (prefilledFor.current === collectionState.collection.collectionId) return;
    prefilledFor.current = collectionState.collection.collectionId;
    const existing = existingMappings.find((m) => m.collectionId === collectionState.collection?.collectionId);
    setImageFieldId(existing?.imageFieldId ?? "");
    setAltFieldId(existing?.altFieldId ?? "");
    setTitleFieldId(existing?.titleFieldId ?? "");
    setCaptionFieldId(existing?.captionFieldId ?? "");
    setDescriptionFieldId(existing?.descriptionFieldId ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionState.ok, collectionState.collection]);

  if (!hasSite) {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">{t("selectSiteFirst")}</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">{t("title")}</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">{t("hint")}</p>

      <div className="mt-4">
        <label htmlFor="webflow-mapping-collection" className="mb-1.5 block text-sm font-medium">
          {t("collection")}
        </label>
        {collectionsState.error ? (
          <p role="alert" className="mb-2 text-sm text-red-700">
            {msg(collectionsState.error)}
          </p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            id="webflow-mapping-collection"
            value={collectionId}
            onChange={(e) => setCollectionId(e.target.value)}
            disabled={collectionsPending}
            className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm"
          >
            <option value="">{collectionsPending ? t("loadingCollections") : t("collectionPlaceholder")}</option>
            {(collectionsState.collections ?? []).map((c) => (
              <option key={c.collectionId} value={c.collectionId}>
                {c.displayNameSafe || c.collectionId}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleDiscoverFields}
            disabled={!collectionId || fieldsPending}
            className="shrink-0 rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
          >
            {fieldsPending ? t("discoveringFields") : t("discoverFields")}
          </button>
        </div>
        {collectionState.error ? (
          <p role="alert" className="mt-2 text-sm text-red-700">
            {msg(collectionState.error)}
          </p>
        ) : null}
      </div>

      {fields.length > 0 ? (
        <form action={saveAction} className="mt-5 space-y-4" noValidate>
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="workspaceType" value={workspaceType} />
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <input type="hidden" name="connectionId" value={connectionId} />
          <input type="hidden" name="collectionId" value={collectionId} />

          {saveState.error ? (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {msg(saveState.error)}
            </div>
          ) : null}
          {saveState.ok && saveState.fieldMapping ? (
            <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {t("saveSuccess")}
            </div>
          ) : null}

          <div>
            <label htmlFor="webflow-mapping-image" className="mb-1.5 block text-sm font-medium">
              {t("imageField")}
            </label>
            <select
              id="webflow-mapping-image"
              name="imageFieldId"
              required
              value={imageFieldId}
              onChange={(e) => setImageFieldId(e.target.value)}
              disabled={savePending}
              className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm"
            >
              <option value="">{t("selectField")}</option>
              {imageFields.map((f) => (
                <option key={f.id} value={f.id}>
                  {fieldLabel(f)}
                </option>
              ))}
            </select>
            {imageFields.length === 0 ? (
              <p className="mt-1 text-xs text-amber-700">{t("noImageFields")}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="webflow-mapping-alt" className="mb-1.5 block text-sm font-medium">
                {t("altField")}
              </label>
              <select
                id="webflow-mapping-alt"
                name="altFieldId"
                value={altFieldId}
                onChange={(e) => setAltFieldId(e.target.value)}
                disabled={savePending}
                className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm"
              >
                <option value="">{t("noneOption")}</option>
                {textFields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {fieldLabel(f)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="webflow-mapping-title" className="mb-1.5 block text-sm font-medium">
                {t("titleField")}
              </label>
              <select
                id="webflow-mapping-title"
                name="titleFieldId"
                value={titleFieldId}
                onChange={(e) => setTitleFieldId(e.target.value)}
                disabled={savePending}
                className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm"
              >
                <option value="">{t("noneOption")}</option>
                {textFields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {fieldLabel(f)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="webflow-mapping-caption" className="mb-1.5 block text-sm font-medium">
                {t("captionField")}
              </label>
              <select
                id="webflow-mapping-caption"
                name="captionFieldId"
                value={captionFieldId}
                onChange={(e) => setCaptionFieldId(e.target.value)}
                disabled={savePending}
                className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm"
              >
                <option value="">{t("noneOption")}</option>
                {textFields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {fieldLabel(f)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="webflow-mapping-description" className="mb-1.5 block text-sm font-medium">
                {t("descriptionField")}
              </label>
              <select
                id="webflow-mapping-description"
                name="descriptionFieldId"
                value={descriptionFieldId}
                onChange={(e) => setDescriptionFieldId(e.target.value)}
                disabled={savePending}
                className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm"
              >
                <option value="">{t("noneOption")}</option>
                {textFields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {fieldLabel(f)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={savePending || !imageFieldId}
            className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {savePending ? t("saving") : t("save")}
          </button>
        </form>
      ) : null}

      {existingMappings.length > 0 ? (
        <div className="mt-6 border-t border-[var(--border)] pt-4">
          <h3 className="text-sm font-semibold">{t("existingTitle")}</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {existingMappings.map((m) => (
              <li key={m.id} className="rounded-xl border border-[var(--border)] px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{m.collectionNameSafe || m.collectionId}</span>
                  {m.staleAt ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      {t("stale")}
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                      {t("current")}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {t("mappingVersion")}: {m.mappingVersion} ·{" "}
                  {format.dateTime(new Date(m.updatedAt), {dateStyle: "medium", timeStyle: "short", timeZone: "UTC"})}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
