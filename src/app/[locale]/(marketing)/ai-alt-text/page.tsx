import {redirect} from "@/i18n/navigation";
import {setRequestLocale} from "next-intl/server";

type PageProps = {params: Promise<{locale: string}>};

/** AI Alt Text removed from public product — send visitors to metadata editor. */
export default async function AiAltTextRemovedPage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  redirect({href: "/image-metadata-editor", locale});
}
