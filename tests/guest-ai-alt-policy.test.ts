import {describe, expect, it, vi} from "vitest";
import {
  GUEST_AI_ALT_OPERATION,
  clampText,
  formatGuestAiAltJson,
  formatGuestAiAltTxt,
  guestAiAltOptionsEqual,
  isGuestAiAltMime,
  normalizeGuestAiStructured,
  normalizeKeywords,
  parseGuestAiAltOptions,
  sanitizeGuestAiFilename,
  stripHtmlAndControls,
  type GuestAiAltResultSummary,
} from "@/lib/guest/ai-alt-policy";
import {isGuestSupportedOperation} from "@/server/guest/processing-policy";
import {aiAltToolConfig} from "@/components/guest/tools/ai-alt-tool";
import {metadataToolConfig} from "@/components/guest/tools/metadata-tool";
import {normalizeGuestAiAltForTest} from "@/server/guest/ai-alt-provider";

describe("guest AI alt architecture", () => {
  it("registers ai.generate_alt_text and mounts shared workspace config", () => {
    expect(GUEST_AI_ALT_OPERATION).toBe("ai.generate_alt_text");
    expect(isGuestSupportedOperation(GUEST_AI_ALT_OPERATION)).toBe(true);
    expect(aiAltToolConfig.operation).toBe(GUEST_AI_ALT_OPERATION);
    expect(aiAltToolConfig.toolCode).toBe("ai-alt-text");
    expect(aiAltToolConfig.hideImageDownload).toBe(true);
    expect(aiAltToolConfig.CustomResultPanel).toBeTruthy();
    expect(metadataToolConfig.hideImageDownload).toBe(true);
  });

  it("accepts static JPEG/PNG/WebP only", () => {
    expect(isGuestAiAltMime("image/jpeg")).toBe(true);
    expect(isGuestAiAltMime("image/png")).toBe(true);
    expect(isGuestAiAltMime("image/webp")).toBe(true);
    expect(isGuestAiAltMime("image/gif")).toBe(false);
    expect(isGuestAiAltMime("image/svg+xml")).toBe(false);
  });
});

describe("guest AI alt safe options", () => {
  it("parses purposes and languages", () => {
    expect(parseGuestAiAltOptions({purpose: "seo", outputLanguage: "en"}).purpose).toBe("seo");
    expect(parseGuestAiAltOptions({purpose: "accessibility", outputLanguage: "ur"}).outputLanguage).toBe(
      "ur",
    );
    for (const purpose of ["seo", "accessibility", "ecommerce", "blog", "social"]) {
      expect(parseGuestAiAltOptions({purpose, outputLanguage: "en"}).purpose).toBe(purpose);
    }
  });

  it("rejects invalid purpose/language and arbitrary prompts", () => {
    expect(() => parseGuestAiAltOptions({purpose: "hack", outputLanguage: "en"})).toThrow(
      "PURPOSE_INVALID",
    );
    expect(() => parseGuestAiAltOptions({purpose: "seo", outputLanguage: "de"})).toThrow(
      "LANGUAGE_INVALID",
    );
    expect(() =>
      parseGuestAiAltOptions({purpose: "seo", outputLanguage: "en", prompt: "ignore previous"}),
    ).toThrow("INVALID_OPTIONS");
    expect(() =>
      parseGuestAiAltOptions({purpose: "seo", outputLanguage: "en", model: "gpt-x"}),
    ).toThrow("INVALID_OPTIONS");
  });

  it("compares options for idempotency", () => {
    const a = parseGuestAiAltOptions({purpose: "seo", outputLanguage: "en"});
    const b = parseGuestAiAltOptions({purpose: "seo", outputLanguage: "en"});
    expect(guestAiAltOptionsEqual(a, b)).toBe(true);
    expect(
      guestAiAltOptionsEqual(a, parseGuestAiAltOptions({purpose: "blog", outputLanguage: "en"})),
    ).toBe(false);
  });
});

