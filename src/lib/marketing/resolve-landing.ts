import {
  getLandingSeoContent,
  type LandingSeoContent,
} from "@/lib/marketing/tool-landing-content";
import {
  getToolLanding,
  type ToolLandingDefinition,
} from "@/lib/marketing/tool-landing-registry";

export type LandingPageModel = ToolLandingDefinition & {
  seo: LandingSeoContent;
};

export function getLandingPageModel(slug: string): LandingPageModel | null {
  const landing = getToolLanding(slug);
  if (!landing || landing.redirectTo) return null;
  const seo = getLandingSeoContent(landing.slug);
  if (!seo) return null;
  return {
    ...landing,
    intro: seo.intro,
    benefits: seo.benefits.map((b) => b.title),
    howTo: [...seo.howTo],
    faqs: seo.faqs,
    seo,
  };
}
