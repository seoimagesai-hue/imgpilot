import {localizedCopy} from "@/lib/marketing/localized-copy";
/**
 * About Img Pilot — premium company / EEAT page.
 * Honest product story only: no fake dates, team photos, or invented stats.
 */
import {isAppLocale, type AppLocale} from "@/i18n/routing";

export type AboutFaq = {q: string; a: string};

export type AboutCopy = {
  metaTitle: string;
  metaDescription: string;
  breadcrumbCurrent: string;
  hero: {
    badge: string;
    h1: string;
    paragraph: string;
    exploreCta: string;
    contactCta: string;
    heroImageAlt: string;
  };
  mission: {
    title: string;
    paragraphs: string[];
  };
  story: {
    title: string;
    paragraphs: string[];
  };
  why: {
    eyebrow: string;
    title: string;
    cards: {
      title: string;
      body: string;
      icon:
        | "fast"
        | "browser"
        | "secure"
        | "formats"
        | "batch"
        | "install"
        | "responsive"
        | "privacy";
    }[];
  };
  values: {
    eyebrow: string;
    title: string;
    cards: {title: string; body: string}[];
  };
  different: {
    eyebrow: string;
    title: string;
    intro: string;
    cards: {title: string; body: string}[];
  };
  formats: {
    eyebrow: string;
    title: string;
    intro: string;
    current: {title: string; body: string}[];
    future: {title: string; body: string}[];
    futureEyebrow: string;
  };
  security: {
    title: string;
    paragraphs: string[];
    points: string[];
  };
  faqHeading: string;
  faqs: AboutFaq[];
  cta: {
    title: string;
    body: string;
    exploreCta: string;
    contactCta: string;
  };
};

