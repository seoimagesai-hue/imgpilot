import {getTranslations, setRequestLocale} from "next-intl/server";
import {ToolHeader} from "@/components/guest/tool-header";
import {EmptyState} from "@/components/guest/empty-state";

type PageProps = {
  params: Promise<{locale: string}>;
  titleKey: "compress" | "resize" | "crop" | "convert" | "geotag" | "metadata" | "aiAlt" | "metadataEditor";
};

async function ToolPlaceholder({params, titleKey}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations("guest");
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <ToolHeader title={t(`tools.${titleKey}`)} description={t("tools.comingSoon")} />
      <EmptyState />
    </main>
  );
}

export function makeToolPlaceholder(
  titleKey: PageProps["titleKey"],
) {
  return async function Page({params}: {params: Promise<{locale: string}>}) {
    return ToolPlaceholder({params, titleKey});
  };
}
