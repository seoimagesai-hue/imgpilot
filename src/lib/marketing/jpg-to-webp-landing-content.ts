/**
 * JPG → WebP landing — website speed / Core Web Vitals / modern format focus
 * (distinct from resize & compress landings).
 */
import type {AppLocale} from "@/i18n/routing";

export type JpgToWebpFaq = {q: string; a: string};

export type JpgToWebpCopy = {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  breadcrumbParent: {href: "/convert-image"; label: string};
  breadcrumbCurrent: string;
  hero: {
    badge: string;
    paragraph: string;
    trust: string[];
    uploadCta: string;
    heroImageAlt: string;
  };
  guestBar: {
    title: string;
    deletionTitle: string;
    countdownLabel: string;
  };
  upload: {
    heading: string;
    supporting: string;
    chooseLabel: string;
    formatsHint: string;
    features: {title: string; body: string}[];
  };
  intro: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
    imageAlt: string;
  };
  comparison: {
    eyebrow: string;
    title: string;
    intro: string;
    columns: [string, string, string];
    rows: {label: string; jpg: string; webp: string}[];
    explanation: string;
  };
  benefits: {
    eyebrow: string;
    title: string;
    cards: {
      title: string;
      body: string;
      icon: "size" | "speed" | "vitals" | "privacy" | "browser" | "safe";
    }[];
  };
  howTo: {
    eyebrow: string;
    title: string;
    steps: {title: string; body: string}[];
    imageAlt: string;
  };
  whyWebp: {
    title: string;
    paragraphs: string[];
    points: string[];
    note: string;
  };
  useCases: {
    eyebrow: string;
    title: string;
    cards: {title: string; body: string}[];
  };
  tips: {
    eyebrow: string;
    title: string;
    items: string[];
  };
  faqHeading: string;
  faqs: JpgToWebpFaq[];
  related: {
    eyebrow: string;
    title: string;
    tools: {href: string; title: string; body: string}[];
  };
  cta: {
    title: string;
    body: string;
    primaryLabel: string;
    secondaryLabel: string;
    secondaryHref: "/register";
  };
};

