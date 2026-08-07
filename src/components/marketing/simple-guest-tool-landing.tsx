/**
 * @deprecated Prefer ToolLandingShell + getToolLandingCopy.
 * Kept as a thin adapter for any remaining imports.
 */
import {ToolLandingShell} from "@/components/marketing/tool-landing-shell";
import type {GuestToolConfig} from "@/components/guest/tool-config";
import {getToolLandingCopyForLocale} from "@/lib/marketing/tool-landing-copy";

type SimpleLandingProps = {
  locale: string;
  path: string;
  eyebrow: string;
  h1: string;
  intro: string;
  features: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toolConfig: GuestToolConfig<any>;
};

export function SimpleGuestToolLanding({locale, path, toolConfig}: SimpleLandingProps) {
  const copy = getToolLandingCopyForLocale(path, locale);
  return <ToolLandingShell locale={locale} copy={copy} toolConfig={toolConfig} />;
}
