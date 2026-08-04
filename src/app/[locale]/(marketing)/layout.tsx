import {ConsumerFooter, ConsumerHeader} from "@/components/marketing/public-chrome";

export default function MarketingLayout({children}: {children: React.ReactNode}) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]">
      <ConsumerHeader />
      <div className="flex-1">{children}</div>
      <ConsumerFooter />
    </div>
  );
}