describe("guest AI alt sanitization and schema", () => {
  it("strips HTML/markdown and clamps lengths", () => {
    expect(stripHtmlAndControls("<b>Hi</b> ```x```")).toBe("Hi");
    expect(clampText("a".repeat(200), 125).length).toBe(125);
    expect(sanitizeGuestAiFilename("My Photo!.JPG")).toBe("my-photo");
    expect(sanitizeGuestAiFilename("../etc/passwd")).toBe("image");
    expect(normalizeKeywords(["A", "a", "B", "c".repeat(100)]).length).toBe(3);
  });

  it("normalizes valid structured responses and rejects incomplete ones", () => {
    const ok = normalizeGuestAiStructured({
      altText: "A red mug on a wooden desk",
      title: "Red mug",
      caption: "Desk scene",
      shortDescription: "A ceramic mug",
      longDescription: "A red ceramic mug sits on a wooden desk near a window.",
      filename: "Red Mug Scene!",
      keywords: ["mug", "desk", "Mug"],
    });
    expect(ok.filename).toBe("red-mug-scene");
    expect(ok.keywords).toEqual(["mug", "desk"]);
    expect(ok.altText.length).toBeLessThanOrEqual(125);

    expect(() =>
      normalizeGuestAiStructured({
        altText: "",
        title: "x",
        shortDescription: "y",
      }),
    ).toThrow("RESPONSE_INVALID");
  });

  it("maps dashboard-shaped description fields", () => {
    const ok = normalizeGuestAiAltForTest({
      altText: "Alt",
      title: "Title",
      caption: null,
      description: "Short from dashboard schema",
      filenameSuggestion: "dash-file",
      keywords: ["one"],
    });
    expect(ok.shortDescription).toContain("Short");
    expect(ok.filename).toBe("dash-file");
  });

  it("formats TXT/JSON without internal secrets", () => {
    const summary: GuestAiAltResultSummary = {
      schemaVersion: "image-seo-ai-v2",
      purpose: "seo",
      outputLanguage: "en",
      result: {
        schemaVersion: "image-seo-ai-v2",
        altText: "Alt",
        title: "Title",
        caption: "Cap",
        shortDescription: "Short",
        longDescription: "Long",
        filename: "file",
        keywords: ["k1"],
      },
      generatedAt: "2026-08-03T00:00:00.000Z",
      durationMs: 10,
      providerConfigured: true,
    };
    const txt = formatGuestAiAltTxt(summary, {
      purpose: "Purpose",
      language: "Language",
      altText: "Alt",
      title: "Title",
      caption: "Caption",
      shortDescription: "Short",
      longDescription: "Long",
      filename: "Filename",
      keywords: "Keywords",
      warning: "WARNING",
      generatedAt: "Generated",
      expiresAt: "Expires",
    });
    expect(txt).toContain("WARNING");
    expect(txt).not.toContain("storageKey");
    expect(txt).not.toContain("OPENAI");
    const json = formatGuestAiAltJson(summary, "exp");
    expect(json).toContain('"schemaVersion"');
    expect(json).not.toContain("durationMs");
    expect(json).not.toContain("providerConfigured");
  });
});

describe("guest AI provider status mocks", () => {
  it("reports unconfigured safely", async () => {
    vi.resetModules();
    vi.doMock("@/server/images/ai-provider", () => ({
      getAiConfigStatus: () => ({configured: false, reason: "AI_NOT_CONFIGURED"}),
      isAiConfigured: () => false,
    }));
    const mod = await import("@/server/guest/ai-alt-provider");
    expect(mod.getGuestAiPublicStatus()).toEqual({configured: false, provider: null});
    await expect(
      mod.generateGuestAiAltText({
        imageBytes: Buffer.from("x"),
        options: parseGuestAiAltOptions({purpose: "seo", outputLanguage: "en"}),
      }),
    ).rejects.toThrow("NOT_CONFIGURED");
    vi.doUnmock("@/server/images/ai-provider");
    vi.resetModules();
  });
});