const en: JpgToWebpCopy = {
  metaTitle: "Convert JPG to WebP Online Free | SEO Images",
  metaDescription:
    "Convert JPG images to WebP online for faster websites and smaller image files. Secure browser-based conversion with instant download.",
  h1: "Convert JPG to WebP Online",
  breadcrumbParent: {href: "/convert-image", label: "Convert Image"},
  breadcrumbCurrent: "JPG to WebP",
  hero: {
    badge: "JPG TO WEBP CONVERTER",
    paragraph:
      "Convert JPG images into modern WebP format directly in your browser. Reduce file size, improve website performance and create images that load faster while maintaining excellent visual quality.",
    trust: ["Smaller Files", "Faster Websites", "Private Processing", "No Software Required"],
    uploadCta: "Upload JPG",
    heroImageAlt: "Browser interface converting a JPG image card into a smaller WebP image card",
  },
  guestBar: {
    title: "Guest usage",
    deletionTitle: "Automatic deletion",
    countdownLabel: "Temporary files delete automatically in",
  },
  upload: {
    heading: "Upload a JPG Image",
    supporting: "Drag and drop a JPG image, paste from clipboard or browse your computer.",
    chooseLabel: "Choose JPG",
    formatsHint: "JPG · Maximum file size follows guest limits shown above",
    features: [
      {title: "Fast Conversion", body: "Turn a JPG into WebP with the shared convert engine."},
      {title: "Modern WebP Format", body: "Create a web-ready WebP download for modern browsers."},
      {title: "Private Processing", body: "Uploads stay in temporary private storage."},
      {title: "Automatic File Deletion", body: "Guest files are removed after the retention countdown."},
    ],
  },
  intro: {
    eyebrow: "MODERN IMAGE FORMAT",
    title: "Why Convert JPG to WebP?",
    paragraphs: [
      "WebP is a modern image format developed to reduce file size while maintaining high visual quality. Converting JPG images to WebP helps websites load faster, reduces bandwidth usage and improves overall browsing performance.",
      "This converter creates a new WebP image while keeping your original JPG unchanged on your device.",
      "Format conversion is not a substitute for resizing oversized photos or cropping composition. Use those tools first when dimensions or framing still need work.",
    ],
    imageAlt: "JPG and WebP comparison cards showing similar quality with a smaller WebP file size",
  },
  comparison: {
    eyebrow: "JPG VS WEBP",
    title: "How JPG and WebP Compare",
    intro: "Use this table as a practical guide for website delivery — not a promise of exact kilobyte savings on every photo.",
    columns: ["Compare", "JPG", "WebP"],
    rows: [
      {
        label: "Average file size",
        jpg: "Often larger for similar web quality",
        webp: "Often smaller at comparable quality",
      },
      {
        label: "Compression",
        jpg: "Mature lossy photographic encoding",
        webp: "Modern lossy encoding (still-image here)",
      },
      {
        label: "Transparency support",
        jpg: "No alpha channel",
        webp: "Supports transparency in the format",
      },
      {
        label: "Animation",
        jpg: "Still images only",
        webp: "Format can animate; this tool targets stills",
      },
      {
        label: "Browser support",
        jpg: "Nearly universal",
        webp: "Strong on modern browsers",
      },
      {
        label: "Website performance",
        jpg: "Reliable baseline delivery",
        webp: "Usually better bytes and load efficiency",
      },
    ],
    explanation:
      "WebP shines on product pages, blogs and marketing sites where every kilobyte affects mobile LCP. Keep JPG when a partner, email client or legacy CMS still cannot decode WebP.",
  },
  benefits: {
    eyebrow: "WHY CONVERT",
    title: "Faster Delivery Without Desktop Software",
    cards: [
      {
        title: "Smaller File Size",
        body: "WebP often ships fewer bytes than a similar-looking JPG for web layouts.",
        icon: "size",
      },
      {
        title: "Improve Website Speed",
        body: "Lighter images help pages paint sooner, especially on mobile networks.",
        icon: "speed",
      },
      {
        title: "Better Core Web Vitals",
        body: "Reducing image weight supports LCP and overall page experience scores.",
        icon: "vitals",
      },
      {
        title: "Private Processing",
        body: "Files remain temporary and are not published to a public gallery.",
        icon: "privacy",
      },
      {
        title: "No Installation",
        body: "Works in any modern browser on desktop, tablet or mobile.",
        icon: "browser",
      },
      {
        title: "Original Image Protected",
        body: "Download a new WebP file. Your original JPG stays unchanged.",
        icon: "safe",
      },
    ],
  },
  howTo: {
    eyebrow: "THREE SIMPLE STEPS",
    title: "How to Convert JPG to WebP",
    steps: [
      {
        title: "Upload JPG",
        body: "Choose a JPG from your device, drag it into the upload area or paste it from your clipboard.",
      },
      {
        title: "Convert",
        body: "Confirm WebP as the target and run conversion with the shared guest convert engine.",
      },
      {
        title: "Download WebP",
        body: "Preview the result and download the new WebP while keeping the original JPG safe.",
      },
    ],
    imageAlt: "Three steps for uploading a JPG, converting to WebP and downloading the result",
  },
  whyWebp: {
    title: "Why Modern Websites Prefer WebP",
    paragraphs: [
      "Search and performance teams care about how quickly hero images and product grids appear. WebP helps transfer less data without forcing a full redesign of your site.",
      "After conversion, verify real pages on mobile hardware — file size alone is not a Core Web Vitals score.",
    ],
    points: [
      "Faster loading — fewer bytes for many photographic assets",
      "Better Lighthouse score potential — when images dominate LCP",
      "Reduced bandwidth — lower hosting and CDN transfer cost",
      "Improved SEO signals — page experience influences discovery",
      "Better user experience — less waiting on slow connections",
      "Mobile performance — lighter downloads on cellular networks",
    ],
    note: "Many modern websites now serve WebP images whenever supported by the browser because they help pages load more efficiently.",
  },
  useCases: {
    eyebrow: "COMMON USE CASES",
    title: "Where JPG to WebP Helps Most",
    cards: [
      {
        title: "Website Images",
        body: "Ship lighter hero, section and gallery photos for public marketing sites.",
      },
      {
        title: "Blog Images",
        body: "Keep article posts readable and quick without dulling photograph quality.",
      },
      {
        title: "Ecommerce Products",
        body: "Serve catalogue grids that feel snappy while shoppers browse on phones.",
      },
      {
        title: "Landing Pages",
        body: "Protect campaign LCP budgets when paid traffic lands on image-heavy pages.",
      },
    ],
  },
  tips: {
    eyebrow: "BETTER RESULTS",
    title: "Conversion Tips",
    items: [
      "Start with a high-quality JPG master so re-encoding has detail to keep.",
      "Resize before converting if the photo is far larger than the layout box.",
      "Compress WebP afterward only when you still need a smaller delivery budget.",
      "Preview image quality on a real page before a sitewide format flip.",
      "Keep the original JPG as a separate archive and fallback source.",
      "Use WebP for websites where browsers and CDNs already support it.",
    ],
  },
  faqHeading: "Frequently Asked Questions",
  faqs: [
    {
      q: "What is WebP?",
      a: "WebP is a modern still-image format designed for efficient web delivery. This page converts a JPG into a new WebP file using the shared guest convert engine.",
    },
    {
      q: "Does converting JPG to WebP reduce quality?",
      a: "Conversion re-encodes pixels, so results depend on content and quality presets. Preview before publishing and keep a high-quality original.",
    },
    {
      q: "Why is WebP often smaller than JPG?",
      a: "WebP uses newer compression techniques that frequently need fewer bytes for similar visual quality on web photos — exact savings vary by image.",
    },
    {
      q: "Can I convert multiple JPG images at once on this page?",
      a: "This landing is built for single-image conversion. For several files, use Bulk Image Tools when you need a multi-file workflow.",
    },
    {
      q: "Does WebP support transparency when converting from JPG?",
      a: "WebP as a format can store transparency, but JPG sources have no alpha channel, so the converted still starts without transparency.",
    },
    {
      q: "Will my original JPG change after conversion?",
      a: "No. A new WebP is created for download. The JPG on your device remains unchanged.",
    },
    {
      q: "Can I use WebP everywhere after converting?",
      a: "Most modern browsers support WebP, but some email clients and older systems still prefer JPG. Keep a fallback when a partner cannot decode WebP.",
    },
    {
      q: "What are the guest limits for JPG to WebP conversion?",
      a: "Free guest operations and maximum file size appear in the usage bar above the uploader. Higher limits may require an account.",
    },
    {
      q: "Are JPG to WebP uploads private?",
      a: "Guest images use private temporary storage and are deleted automatically according to the retention countdown on the page.",
    },
    {
      q: "What is the difference between JPG and WebP for websites?",
      a: "JPG is the long-standing photographic baseline. WebP is a newer delivery format that often reduces transfer size while looking similar on modern browsers.",
    },
  ],
  related: {
    eyebrow: "CONTINUE EDITING",
    title: "Related Image Tools",
    tools: [
      {href: "/webp-to-jpg", title: "Convert WebP to JPG", body: "Create a JPG fallback when a partner cannot open WebP."},
      {href: "/compress-jpg", title: "Compress JPG", body: "Reduce JPG weight when you must stay on JPEG."},
      {href: "/resize-jpg", title: "Resize JPG", body: "Fix width and height before converting to WebP."},
      {href: "/crop-jpg", title: "Crop JPG", body: "Frame the subject before you change formats."},
      {href: "/png-to-webp", title: "PNG to WebP", body: "Convert graphics and screenshots to WebP."},
      {href: "/bulk-image-tools", title: "Bulk Convert Images", body: "Process several images in one guest workflow."},
    ],
  },
  cta: {
    title: "Ready to Convert Another Image?",
    body: "Upload another JPG or create a free account to unlock more image tools and higher usage limits.",
    primaryLabel: "Convert Another Image",
    secondaryLabel: "Create Free Account",
    secondaryHref: "/register",
  },
};

