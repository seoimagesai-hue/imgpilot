/**
 * Image library query-string validation (Prompt 8 + Prompt 11 Ready).
 * Invalid values fall back safely — never pass raw sort into SQL.
 */

import {z} from "zod";

export const LIBRARY_PAGE_SIZES = [12, 24, 48] as const;
export const DEFAULT_LIBRARY_PAGE_SIZE = 24;
export const MAX_LIBRARY_PAGE_SIZE = 48;
export const MAX_LIBRARY_SEARCH_LENGTH = 100;

export const LIBRARY_STATUS_FILTERS = [
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
export type LibraryStatusFilter = (typeof LIBRARY_STATUS_FILTERS)[number];

export const LIBRARY_SORTS = [
  "newest",
  "oldest",
  "filename_asc",
  "filename_desc",
  "size_asc",
  "size_desc",
  "dimensions_desc",
] as const;
export type LibrarySort = (typeof LIBRARY_SORTS)[number];

export const LIBRARY_VIEWS = ["grid", "table"] as const;
export type LibraryView = (typeof LIBRARY_VIEWS)[number];

const DEFAULT_STATUS: LibraryStatusFilter = "ready_for_processing";

const statusSchema = z.enum(LIBRARY_STATUS_FILTERS).catch(DEFAULT_STATUS);
const sortSchema = z.enum(LIBRARY_SORTS).catch("newest");
const viewSchema = z.enum(LIBRARY_VIEWS).catch("grid");

export type LibraryQuery = {
  q: string;
  status: LibraryStatusFilter;
  sort: LibrarySort;
  view: LibraryView;
  page: number;
  pageSize: number;
};

export function parseLibraryQuery(raw: {
  q?: string;
  status?: string;
  sort?: string;
  view?: string;
  page?: string;
  pageSize?: string;
}): LibraryQuery {
  const qRaw = (raw.q ?? "").trim().slice(0, MAX_LIBRARY_SEARCH_LENGTH);
  const status = statusSchema.parse(raw.status ?? DEFAULT_STATUS);
  const sort = sortSchema.parse(raw.sort ?? "newest");
  const view = viewSchema.parse(raw.view ?? "grid");

  const pageParsed = Number.parseInt(raw.page ?? "1", 10);
  const page = Number.isFinite(pageParsed) && pageParsed > 0 ? Math.min(pageParsed, 10_000) : 1;

  const sizeParsed = Number.parseInt(raw.pageSize ?? String(DEFAULT_LIBRARY_PAGE_SIZE), 10);
  const pageSize = (LIBRARY_PAGE_SIZES as readonly number[]).includes(sizeParsed)
    ? sizeParsed
    : DEFAULT_LIBRARY_PAGE_SIZE;

  return {q: qRaw, status, sort, view, page, pageSize};
}

export function buildLibrarySearchParams(
  query: LibraryQuery,
  overrides?: Partial<LibraryQuery>,
): URLSearchParams {
  const next = {...query, ...overrides};
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.status !== DEFAULT_STATUS) params.set("status", next.status);
  if (next.sort !== "newest") params.set("sort", next.sort);
  if (next.view !== "grid") params.set("view", next.view);
  if (next.page > 1) params.set("page", String(next.page));
  if (next.pageSize !== DEFAULT_LIBRARY_PAGE_SIZE) params.set("pageSize", String(next.pageSize));
  return params;
}

export function libraryHref(projectId: string, query: LibraryQuery, overrides?: Partial<LibraryQuery>) {
  const params = buildLibrarySearchParams(query, overrides);
  const qs = params.toString();
  return `/dashboard/projects/${projectId}/images${qs ? `?${qs}` : ""}`;
}
