import {describe, expect, it} from "vitest";
import sharp from "sharp";
import {prepareAnalysisImage} from "@/server/images/ai-analysis-image";
import {
  getAiMetadataPolicy,
  AI_ANALYSIS_MAX_EDGE,
} from "@/server/images/ai-metadata-policy";
import {
  sanitizeFilenameSuggestion,
  validateStructuredMetadata,
} from "@/server/images/ai-metadata-schema";
import {buildMetadataPrompt} from "@/server/images/ai-metadata-prompt";

describe("ai metadata policy", () => {
  it("never auto-approves or auto-renames", () => {
    const policy = getAiMetadataPolicy();
    expect(policy.autoApprove).toBe(false);
    expect(policy.autoRename).toBe(false);
    expect(policy.browserCallsProvider).toBe(false);
    expect(policy.bulkAi).toBe(true);
    expect(policy.bulkReviewActions).toBe(true);
    expect(policy.urduFilenamePolicy).toBe("latin_ascii_slug");
  });
});

describe("filename suggestion", () => {
  it("sanitizes to latin ascii slug", () => {
    expect(sanitizeFilenameSuggestion("Hello World!!")).toBe("hello-world");
    expect(sanitizeFilenameSuggestion("../etc/passwd")).toBe("etc-passwd");
    expect(sanitizeFilenameSuggestion("تصویر")).toBe("image");
  });
});

describe("structured output", () => {
  it("accepts valid payload", () => {
    const out = validateStructuredMetadata({
      altText: "A red bicycle parked beside a wooden fence on a sunny street.",
      title: "Red bicycle by fence",
      caption: null,
      description: "A red bicycle leans against a wooden fence along a quiet street.",
      filenameSuggestion: "Red Bicycle By Fence",
      language: "en",
    });
    expect(out.filenameSuggestion).toBe("red-bicycle-by-fence");
  });

  it("rejects missing alt text", () => {
    expect(() =>
      validateStructuredMetadata({
        altText: "",
        title: "Title",
        caption: null,
        description: "Desc",
        filenameSuggestion: "title",
        language: "en",
      }),
    ).toThrow(/AI_RESPONSE_INVALID|METADATA/);
  });
});

describe("analysis image", () => {
  it("bounds longest edge and does not upscale", async () => {
    const large = await sharp({
      create: {width: 2400, height: 1200, channels: 3, background: {r: 10, g: 20, b: 30}},
    })
      .jpeg()
      .toBuffer();
    const analysis = await prepareAnalysisImage(large);
    expect(Math.max(analysis.width, analysis.height)).toBeLessThanOrEqual(AI_ANALYSIS_MAX_EDGE);
    expect(analysis.scaled).toBe(true);

    const tiny = await sharp({
      create: {width: 80, height: 60, channels: 3, background: {r: 1, g: 2, b: 3}},
    })
      .jpeg()
      .toBuffer();
    const small = await prepareAnalysisImage(tiny);
    expect(small.width).toBe(80);
    expect(small.height).toBe(60);
    expect(small.scaled).toBe(false);
  });
});

describe("prompt builder", () => {
  it("includes language and excludes storage keys", () => {
    const prompt = buildMetadataPrompt({
      language: "ur",
      projectName: "Demo",
      websiteHostname: "example.com",
    });
    expect(prompt.system).toMatch(/Urdu/);
    expect(prompt.user).not.toMatch(/users\//);
    expect(prompt.promptVersion).toBe("metadata-v1");
  });
});
