import {localizedCopy} from "@/lib/marketing/localized-copy";
/**
 * Contact Img Pilot — premium support page. Form submits via mailto (no new API).
 */
import {isAppLocale, type AppLocale} from "@/i18n/routing";

export type ContactFaq = {q: string; a: string};

export type ContactCopy = {
  metaTitle: string;
  metaDescription: string;
  breadcrumbCurrent: string;
  hero: {
    badge: string;
    h1: string;
    paragraph: string;
    heroImageAlt: string;
  };
  form: {
    title: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    submit: string;
    unavailable: string;
    required: string;
  };
  support: {
    eyebrow: string;
    title: string;
    cards: {title: string; body: string}[];
  };
  response: {
    title: string;
    paragraphs: string[];
    points: string[];
  };
  business: {
    title: string;
    body: string;
  };
  faqHeading: string;
  faqs: ContactFaq[];
  cta: {
    title: string;
    exploreCta: string;
    homeCta: string;
  };
};

const en: ContactCopy = {
  metaTitle: "Contact Img Pilot",
  metaDescription:
    "Need help with Img Pilot? Contact our support team for questions about image optimization, accounts and browser-based tools.",
  breadcrumbCurrent: "Contact",
  hero: {
    badge: "CONTACT IMG PILOT",
    h1: "We're Here to Help",
    paragraph:
      "Have a question about our image tools, your account or image processing? Get in touch and we'll help you as quickly as possible.",
    heroImageAlt:
      "Customer support illustration with help desk dashboard, email and browser interface",
  },
  form: {
    title: "Send a message",
    name: "Name",
    email: "Email",
    subject: "Subject",
    message: "Message",
    submit: "Submit",
    unavailable:
      "Support email is not configured in this environment yet (`SUPPORT_EMAIL`).",
    required: "Please complete all fields before submitting.",
  },
  support: {
    eyebrow: "SUPPORT OPTIONS",
    title: "How Can We Help?",
    cards: [
      {
        title: "General Support",
        body: "Questions about guest tools, limits, downloads or getting started on Img Pilot.",
      },
      {
        title: "Technical Issues",
        body: "Upload failures, processing errors, format problems or unexpected tool behavior.",
      },
      {
        title: "Business Enquiries",
        body: "Partnerships, enterprise needs and commercial questions for the product team.",
      },
      {
        title: "Feature Requests",
        body: "Ideas for formats, bulk workflows, integrations or publishing improvements.",
      },
    ],
  },
  response: {
    title: "What to Expect",
    paragraphs: [
      "Messages open in your email client so the request reaches the configured support address. Include enough context (tool name, browser and what you tried) so we can respond accurately.",
    ],
    points: [
      "Typical replies depend on volume — clear subjects help us prioritize",
      "We do not ask for passwords or secret tokens by email",
      "Your message is for support — we do not use these threads for spam marketing",
    ],
  },
  business: {
    title: "Business Enquiries",
    body: "For partnerships or commercial discussions, use the contact form with a clear subject such as “Business enquiry” so the right person can follow up.",
  },
  faqHeading: "Frequently Asked Questions",
  faqs: [
    {
      q: "How do I contact Img Pilot support?",
      a: "Use the form on this page. When SUPPORT_EMAIL is configured, Submit opens your email client with the message ready to send.",
    },
    {
      q: "What if the support email is not configured?",
      a: "The form stays disabled and explains that SUPPORT_EMAIL is missing in this environment.",
    },
    {
      q: "Do I need an account to ask a question?",
      a: "No. Guest users and signed-in accounts can both contact support.",
    },
    {
      q: "What should I include for a technical issue?",
      a: "Tool URL, image format, approximate file size, browser and a short description of the error or unexpected result.",
    },
    {
      q: "Can you restore a deleted guest file?",
      a: "Guest assets are temporary and expire automatically. Keep originals on your device before important jobs.",
    },
    {
      q: "Where do privacy requests go?",
      a: "Use this page with a subject such as “Privacy request” and review the Privacy Policy for how guest and account data are handled.",
    },
    {
      q: "Do you offer phone support?",
      a: "Support is handled through the configured email channel so we can keep a written record of your request.",
    },
    {
      q: "How fast will I get a reply?",
      a: "Response times vary with volume. Clear subjects and complete details usually get faster, more useful answers.",
    },
    {
      q: "Can I request a new image format?",
      a: "Yes. Send a feature request naming the format and your use case. HEIC and AVIF are already noted as future considerations.",
    },
    {
      q: "Is this form a new backend API?",
      a: "No. It prepares a mailto message to the existing SUPPORT_EMAIL configuration and does not add a new contact API.",
    },
  ],
  cta: {
    title: "Prefer to keep optimizing?",
    exploreCta: "Explore Tools",
    homeCta: "Back to Homepage",
  },
};

