import {notFound} from "next/navigation";
import {BulkToolLandingWorkspace} from "@/components/guest/bulk-tool-landing-workspace";
import {LandingToolWorkspace} from "@/components/guest/landing-tool-workspace";
import {ToolLandingShell} from "@/components/marketing/tool-landing-shell";
import {getSeoToolLandingCopy} from "@/lib/marketing/seo-tool-landing-copy";
import {getToolLanding} from "@/lib/marketing/tool-landing-registry";

const MARKETING_UPLOAD = {
  landingChrome: "marketing" as const,
  dropLabel: "Drop Your Files Here",
  supportLabel: "",
  browseLabel: "Select Files",
  formatsHint: "You can also paste an image with Ctrl + V",
};

/** Format SEO landings (compress/resize/crop/convert-by-format) → shared Compress mockup shell. */
export function SeoFormatToolLanding({slug, locale}: {slug: string; locale: string}) {
  const landing = getToolLanding(slug);
  if (!landing || landing.redirectTo) notFound();
  const copy = getSeoToolLandingCopy(`/${slug}`, locale);

  return (
    <ToolLandingShell
      locale={locale}
      copy={copy}
      workspace={
        <LandingToolWorkspace
          landing={landing}
          presentation={{
            ...MARKETING_UPLOAD,
            marketingCompressPresets: landing.operation === "compress",
            showPopularSizes: landing.operation === "resize",
          }}
        />
      }
    />
  );
}

/** Bulk SEO landings → same shell with bulk workspace. */
export function SeoBulkToolLanding({
  locale,
  path,
  initialTool,
}: {
  locale: string;
  path: "/bulk-compress" | "/bulk-resize" | "/bulk-convert";
  initialTool: "compress" | "resize" | "convert";
}) {
  const copy = getSeoToolLandingCopy(path, locale);
  return (
    <ToolLandingShell
      locale={locale}
      copy={copy}
      workspace={<BulkToolLandingWorkspace initialTool={initialTool} />}
    />
  );
}
