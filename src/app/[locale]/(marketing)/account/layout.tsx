import {setRequestLocale} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {isAppLocale} from "@/server/auth/validation";
import {requireUser} from "@/server/auth/session";

export const dynamic = "force-dynamic";

export const metadata = {
  robots: {index: false, follow: false},
};

const NAV = [
  {href: "/account", label: "Overview"},
  {href: "/account/usage", label: "Usage"},
  {href: "/account/billing", label: "Billing"},
  {href: "/account/history", label: "History"},
  {href: "/account/settings", label: "Settings"},
] as const;

type Props = Readonly<{
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}>;

export default async function AccountLayout({children, params}: Props) {
  const {locale: raw} = await params;
  const locale = isAppLocale(raw) ? raw : "en";
  setRequestLocale(locale);
  await requireUser(locale, "/account");

  return (
    <div className="marketing-container py-8 sm:py-10">
      <nav
        aria-label="Account"
        className="mb-8 flex flex-wrap gap-2 border-b border-[var(--border)] pb-4 text-sm"
      >
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg px-3 py-1.5 text-[var(--body)] hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
