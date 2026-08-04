import {setRequestLocale} from "next-intl/server";
import {AiAltToolPage} from "@/components/guest/tools/ai-alt-tool-page";

type PageProps = {params: Promise<{locale: string}>};

export default async function AiAltTextPage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <AiAltToolPage />;
}