const en: AboutCopy = {
  metaTitle: "About Img Pilot",
  metaDescription:
    "Learn more about Img Pilot and our mission to make image optimization faster, easier and more accessible through modern browser-based tools.",
  breadcrumbCurrent: "About",
  hero: {
    badge: "ABOUT IMG PILOT",
    h1: "Making Image Optimization Simple for Everyone",
    paragraph:
      "Img Pilot helps businesses, marketers, designers, developers and everyday users optimize images directly from the browser. Our goal is to make image conversion, compression, resizing and optimization simple, secure and accessible without requiring complicated software.",
    exploreCta: "Explore Tools",
    contactCta: "Contact Us",
    heroImageAlt:
      "Illustration of browser image tools, dashboards and cloud processing for an online image optimization platform",
  },
  mission: {
    title: "Our Mission",
    paragraphs: [
      "Image work should not require installing heavy desktop suites for every small change. Our mission is to make conversion, compression, resizing and cropping simple enough that a marketer can finish a campaign asset, a developer can prepare performant delivery formats and a designer can tighten composition — all in the browser.",
      "We focus on time. Uploading a file, choosing a clear control and downloading a result should take minutes, not a scavenger hunt through export menus. Faster image workflows mean landing pages ship sooner, catalogs stay consistent and creators spend energy on the message instead of the toolchain.",
      "Website performance sits at the center of that promise. Correct formats, honest dimensions and leaner files help pages feel quicker on real networks. When businesses publish clearer media, visitors notice. When developers standardize on modern containers, stacks stay easier to maintain.",
      "Img Pilot exists for that mix of creators, teams and builders who need dependable guest tools today and deeper project workflows when they are ready to sign in — without turning image optimization into a specialist chore.",
    ],
  },
  story: {
    title: "Built Around Real Workflows",
    paragraphs: [
      "Traditional image software is powerful, but it is often slow for everyday web tasks. Opening a full editor to convert a PNG, compress a hero or crop a story frame breaks flow. Browser-based tools remove that friction: open a page, drop a file and keep working.",
      "Modern delivery also changed what “good enough” means. JPG and PNG still matter, while WebP and other formats reshape how teams balance quality and weight. Img Pilot grows a library around those practical jobs — convert, compress, resize, crop and bulk passes — so people can stay in one place instead of hopping between single-purpose utilities.",
      "Privacy shapes the product as much as performance. Guest uploads are meant for temporary work: private storage, clear retention and no public gallery of other people’s files. That approach lets someone try a tool quickly without treating every upload like a permanent archive.",
      "As the library expands, the goal stays steady: honest controls that map to real engines, clear limits and pages that explain when to convert versus compress versus resize. We would rather under-claim than invent milestones. The product improves by covering real formats and workflows people already need, not by stacking empty badges.",
    ],
  },
  why: {
    eyebrow: "WHY IMG PILOT",
    title: "Built for Browser-First Image Work",
    cards: [
      {
        title: "Fast Processing",
        body: "Move from upload to download quickly so campaign and website work stay in flow.",
        icon: "fast",
      },
      {
        title: "Browser Based",
        body: "Run conversion, compression, resize and crop tools without installing desktop suites.",
        icon: "browser",
      },
      {
        title: "Secure Processing",
        body: "Guest files use temporary private storage with controlled access patterns.",
        icon: "secure",
      },
      {
        title: "Modern Formats",
        body: "Work with the formats teams publish today, starting with JPG, PNG and WebP.",
        icon: "formats",
      },
      {
        title: "Batch Tools",
        body: "Bulk compress, resize and convert when a single file is not enough.",
        icon: "batch",
      },
      {
        title: "No Installation",
        body: "Share a link with collaborators instead of standardizing local software versions.",
        icon: "install",
      },
      {
        title: "Responsive Design",
        body: "Use the same tools on large screens and smaller devices when you need a quick fix.",
        icon: "responsive",
      },
      {
        title: "Privacy First",
        body: "Temporary guest retention and automatic cleanup keep short jobs from becoming permanent clutter.",
        icon: "privacy",
      },
    ],
  },
  values: {
    eyebrow: "OUR VALUES",
    title: "What Guides Product Decisions",
    cards: [
      {
        title: "Simplicity",
        body: "Controls should map to real outcomes — convert, compress, resize, crop — without mystery toggles.",
      },
      {
        title: "Privacy",
        body: "Guest work is temporary by design. We prefer clear deletion over silent retention.",
      },
      {
        title: "Performance",
        body: "Image tools exist to help pages load better and media ship lighter.",
      },
      {
        title: "Reliability",
        body: "Honest formats, predictable limits and pages that do not oversell unfinished capabilities.",
      },
    ],
  },
  different: {
    eyebrow: "WHAT MAKES US DIFFERENT",
    title: "A Focused Image Optimization Platform",
    intro:
      "Img Pilot is not a generic file dump or a social gallery. It is a set of browser tools and account workflows built around publishing better images.",
    cards: [
      {
        title: "Tool clusters, not orphan pages",
        body: "Convert, compress, resize and crop hubs connect to format-specific guides so people can find the right job quickly.",
      },
      {
        title: "Guest path and account path",
        body: "Try tools without signing up, then move into projects when you need longer-term workspace features.",
      },
      {
        title: "Honest capability claims",
        body: "Supported ratios, formats and limits match what the product actually runs — including clear “coming later” labels.",
      },
      {
        title: "Privacy-minded temporary storage",
        body: "Guest outputs are for finishing a task, not building a public archive of uploads.",
      },
    ],
  },
  formats: {
    eyebrow: "SUPPORTED FORMATS",
    title: "Formats We Optimize Today",
    intro:
      "Current guest and core tooling centers on the formats most websites still ship every day.",
    current: [
      {
        title: "JPG",
        body: "Photographic images for blogs, catalogs, ads and general web delivery.",
      },
      {
        title: "PNG",
        body: "Graphics and UI assets where crisp edges or transparency matter.",
      },
      {
        title: "WebP",
        body: "Modern web delivery when smaller files and flexible encoding help performance.",
      },
    ],
    futureEyebrow: "Future support",
    future: [
      {
        title: "HEIC",
        body: "Planned for common phone-camera workflows as the tooling matures.",
      },
      {
        title: "AVIF",
        body: "Planned for advanced delivery paths where AVIF fits the stack.",
      },
    ],
  },
  security: {
    title: "Privacy Comes First",
    paragraphs: [
      "Browser-based image tools only earn trust when uploads are treated carefully. Img Pilot is designed so quick optimization jobs do not become permanent copies of your files on a public shelf.",
    ],
    points: [
      "Guest processing is temporary — retention is shown in the tool UI",
      "Automatic deletion removes expired guest originals and outputs",
      "There is no public gallery of other users’ uploads",
      "Uploads use private storage paths rather than open share links by default",
    ],
  },
  faqHeading: "Frequently Asked Questions",
  faqs: [
    {
      q: "What is Img Pilot?",
      a: "Img Pilot is a browser-based platform for converting, compressing, resizing and cropping images for websites, marketing and everyday publishing.",
    },
    {
      q: "Who is Img Pilot for?",
      a: "Businesses, marketers, designers, developers and individuals who need dependable image tools without installing heavy desktop software for every task.",
    },
    {
      q: "Do I need an account to use the tools?",
      a: "Guest tools work without an account, subject to guest limits. Creating an account unlocks projects and longer-term workspace features.",
    },
    {
      q: "Which image formats do you support today?",
      a: "Core workflows focus on JPG, PNG and WebP. HEIC and AVIF are listed as future support as the library expands.",
    },
    {
      q: "Are uploads private?",
      a: "Guest files use temporary private storage and are deleted according to the retention countdown shown in the tool. There is no public gallery of uploads.",
    },
    {
      q: "Is Img Pilot only a compress tool?",
      a: "No. The product includes convert, compress, resize and crop hubs, format-specific pages and bulk tools for multi-file jobs.",
    },
    {
      q: "How is Img Pilot different from desktop editors?",
      a: "Desktop editors are excellent for deep creative work. Img Pilot focuses on fast, browser-based optimization tasks people repeat while publishing to the web.",
    },
    {
      q: "How can I contact the team?",
      a: "Use the Contact page for support and business questions. We prefer clear written requests so we can respond with the right context.",
    },
  ],
  cta: {
    title: "Ready to optimize your images?",
    body: "Explore browser-based tools for conversion, compression, resizing and cropping — or contact us if you need help choosing a workflow.",
    exploreCta: "Explore Tools",
    contactCta: "Contact Us",
  },
};

