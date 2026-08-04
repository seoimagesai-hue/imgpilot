import {describe, expect, it} from "vitest";
import {
  buildHtmlFigureSnippet,
  buildHtmlImageSnippet,
  escapeHtml,
  formatEditorCsv,
  formatEditorJson,
  formatEditorTxt,
  GUEST_METADATA_EDIT_OPERATION,
  GUEST_METADATA_EDITOR_SCHEMA,
  mapAiResultToEditorDraft,
  neutralizeCsvCell,
  normalizeEditorKeywords,
  parseGuestEditorDraft,
  sanitizeEditorFilename,
  suggestedFilenameWithExtension,
  validateGuestEditorDraft,
  defaultGuestEditorDraft,
} from "@/lib/guest/metadata-editor-policy";
import {isGuestSupportedOperation} from "@/server/guest/processing-policy";
import {metadataEditorToolConfig} from "@/components/guest/tools/metadata-editor-tool";
import {aiAltToolConfig} from "@/components/guest/tools/ai-alt-tool";

describe("guest metadata editor architecture", () => {
  it("registers metadata.edit and mounts shared workspace config", () => {
    expect(GUEST_METADATA_EDIT_OPERATION).toBe("metadata.edit");
    expect(isGuestSupportedOperation(GUEST_METADATA_EDIT_OPERATION)).toBe(true);
    expect(metadataEditorToolConfig.operation).toBe(GUEST_METADATA_EDIT_OPERATION);
    expect(metadataEditorToolConfig.toolCode).toBe("image-metadata-editor");
    expect(metadataEditorToolConfig.hideImageDownload).toBe(true);
    expect(metadataEditorToolConfig.CustomResultPanel).toBeTruthy();
    expect(metadataEditorToolConfig.processingPhase).toBe("preparing_editor");
    expect(aiAltToolConfig.hideImageDownload).toBe(true);
  });
});

describe("guest metadata editor draft schema", () => {
  it("parses valid blank draft and strips unknown/risky fields", () => {
    const draft = parseGuestEditorDraft({
      sourceMode: "blank",
      decorative: false,
      metadata: {
        altText: "Red chair",
        title: "Chair",
        caption: "Office",
        shortDescription: "Short",
        longDescription: "Long",
        filename: "modern-red-office-chair",
        keywords: ["chair", "office"],
        secret: "nope",
      },
    });
    expect(draft.schemaVersion).toBe(GUEST_METADATA_EDITOR_SCHEMA);
    expect(draft.metadata.altText).toBe("Red chair");
    expect(draft.metadata.filename).toBe("modern-red-office-chair");
    expect("secret" in draft.metadata).toBe(false);
  });

  it("rejects banned top-level secrets by throwing", () => {
    // storageKey at top level is banned
    expect(() =>
      parseGuestEditorDraft({
        storageKey: "guest/x",
        metadata: {filename: "ok"},
      }),
    ).toThrow("DRAFT_INVALID");
  });

  it("strips HTML/script from text fields", () => {
    const draft = parseGuestEditorDraft({
      metadata: {
        altText: '<script>alert(1)</script>Safe',
        title: "<b>Title</b>",
        filename: "safe-name",
      },
    });
    expect(draft.metadata.altText).not.toContain("<script>");
    expect(draft.metadata.altText).toContain("Safe");
    expect(draft.metadata.title).toBe("Title");
  });

  it("forces empty alt when decorative", () => {
    const draft = parseGuestEditorDraft({
      decorative: true,
      metadata: {altText: "should clear", filename: "decor"},
    });
    expect(draft.decorative).toBe(true);
    expect(draft.metadata.altText).toBe("");
  });

  it("maps AI result without provider call shape", () => {
    const draft = mapAiResultToEditorDraft({
      altText: "AI alt",
      title: "AI title",
      caption: "Cap",
      shortDescription: "S",
      longDescription: "L",
      filename: "ai-name",
      keywords: ["a", "A", "b"],
    });
    expect(draft.sourceMode).toBe("ai_import");
    expect(draft.aiReviewed).toBe(false);
    expect(draft.metadata.altText).toBe("AI alt");
    expect(draft.metadata.keywords).toEqual(["a", "b"]);
  });
});

describe("guest metadata editor filename", () => {
  it("normalizes spaces and lowercases", () => {
    expect(sanitizeEditorFilename("Modern Red Office Chair")).toBe("modern-red-office-chair");
  });

  it("blocks path traversal and leading dots", () => {
    expect(sanitizeEditorFilename("../etc/passwd")).toBe("");
    expect(sanitizeEditorFilename(".hidden")).toBe("");
    expect(sanitizeEditorFilename("foo/bar")).toBe("");
    expect(sanitizeEditorFilename("foo\\bar")).toBe("");
  });

  it("blocks reserved device names", () => {
    expect(sanitizeEditorFilename("CON")).toBe("");
    expect(sanitizeEditorFilename("nul")).toBe("");
  });

  it("strips duplicate extensions and appends trusted mime extension", () => {
    expect(sanitizeEditorFilename("photo.JPG.png")).toBe("photo-jpg");
    expect(suggestedFilenameWithExtension("melbourne-panel-repair", "image/jpeg")).toBe(
      "melbourne-panel-repair.jpg",
    );
    expect(suggestedFilenameWithExtension("x", "image/webp")).toBe("x.webp");
  });
});

