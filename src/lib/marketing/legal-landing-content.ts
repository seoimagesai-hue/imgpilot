/**
 * Privacy / Terms / Cookies legal presentation models.
 * Privacy & Terms body paragraphs are preserved exactly from the prior stubs.
 */
import type {LegalDocModel} from "@/components/marketing/legal-document-view";

/** Exact prior Privacy stub paragraphs — do not edit wording. */
export const PRIVACY_LEGAL_PARAGRAPHS = [
  "Guest tool uploads are stored in private object storage and associated with a temporary guest session. Guest assets expire about one hour after the session is created. Downloads do not extend expiry. Authenticated projects keep library data according to your account plan and product retention rules.",
  "This is a concise product privacy summary. Professional legal review is still pending before a production paid launch.",
] as const;

/** Exact prior Terms stub paragraphs — do not edit wording. */
export const TERMS_LEGAL_PARAGRAPHS = [
  "Guest tools are provided as-is within published free limits. Do not upload unlawful content. You are responsible for rights to any file you process. Paid features require an active plan when billing is configured; checkout remains unavailable until Stripe Price IDs are approved.",
  "This stub is provided so footer links resolve. Full legal terms still require professional review before production paid launch.",
] as const;

export function getPrivacyDoc(locale: string): LegalDocModel {
  const ur = locale === "ur";
  return {
    path: "/privacy",
    metaTitle: ur ? "پرائیویسی پالیسی | SEO Images" : "Privacy Policy | SEO Images",
    metaDescription: ur
      ? "جانیں کہ SEO Images براؤزر پر مبنی امیج ٹولز استعمال کرتے وقت آپ کی معلومات کیسے جمع، استعمال، ذخیرہ اور محفوظ کرتا ہے۔"
      : "Learn how SEO Images collects, uses, stores and protects your information when you use our browser-based image optimization tools.",
    breadcrumbCurrent: ur ? "پرائیویسی پالیسی" : "Privacy Policy",
    hero: {
      badge: "LEGAL",
      h1: ur ? "پرائیویسی پالیسی" : "Privacy Policy",
      paragraph: ur
        ? "جانیں کہ SEO Images براؤزر پر مبنی امیج آپٹیمائزیشن ٹولز استعمال کرتے وقت آپ کی معلومات کیسے جمع، استعمال، ذخیرہ اور محفوظ کرتا ہے۔"
        : "Learn how SEO Images collects, uses, stores and protects your information when you use our browser-based image optimization tools.",
      heroImageSrc: "/illustrations/privacy-hero.webp",
      heroImageAlt: ur
        ? "پرائیویسی شیلڈ، کلاؤڈ سیکیورٹی اور براؤزر ڈیش بورڈ کی مثال"
        : "Privacy shield, cloud security and browser dashboard illustration",
    },
    metaCards: [
      {
        label: ur ? "آخری اپڈیٹ" : "Last Updated",
        value: ur ? "مصنوعاتی خلاصہ — مکمل قانونی جائزہ زیر زیر" : "Product summary — full legal review pending",
      },
      {
        label: ur ? "موثر تاریخ" : "Effective Date",
        value: ur ? "جب تک یہ مصنوعاتی خلاصہ شائع ہے" : "While this product summary is published",
      },
      {
        label: ur ? "لاگو ہوتا ہے" : "Applies To",
        value: ur ? "گیسٹ ٹولز اور سائنڈ ان اکاؤنٹس" : "Guest tools and signed-in accounts",
      },
    ],
    tocLabel: ur ? "اس صفحے پر" : "On this page",
    sections: [
      {
        id: "overview",
        title: ur ? "جائزہ" : "Overview",
        paragraphs: [PRIVACY_LEGAL_PARAGRAPHS[0]],
      },
      {
        id: "status",
        title: ur ? "قانونی حیثیت" : "Legal status",
        paragraphs: [PRIVACY_LEGAL_PARAGRAPHS[1]],
        callout: ur
          ? "یہ متن سابقہ پرائیویسی خلاصہ ہے — معنی تبدیل نہیں کیے گئے۔"
          : "This keeps the prior privacy summary wording unchanged.",
      },
    ],
    contact: {
      title: ur ? "سوالات؟" : "Questions?",
      body: ur
        ? "پرائیویسی درخواستوں یا سوالات کے لیے سپورٹ سے رابطہ کریں۔"
        : "Contact support for privacy requests or product questions.",
      cta: ur ? "سپورٹ سے رابطہ" : "Contact Support",
    },
  };
}

