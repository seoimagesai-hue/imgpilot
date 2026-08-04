import {setRequestLocale} from "next-intl/server";
import {GuestToolWorkspace} from "@/components/guest/guest-tool-workspace";
import {geotagToolConfig} from "@/components/guest/tools/geotag-tool";

type PageProps = {params: Promise<{locale: string}>};

export default async function GeotagImagePage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <GuestToolWorkspace config={geotagToolConfig} />;
}