const ur: AboutCopy = {
  metaTitle: "Img Pilot کے بارے میں",
  metaDescription:
    "Img Pilot کے بارے میں مزید جانیں اور ہماری اس مشن کو سمجھیں کہ جدید براؤزر پر مبنی ٹولز سے امیج آپٹیمائزیشن کو تیز، آسان اور زیادہ قابلِ رسائی بنایا جائے۔",
  breadcrumbCurrent: "تعارف",
  hero: {
    badge: "ABOUT IMG PILOT",
    h1: "امیج آپٹیمائزیشن سب کے لیے آسان بنانا",
    paragraph:
      "Img Pilot کاروباروں، مارکیٹرز، ڈیزائنرز، ڈیولپرز اور روزمرہ صارفین کو براؤزر سے ہی امیجز آپٹیمائز کرنے میں مدد دیتا ہے۔ ہمارا ہدف امیج کنورژن، کمپریشن، ری سائز اور آپٹیمائزیشن کو سادہ، محفوظ اور قابلِ رسائی بنانا ہے — بغیر پیچیدہ سافٹ ویئر کے۔",
    exploreCta: "ٹولز دیکھیں",
    contactCta: "رابطہ کریں",
    heroImageAlt:
      "براؤزر امیج ٹولز، ڈیش بورڈز اور کلاؤڈ پروسیسنگ کی مثال جو آن لائن امیج آپٹیمائزیشن پلیٹ فارم دکھاتی ہے",
  },
  mission: {
    title: "ہمارا مشن",
    paragraphs: [
      "امیج کا کام ہر چھوٹی تبدیلی کے لیے بھاری ڈیسک ٹاپ سوئٹس انسٹال کرنے کا متقاضی نہیں ہونا چاہیے۔ ہمارا مشن کنورژن، کمپریشن، ری سائز اور کراپ کو اتنا سادہ بنانا ہے کہ مارکیٹر مہم کا اثاثہ مکمل کر سکے، ڈیولپر کارکردگی والے فارمیٹس تیار کر سکے اور ڈیزائنر کمپوزیشن سخت کر سکے — سب براؤزر میں۔",
      "ہم وقت پر توجہ دیتے ہیں۔ فائل اپلوڈ کرنا، واضح کنٹرول منتخب کرنا اور نتیجہ ڈاؤن لوڈ کرنا منٹوں کا کام ہونا چاہیے، ایکسپورٹ مینو کی تلاش نہیں۔ تیز امیج ورک فلو کا مطلب ہے لینڈنگ پیجز جلد شائع ہوں، کیٹلاگز مستقل رہیں اور تخلیق کار پیغام پر توانائی لگائیں نہ کہ ٹول چین پر۔",
      "ویب سائٹ کی کارکردگی اس وعدے کے مرکز میں ہے۔ درست فارمیٹس، ایماندار ابعاد اور ہلکی فائلیں حقیقی نیٹ ورکس پر صفحات کو تیز محسوس کراتی ہیں۔ جب کاروبار واضح میڈیا شائع کریں تو زائرین نوٹس کرتے ہیں۔ جب ڈیولپرز جدید کنٹینرز پر معیاری بنیں تو سٹیک برقرار رکھنا آسان رہتا ہے۔",
      "Img Pilot اس مرکب کے لیے موجود ہے — تخلیق کار، ٹیمیں اور بلڈرز جو آج قابلِ اعتماد گیسٹ ٹولز چاہتے ہیں اور جب سائن ان کے لیے تیار ہوں تو گہرے پروجیکٹ ورک فلو — بغیر امیج آپٹیمائزیشن کو ماہرین کا بوجھ بنائے۔",
    ],
  },
  story: {
    title: "حقیقی ورک فلو کے گرد بنایا گیا",
    paragraphs: [
      "روایتی امیج سافٹ ویئر طاقتور ہوتا ہے، مگر روزمرہ ویب کاموں کے لیے اکثر سست لگتا ہے۔ صرف PNG کنورٹ، ہیرو کمپریس یا اسٹوری کراپ کرنے کے لیے پورا ایڈیٹر کھولنا بہاؤ توڑ دیتا ہے۔ براؤزر پر مبنی ٹولز وہ رگڑ کم کرتے ہیں: صفحہ کھولیں، فائل ڈالیں اور کام جاری رکھیں۔",
      "جدید ڈیلیوری نے یہ بھی بدلا کہ “کافی اچھا” کیا ہے۔ JPG اور PNG اب بھی اہم ہیں، جبکہ WebP اور دیگر فارمیٹس معیار اور وزن کا توازن بدل رہے ہیں۔ Img Pilot ان عملی کاموں کے گرد لائبریری بڑھاتا ہے — کنورٹ، کمپریس، ری سائز، کراپ اور بلک پاسز — تاکہ لوگ الگ الگ یوٹیلیٹیز کے درمیان نہ بھٹکیں۔",
      "پرائیویسی مصنوعات کو کارکردگی جتنی ہی شکل دیتی ہے۔ گیسٹ اپلوڈز عارضی کام کے لیے ہیں: نجی اسٹوریج، واضح برقرار رکھنا اور دوسروں کی فائلوں کی عوامی گیلری نہیں۔ یہ نقطۂ نظر بغیر ہر اپلوڈ کو مستقل آرکائیو سمجھے ٹول آزمانے دیتا ہے۔",
      "جیسے لائبریری پھیلتی ہے، ہدف مستحکم رہتا ہے: ایماندار کنٹرولز جو حقیقی انجنز سے جڑیں، واضح حدود اور صفحات جو بتائیں کب کنورٹ، کمپریس یا ری سائز کریں۔ ہم خالی بیجز کے بجائے حقیقی فارمیٹس اور ورک فلو کو ترجیح دیتے ہیں — بغیر فرضی تاریخوں یا اعداد کے۔",
    ],
  },
  why: {
    eyebrow: "IMG PILOT کیوں",
    title: "براؤزر فرسٹ امیج کام کے لیے بنایا گیا",
    cards: [
      {
        title: "تیز پروسیسنگ",
        body: "اپلوڈ سے ڈاؤن لوڈ تک جلدی جائیں تاکہ مہم اور ویب سائٹ کا کام بہاؤ میں رہے۔",
        icon: "fast",
      },
      {
        title: "براؤزر پر مبنی",
        body: "ڈیسک ٹاپ سوئٹس انسٹال کیے بغیر کنورژن، کمپریشن، ری سائز اور کراپ چلائیں۔",
        icon: "browser",
      },
      {
        title: "محفوظ پروسیسنگ",
        body: "گیسٹ فائلیں کنٹرول شدہ رسائی کے ساتھ عارضی نجی اسٹوریج استعمال کرتی ہیں۔",
        icon: "secure",
      },
      {
        title: "جدید فارمیٹس",
        body: "وہ فارمیٹس استعمال کریں جو ٹیمیں آج شائع کرتی ہیں — JPG، PNG اور WebP سے شروع۔",
        icon: "formats",
      },
      {
        title: "بیچ ٹولز",
        body: "جب ایک فائل کافی نہ ہو تو بلک کمپریس، ری سائز اور کنورٹ۔",
        icon: "batch",
      },
      {
        title: "بغیر انسٹالیشن",
        body: "مقامی سافٹ ویئر ورژنز معیاری بنانے کے بجائے تعاون کاروں کے ساتھ لنک شیئر کریں۔",
        icon: "install",
      },
      {
        title: "ریسپانسو ڈیزائن",
        body: "بڑی اسکرینز اور چھوٹی ڈیوائسز پر ایک ہی ٹولز استعمال کریں جب فوری درست کاری درکار ہو۔",
        icon: "responsive",
      },
      {
        title: "پرائیویسی فرسٹ",
        body: "عارضی گیسٹ برقرار رکھنا اور خودکار صفائی مختصر کاموں کو مستقل بیڑے نہیں بننے دیتے۔",
        icon: "privacy",
      },
    ],
  },
  values: {
    eyebrow: "ہماری اقدار",
    title: "مصنوعاتی فیصلوں کی رہنمائی",
    cards: [
      {
        title: "سادگی",
        body: "کنٹرولز حقیقی نتائج سے جڑیں — کنورٹ، کمپریس، ری سائز، کراپ — بغیر پراسرار سوئچز کے۔",
      },
      {
        title: "پرائیویسی",
        body: "گیسٹ کام ڈیزائن کے لحاظ سے عارضی ہے۔ خاموش برقرار رکھنے سے واضح حذف بہتر ہے۔",
      },
      {
        title: "کارکردگی",
        body: "امیج ٹولز اس لیے ہیں کہ صفحات بہتر لوڈ ہوں اور میڈیا ہلکا شائع ہو۔",
      },
      {
        title: "قابلِ اعتمادگی",
        body: "ایماندار فارمیٹس، پیش قیاسی حدود اور ایسے صفحات جو ادھوری صلاحیتوں کو بڑھا چڑھا کر نہ بیچیں۔",
      },
    ],
  },
  different: {
    eyebrow: "ہمیں کیا الگ بناتا ہے",
    title: "مرکوز امیج آپٹیمائزیشن پلیٹ فارم",
    intro:
      "Img Pilot عمومی فائل ڈمپ یا سوشل گیلری نہیں۔ یہ براؤزر ٹولز اور اکاؤنٹ ورک فلو ہیں جو بہتر امیجز شائع کرنے کے گرد بنائے گئے ہیں۔",
    cards: [
      {
        title: "ٹول کلسٹرز، اکیلے صفحات نہیں",
        body: "کنورٹ، کمپریس، ری سائز اور کراپ ہبز فارمیٹ مخصوص رہنمائی سے جڑتے ہیں تاکہ صحیح کام جلدی ملے۔",
      },
      {
        title: "گیسٹ راستہ اور اکاؤنٹ راستہ",
        body: "بغیر سائن اپ ٹولز آزمائیں، پھر جب طویل ورک اسپیس درکار ہو تو پروجیکٹس میں جائیں۔",
      },
      {
        title: "ایماندار صلاحیت کے دعوے",
        body: "معاون ریشو، فارمیٹس اور حدود وہی ہیں جو پروڈکٹ واقعی چلاتا ہے — بشمول واضح “بعد میں” لیبلز۔",
      },
      {
        title: "پرائیویسی ذہن عارضی اسٹوریج",
        body: "گیسٹ آؤٹ پٹس کام مکمل کرنے کے لیے ہیں، اپلوڈز کی عوامی آرکائیو بنانے کے لیے نہیں۔",
      },
    ],
  },
  formats: {
    eyebrow: "معاون فارمیٹس",
    title: "وہ فارمیٹس جو ہم آج آپٹیمائز کرتے ہیں",
    intro: "موجودہ گیسٹ اور بنیادی ٹولنگ ان فارمیٹس پر مرکوز ہے جو زیادہ تر ویب سائٹس روزانہ بھیجتی ہیں۔",
    current: [
      {
        title: "JPG",
        body: "بلاگز، کیٹلاگز، اشتہارات اور عمومی ویب ڈیلیوری کے لیے عکسی امیجز۔",
      },
      {
        title: "PNG",
        body: "گرافکس اور UI اثاثے جہاں تیز کنارے یا شفافیت اہم ہو۔",
      },
      {
        title: "WebP",
        body: "جدید ویب ڈیلیوری جب چھوٹی فائلیں اور لچکدار اینکوڈنگ کارکردگی میں مدد دیں۔",
      },
    ],
    futureEyebrow: "مستقبل کی سپورٹ",
    future: [
      {
        title: "HEIC",
        body: "جب ٹولنگ پختہ ہو تو عام فون کیمرہ ورک فلو کے لیے منصوبہ بند۔",
      },
      {
        title: "AVIF",
        body: "اعلیٰ ڈیلیوری راستوں کے لیے منصوبہ بند جہاں AVIF سٹیک میں فٹ ہو۔",
      },
    ],
  },
  security: {
    title: "پرائیویسی پہلے آتی ہے",
    paragraphs: [
      "براؤزر پر مبنی امیج ٹولز صرف اس وقت اعتماد جیتتے ہیں جب اپلوڈز کا احتیاط سے خیال رکھا جائے۔ Img Pilot اس طرح ڈیزائن ہے کہ فوری آپٹیمائزیشن کام آپ کی فائلوں کی عوامی شیلف پر مستقل کاپیاں نہ بن جائیں۔",
    ],
    points: [
      "گیسٹ پروسیسنگ عارضی ہے — برقرار رکھنا ٹول UI میں دکھایا جاتا ہے",
      "خودکار حذف میعاد ختم گیسٹ اصل اور آؤٹ پٹس ہٹا دیتا ہے",
      "دوسرے صارفین کے اپلوڈز کی کوئی عوامی گیلری نہیں",
      "اپلوڈز ڈیفالٹ پر کھلے شیئر لنکس کے بجائے نجی اسٹوریج راستے استعمال کرتے ہیں",
    ],
  },
  faqHeading: "عمومی سوالات",
  faqs: [
    {
      q: "Img Pilot کیا ہے؟",
      a: "Img Pilot ویب سائٹس، مارکیٹنگ اور روزمرہ اشاعت کے لیے امیجز کنورٹ، کمپریس، ری سائز اور کراپ کرنے کا براؤزر پر مبنی پلیٹ فارم ہے۔",
    },
    {
      q: "Img Pilot کس کے لیے ہے؟",
      a: "کاروبار، مارکیٹرز، ڈیزائنرز، ڈیولپرز اور افراد جو ہر کام کے لیے بھاری ڈیسک ٹاپ سافٹ ویئر انسٹال کیے بغیر قابلِ اعتماد امیج ٹولز چاہتے ہیں۔",
    },
    {
      q: "کیا ٹولز استعمال کے لیے اکاؤنٹ درکار ہے؟",
      a: "گیسٹ ٹولز بغیر اکاؤنٹ کام کرتے ہیں، گیسٹ حدود کے ساتھ۔ اکاؤنٹ بنانے سے پروجیکٹس اور طویل ورک اسپیس کھلتے ہیں۔",
    },
    {
      q: "آج کون سے امیج فارمیٹس سپورٹ ہیں؟",
      a: "بنیادی ورک فلو JPG، PNG اور WebP پر مرکوز ہیں۔ HEIC اور AVIF لائبریری بڑھنے کے ساتھ مستقبل کی سپورٹ کے طور پر درج ہیں۔",
    },
    {
      q: "کیا اپلوڈز نجی ہیں؟",
      a: "گیسٹ فائلیں عارضی نجی اسٹوریج استعمال کرتی ہیں اور ٹول میں دکھائے گئے برقرار رکھنے کے کاؤنٹ ڈاؤن کے مطابق حذف ہوتی ہیں۔ اپلوڈز کی عوامی گیلری نہیں۔",
    },
    {
      q: "کیا Img Pilot صرف کمپریس ٹول ہے؟",
      a: "نہیں۔ مصنوعات میں کنورٹ، کمپریس، ری سائز اور کراپ ہبز، فارمیٹ مخصوص صفحات اور کئی فائلوں کے لیے بلک ٹولز شامل ہیں۔",
    },
    {
      q: "Img Pilot ڈیسک ٹاپ ایڈیٹرز سے کیسے الگ ہے؟",
      a: "ڈیسک ٹاپ ایڈیٹرز گہرے تخلیقی کام کے لیے بہترین ہیں۔ Img Pilot ان تیز براؤزر پر مبنی آپٹیمائزیشن کاموں پر مرکوز ہے جو لوگ ویب پر شائع کرتے وقت دہراتے ہیں۔",
    },
    {
      q: "ٹیم سے کیسے رابطہ کریں؟",
      a: "سپورٹ اور کاروباری سوالات کے لیے Contact صفحہ استعمال کریں۔ ہم واضح تحریری درخواستیں پسند کرتے ہیں تاکہ صحیح سیاق کے ساتھ جواب دے سکیں۔",
    },
  ],
  cta: {
    title: "اپنی امیجز آپٹیمائز کرنے کے لیے تیار؟",
    body: "کنورژن، کمپریشن، ری سائز اور کراپ کے براؤزر ٹولز دیکھیں — یا ورک فلو چننے میں مدد چاہیے تو ہم سے رابطہ کریں۔",
    exploreCta: "ٹولز دیکھیں",
    contactCta: "رابطہ کریں",
  },
};

export function getAboutCopy(locale: string): AboutCopy {
  return localizedCopy(locale, {en, ur});
}

export function isAboutLocale(locale: string): locale is AppLocale {
  return isAppLocale(locale);
}