const ur: JpgToWebpCopy = {
  metaTitle: "آن لائن JPG کو WebP میں تبدیل کریں مفت | SEO Images",
  metaDescription:
    "تیز ویب سائٹس اور چھوٹی امیج فائلوں کے لیے JPG کو آن لائن WebP میں تبدیل کریں۔ محفوظ براؤزر پر مبنی کنورژن اور فوری ڈاؤن لوڈ۔",
  h1: "آن لائن JPG کو WebP میں تبدیل کریں",
  breadcrumbParent: {href: "/convert-image", label: "تصویر تبدیل کریں"},
  breadcrumbCurrent: "JPG to WebP",
  hero: {
    badge: "JPG TO WEBP CONVERTER",
    paragraph:
      "اپنے براؤزر میں ہی JPG تصاویر کو جدید WebP فارمیٹ میں تبدیل کریں۔ فائل سائز کم کریں، ویب سائٹ کارکردگی بہتر بنائیں اور بہترین بصری معیار رکھتے ہوئے تیز لوڈ ہونے والی تصاویر تیار کریں۔",
    trust: ["چھوٹی فائلیں", "تیز ویب سائٹس", "نجی پروسیسنگ", "سافٹ ویئر کی ضرورت نہیں"],
    uploadCta: "JPG اپ لوڈ کریں",
    heroImageAlt: "براؤزر انٹرفیس میں JPG کارڈ کو چھوٹے WebP کارڈ میں تبدیل کرتے ہوئے",
  },
  guestBar: {
    title: "مہمان استعمال",
    deletionTitle: "خودکار حذف",
    countdownLabel: "عارضی فائلیں خود بخود حذف ہوں گی",
  },
  upload: {
    heading: "JPG تصویر اپ لوڈ کریں",
    supporting: "JPG گھسیٹیں، کلپ بورڈ سے چسپاں کریں یا کمپیوٹر سے چنیں۔",
    chooseLabel: "JPG چنیں",
    formatsHint: "JPG · زیادہ سے زیادہ فائل سائز اوپر دکھائی گئی مہمان حد کے مطابق",
    features: [
      {title: "تیز کنورژن", body: "شیئرڈ کنورٹ انجن سے JPG کو WebP بنائیں۔"},
      {title: "جدید WebP فارمیٹ", body: "جدید براؤزرز کے لیے ویب ریڈی WebP ڈاؤن لوڈ کریں۔"},
      {title: "نجی پروسیسنگ", body: "اپ لوڈز عارضی نجی اسٹوریج میں رہتی ہیں۔"},
      {title: "خودکار فائل حذف", body: "برقرار رکھنے کی مدت کے بعد مہمان فائلیں ہٹ جاتی ہیں۔"},
    ],
  },
  intro: {
    eyebrow: "جدید امیج فارمیٹ",
    title: "JPG کو WebP میں کیوں تبدیل کریں؟",
    paragraphs: [
      "WebP ایک جدید امیج فارمیٹ ہے جو اعلیٰ بصری معیار رکھتے ہوئے فائل سائز کم کرنے کے لیے بنایا گیا۔ JPG کو WebP میں بدلنے سے ویب سائٹس تیز لوڈ ہوتی ہیں، بینڈوتھ کم ہوتی ہے اور براؤزنگ بہتر محسوس ہوتی ہے۔",
      "یہ کنورٹر نئی WebP تصویر بناتا ہے جبکہ آپ کی اصل JPG ڈیوائس پر جوں کی توں رہتی ہے۔",
      "فارمیٹ کنورژن بڑے فوٹوز ری سائز کرنے یا کمپوزیشن کراپ کرنے کا متبادل نہیں۔ جب ابعاد یا فریم ابھی درست ہوں تو پہلے وہ ٹولز استعمال کریں۔",
    ],
    imageAlt: "JPG اور WebP موازنہ کارڈز — ملتا جلتا معیار، چھوٹا WebP سائز",
  },
  comparison: {
    eyebrow: "JPG بمقابلہ WebP",
    title: "JPG اور WebP کا موازنہ",
    intro: "یہ جدول ویب ڈیلیوری کے لیے عملی رہنمائی ہے — ہر فوٹو پر عین کلوبائٹ بچت کا وعدہ نہیں۔",
    columns: ["موازنہ", "JPG", "WebP"],
    rows: [
      {
        label: "اوسط فائل سائز",
        jpg: "ملتے جلتے ویب کوالٹی پر اکثر بڑا",
        webp: "ملتے جلتے کوالٹی پر اکثر چھوٹا",
      },
      {
        label: "کمپریشن",
        jpg: "پختہ لاسی فوٹوگرافک انکوڈنگ",
        webp: "جدید لاسی انکوڈنگ (یہاں ابھی بھی تصاویر)",
      },
      {
        label: "شفافیت کی سپورٹ",
        jpg: "الفا چینل نہیں",
        webp: "فارمیٹ شفافیت سپورٹ کرتا ہے",
      },
      {
        label: "اینیمیشن",
        jpg: "صرف اسٹل امیجز",
        webp: "فارمیٹ اینیمیٹ ہو سکتا ہے؛ یہ ٹول اسٹل کے لیے ہے",
      },
      {
        label: "براؤزر سپورٹ",
        jpg: "تقریباً عالمگیر",
        webp: "جدید براؤزرز پر مضبوط",
      },
      {
        label: "ویب سائٹ کارکردگی",
        jpg: "قابلِ اعتماد بیس لائن",
        webp: "عمومی طور پر بہتر بائٹس اور لوڈ",
      },
    ],
    explanation:
      "WebP پروڈکٹ صفحات، بلاگز اور مارکیٹنگ سائٹس پر چمکتا ہے جہاں ہر کلوبائٹ موبائل LCP کو متاثر کرتا ہے۔ جب پارٹنر، ای میل کلائنٹ یا پرانا CMS WebP نہ کھول سکے تو JPG رکھیں۔",
  },
  benefits: {
    eyebrow: "تبدیلی کیوں",
    title: "بغیر ڈیسکٹاپ سافٹ ویئر تیز ڈیلیوری",
    cards: [
      {
        title: "چھوٹا فائل سائز",
        body: "ویب لے آؤٹ کے لیے ملتی جلتی JPG کے مقابلے WebP اکثر کم بائٹس بھیجتا ہے۔",
        icon: "size",
      },
      {
        title: "ویب سائٹ کی رفتار بہتر",
        body: "ہلکی تصاویر صفحات کو جلد دکھانے میں مدد دیتی ہیں، خاص طور پر موبائل نیٹ ورکس پر۔",
        icon: "speed",
      },
      {
        title: "بہتر Core Web Vitals",
        body: "امیج وزن کم کرنا LCP اور صفحے کے مجموعی تجربے میں مدد کر سکتا ہے۔",
        icon: "vitals",
      },
      {
        title: "نجی پروسیسنگ",
        body: "فائلیں عارضی رہتی ہیں اور عوامی گیلری میں نہیں جاتیں۔",
        icon: "privacy",
      },
      {
        title: "بغیر انسٹالیشن",
        body: "ڈیسکٹاپ، ٹیبلیٹ یا موبائل کے جدید براؤزر میں چلتا ہے۔",
        icon: "browser",
      },
      {
        title: "اصل تصویر محفوظ",
        body: "نئی WebP ڈاؤن لوڈ کریں۔ اصل JPG جوں کی توں رہتی ہے۔",
        icon: "safe",
      },
    ],
  },
  howTo: {
    eyebrow: "تین آسان مراحل",
    title: "JPG کو WebP میں کیسے تبدیل کریں",
    steps: [
      {
        title: "JPG اپ لوڈ کریں",
        body: "ڈیوائس سے JPG چنیں، اپ لوڈ ایریا میں گھسیٹیں، یا کلپ بورڈ سے چسپاں کریں۔",
      },
      {
        title: "تبدیل کریں",
        body: "ٹارگٹ WebP تصدیق کریں اور شیئرڈ مہمان کنورٹ انجن چلائیں۔",
      },
      {
        title: "WebP ڈاؤن لوڈ کریں",
        body: "نتیجہ دیکھیں اور اصل JPG محفوظ رکھتے ہوئے نئی WebP ڈاؤن لوڈ کریں۔",
      },
    ],
    imageAlt: "JPG اپ لوڈ، WebP کنورژن اور ڈاؤن لوڈ کے تین مراحل",
  },
  whyWebp: {
    title: "جدید ویب سائٹس WebP کیوں ترجیح دیتی ہیں",
    paragraphs: [
      "سرچ اور پرفارمنس ٹیمیں چاہتی ہیں ہیرو امیجز اور پروڈکٹ گرڈز جلد دکھائیں۔ WebP کم ڈیٹا بھیجنے میں مدد دیتا ہے بغیر پوری سائٹ ری ڈیزائن کیے۔",
      "کنورژن کے بعد حقیقی صفحات موبائل ہارڈویئر پر چیک کریں — صرف فائل سائز Core Web Vitals سکور نہیں۔",
    ],
    points: [
      "تیز لوڈنگ — بہت سی فوٹوگرافک اثاثوں کے لیے کم بائٹس",
      "بہتر Lighthouse امکانات — جب امیجز LCP پر غالب ہوں",
      "کم بینڈوتھ — کم ہوسٹنگ اور CDN ٹرانسفر لاگت",
      "بہتر SEO سگنلز — صفحے کا تجربہ دریافت کو متاثر کرتا ہے",
      "بہتر صارف تجربہ — سست کنکشن پر کم انتظار",
      "موبائل کارکردگی — سیلولر نیٹ ورکس پر ہلکی ڈاؤن لوڈز",
    ],
    note: "بہت سی جدید ویب سائٹس اب براؤزر سپورٹ ہونے پر WebP پیش کرتی ہیں کیونکہ صفحات زیادہ مؤثر طریقے سے لوڈ ہوتے ہیں۔",
  },
  useCases: {
    eyebrow: "عام استعمالات",
    title: "JPG to WebP سب سے زیادہ کہاں مدد کرتا ہے",
    cards: [
      {
        title: "ویب سائٹ امیجز",
        body: "عوامی مارکیٹنگ سائٹس کے لیے ہلکی ہیرو، سیکشن اور گیلری فوٹوز بھیجیں۔",
      },
      {
        title: "بلاگ امیجز",
        body: "مضامین کو پڑھنے میں آسان اور تیز رکھیں بغیر تصویر کا معیار خراب کیے۔",
      },
      {
        title: "ای کامرس پروڈکٹس",
        body: "کیٹلاگ گرڈز موبائل پر تیز محسوس ہوں جب خریدار براؤز کریں۔",
      },
      {
        title: "لینڈنگ پیجز",
        body: "تصویر بھری مہمات پر LCP بجٹ بچائیں جب پیڈ ٹریفک آئے۔",
      },
    ],
  },
  tips: {
    eyebrow: "بہتر نتائج",
    title: "کنورژن کے مشورے",
    items: [
      "اعلیٰ معیار کی اصل JPG سے شروع کریں تاکہ ری انکوڈنگ میں تفصیل رہے۔",
      "اگر فوٹو لے آؤٹ باکس سے بہت بڑی ہو تو کنورٹ سے پہلے ری سائز کریں۔",
      "اگر اب بھی چھوٹی ڈیلیوری درکار ہو تو بعد میں Compress WebP استعمال کریں۔",
      "سائٹ وائیڈ فارمیٹ بدلاؤ سے پہلے حقیقی صفحے پر معیار دیکھیں۔",
      "اصل JPG الگ آرکائیو اور فال بیک ماخذ کے طور پر رکھیں۔",
      "ویب سائٹس کے لیے WebP استعمال کریں جہاں براؤزر اور CDN سپورٹ کریں۔",
    ],
  },
  faqHeading: "عمومی سوالات",
  faqs: [
    {
      q: "WebP کیا ہے؟",
      a: "WebP ویب ڈیلیوری کے لیے جدید اسٹل امیج فارمیٹ ہے۔ یہ صفحہ شیئرڈ مہمان کنورٹ انجن سے JPG کو نئی WebP فائل میں بدلتا ہے۔",
    },
    {
      q: "کیا JPG کو WebP میں بدلنے سے کوالٹی کم ہوتی ہے؟",
      a: "کنورژن پکسلز دوبارہ اینکوڈ کرتا ہے، اس لیے نتیجہ مواد اور کوالٹی پری سیٹ پر منحصر ہے۔ شائع کرنے سے پہلے دیکھیں اور اعلیٰ اصل رکھیں۔",
    },
    {
      q: "WebP اکثر JPG سے چھوٹا کیوں ہوتا ہے؟",
      a: "WebP نئی کمپریشن تکنیک استعمال کرتا ہے جو ویب فوٹوز پر ملتے جلتے بصری معیار کے لیے اکثر کم بائٹس مانگتی ہے — بچت تصویر کے ساتھ بدلتی ہے۔",
    },
    {
      q: "کیا اس صفحے پر کئی JPG ایک ساتھ تبدیل ہو سکتی ہیں؟",
      a: "یہ لینڈنگ سنگل امیج کنورژن کے لیے ہے۔ کئی فائلوں کے لیے Bulk Image Tools استعمال کریں۔",
    },
    {
      q: "کیا JPG سے کنورٹ کرتے وقت WebP شفافیت سپورٹ کرتا ہے؟",
      a: "WebP فارمیٹ شفافیت رکھ سکتا ہے، مگر JPG ماخذ میں الفا نہیں ہوتا، اس لیے کنورٹ شدہ اسٹل شفافیت کے بغیر شروع ہوتا ہے۔",
    },
    {
      q: "کیا کنورژن کے بعد میری اصل JPG بدل جائے گی؟",
      a: "نہیں۔ ڈاؤن لوڈ کے لیے نئی WebP بنتی ہے۔ ڈیوائس پر JPG جوں کی توں رہتی ہے۔",
    },
    {
      q: "کیا کنورژن کے بعد WebP ہر جگہ استعمال ہو سکتا ہے؟",
      a: "زیادہ تر جدید براؤزرز WebP سپورٹ کرتے ہیں، مگر کچھ ای میل کلائنٹس اور پرانے سسٹمز اب بھی JPG چاہتے ہیں۔ جہاں پارٹنر WebP نہ کھول سکے فال بیک رکھیں۔",
    },
    {
      q: "JPG to WebP کنورژن کی مہمان حدود کیا ہیں؟",
      a: "مفت مہمان آپریشنز اور زیادہ سے زیادہ فائل سائز اپ لوڈر کے اوپر استعمال بار میں نظر آتی ہیں۔ اعلیٰ حدود کے لیے اکاؤنٹ درکار ہو سکتا ہے۔",
    },
    {
      q: "کیا JPG to WebP اپ لوڈز نجی ہیں؟",
      a: "مہمان تصاویر نجی عارضی اسٹوریج استعمال کرتی ہیں اور صفحے پر دکھائی گئی برقرار رکھنے کی مدت کے مطابق خودبخود حذف ہوتی ہیں۔",
    },
    {
      q: "ویب سائٹس کے لیے JPG اور WebP میں کیا فرق ہے؟",
      a: "JPG طویل عرصے سے فوٹوگرافک بیس لائن ہے۔ WebP نیا ڈیلیوری فارمیٹ ہے جو جدید براؤزرز پر ملتے جلتے نظر آتے ہوئے اکثر ٹرانسفر سائز کم کرتا ہے۔",
    },
  ],
  related: {
    eyebrow: "مزید ایڈیٹنگ",
    title: "متعلقہ امیج ٹولز",
    tools: [
      {href: "/webp-to-jpg", title: "Convert WebP to JPG", body: "جب پارٹنر WebP نہ کھول سکے تو JPG فال بیک بنائیں۔"},
      {href: "/compress-jpg", title: "Compress JPG", body: "جب JPEG پر رہنا ہو تو JPG وزن کم کریں۔"},
      {href: "/resize-jpg", title: "Resize JPG", body: "WebP میں بدلنے سے پہلے چوڑائی اور اونچائی درست کریں۔"},
      {href: "/crop-jpg", title: "Crop JPG", body: "فارمیٹ بدلنے سے پہلے سبجیکٹ فریم کریں۔"},
      {href: "/png-to-webp", title: "PNG to WebP", body: "گرافکس اور اسکرین شاٹس کو WebP میں بدلیں۔"},
      {href: "/bulk-image-tools", title: "Bulk Convert Images", body: "ایک مہمان ورک فلو میں کئی تصاویر پروسیس کریں۔"},
    ],
  },
  cta: {
    title: "ایک اور تصویر تبدیل کریں؟",
    body: "ایک اور JPG اپ لوڈ کریں یا مزید امیج ٹولز اور اعلیٰ استعمال کی حدود کے لیے مفت اکاؤنٹ بنائیں۔",
    primaryLabel: "ایک اور تصویر تبدیل کریں",
    secondaryLabel: "مفت اکاؤنٹ بنائیں",
    secondaryHref: "/register",
  },
};