export function getTermsDoc(locale: string): LegalDocModel {
  const ur = locale === "ur";
  return {
    path: "/terms",
    metaTitle: ur ? "شرائط و ضوابط | SEO Images" : "Terms & Conditions | SEO Images",
    metaDescription: ur
      ? "SEO Images گیسٹ ٹولز اور اکاؤنٹس کے استعمال کی شرائط۔"
      : "Terms of use for SEO Images guest tools and accounts.",
    breadcrumbCurrent: ur ? "شرائط و ضوابط" : "Terms & Conditions",
    hero: {
      badge: "LEGAL",
      h1: ur ? "شرائط و ضوابط" : "Terms & Conditions",
      paragraph: ur
        ? "SEO Images گیسٹ ٹولز اور اکاؤنٹس استعمال کرنے سے پہلے ان شرائط کو پڑھیں۔"
        : "Read these terms before using SEO Images guest tools and accounts.",
      heroImageSrc: "/illustrations/terms-hero.webp",
      heroImageAlt: ur
        ? "ڈیجیٹل معاہدہ، دستاویزات اور سیکیورٹی شیلڈ کی مثال"
        : "Digital agreement, documents and security shield illustration",
    },
    metaCards: [
      {
        label: ur ? "آخری اپڈیٹ" : "Last Updated",
        value: ur ? "مصنوعاتی سٹب — مکمل قانونی جائزہ جاری" : "Product stub — full legal review pending",
      },
      {
        label: ur ? "موثر تاریخ" : "Effective Date",
        value: ur ? "جب تک یہ سٹب شائع ہے" : "While this stub is published",
      },
      {
        label: ur ? "لاگو ہوتا ہے" : "Applies To",
        value: ur ? "تمام SEO Images صارفین" : "All SEO Images users",
      },
    ],
    tocLabel: ur ? "اس صفحے پر" : "On this page",
    sections: [
      {
        id: "overview",
        title: ur ? "جائزہ" : "Overview",
        paragraphs: [TERMS_LEGAL_PARAGRAPHS[0]],
      },
      {
        id: "status",
        title: ur ? "قانونی حیثیت" : "Legal status",
        paragraphs: [TERMS_LEGAL_PARAGRAPHS[1]],
        callout: ur
          ? "یہ متن سابقہ شرائط سٹب ہے — معنی تبدیل نہیں کیے گئے۔"
          : "This keeps the prior terms stub wording unchanged.",
      },
    ],
    contact: {
      title: ur ? "سوالات؟" : "Questions?",
      body: ur
        ? "شرائط کے بارے میں سوال ہو تو سپورٹ سے رابطہ کریں۔"
        : "Contact support if you have questions about these terms.",
      cta: ur ? "سپورٹ سے رابطہ" : "Contact Support",
    },
  };
}

