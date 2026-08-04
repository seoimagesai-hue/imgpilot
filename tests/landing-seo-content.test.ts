import {describe, expect, it} from "vitest";
import {getLandingPageModel} from "@/lib/marketing/resolve-landing";
import {
  getLandingSeoContent,
  listSeoContentSlugs,
  TOOL_LANDING_SEO_CONTENT,
} from "@/lib/marketing/tool-landing-content";
import {listIndexableToolLandings} from "@/lib/marketing/tool-landing-registry";

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

describe("landing SEO content registry", () => {
  const indexable = listIndexableToolLandings();

  it("covers every indexable landing slug with unique SEO content", () => {
    const seo = new Set(listSeoContentSlugs());
    for (const landing of indexable) {
      expect(seo.has(landing.slug), `missing SEO for ${landing.slug}`).toBe(true);
      expect(getLandingSeoContent(landing.slug)).toBeTruthy();
      expect(getLandingPageModel(landing.slug)?.seo).toBeTruthy();
    }
  });

  it("keeps FAQ questions unique across landings", () => {
    const seen = new Map<string, string>();
    for (const slug of listSeoContentSlugs()) {
      const content = TOOL_LANDING_SEO_CONTENT[slug]!;
      for (const faq of content.faqs) {
        const key = faq.q.trim().toLowerCase();
        const previous = seen.get(key);
        expect(previous, `duplicate FAQ "${faq.q}" on ${slug} (also ${previous})`).toBeUndefined();
        seen.set(key, slug);
      }
    }
  });

  it("keeps intro/why/technical unique enough and within word budget", () => {
    const intros = new Map<string, string>();
    const whys = new Map<string, string>();

    for (const slug of listSeoContentSlugs()) {
      const content = TOOL_LANDING_SEO_CONTENT[slug]!;
      const introWords = wordCount(content.intro);
      const whyWords = wordCount(content.why);
      const total =
        introWords +
        whyWords +
        wordCount(content.technical) +
        content.benefits.reduce((n, b) => n + wordCount(b.title) + wordCount(b.body), 0) +
        content.howTo.reduce((n, s) => n + wordCount(s), 0) +
        content.faqs.reduce((n, f) => n + wordCount(f.q) + wordCount(f.a), 0);

      expect(introWords, `${slug} intro words`).toBeGreaterThanOrEqual(40);
      expect(introWords, `${slug} intro words`).toBeLessThanOrEqual(110);
      expect(whyWords, `${slug} why words`).toBeGreaterThanOrEqual(80);
      expect(whyWords, `${slug} why words`).toBeLessThanOrEqual(200);
      expect(total, `${slug} total words ${total}`).toBeGreaterThanOrEqual(400);
      expect(total, `${slug} total words ${total}`).toBeLessThanOrEqual(800);

      const introKey = content.intro.trim().toLowerCase();
      const whyKey = content.why.trim().toLowerCase();
      expect(intros.get(introKey), `duplicate intro on ${slug}`).toBeUndefined();
      expect(whys.get(whyKey), `duplicate why on ${slug}`).toBeUndefined();
      intros.set(introKey, slug);
      whys.set(whyKey, slug);

      expect(content.benefits.length).toBeGreaterThanOrEqual(4);
      expect(content.benefits.length).toBeLessThanOrEqual(6);
      expect(content.faqs.length).toBeGreaterThanOrEqual(3);
      expect(content.howTo).toHaveLength(4);
    }
  });

  it("resolves page model with SEO faqs instead of empty stub", () => {
    const model = getLandingPageModel("compress-jpg");
    expect(model?.seo.faqs.some((f) => /KB|kilobyte/i.test(f.q))).toBe(true);
    expect(model?.faqs).toEqual(model?.seo.faqs);
  });
});