export function getJpgToWebpCopy(locale: string): JpgToWebpCopy {
  return locale === "ur" ? ur : en;
}

export function jpgToWebpSeoCompat() {
  const c = en;
  return {
    intro: [
      c.hero.paragraph,
      "Guest sessions stay private on temporary storage, and the download is a new WebP rather than an overwrite of your original JPG.",
      "This landing focuses on modern website delivery — Core Web Vitals, bandwidth and format choice — not resize presets or same-format compress dials.",
    ].join(" "),
    why: [
      c.intro.paragraphs[0],
      c.intro.paragraphs[1],
      "Unlike Resize JPG or Compress JPG, the story here is format modernization for faster pages when browsers support WebP.",
      c.benefits.cards[0]!.body,
      c.whyWebp.note,
    ].join(" "),
    benefits: c.benefits.cards.map((card) => ({title: card.title, body: card.body})),
    howTo: [
      "Upload a JPG image",
      "Confirm WebP as the target format",
      "Convert with the guest engine",
      "Download the WebP file",
    ] as [string, string, string, string],
    technicalTitle: c.whyWebp.title,
    technical: [...c.whyWebp.paragraphs, ...c.whyWebp.points.slice(0, 4), c.comparison.explanation].join(" "),
    faqs: c.faqs,
    ctaLabel: c.cta.primaryLabel,
  };
}

export type JpgToWebpLocale = AppLocale;
