import {describe, expect, it, vi, beforeEach, afterEach} from "vitest";
import {
  normalizeGuestAiStructured,
  parseGuestAiAltOptions,
} from "@/lib/guest/ai-alt-policy";

describe("guest AI provider adapter mocked behaviors", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("maps timeout errors from the SDK", async () => {
    vi.doMock("@/server/images/ai-provider", () => ({
      getAiConfigStatus: () => ({configured: true, provider: "openai", model: "gpt-4o-mini"}),
      isAiConfigured: () => true,
    }));
    vi.doMock("@/lib/env", () => ({
      getServerEnv: () => ({OPENAI_API_KEY: "sk-test"}),
    }));
    vi.doMock("@/server/images/ai-analysis-image", () => ({
      prepareAnalysisImage: async () => ({
        bytes: Buffer.from("jpeg"),
        mimeType: "image/jpeg",
        width: 10,
        height: 10,
        scaled: false,
      }),
    }));
    vi.doMock("openai", () => {
      class OpenAI {
        chat = {
          completions: {
            create: async () => {
              throw new Error("Request timed out");
            },
          },
        };
        constructor(_opts: unknown) {}
      }
      return {default: OpenAI};
    });

    const {generateGuestAiAltText} = await import("@/server/guest/ai-alt-provider");
    await expect(
      generateGuestAiAltText({
        imageBytes: Buffer.from("x"),
        options: parseGuestAiAltOptions({purpose: "seo", outputLanguage: "en"}),
      }),
    ).rejects.toThrow("TIMEOUT");
  });

  it("rejects malformed JSON from the provider", async () => {
    vi.doMock("@/server/images/ai-provider", () => ({
      getAiConfigStatus: () => ({configured: true, provider: "openai", model: "gpt-4o-mini"}),
      isAiConfigured: () => true,
    }));
    vi.doMock("@/lib/env", () => ({
      getServerEnv: () => ({OPENAI_API_KEY: "sk-test"}),
    }));
    vi.doMock("@/server/images/ai-analysis-image", () => ({
      prepareAnalysisImage: async () => ({
        bytes: Buffer.from("jpeg"),
        mimeType: "image/jpeg",
        width: 10,
        height: 10,
        scaled: false,
      }),
    }));
    vi.doMock("openai", () => {
      class OpenAI {
        chat = {
          completions: {
            create: async () => ({
              choices: [{message: {content: "not-json"}}],
            }),
          },
        };
        constructor(_opts: unknown) {}
      }
      return {default: OpenAI};
    });

    const {generateGuestAiAltText} = await import("@/server/guest/ai-alt-provider");
    await expect(
      generateGuestAiAltText({
        imageBytes: Buffer.from("x"),
        options: parseGuestAiAltOptions({purpose: "seo", outputLanguage: "en"}),
      }),
    ).rejects.toThrow("RESPONSE_INVALID");
  });

  it("accepts a mocked successful structured response", async () => {
    vi.doMock("@/server/images/ai-provider", () => ({
      getAiConfigStatus: () => ({configured: true, provider: "openai", model: "gpt-4o-mini"}),
      isAiConfigured: () => true,
    }));
    vi.doMock("@/lib/env", () => ({
      getServerEnv: () => ({OPENAI_API_KEY: "sk-test"}),
    }));
    vi.doMock("@/server/images/ai-analysis-image", () => ({
      prepareAnalysisImage: async () => ({
        bytes: Buffer.from("jpeg"),
        mimeType: "image/jpeg",
        width: 10,
        height: 10,
        scaled: false,
      }),
    }));
    vi.doMock("openai", () => {
      class OpenAI {
        chat = {
          completions: {
            create: async () => ({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      altText: "A blue bicycle parked beside a brick wall",
                      title: "Blue bicycle",
                      caption: "Street scene",
                      shortDescription: "A blue bike against a wall",
                      longDescription: "A blue bicycle leans against a weathered brick wall.",
                      filename: "blue-bicycle-wall",
                      keywords: ["bicycle", "blue", "wall"],
                    }),
                  },
                },
              ],
            }),
          },
        };
        constructor(_opts: unknown) {}
      }
      return {default: OpenAI};
    });

    const {generateGuestAiAltText} = await import("@/server/guest/ai-alt-provider");
    const out = await generateGuestAiAltText({
      imageBytes: Buffer.from("x"),
      options: parseGuestAiAltOptions({purpose: "seo", outputLanguage: "en"}),
    });
    expect(out.result.altText).toContain("bicycle");
    expect(out.result.filename).toBe("blue-bicycle-wall");
    expect(normalizeGuestAiStructured(out.result).keywords).toContain("bicycle");
  });

  it("documents that Responses API fallback is not implemented", () => {
    // Product truth: Chat Completions only; no second fallback path.
    expect(true).toBe(true);
  });
});
