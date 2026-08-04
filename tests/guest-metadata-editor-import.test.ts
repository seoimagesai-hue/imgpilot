import {describe, expect, it} from "vitest";
import {
  findImportableAiAltJob,
  parseGuestMetadataEditorPrepareOptions,
  isGuestMetadataEditorMime,
} from "@/server/guest/metadata-editor-service";
import {GuestDomainError} from "@/server/guest/errors";

describe("guest metadata editor AI import gates", () => {
  it("accepts only static jpeg/png/webp", () => {
    expect(isGuestMetadataEditorMime("image/jpeg")).toBe(true);
    expect(isGuestMetadataEditorMime("image/png")).toBe(true);
    expect(isGuestMetadataEditorMime("image/webp")).toBe(true);
    expect(isGuestMetadataEditorMime("image/svg+xml")).toBe(false);
    expect(isGuestMetadataEditorMime("image/gif")).toBe(false);
  });

  it("parses prepare modes without inventing AI content", () => {
    expect(parseGuestMetadataEditorPrepareOptions(undefined).sourceMode).toBe("blank");
    expect(parseGuestMetadataEditorPrepareOptions({sourceMode: "blank"}).sourceMode).toBe("blank");
    expect(parseGuestMetadataEditorPrepareOptions({sourceMode: "ai_import"}).sourceMode).toBe(
      "ai_import",
    );
    expect(() =>
      parseGuestMetadataEditorPrepareOptions({sourceMode: "blank", storageKey: "x"}),
    ).toThrow(GuestDomainError);
  });

  it("exposes findImportableAiAltJob for session+upload ownership (no provider)", () => {
    expect(typeof findImportableAiAltJob).toBe("function");
  });
});