const ur: ContactCopy = {
  metaTitle: "Img Pilot سے رابطہ کریں",
  metaDescription:
    "Img Pilot میں مدد درکار ہے؟ امیج آپٹیمائزیشن، اکاؤنٹس اور براؤزر ٹولز کے سوالات کے لیے ہماری سپورٹ ٹیم سے رابطہ کریں۔",
  breadcrumbCurrent: "رابطہ",
  hero: {
    badge: "CONTACT IMG PILOT",
    h1: "ہم مدد کے لیے موجود ہیں",
    paragraph:
      "امیج ٹولز، اکاؤنٹ یا پروسیسنگ کے بارے میں سوال ہے؟ رابطہ کریں — ہم جلد سے جلد مدد کرنے کی کوشش کریں گے۔",
    heroImageAlt: "ہیلپ ڈیسک ڈیش بورڈ، ای میل اور براؤزر انٹرفیس والی کسٹمر سپورٹ مثال",
  },
  form: {
    title: "پیغام بھیجیں",
    name: "نام",
    email: "ای میل",
    subject: "موضوع",
    message: "پیغام",
    submit: "جمع کروائیں",
    unavailable: "اس ماحول میں سپورٹ ای میل ابھی ترتیب نہیں (`SUPPORT_EMAIL`)۔",
    required: "جمع کرانے سے پہلے تمام خانے مکمل کریں۔",
  },
  support: {
    eyebrow: "سپورٹ کے اختیارات",
    title: "ہم کیسے مدد کر سکتے ہیں؟",
    cards: [
      {
        title: "عمومی سپورٹ",
        body: "گیسٹ ٹولز، حدود، ڈاؤن لوڈز یا شروع کرنے سے متعلق سوالات۔",
      },
      {
        title: "تکنیکی مسائل",
        body: "اپلوڈ ناکامی، پروسیسنگ خرابیاں، فارمیٹ مسائل یا غیر متوقع رویہ۔",
      },
      {
        title: "کاروباری استفسارات",
        body: "شراکت داری، انٹرپرائز ضروریات اور تجارتی سوالات۔",
      },
      {
        title: "فیچر درخواستیں",
        body: "فارمیٹس، بلک ورک فلو، انٹیگریشنز یا اشاعت کی بہتری کے خیالات۔",
      },
    ],
  },
  response: {
    title: "کیا توقع کریں",
    paragraphs: [
      "پیغام آپ کے ای میل کلائنٹ میں کھلتا ہے تاکہ درخواست ترتیب شدہ سپورٹ ایڈریس تک پہنچے۔ کافی سیاق شامل کریں (ٹول نام، براؤزر اور آپ نے کیا آزمایا)۔",
    ],
    points: [
      "جوابات کا وقت حجم پر منحصر — واضح موضوعات ترجیح میں مدد دیتے ہیں",
      "ہم ای میل پر پاس ورڈ یا خفیہ ٹوکن نہیں مانگتے",
      "آپ کا پیغام سپورٹ کے لیے ہے — ان تھریڈز پر سپیم مارکیٹنگ نہیں",
    ],
  },
  business: {
    title: "کاروباری استفسارات",
    body: "شراکت یا تجارتی بات چیت کے لیے فارم میں واضح موضوع لکھیں جیسے “Business enquiry” تاکہ صحیح شخص فالو اپ کر سکے۔",
  },
  faqHeading: "عمومی سوالات",
  faqs: [
    {
      q: "Img Pilot سپورٹ سے کیسے رابطہ کریں؟",
      a: "اس صفحے کا فارم استعمال کریں۔ جب SUPPORT_EMAIL ترتیب ہو، Submit آپ کے ای میل کلائنٹ میں پیغام تیار کر کے کھولتا ہے۔",
    },
    {
      q: "اگر سپورٹ ای میل ترتیب نہ ہو تو؟",
      a: "فارم غیر فعال رہتا ہے اور بتاتا ہے کہ اس ماحول میں SUPPORT_EMAIL موجود نہیں۔",
    },
    {
      q: "کیا سوال پوچھنے کے لیے اکاؤنٹ درکار ہے؟",
      a: "نہیں۔ گیسٹ صارفین اور سائنڈ ان اکاؤنٹس دونوں سپورٹ سے رابطہ کر سکتے ہیں۔",
    },
    {
      q: "تکنیکی مسئلے میں کیا شامل کریں؟",
      a: "ٹول URL، امیج فارمیٹ، تخمینی فائل سائز، براؤزر اور غلطی یا نتیجے کی مختصر تفصیل۔",
    },
    {
      q: "کیا حذف شدہ گیسٹ فائل بحال ہو سکتی ہے؟",
      a: "گیسٹ اثاثے عارضی ہوتے ہیں اور خودکار ختم ہوتے ہیں۔ اہم کام سے پہلے اصل فائلیں اپنی ڈیوائس پر رکھیں۔",
    },
    {
      q: "پرائیویسی درخواستیں کہاں جائیں؟",
      a: "اس صفحے پر موضوع “Privacy request” رکھیں اور Privacy Policy دیکھیں کہ گیسٹ اور اکاؤنٹ ڈیٹا کیسے ہینڈل ہوتا ہے۔",
    },
    {
      q: "کیا فون سپورٹ ہے؟",
      a: "سپورٹ ترتیب شدہ ای میل چینل سے ہوتی ہے تاکہ آپ کی درخواست کا تحریری ریکارڈ رہے۔",
    },
    {
      q: "جواب کتنی جلدی ملے گا؟",
      a: "وقت حجم کے ساتھ بدلتا ہے۔ واضح موضوعات اور مکمل تفصیل عموماً بہتر جواب دیتی ہے۔",
    },
    {
      q: "کیا نیا امیج فارمیٹ مانگ سکتا ہوں؟",
      a: "ہاں۔ فارمیٹ اور استعمال کا کیس لکھ کر فیچر درخواست بھیجیں۔ HEIC اور AVIF پہلے ہی مستقبل کے طور پر نوٹ ہیں۔",
    },
    {
      q: "کیا یہ فارم نیا بیک اینڈ API ہے؟",
      a: "نہیں۔ یہ موجودہ SUPPORT_EMAIL کے لیے mailto پیغام تیار کرتا ہے اور نیا contact API نہیں جوڑتا۔",
    },
  ],
  cta: {
    title: "آپٹیمائزیشن جاری رکھنا چاہتے ہیں؟",
    exploreCta: "ٹولز دیکھیں",
    homeCta: "ہوم پیج پر واپس",
  },
};

export function getContactCopy(locale: string): ContactCopy {
  return localizedCopy(locale, {en, ur});
}

export function isContactLocale(locale: string): locale is AppLocale {
  return isAppLocale(locale);
}