describe("guest metadata editor keywords", () => {
  it("trims, removes empty, dedupes case-insensitively, preserves urdu", () => {
    expect(normalizeEditorKeywords(["  Chair ", "", "chair", "کرسی", "Chair"])).toEqual([
      "chair",
      "کرسی",
    ]);
  });

  it("enforces max count and length", () => {
    const many = Array.from({length: 20}, (_, i) => `k${i}`);
    expect(normalizeEditorKeywords(many)).toHaveLength(12);
    expect(normalizeEditorKeywords(["a".repeat(100)])[0]?.length).toBe(40);
  });
});

describe("guest metadata editor validation", () => {
  it("warns on missing alt for meaningful images and allows decorative empty alt", () => {
    const blank = defaultGuestEditorDraft();
    blank.metadata.filename = "modern-chair";
    const warned = validateGuestEditorDraft(blank);
    expect(warned.issues.some((i) => i.code === "ALT_MISSING")).toBe(true);
    expect(warned.ok).toBe(true);

    const decor = defaultGuestEditorDraft();
    decor.decorative = true;
    decor.metadata.filename = "decor-bg";
    const ok = validateGuestEditorDraft(decor);
    expect(ok.issues.some((i) => i.code === "ALT_MISSING")).toBe(false);
  });

  it("blocks unsafe empty filename and image-of warning", () => {
    const d = defaultGuestEditorDraft();
    d.metadata.altText = "Image of a chair";
    const v = validateGuestEditorDraft(d);
    expect(v.ok).toBe(false);
    expect(v.issues.some((i) => i.severity === "blocking" && i.code === "FILENAME_INVALID")).toBe(
      true,
    );
    expect(v.issues.some((i) => i.code === "ALT_IMAGE_OF")).toBe(true);
  });

  it("warns on unreviewed AI import and has no score field", () => {
    const d = mapAiResultToEditorDraft({
      altText: "Alt",
      title: "T",
      filename: "ai-file",
      keywords: [],
    });
    const v = validateGuestEditorDraft(d);
    expect(v.issues.some((i) => i.code === "AI_NOT_REVIEWED")).toBe(true);
    expect(v.checklist.some((c) => c.id === "ai" && !c.passed)).toBe(true);
    expect("score" in v).toBe(false);
  });
});

describe("guest metadata editor HTML and CSV", () => {
  it("escapes HTML and keeps decorative alt empty", () => {
    expect(escapeHtml(`a<"&>`)).toBe("a&lt;&quot;&amp;&gt;");
    const img = buildHtmlImageSnippet({
      filename: `evil".jpg`,
      altText: `<script>x</script>`,
      title: `t"`,
      decorative: false,
    });
    expect(img).toContain("alt=\"&lt;script&gt;x&lt;/script&gt;\"");
    expect(img).not.toContain("<script>x</script>");
    expect(img).toContain('src="/images/');
    expect(img).not.toContain("r2.cloudflare");

    const decor = buildHtmlImageSnippet({
      filename: "x.webp",
      altText: "ignored",
      title: "",
      decorative: true,
    });
    expect(decor).toContain('alt=""');

    const fig = buildHtmlFigureSnippet({
      filename: "x.jpg",
      altText: "Alt",
      caption: "<b>Cap</b>",
      decorative: false,
    });
    expect(fig).toContain("<figcaption>&lt;b&gt;Cap&lt;/b&gt;</figcaption>");
    expect(fig.indexOf("<img")).toBeLessThan(fig.indexOf("<figcaption"));
  });

  it("neutralizes CSV formula injection and preserves Urdu", () => {
    expect(neutralizeCsvCell("=CMD")).toBe(`"'=CMD"`);
    expect(neutralizeCsvCell("+1")).toBe(`"'+1"`);
    expect(neutralizeCsvCell("@SUM")).toBe(`"'@SUM"`);
    expect(neutralizeCsvCell("-2")).toBe(`"'-2"`);
    const csv = formatEditorCsv({
      draft: {
        ...defaultGuestEditorDraft(),
        decorative: false,
        metadata: {
          altText: "=HYPERLINK",
          title: "عنوان",
          caption: "",
          shortDescription: "",
          longDescription: "",
          filename: "file",
          keywords: ["کرسی", "chair"],
        },
      },
      originalFilename: "orig.jpg",
      suggestedFilename: "file.jpg",
      format: "jpeg",
      width: 10,
      height: 20,
    });
    expect(csv.startsWith("original_filename,")).toBe(true);
    expect(csv).toContain("عنوان");
    expect(csv).toContain("کرسی|chair");
    expect(csv).toContain(`"'=HYPERLINK"`);
  });

  it("formats TXT/JSON without internals", () => {
    const draft = parseGuestEditorDraft({
      metadata: {
        altText: "A",
        title: "T",
        filename: "n",
        keywords: ["k"],
      },
    });
    const txt = formatEditorTxt({
      draft,
      suggestedFilename: "n.jpg",
      format: "jpeg",
      width: 1,
      height: 2,
      expiresAt: "2030-01-01T00:00:00.000Z",
    });
    expect(txt).toContain("do not guarantee search rankings");
    expect(txt).not.toContain("storageKey");
    expect(txt).not.toContain("guest");

    const json = JSON.parse(
      formatEditorJson({
        draft,
        originalFilename: "o.jpg",
        suggestedFilename: "n.jpg",
        format: "jpeg",
        width: 1,
        height: 2,
        generatedAt: "2030-01-01T00:00:00.000Z",
        expiresAt: null,
      }),
    );
    expect(json.schemaVersion).toBe("image-seo-metadata-v2");
    expect(json.metadata.decorative).toBe(false);
    expect(json.storageKey).toBeUndefined();
    expect(json.guestToken).toBeUndefined();
  });
});
