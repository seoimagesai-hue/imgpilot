import {describe, expect, it} from "vitest";
import {
  createProjectSchema,
  projectFilterSchema,
  normalizeWebsiteUrl,
} from "../src/server/projects/validation";

describe("createProjectSchema", () => {
  it("accepts valid project data", () => {
    const parsed = createProjectSchema.safeParse({
      name: "Acme Site",
      websiteUrl: "https://acme.example",
      description: "Bulk images",
      metadataLanguage: "en",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects missing project name", () => {
    const parsed = createProjectSchema.safeParse({
      name: "",
      websiteUrl: "",
      description: "",
      metadataLanguage: "en",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects whitespace-only name", () => {
    const parsed = createProjectSchema.safeParse({
      name: "   ",
      websiteUrl: "",
      description: "",
      metadataLanguage: "ur",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects excessively long name", () => {
    const parsed = createProjectSchema.safeParse({
      name: "a".repeat(101),
      websiteUrl: "",
      description: "",
      metadataLanguage: "en",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts valid HTTPS URL", () => {
    const parsed = createProjectSchema.safeParse({
      name: "Shop",
      websiteUrl: "https://shop.example/path",
      description: "",
      metadataLanguage: "en",
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts valid HTTP URL", () => {
    const parsed = createProjectSchema.safeParse({
      name: "Shop",
      websiteUrl: "http://shop.example",
      description: "",
      metadataLanguage: "en",
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts empty optional URL", () => {
    const parsed = createProjectSchema.safeParse({
      name: "Shop",
      websiteUrl: "",
      description: "",
      metadataLanguage: "en",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.websiteUrl).toBeNull();
  });

  it("rejects unsafe URL protocols", () => {
    const parsed = createProjectSchema.safeParse({
      name: "Shop",
      websiteUrl: "javascript:alert(1)",
      description: "",
      metadataLanguage: "en",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects invalid metadata language", () => {
    const parsed = createProjectSchema.safeParse({
      name: "Shop",
      websiteUrl: "",
      description: "",
      metadataLanguage: "fr",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("normalizeWebsiteUrl", () => {
  it("adds https when protocol is missing", () => {
    expect(normalizeWebsiteUrl("example.com")).toBe("https://example.com/");
  });

  it("rejects non-http protocols", () => {
    expect(() => normalizeWebsiteUrl("ftp://example.com")).toThrow();
  });
});

describe("projectFilterSchema", () => {
  it("accepts valid filter values", () => {
    expect(projectFilterSchema.parse("active")).toBe("active");
    expect(projectFilterSchema.parse("archived")).toBe("archived");
    expect(projectFilterSchema.parse("all")).toBe("all");
  });

  it("falls back invalid filters to active", () => {
    expect(projectFilterSchema.parse("nope")).toBe("active");
  });
});
