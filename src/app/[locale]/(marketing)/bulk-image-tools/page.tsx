import {setRequestLocale} from "next-intl/server";
import {BulkToolWorkspace} from "@/components/guest/bulk-tool-workspace";

type PageProps = {
  params: Promise<{locale: string}>;
  searchParams: Promise<{tool?: string}>;
};

export default async function BulkImageToolsPage({params, searchParams}: PageProps) {
  const {locale} = await params;
  const query = await searchParams;
  setRequestLocale(locale);
  return <BulkToolWorkspace initialTool={query.tool} />;
}
