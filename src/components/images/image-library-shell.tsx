"use client";

import {useLocale, useTranslations} from "next-intl";
import {useCallback, useEffect, useId, useMemo, useRef, useState} from "react";
import {useRouter} from "@/i18n/navigation";
import {formatByteSize} from "@/lib/format-bytes";
import {formatDimensions, formatPixelCount} from "@/lib/format-image-meta";
import {libraryHref, type LibraryQuery} from "@/server/images/library-query";
import type {LibraryStatusCounts} from "@/server/images/library-queries";
import {RetryValidationButton} from "@/components/images/retry-validation-button";
import {ImageDeleteDialog} from "@/components/images/image-delete-dialog";
import {ImageReplacePanel} from "@/components/images/image-replace-panel";

export type ClientLibraryImage = {
  id: string;
  originalFilename: string;
  mimeType: string;
  detectedMimeType: string | null;
  detectedFormat: string | null;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  pixelCount: number | null;
  status: string;
  isAnimated: boolean | null;
  frameCount: number | null;
  orientation: number | null;
  failureCode: string | null;
  uploadedAt: string | null;
  validatedAt: string | null;
  createdAt: string;
  previewUrl: string | null;
  previewExpiresAt: string | null;
  colourSpace?: string | null;
  hasAlpha?: boolean | null;
  validationVersion?: string | null;
  validationAttempts?: number;
};

type Props = {
  projectId: string;
  query: LibraryQuery;
  items: ClientLibraryImage[];
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
  statusCounts: LibraryStatusCounts;
  emptyKind: "no_images" | "no_validated" | "no_filter" | "no_search";
};

const DELETABLE_STATUSES = new Set([
  "pending_upload",
  "uploaded",
  "upload_failed",
  "validating",
  "validated",
  "validation_failed",
  "ready_for_processing",
]);

const REPLACEABLE_STATUSES = new Set(["validated", "validation_failed", "ready_for_processing"]);
const PREVIEWABLE_STATUSES = new Set(["validated", "ready_for_processing"]);

function PreviewThumb({
  image,
  className,
}: {
  image: ClientLibraryImage;
  className?: string;
}) {
  const t = useTranslations("images");
  const [failed, setFailed] = useState(false);
  const previewable = PREVIEWABLE_STATUSES.has(image.status);

  if (!previewable || !image.previewUrl || failed || image.isAnimated) {
    return (
      <div
        className={`flex items-center justify-center bg-[var(--accent-soft)] text-xs text-[var(--muted)] ${className ?? ""}`}
        aria-hidden={false}
      >
        {image.isAnimated && previewable
          ? t("animated")
          : previewable
            ? t("previewUnavailable")
            : t("privatePreviewUnavailable")}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image.previewUrl}
      alt={image.originalFilename}
      loading="lazy"
      className={`object-cover ${className ?? ""}`}
      onError={() => setFailed(true)}
    />
  );
}

