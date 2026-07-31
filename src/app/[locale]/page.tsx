import {setRequestLocale} from "next-intl/server";
import {redirect} from "@/i18n/navigation";
import {routing, type AppLocale} from "@/i18n/routing";

type HomePageProps = {
  params: Promise<{locale: string}>;
};

export default async function HomePage({params}: HomePageProps) {
  const {locale: rawLocale} = await params;
  const locale = (routing.locales.includes(rawLocale as AppLocale)
    ? rawLocale
    : routing.defaultLocale) as AppLocale;

  setRequestLocale(locale);
  redirect({href: "/dashboard", locale});
}
