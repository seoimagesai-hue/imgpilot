import {describe, expect, it} from "vitest";
import {
  PRIVACY_LEGAL_PARAGRAPHS,
  TERMS_LEGAL_PARAGRAPHS,
} from "@/lib/marketing/legal-landing-content";

describe("legal stub wording", () => {
  it("keeps privacy stub paragraphs unchanged", () => {
    expect(PRIVACY_LEGAL_PARAGRAPHS[0]).toContain("Guest tool uploads are stored in private object storage");
    expect(PRIVACY_LEGAL_PARAGRAPHS[0]).toContain("about one hour");
    expect(PRIVACY_LEGAL_PARAGRAPHS[1]).toContain("Professional legal review is still pending");
  });

  it("keeps terms stub paragraphs unchanged", () => {
    expect(TERMS_LEGAL_PARAGRAPHS[0]).toContain("Guest tools are provided as-is");
    expect(TERMS_LEGAL_PARAGRAPHS[0]).toContain("Stripe Price IDs are approved");
    expect(TERMS_LEGAL_PARAGRAPHS[1]).toContain("Full legal terms still require professional");
  });
});
