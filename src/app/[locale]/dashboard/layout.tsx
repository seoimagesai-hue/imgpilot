import {setRequestLocale} from "next-intl/server";
import {MobileNav} from "@/components/dashboard/mobile-nav";
import {Sidebar} from "@/components/dashboard/sidebar";
import {isAppLocale} from "@/server/auth/validation";
import {requireUser} from "@/server/auth/session";

export const dynamic = "force-dynamic";

type DashboardLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}>;

export default async function DashboardLayout({children, params}: DashboardLayoutProps) {
  const {locale: rawLocale} = await params;
  const locale = isAppLocale(rawLocale) ? rawLocale : "en";
  setRequestLocale(locale);
  await requireUser(locale);

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <MobileNav />
        {children}
      </div>
    </div>
  );
}
