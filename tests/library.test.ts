import {describe, expect, it} from "vitest";
import {formatDimensions, formatPixelCount} from "@/lib/format-image-meta";
import {
  DEFAULT_LIBRARY_PAGE_SIZE,
  MAX_LIBRARY_SEARCH_LENGTH,
  parseLibraryQuery,
} from "@/server/images/library-query";
import {escapeLikePattern} from "@/server/images/library-queries";

describe("library query validation", () => {
  it("defaults", () => {
    const q = parseLibraryQuery({});
    expect(q.status).toBe("ready_for_processing");
    expect(q.sort).toBe("newest");
    expect(q.view).toBe("grid");
    expect(q.page).toBe(1);
    expect(q.pageSize).toBe(DEFAULT_LIBRARY_PAGE_SIZE);
    expect(q.q).toBe("");
  });

  it("accepts valid status/sort/view", () => {
    const q = parseLibraryQuery({
      status: "validation_failed",
      sort: "filename_asc",
      view: "table",
      page: "2",
      pageSize: "48",
    });
    expect(q.status).toBe("validation_failed");
    expect(q.sort).toBe("filename_asc");
    expect(q.view).toBe("table");
    expect(q.page).toBe(2);
    expect(q.pageSize).toBe(48);
  });

  it("falls back invalid status/sort/view", () => {
    const q = parseLibraryQuery({status: "hack", sort: "drop table", view: "masonry"});
    expect(q.status).toBe("ready_for_processing");
    expect(q.sort).toBe("newest");
    expect(q.view).toBe("grid");
  });

  it("rejects negative/invalid page and excessive page size", () => {
    expect(parseLibraryQuery({page: "-1"}).page).toBe(1);
    expect(parseLibraryQuery({page: "abc"}).page).toBe(1);
    expect(parseLibraryQuery({pageSize: "999"}).pageSize).toBe(DEFAULT_LIBRARY_PAGE_SIZE);
  });

  it("trims and bounds search", () => {
    const q = parseLibraryQuery({q: "  hello  "});
    expect(q.q).toBe("hello");
    const long = "x".repeat(MAX_LIBRARY_SEARCH_LENGTH + 50);
    expect(parseLibraryQuery({q: long}).q.length).toBe(MAX_LIBRARY_SEARCH_LENGTH);
  });
});

describe("LIKE escaping", () => {
  it("escapes percent underscore and backslash", () => {
    expect(escapeLikePattern("a%b_c\\d")).toBe("a\\%b\\_c\\\\d");
  });
});

describe("formatters", () => {
  it("formats dimensions and nulls", () => {
    expect(formatDimensions(1920, 1080)).toBe("1920×1080");
    expect(formatDimensions(null, 1080)).toBeNull();
    expect(formatDimensions(0, 10)).toBeNull();
  });

  it("formats pixel counts", () => {
    expect(formatPixelCount(2_100_000, "en")).toContain("MP");
    expect(formatPixelCount(null, "en")).toBeNull();
  });
});