export function ImageLibraryShell({
  projectId,
  query,
  items,
  totalCount,
  totalPages,
  page,
  pageSize,
  statusCounts,
  emptyKind,
}: Props) {
  const t = useTranslations("images");
  const locale = useLocale();
  const router = useRouter();
  const searchId = useId();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<ClientLibraryImage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClientLibraryImage | null>(null);
  const [searchDraft, setSearchDraft] = useState(query.q);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    setSelected(new Set());
  }, [query.page, query.status, query.q, query.sort, query.pageSize]);

  useEffect(() => {
    setSearchDraft(query.q);
  }, [query.q]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (detail) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [detail]);

  const pageIds = useMemo(() => items.map((i) => i.id), [items]);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someSelected = pageIds.some((id) => selected.has(id)) && !allSelected;

  const navigate = useCallback(
    (overrides: Partial<LibraryQuery>) => {
      router.push(libraryHref(projectId, query, overrides));
    },
    [projectId, query, router],
  );

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectPage = () => setSelected(new Set(pageIds));
  const clearSelection = () => setSelected(new Set());

  const openDetails = (image: ClientLibraryImage, button: HTMLButtonElement | null) => {
    triggerRef.current = button;
    setDetail(image);
  };

  const closeDetails = () => {
    setDetail(null);
    queueMicrotask(() => triggerRef.current?.focus());
  };

  const handleDeleted = (imageId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(imageId);
      return next;
    });
    if (detail?.id === imageId) setDetail(null);
  };

  const statusFilters = [
    "all",
    "ready_for_processing",
    "validated",
    "validating",
    "uploaded",
    "validation_failed",
    "pending_upload",
    "upload_failed",
    "deleting",
    "deleted",
    "replacement",
  ] as const;

  const countFor = (status: (typeof statusFilters)[number]) => {
    if (status === "all") return statusCounts.total;
    return statusCounts[status];
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 text-sm">
        <div className="rounded-xl border border-[var(--border)] bg-white px-3 py-2">
          {t("summaryTotal")}: {statusCounts.total}
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white px-3 py-2">
          {t("filter.ready_for_processing")}: {statusCounts.ready_for_processing}
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white px-3 py-2">
          {t("filter.validated")}: {statusCounts.validated}
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white px-3 py-2">
          {t("awaitingValidation")}: {statusCounts.uploaded + statusCounts.validating}
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white px-3 py-2">
          {t("filter.validation_failed")}: {statusCounts.validation_failed}
        </div>
      </div>

      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          navigate({q: searchDraft.trim(), page: 1});
        }}
      >
        <div className="min-w-[12rem] flex-1">
          <label htmlFor={searchId} className="mb-1 block text-sm text-[var(--muted)]">
            {t("searchByFilename")}
          </label>
          <input
            id={searchId}
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            maxLength={100}
            className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
            placeholder={t("searchImages")}
          />
        </div>
        <button type="submit" className="rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white">
          {t("searchImages")}
        </button>
        {query.q ? (
          <button
            type="button"
            className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
            onClick={() => navigate({q: "", page: 1})}
          >
            {t("clearSearch")}
          </button>
        ) : null}
      </form>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-[var(--muted)]">
          {t("sortImages")}
          <select
            className="ms-2 rounded-lg border border-[var(--border)] bg-white px-2 py-1.5"
            value={query.sort}
            onChange={(event) =>
              navigate({sort: event.target.value as LibraryQuery["sort"], page: 1})
            }
            aria-label={t("sortImages")}
          >
            <option value="newest">{t("sort.newest")}</option>
            <option value="oldest">{t("sort.oldest")}</option>
            <option value="filename_asc">{t("sort.filename_asc")}</option>
            <option value="filename_desc">{t("sort.filename_desc")}</option>
            <option value="size_desc">{t("sort.size_desc")}</option>
            <option value="size_asc">{t("sort.size_asc")}</option>
            <option value="dimensions_desc">{t("sort.dimensions_desc")}</option>
          </select>
        </label>

        <div className="flex gap-1" role="group" aria-label={t("viewToggle")}>
          <button
            type="button"
            aria-pressed={query.view === "grid"}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              query.view === "grid"
                ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                : "border-[var(--border)] bg-white"
            }`}
            onClick={() => navigate({view: "grid"})}
          >
            {t("gridView")}
          </button>
          <button
            type="button"
            aria-pressed={query.view === "table"}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              query.view === "table"
                ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                : "border-[var(--border)] bg-white"
            }`}
            onClick={() => navigate({view: "table"})}
          >
            {t("tableView")}
          </button>
        </div>

        <label className="text-sm text-[var(--muted)]">
          {t("imagesPerPage")}
          <select
            className="ms-2 rounded-lg border border-[var(--border)] bg-white px-2 py-1.5"
            value={query.pageSize}
            onChange={(event) =>
              navigate({pageSize: Number(event.target.value), page: 1})
            }
          >
            <option value={12}>12</option>
            <option value={24}>24</option>
            <option value={48}>48</option>
          </select>
        </label>
      </div>

      <nav className="flex flex-wrap gap-2 text-sm" aria-label={t("filterByStatus")}>
        {statusFilters.map((value) => (
          <button
            key={value}
            type="button"
            className={`rounded-full border px-3 py-1 ${
              query.status === value
                ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                : "border-[var(--border)] bg-white"
            }`}
            aria-pressed={query.status === value}
            onClick={() => navigate({status: value, page: 1})}
          >
            {t(`filter.${value}`)} ({countFor(value)})
          </button>
        ))}
        {query.status !== "ready_for_processing" || query.q ? (
          <button
            type="button"
            className="rounded-full border border-[var(--border)] px-3 py-1 underline"
            onClick={() => navigate({status: "ready_for_processing", q: "", page: 1})}
          >
            {t("clearFilters")}
          </button>
        ) : null}
      </nav>

      {selected.size > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--accent-soft)]/50 px-3 py-2 text-sm">
          <span>{t("selectedImages", {count: selected.size})}</span>
          <button type="button" className="underline" onClick={clearSelection}>
            {t("clearSelection")}
          </button>
        </div>
      ) : null}

      {totalCount === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white p-8 text-center">
          <h3 className="font-medium">
            {emptyKind === "no_search"
              ? t("noMatchingImages")
              : emptyKind === "no_filter"
                ? t("noMatchingImages")
                : emptyKind === "no_validated"
                  ? t("noValidatedImages")
                  : t("noImagesUploaded")}
          </h3>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {emptyKind === "no_images" ? t("emptyText") : t("tryAdjustingFilters")}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {emptyKind === "no_images" ? (
              <button
                type="button"
                className="rounded-xl bg-[var(--accent)] px-3 py-2 text-sm text-white"
                onClick={() => router.push(`/dashboard/projects/${projectId}/images/upload`)}
              >
                {t("uploadImages")}
              </button>
            ) : (
              <button
                type="button"
                className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
                onClick={() => navigate({status: "all", q: "", page: 1})}
              >
                {t("viewAllStatuses")}
              </button>
            )}
          </div>
        </div>
      ) : query.view === "grid" ? (
        <div className="space-y-3">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected;
              }}
              onChange={() => (allSelected ? clearSelection() : selectPage())}
            />
            {t("selectAllOnPage")}
          </label>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((image) => (
              <li
                key={image.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-white"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <PreviewThumb image={image} className="h-full w-full" />
                  <label className="absolute start-2 top-2 inline-flex items-center gap-1 rounded bg-white/90 px-2 py-1 text-xs">
                    <input
                      type="checkbox"
                      checked={selected.has(image.id)}
                      onChange={() => toggleOne(image.id)}
                      aria-label={t("selectImageNamed", {name: image.originalFilename})}
                    />
                  </label>
                  {image.isAnimated ? (
                    <span className="absolute end-2 top-2 rounded bg-black/70 px-2 py-0.5 text-xs text-white">
                      {t("animated")}
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col gap-1 p-3 text-sm">
                  <p className="truncate font-medium" title={image.originalFilename}>
                    {image.originalFilename}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {formatDimensions(image.width, image.height) ?? t("dimensionsUnknown")}
                    {" · "}
                    {formatByteSize(image.sizeBytes, locale)}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {image.status === "ready_for_processing" ? (
                      <span
                        className="me-1 inline-block rounded-md bg-[var(--accent-soft)] px-1.5 py-0.5 font-medium text-[var(--foreground)]"
                        aria-label={t("ready.badge")}
                      >
                        {t("ready.badge")}
                      </span>
                    ) : null}
                    {image.detectedMimeType ?? image.mimeType} · {t(`status.${image.status}` as "status.validated")}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      className="text-xs underline"
                      onClick={(event) => openDetails(image, event.currentTarget)}
                    >
                      {t("openDetails")}
                    </button>
                    {image.status === "validation_failed" || image.status === "uploaded" ? (
                      <RetryValidationButton projectId={projectId} imageId={image.id} />
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-white">
          <table className="min-w-full text-sm">
            <thead className="border-b border-[var(--border)] text-start text-[var(--muted)]">
              <tr>
                <th className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={() => (allSelected ? clearSelection() : selectPage())}
                    aria-label={t("selectAllOnPage")}
                  />
                </th>
                <th className="px-3 py-3 font-medium">{t("privatePreview")}</th>
                <th className="px-3 py-3 font-medium">{t("filename")}</th>
                <th className="px-3 py-3 font-medium">{t("statusLabel")}</th>
                <th className="px-3 py-3 font-medium">{t("detectedFileType")}</th>
                <th className="px-3 py-3 font-medium">{t("trustedDimensions")}</th>
                <th className="px-3 py-3 font-medium">{t("size")}</th>
                <th className="px-3 py-3 font-medium">{t("animated")}</th>
                <th className="px-3 py-3 font-medium">{t("uploaded")}</th>
                <th className="px-3 py-3 font-medium">{t("validationDate")}</th>
                <th className="px-3 py-3 font-medium">{t("imageDetails")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((image) => (
                <tr key={image.id} className="border-b border-[var(--border)] last:border-b-0">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(image.id)}
                      onChange={() => toggleOne(image.id)}
                      aria-label={t("selectImageNamed", {name: image.originalFilename})}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <PreviewThumb image={image} className="h-12 w-12 rounded-lg" />
                  </td>
                  <td className="max-w-[12rem] truncate px-3 py-3 font-medium" title={image.originalFilename}>
                    {image.originalFilename}
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex flex-wrap items-center gap-2">
                      {image.status === "ready_for_processing" ? (
                        <span
                          className="rounded-md bg-[var(--accent-soft)] px-1.5 py-0.5 text-xs font-medium"
                          aria-label={t("ready.badge")}
                        >
                          {t("ready.badge")}
                        </span>
                      ) : null}
                      {t(`status.${image.status}` as "status.validated")}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-[var(--muted)]">
                    {image.detectedMimeType ?? image.mimeType}
                  </td>
                  <td className="px-3 py-3 text-[var(--muted)]">
                    {formatDimensions(image.width, image.height) ?? t("dimensionsUnknown")}
                  </td>
                  <td className="px-3 py-3 text-[var(--muted)]">
                    {formatByteSize(image.sizeBytes, locale)}
                  </td>
                  <td className="px-3 py-3 text-[var(--muted)]">
                    {image.isAnimated ? t("animated") : t("staticImage")}
                    {image.frameCount && image.isAnimated ? ` (${image.frameCount})` : null}
                  </td>
                  <td className="px-3 py-3 text-[var(--muted)]">
                    {image.uploadedAt
                      ? new Date(image.uploadedAt).toLocaleString(locale)
                      : "—"}
                  </td>
                  <td className="px-3 py-3 text-[var(--muted)]">
                    {image.validatedAt
                      ? new Date(image.validatedAt).toLocaleString(locale)
                      : "—"}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      className="underline"
                      onClick={(event) => openDetails(image, event.currentTarget)}
                    >
                      {t("openDetails")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-[var(--muted)]">
            {t("showingResults", {
              from: (page - 1) * pageSize + 1,
              to: Math.min(page * pageSize, totalCount),
              total: totalCount,
            })}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 disabled:opacity-40"
              disabled={page <= 1}
              onClick={() => navigate({page: page - 1})}
            >
              {t("previousPage")}
            </button>
            <span>
              {t("page")} {page} / {totalPages}
            </span>
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 disabled:opacity-40"
              disabled={page >= totalPages}
              onClick={() => navigate({page: page + 1})}
            >
              {t("nextPage")}
            </button>
          </div>
        </div>
      ) : null}

      <p className="text-xs text-[var(--muted)]">{t("originalUnmodified")}</p>
      <p className="text-xs text-[var(--muted)]">{t("previewUsesOriginalNotice")}</p>

      <dialog
        ref={dialogRef}
        className="w-[min(32rem,calc(100%-2rem))] max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border)] bg-white p-0 shadow-xl backdrop:bg-black/40"
        onClose={closeDetails}
        onCancel={(event) => {
          event.preventDefault();
          closeDetails();
        }}
      >
        {detail ? (
          <div className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold">{t("imageDetails")}</h2>
              <button type="button" className="underline" onClick={closeDetails}>
                {t("closeDetails")}
              </button>
            </div>
            <div className="aspect-[4/3] overflow-hidden rounded-xl">
              <PreviewThumb image={detail} className="h-full w-full" />
            </div>
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[var(--muted)]">{t("filename")}</dt>
                <dd className="break-all font-medium">{detail.originalFilename}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">{t("statusLabel")}</dt>
                <dd>{t(`status.${detail.status}` as "status.validated")}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">{t("fileType")}</dt>
                <dd>{detail.mimeType}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">{t("detectedFileType")}</dt>
                <dd>{detail.detectedMimeType ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">{t("detectedFormat")}</dt>
                <dd>{detail.detectedFormat ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">{t("size")}</dt>
                <dd>{formatByteSize(detail.sizeBytes, locale)}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">{t("trustedDimensions")}</dt>
                <dd>{formatDimensions(detail.width, detail.height) ?? t("dimensionsUnknown")}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">{t("pixelCountLabel")}</dt>
                <dd>{formatPixelCount(detail.pixelCount, locale) ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">{t("animated")}</dt>
                <dd>
                  {detail.isAnimated ? t("animated") : t("staticImage")}
                  {detail.frameCount ? ` · ${t("frames")}: ${detail.frameCount}` : null}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">{t("orientation")}</dt>
                <dd>{detail.orientation ?? "—"}</dd>
              </div>
              {detail.failureCode ? (
                <div className="sm:col-span-2">
                  <dt className="text-[var(--muted)]">{t("filter.validation_failed")}</dt>
                  <dd className="text-red-700">
                    {t(`validationErrors.${detail.failureCode}` as "validationErrors.DECODE_FAILED")}
                  </dd>
                </div>
              ) : null}
            </dl>
            <p className="text-xs text-[var(--muted)]">{t("originalUnmodified")}</p>
            {detail && DELETABLE_STATUSES.has(detail.status) ? (
              <div className="flex flex-wrap gap-3 border-t border-[var(--border)] pt-3">
                <button
                  type="button"
                  className="rounded-xl border border-red-300 px-3 py-2 text-sm text-red-800"
                  onClick={() => setDeleteTarget(detail)}
                >
                  {t("delete.button")}
                </button>
              </div>
            ) : null}
            {detail && REPLACEABLE_STATUSES.has(detail.status) ? (
              <ImageReplacePanel
                projectId={projectId}
                imageId={detail.id}
                onComplete={closeDetails}
              />
            ) : null}
          </div>
        ) : null}
      </dialog>

      {deleteTarget ? (
        <ImageDeleteDialog
          projectId={projectId}
          imageId={deleteTarget.id}
          imageName={deleteTarget.originalFilename}
          open={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
        />
      ) : null}
    </div>
  );
}
