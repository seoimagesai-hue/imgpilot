import {redirect} from "@/i18n/navigation";
import {setRequestLocale} from "next-intl/server";

type PageProps = {params: Promise<{locale: string}>};

/** Legacy route → AI Alt Text Generator. */
export default async function ImageAltTextRedirectPage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  redirect({href: "/ai-alt-text", locale});
}
