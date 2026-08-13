/**
 * @deprecated Prefer ToolLandingShell + getToolLandingCopy.
 * Kept as a thin adapter for any remaining imports.
 */
import {ToolLandingShell} from "@/components/marketing/tool-landing-shell";
import type {LandingToolId} from "@/components/marketing/tool-landing-workspace";
import {getToolLandingCopyForLocale} from "@/lib/marketing/tool-landing-copy";

type SimpleLandingProps = {
  locale: string;
  path: string;
  eyebrow: string;
  h1: string;
  intro: string;
  features: string[];
  toolId: LandingToolId;
};

export function SimpleGuestToolLanding({locale, path, toolId}: SimpleLandingProps) {
  const copy = getToolLandingCopyForLocale(path, locale);
  return <ToolLandingShell locale={locale} copy={copy} toolId={toolId} />;
}
