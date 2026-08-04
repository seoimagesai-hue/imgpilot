import {setRequestLocale} from "next-intl/server";
import {GuestToolWorkspace} from "@/components/guest/guest-tool-workspace";
import {metadataEditorToolConfig} from "@/components/guest/tools/metadata-editor-tool";

type PageProps = {params: Promise<{locale: string}>};

export default async function ImageMetadataEditorPage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <GuestToolWorkspace config={metadataEditorToolConfig} />;
}
