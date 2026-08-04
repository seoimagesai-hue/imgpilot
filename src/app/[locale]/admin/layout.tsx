import {setRequestLocale} from "next-intl/server";
import {AdminMobileNav, AdminSidebar} from "@/components/admin/admin-sidebar";
import {isAppLocale} from "@/server/auth/validation";
import {requireSuperAdmin} from "@/server/auth/session";

export const dynamic = "force-dynamic";

export const metadata = {
  robots: {index: false, follow: false},
  title: "Admin",
};

type AdminLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}>;

export default async function AdminLayout({children, params}: AdminLayoutProps) {
  const {locale: rawLocale} = await params;
  const locale = isAppLocale(rawLocale) ? rawLocale : "en";
  setRequestLocale(locale);
  await requireSuperAdmin(locale);

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <AdminSidebar />
      <div className="min-w-0 flex-1 bg-white">
        <AdminMobileNav />
        {children}
      </div>
    </div>
  );
}