export function getCookiesDoc(locale: string): LegalDocModel {
  const ur = locale === "ur";
  return {
    path: "/cookies",
    metaTitle: ur ? "کوکی پالیسی | SEO Images" : "Cookie Policy | SEO Images",
    metaDescription: ur
      ? "جانیں کہ SEO Images ضروری کوکیز جیسے گیسٹ سیشن کوکی کیسے استعمال کرتا ہے۔"
      : "Learn how SEO Images uses essential cookies such as the guest session cookie.",
    breadcrumbCurrent: ur ? "کوکی پالیسی" : "Cookie Policy",
    hero: {
      badge: "LEGAL",
      h1: ur ? "کوکی پالیسی" : "Cookie Policy",
      paragraph: ur
        ? "یہ صفحہ بتاتا ہے کہ SEO Images براؤزر میں کون سی کوکیز استعمال کرتا ہے اور کیوں۔"
        : "This page explains which cookies SEO Images uses in your browser and why.",
      heroImageSrc: "/illustrations/cookies-hero.webp",
      heroImageAlt: ur
        ? "براؤزر کوکیز، پرائیویسی سیٹنگز اور رضامندی بینر کی مثال"
        : "Browser cookies, privacy settings and consent banner illustration",
    },
    metaCards: [
      {
        label: ur ? "آخری اپڈیٹ" : "Last Updated",
        value: ur ? "ایماندار مصنوعاتی خلاصہ — قانونی جائزہ زیر پر" : "Honest product summary — legal review pending",
      },
      {
        label: ur ? "موثر تاریخ" : "Effective Date",
        value: ur ? "جب تک یہ خلاصہ شائع ہے" : "While this summary is published",
      },
      {
        label: ur ? "لاگو ہوتا ہے" : "Applies To",
        value: ur ? "SEO Images ویب سائٹ زائرین" : "Visitors to the SEO Images website",
      },
    ],
    tocLabel: ur ? "اس صفحے پر" : "On this page",
    sections: [
      {
        id: "overview",
        title: ur ? "جائزہ" : "Overview",
        paragraphs: [
          ur
            ? "کوکیز چھوٹی ٹیکسٹ فائلیں ہیں جو ویب سائٹ آپ کے براؤزر میں محفوظ کر سکتی ہے۔ SEO Images فی الحال بنیادی طور پر ضروری کوکیز استعمال کرتا ہے تاکہ گیسٹ ٹول سیشنز کام کریں۔"
            : "Cookies are small text files a website may store in your browser. SEO Images primarily uses essential cookies so guest tool sessions can work.",
        ],
      },
      {
        id: "categories",
        title: ur ? "کوکی کیٹیگریز" : "Cookie categories",
        cards: [
          {
            title: ur ? "ضروری" : "Essential",
            body: ur
              ? "ٹول سیشن برقرار رکھنے اور بنیادی سیکیورٹی کے لیے درکار — مثال: گیسٹ سیشن کوکی۔"
              : "Required for tool sessions and basic security — for example the guest session cookie.",
          },
          {
            title: ur ? "ترجیحات" : "Preferences",
            body: ur
              ? "اگر مستقبل میں زبان یا UI ترجیحات الگ کوکی میں محفوظ ہوں تو یہاں بیان کی جائیں گی۔"
              : "If locale or UI preferences are stored in a dedicated cookie later, they will be listed here.",
          },
          {
            title: ur ? "تجزیات" : "Analytics",
            body: ur
              ? "اس خلاصے میں کوئی تھرڈ پارٹی analytics کوکی پروموٹ نہیں کی جا رہی جب تک پروڈکٹ واضح طور پر اسے فعال نہ کرے۔"
              : "This summary does not advertise third-party analytics cookies unless the product explicitly enables them.",
          },
          {
            title: ur ? "مارکیٹنگ" : "Marketing",
            body: ur
              ? "SEO Images اس خلاصے میں اشتہاری ری ٹارگٹنگ کوکیز کا دعویٰ نہیں کرتا۔"
              : "SEO Images does not claim advertising retargeting cookies in this summary.",
          },
        ],
      },
      {
        id: "essential",
        title: ur ? "ضروری کوکیز جو ہم استعمال کرتے ہیں" : "Essential cookies we use",
        bullets: [
          ur
            ? "`seoimages_guest` (یا ماحول میں ترتیب شدہ گیسٹ کوکی نام) — HttpOnly گیسٹ سیشن ٹوکن تاکہ اپلوڈ اور جابز اسی زائر سے جڑیں。"
            : "`seoimages_guest` (or the configured guest cookie name) — HttpOnly guest session token so uploads and jobs stay tied to the same visitor.",
          ur
            ? "سائنڈ ان اکاؤنٹس کے لیے آتھ سیشن کوکیز Auth.js / NextAuth کنفیگریشن کے مطابق سیٹ ہو سکتی ہیں جب آپ لاگ اِن ہوں۔"
            : "Signed-in account auth session cookies may be set by the Auth.js / NextAuth configuration when you log in.",
        ],
        callout: ur
          ? "گیسٹ اثاثے عارضی ہیں؛ کوکی سیشن ختم ہونے یا برقرار رکھنے کی پالیسی کے بعد پروسیسنگ جاری نہیں رہتی۔"
          : "Guest assets are temporary; processing does not continue after the session expires under product retention rules.",
      },
      {
        id: "control",
        title: ur ? "اپنی کوکیز کیسے کنٹرول کریں" : "How to control cookies",
        paragraphs: [
          ur
            ? "آپ براؤزر سیٹنگز سے کوکیز صاف یا بلاک کر سکتے ہیں۔ ضروری گیسٹ کوکی بلاک کرنے سے بغیر اکاؤنٹ ٹولز کام کرنا بند کر سکتے ہیں۔"
            : "You can clear or block cookies in your browser settings. Blocking the essential guest cookie may stop guest tools from working.",
        ],
      },
      {
        id: "status",
        title: ur ? "قانونی حیثیت" : "Legal status",
        paragraphs: [
          ur
            ? "یہ ایماندار مصنوعاتی کوکی خلاصہ ہے۔ پیشہ ورانہ قانونی جائزہ ادا شدہ پروڈکشن لانچ سے پہلے ابھی درکار ہے۔"
            : "This is an honest product cookie summary. Professional legal review is still pending before a production paid launch.",
        ],
      },
    ],
    contact: {
      title: ur ? "سوالات؟" : "Questions?",
      body: ur
        ? "کوکیز یا پرائیویسی کے بارے میں پوچھیں تو سپورٹ سے رابطہ کریں۔"
        : "Contact support if you have questions about cookies or privacy.",
      cta: ur ? "سپورٹ سے رابطہ" : "Contact Support",
    },
  };
}
