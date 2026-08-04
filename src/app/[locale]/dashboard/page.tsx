import {redirect} from "next/navigation";
import {isAppLocale} from "@/server/auth/validation";

type Props = {params: Promise<{locale: string}>};

/** Legacy dashboard index → consumer account overview. Nested /dashboard/* stays for data retention. */
export default async function DashboardIndexRedirect({params}: Props) {
  const {locale: raw} = await params;
  const locale = isAppLocale(raw) ? raw : "en";
  redirect(`/${locale}/account`);
}
