import {describe, expect, it} from "vitest";
import {
  PRIVACY_LEGAL_PARAGRAPHS,
  TERMS_LEGAL_PARAGRAPHS,
  getCookiesDoc,
  getPrivacyDoc,
  getTermsDoc,
} from "@/lib/marketing/legal-landing-content";

describe("legal policy content", () => {
  it("keeps accurate guest retention and review notes in shared privacy paragraphs", () => {
    expect(PRIVACY_LEGAL_PARAGRAPHS[0]).toContain("Guest tool uploads are stored in private object storage");
    expect(PRIVACY_LEGAL_PARAGRAPHS[0]).toContain("about one hour");
    expect(PRIVACY_LEGAL_PARAGRAPHS[1]).toContain("professional legal review");
  });

  it("keeps accurate free-limit and billing notes in shared terms paragraphs", () => {
    expect(TERMS_LEGAL_PARAGRAPHS[0]).toContain("Guest tools are provided as-is");
    expect(TERMS_LEGAL_PARAGRAPHS[0]).toContain("Stripe Price IDs are approved");
    expect(TERMS_LEGAL_PARAGRAPHS[1]).toContain("By using Img Pilot you agree");
  });

  it("builds full EN privacy / terms / cookies documents with multiple sections", () => {
    expect(getPrivacyDoc("en").sections.length).toBeGreaterThanOrEqual(8);
    expect(getTermsDoc("en").sections.length).toBeGreaterThanOrEqual(8);
    expect(getCookiesDoc("en").sections.length).toBeGreaterThanOrEqual(5);
    expect(getPrivacyDoc("en").sections.some((s) => s.id === "retention")).toBe(true);
    expect(getCookiesDoc("en").sections.some((s) => s.id === "essential")).toBe(true);
  });

  it("builds full UR privacy / terms / cookies documents", () => {
    expect(getPrivacyDoc("ur").hero.h1).toContain("پرائیویسی");
    expect(getTermsDoc("ur").sections.length).toBeGreaterThanOrEqual(8);
    expect(getCookiesDoc("ur").metaTitle).toContain("کوکی");
  });
});
