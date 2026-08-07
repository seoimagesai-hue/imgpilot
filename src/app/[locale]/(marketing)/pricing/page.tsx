import type {Metadata} from "next";
import {setRequestLocale} from "next-intl/server";
import {PricingExperience} from "@/components/billing/pricing-experience";
import type {AppLocale} from "@/i18n/routing";
import {isAppLocale} from "@/server/auth/validation";
import {getPublicPricingView} from "@/server/billing/pricing-view";
import {buildPublicMetadata} from "@/server/marketing/seo";

type PageProps = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale: raw} = await params;
  const locale = (isAppLocale(raw) ? raw : "en") as AppLocale;
  return buildPublicMetadata({
    locale,
    path: "/pricing",
    title: "Pricing — Img Pilot Guest, Free & Pro Plans",
    description:
      "Compare Img Pilot Guest, Free and Pro plans. See processing limits, bulk capacity, retention and when paid checkout is available.",
    index: true,
  });
}

export default async function PricingPage({params}: PageProps) {
  const {locale: raw} = await params;
  const locale = isAppLocale(raw) ? raw : "en";
  setRequestLocale(locale);
  const view = getPublicPricingView();

  return <PricingExperience view={view} />;
}
