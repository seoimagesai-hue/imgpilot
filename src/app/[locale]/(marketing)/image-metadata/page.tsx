import {setRequestLocale} from "next-intl/server";
import {GuestToolWorkspace} from "@/components/guest/guest-tool-workspace";
import {metadataToolConfig} from "@/components/guest/tools/metadata-tool";

type PageProps = {params: Promise<{locale: string}>};

export default async function ImageMetadataPage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <GuestToolWorkspace config={metadataToolConfig} />;
}
