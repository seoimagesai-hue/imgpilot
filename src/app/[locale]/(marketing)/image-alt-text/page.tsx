import {redirect} from "@/i18n/navigation";
import {setRequestLocale} from "next-intl/server";

type PageProps = {params: Promise<{locale: string}>};

/** Legacy route — AI Alt Text removed; send to metadata editor. */
export default async function ImageAltTextRedirectPage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  redirect({href: "/image-metadata-editor", locale});
}
