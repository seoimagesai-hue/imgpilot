import {localizedCopy} from "@/lib/marketing/localized-copy";
/**
 * Compress WebP landing — further optimize already-modern WebP for web performance
 * (distinct from Compress JPG photos and Compress PNG transparency/logos).
 */
import type {AppLocale} from "@/i18n/routing";

export type CompressWebpFaq = {q: string; a: string};

export type CompressWebpCopy = {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  breadcrumbParent: {href: "/compress-image"; label: string};
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
  whyCompress: {
    title: string;
    paragraphs: string[];
    improvementsTitle: string;
    points: string[];
  };
  benefits: {
    eyebrow: string;
    title: string;
    cards: {
      title: string;
      body: string;
      icon: "size" | "speed" | "bandwidth" | "mobile" | "privacy" | "safe";
    }[];
  };
  howTo: {
    eyebrow: string;
    title: string;
    steps: {title: string; body: string}[];
    imageAlt: string;
  };
  guide: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
    topics: string[];
    tableCaption: string;
    recommendations: {name: string; bestFor: string; rows: string[]}[];
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
  faqs: CompressWebpFaq[];
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

const en: CompressWebpCopy = {
  metaTitle: "Compress WebP Images Online Free | Img Pilot",
  metaDescription:
    "Compress WebP images online to reduce file size while maintaining quality. Improve website speed with secure browser-based WebP optimization.",
  h1: "Compress WebP Images Online",
  breadcrumbParent: {href: "/compress-image", label: "Compress Image"},
  breadcrumbCurrent: "Compress WebP Images Online",
  hero: {
    badge: "WEBP IMAGE COMPRESSOR",
    paragraph:
      "Reduce WebP image file size while maintaining excellent visual quality. Optimize images for websites, landing pages, ecommerce stores and mobile applications directly from your browser.",
    trust: [
      "Smaller WebP Files",
      "Faster Website Loading",
      "Secure Processing",
      "No Software Required",
    ],
    uploadCta: "Upload WebP",
    heroImageAlt:
      "Browser interface compressing a large WebP file into a much smaller optimized WebP with a quality slider",
  },
  guestBar: {
    title: "Guest usage",
    deletionTitle: "Automatic deletion",
    countdownLabel: "Temporary files delete automatically in",
  },
  upload: {
    heading: "Upload a WebP Image",
    supporting: "Drag and drop your WebP image, paste it from the clipboard or browse your device.",
    chooseLabel: "Choose WebP",
    formatsHint: "WebP · Maximum file size follows guest limits shown above",
    features: [
      {title: "Modern WebP Optimization", body: "Re-encode WebP with guest quality presets for lighter delivery."},
      {title: "Private Processing", body: "Uploads stay in temporary private storage."},
      {title: "Automatic File Deletion", body: "Guest files are removed after the retention countdown."},
      {title: "Original File Protected", body: "Download a new WebP. Your original stays unchanged."},
    ],
  },
  intro: {
    eyebrow: "MODERN IMAGE OPTIMIZATION",
    title: "Reduce WebP File Size for Better Website Performance",
    paragraphs: [
      "WebP already offers excellent compression compared to older image formats, but many exported WebP images still contain unnecessary data or higher quality settings than required.",
      "This WebP compressor reduces file size while maintaining clear image quality, helping websites load faster and consume less bandwidth.",
      "The original WebP image remains unchanged on your device.",
    ],
    imageAlt:
      "Before and after WebP compression showing a large original file reduced to a much smaller optimized WebP",
  },
  whyCompress: {
    title: "Why Compress an Already Efficient Format?",
    paragraphs: [
      "Many design tools export WebP files at unnecessarily high quality settings.",
      "Reducing quality slightly can significantly reduce file size while producing almost no visible difference.",
    ],
    improvementsTitle: "Smaller WebP files improve:",
    points: [
      "Website speed",
      "Core Web Vitals",
      "Mobile performance",
      "CDN bandwidth",
      "Storage efficiency",
    ],
  },
  benefits: {
    eyebrow: "WHY COMPRESS WEBP",
    title: "Make Modern WebP Even Lighter",
    cards: [
      {
        title: "Smaller File Sizes",
        body: "Trim oversized WebP exports that still waste kilobytes on production pages.",
        icon: "size",
      },
      {
        title: "Faster Websites",
        body: "Lighter hero and product images help pages paint sooner for visitors.",
        icon: "speed",
      },
      {
        title: "Lower Bandwidth Usage",
        body: "Reduce transfer cost for CDNs, mobile users and high-traffic campaigns.",
        icon: "bandwidth",
      },
      {
        title: "Better Mobile Performance",
        body: "Smaller downloads matter most on cellular networks and mid-range devices.",
        icon: "mobile",
      },
      {
        title: "Private Processing",
        body: "Files remain temporary and are not published to a public gallery.",
        icon: "privacy",
      },
      {
        title: "Original File Protected",
        body: "Download a new optimized WebP. Your source file stays unchanged.",
        icon: "safe",
      },
    ],
  },
  howTo: {
    eyebrow: "THREE SIMPLE STEPS",
    title: "How to Compress WebP Images",
    steps: [
      {
        title: "Upload WebP",
        body: "Choose a WebP from your device, drag it into the upload area or paste it from your clipboard.",
      },
      {
        title: "Compress",
        body: "Pick a quality preset that balances visual clarity with file weight, then run compression.",
      },
      {
        title: "Download Optimized WebP",
        body: "Preview the result, compare file size, then download the lighter WebP.",
      },
    ],
    imageAlt: "Three steps for uploading WebP, compressing with quality controls and downloading the result",
  },
  guide: {
    eyebrow: "COMPRESSION GUIDE",
    title: "Understanding WebP Compression",
    paragraphs: [
      "WebP can be encoded with lossy or more protective settings depending on the source and presets. Guest compression keeps the WebP container — it does not silently convert to JPG.",
      "Use preview to judge text edges, product detail and soft gradients before replacing production assets.",
    ],
    topics: [
      "Lossy WebP reduces bytes by allowing small visual tradeoffs — often ideal for photos and marketing scenes.",
      "Lossless-leaning WebP preserves more detail but may stay heavier; useful when crisp edges matter most.",
      "Quality settings let you trade detail for weight without inventing an exact kilobyte target.",
      "Visual comparison in the workspace helps you stop when further passes stop helping.",
      "Compression ratio varies by content — screenshots, photos and UI art behave differently.",
      "Recommended quality levels below are practical starting points for common web workflows.",
    ],
    tableCaption: "Recommended quality levels",
    recommendations: [
      {
        name: "Maximum Quality",
        bestFor: "Best for photography and high-detail product shots.",
        rows: ["Prioritize clarity", "Smaller savings", "Use when every pixel detail matters"],
      },
      {
        name: "Balanced",
        bestFor: "Best for websites and most marketing pages.",
        rows: ["Strong size reduction", "Clear everyday quality", "Default starting point"],
      },
      {
        name: "High Compression",
        bestFor: "Best for fast loading pages and thumbnails.",
        rows: ["Aggressive weight cuts", "Preview carefully", "Great for cards and lists"],
      },
    ],
  },
  useCases: {
    eyebrow: "COMMON USE CASES",
    title: "Where Compress WebP Helps Most",
    cards: [
      {
        title: "Landing Pages",
        body: "Tighten campaign heroes and section art that still feel heavy after export.",
      },
      {
        title: "Ecommerce Stores",
        body: "Ship lighter product WebP galleries without leaving the modern format.",
      },
      {
        title: "Blogs",
        body: "Keep post images readable while cutting bandwidth on content-heavy sites.",
      },
      {
        title: "Mobile Apps",
        body: "Reduce asset packs and in-app marketing creatives delivered as WebP.",
      },
    ],
  },
  tips: {
    eyebrow: "BETTER RESULTS",
    title: "Optimization Tips",
    items: [
      "Use balanced quality for websites as your first pass.",
      "Preview before downloading — stop when quality drops more than bytes save.",
      "Resize oversized images first when the layout box is much smaller than the file.",
      "Compress hero images carefully; they often dominate LCP.",
      "Keep original files as masters before replacing CDN or CMS assets.",
      "Test page speed after replacing images on staging or production.",
    ],
  },
  faqHeading: "Frequently Asked Questions",
  faqs: [
    {
      q: "Can WebP be compressed further?",
      a: "Yes. Many exported WebP files use higher quality settings than websites need. A careful re-encode can still cut file size while looking nearly identical.",
    },
    {
      q: "Will WebP quality decrease after compression?",
      a: "Depending on the preset, compression can be lossy. Always preview important details before replacing production assets.",
    },
    {
      q: "What is the difference between lossy and lossless WebP compression?",
      a: "Lossy WebP allows small visual tradeoffs for much smaller files. More protective settings keep more detail but often remain heavier. Guest presets map to practical quality levels rather than inventing unsupported modes.",
    },
    {
      q: "Is WebP already compressed enough for websites?",
      a: "Not always. Designer exports and AI-generated canvases can still be oversized. Compress when the download still wastes LCP or bandwidth budget.",
    },
    {
      q: "Can I compress multiple WebP files at once?",
      a: "Use Bulk Image Tools when multi-file compression is available within guest or account limits.",
    },
    {
      q: "Are Compress WebP uploads private?",
      a: "Guest images use private temporary storage and are deleted automatically according to the retention countdown on the page.",
    },
    {
      q: "What are the guest limits for Compress WebP?",
      a: "Free guest operations and maximum file size appear in the usage bar above the uploader. Higher limits may require an account.",
    },
    {
      q: "What is the maximum upload size for Compress WebP?",
      a: "The maximum size matches the guest upload limit shown in the usage bar. Oversized files are rejected before compression starts.",
    },
    {
      q: "Why are some WebP files still large?",
      a: "High quality settings, large pixel dimensions and detailed photography all keep WebP heavy. Resize first when the layout does not need the full resolution.",
    },
    {
      q: "Will Compress WebP overwrite the original image?",
      a: "No. Compression creates a new optimized WebP download. The original file on your device stays unchanged.",
    },
  ],
  related: {
    eyebrow: "CONTINUE OPTIMIZING",
    title: "Related Image Tools",
    tools: [
      {href: "/resize-webp", title: "Resize WebP", body: "Fix dimensions before or after compression."},
      {href: "/webp-to-jpg", title: "Convert WebP to JPG", body: "Create JPG when partners cannot accept WebP."},
      {href: "/webp-to-png", title: "Convert WebP to PNG", body: "Get an editable PNG master when design tools need it."},
      {href: "/compress-jpg", title: "Compress JPG", body: "Optimize photographic JPG masters for the web."},
      {href: "/compress-png", title: "Compress PNG", body: "Reduce PNG weight while keeping transparency."},
      {href: "/bulk-image-tools", title: "Bulk Compress Images", body: "Process several images in one guest workflow."},
    ],
  },
  cta: {
    title: "Ready to Compress Another WebP?",
    body: "Upload another WebP image or create a free account for additional image optimization tools and higher usage limits.",
    primaryLabel: "Compress Another Image",
    secondaryLabel: "Create Free Account",
    secondaryHref: "/register",
  },
};

const ur: CompressWebpCopy = {
  metaTitle: "آن لائن WebP امیجز کمپریس کریں مفت | Img Pilot",
  metaDescription:
    "کوالٹی برقرار رکھتے ہوئے WebP تصاویر آن لائن کمپریس کریں۔ محفوظ براؤزر پر مبنی WebP آپٹیمائزیشن سے ویب سائٹ کی رفتار بہتر بنائیں۔",
  h1: "آن لائن WebP امیجز کمپریس کریں",
  breadcrumbParent: {href: "/compress-image", label: "تصویر کمپریس کریں"},
  breadcrumbCurrent: "Compress WebP Images Online",
  hero: {
    badge: "WEBP IMAGE COMPRESSOR",
    paragraph:
      "شاندار بصری معیار برقرار رکھتے ہوئے WebP امیج فائل سائز کم کریں۔ ویب سائٹس، لینڈنگ پیجز، ای کامرس اسٹورز اور موبائل ایپس کے لیے براؤزر سے ہی آپٹیمائز کریں۔",
    trust: ["چھوٹی WebP فائلیں", "تیز ویب سائٹ لوڈنگ", "محفوظ پروسیسنگ", "سافٹ ویئر کی ضرورت نہیں"],
    uploadCta: "WebP اپ لوڈ کریں",
    heroImageAlt: "براؤزر میں بڑی WebP کو کوالٹی سلائڈر کے ساتھ بہت چھوٹی آپٹیمائزڈ WebP میں کمپریس کرتے ہوئے",
  },
  guestBar: {
    title: "مہمان استعمال",
    deletionTitle: "خودکار حذف",
    countdownLabel: "عارضی فائلیں خود بخود حذف ہوں گی",
  },
  upload: {
    heading: "WebP تصویر اپ لوڈ کریں",
    supporting: "WebP گھسیٹیں، کلپ بورڈ سے چسپاں کریں یا اپنی ڈیوائس سے چنیں۔",
    chooseLabel: "WebP چنیں",
    formatsHint: "WebP · زیادہ سے زیادہ فائل سائز اوپر دکھائی گئی مہمان حد کے مطابق",
    features: [
      {title: "جدید WebP آپٹیمائزیشن", body: "ہلکی ڈیلیوری کے لیے مہمان کوالٹی پری سیٹس سے WebP دوبارہ انکوڈ کریں۔"},
      {title: "نجی پروسیسنگ", body: "اپ لوڈز عارضی نجی اسٹوریج میں رہتی ہیں۔"},
      {title: "خودکار فائل حذف", body: "برقرار رکھنے کی مدت کے بعد مہمان فائلیں ہٹ جاتی ہیں۔"},
      {title: "اصل فائل محفوظ", body: "نئی WebP ڈاؤن لوڈ کریں۔ اصل جوں کی توں رہتی ہے۔"},
    ],
  },
  intro: {
    eyebrow: "جدید امیج آپٹیمائزیشن",
    title: "بہتر ویب سائٹ کارکردگی کے لیے WebP فائل سائز کم کریں",
    paragraphs: [
      "WebP پہلے ہی پرانے فارمیٹس سے بہتر کمپریشن دیتا ہے، مگر بہت سی ایکسپورٹ شدہ WebP فائلوں میں غیر ضروری ڈیٹا یا درکار سے زیادہ کوالٹی سیٹنگز ہوتی ہیں۔",
      "یہ WebP کمپریسر واضح امیج کوالٹی برقرار رکھتے ہوئے فائل سائز کم کرتا ہے تاکہ ویب سائٹس تیز لوڈ ہوں اور کم بینڈوتھ استعمال کریں۔",
      "اصل WebP تصویر آپ کی ڈیوائس پر جوں کی توں رہتی ہے۔",
    ],
    imageAlt: "WebP کمپریشن سے پہلے اور بعد: بڑی اصل فائل بہت چھوٹی آپٹیمائزڈ WebP میں",
  },
  whyCompress: {
    title: "پہلے سے مؤثر فارمیٹ کو مزید کیوں کمپریس کریں؟",
    paragraphs: [
      "بہت سے ڈیزائن ٹولز WebP فائلیں غیر ضروری طور پر اعلیٰ کوالٹی سیٹنگز پر ایکسپورٹ کرتے ہیں۔",
      "کوالٹی تھوڑی کم کرنے سے فائل سائز نمایاں کم ہو سکتا ہے جبکہ نظر آنے والا فرق تقریباً نہ ہو۔",
    ],
    improvementsTitle: "چھوٹی WebP فائلیں بہتر کرتی ہیں:",
    points: [
      "ویب سائٹ کی رفتار",
      "Core Web Vitals",
      "موبائل کارکردگی",
      "CDN بینڈوتھ",
      "اسٹوریج کی کارکردگی",
    ],
  },
  benefits: {
    eyebrow: "WebP کیوں کمپریس کریں",
    title: "جدید WebP کو مزید ہلکا بنائیں",
    cards: [
      {
        title: "چھوٹے فائل سائز",
        body: "ایسی بڑی WebP ایکسپورٹس کاٹیں جو پروڈکشن صفحات پر اب بھی کلوبائٹس ضائع کریں۔",
        icon: "size",
      },
      {
        title: "تیز ویب سائٹس",
        body: "ہلکے ہیرو اور پروڈکٹ امیجز صفحات جلد دکھانے میں مدد دیتے ہیں۔",
        icon: "speed",
      },
      {
        title: "کم بینڈوتھ استعمال",
        body: "CDN، موبائل یوزرز اور زیادہ ٹریفک مہمات کے لیے ٹرانسفر خرچ کم کریں۔",
        icon: "bandwidth",
      },
      {
        title: "بہتر موبائل کارکردگی",
        body: "سیلولر نیٹ ورکس اور درمیانے آلات پر چھوٹی ڈاؤن لوڈز سب سے زیادہ اہم ہیں۔",
        icon: "mobile",
      },
      {
        title: "نجی پروسیسنگ",
        body: "فائلیں عارضی رہتی ہیں اور عوامی گیلری میں نہیں جاتیں۔",
        icon: "privacy",
      },
      {
        title: "اصل فائل محفوظ",
        body: "نئی آپٹیمائزڈ WebP ڈاؤن لوڈ کریں۔ سورس فائل جوں کی توں رہتی ہے۔",
        icon: "safe",
      },
    ],
  },
  howTo: {
    eyebrow: "تین آسان مراحل",
    title: "WebP امیجز کیسے کمپریس کریں",
    steps: [
      {
        title: "WebP اپ لوڈ کریں",
        body: "ڈیوائس سے WebP چنیں، اپ لوڈ ایریا میں گھسیٹیں، یا کلپ بورڈ سے چسپاں کریں۔",
      },
      {
        title: "کمپریس کریں",
        body: "بصری وضاحت اور فائل وزن کا توازن رکھنے والا کوالٹی پری سیٹ چنیں، پھر کمپریشن چلائیں۔",
      },
      {
        title: "آپٹیمائزڈ WebP ڈاؤن لوڈ کریں",
        body: "نتیجہ دیکھیں، فائل سائز موازنہ کریں، پھر ہلکی WebP ڈاؤن لوڈ کریں۔",
      },
    ],
    imageAlt: "WebP اپ لوڈ، کوالٹی کنٹرولز سے کمپریشن اور ڈاؤن لوڈ کے تین مراحل",
  },
  guide: {
    eyebrow: "کمپریشن گائیڈ",
    title: "WebP کمپریشن کو سمجھیں",
    paragraphs: [
      "WebP سورس اور پری سیٹس کے مطابق لاسی یا زیادہ محتاط سیٹنگز سے انکوڈ ہو سکتا ہے۔ مہمان کمپریشن WebP کنٹینر رکھتی ہے — خاموشی سے JPG نہیں بناتی۔",
      "پروڈکشن اثاثے بدلنے سے پہلے ٹیکسٹ کنارے، پروڈکٹ تفصیل اور نرم گریڈینٹس کا پری ویو دیکھیں۔",
    ],
    topics: [
      "لاسی WebP معمولی بصری سمجھوتوں سے بائٹس کم کرتا ہے — فوٹوز اور مارکیٹنگ سینز کے لیے اکثر مثالی۔",
      "زیادہ محفوظ WebP زیادہ تفصیل رکھتا ہے مگر بھاری رہ سکتا ہے؛ جب تیز کنارے اہم ہوں۔",
      "کوالٹی سیٹنگز آپ کو بغیر عین کلوبائٹ ہدف گھڑنے کے وزن کے لیے تفصیل کا سودا کرنے دیتی ہیں۔",
      "ورک اسپیس میں بصری موازنہ بتاتا ہے کہ کب مزید پاسز مدد نہیں کرتے۔",
      "کمپریشن تناسب مواد پر منحصر ہوتا ہے — اسکرین شاٹس، فوٹوز اور UI آرٹ الگ برتاؤ کرتے ہیں۔",
      "نیچے تجویز کردہ کوالٹی لیولز عام ویب ورک فلوز کے عملی نقطہ آغاز ہیں۔",
    ],
    tableCaption: "تجویز کردہ کوالٹی لیولز",
    recommendations: [
      {
        name: "زیادہ سے زیادہ کوالٹی",
        bestFor: "فوٹوگرافی اور ہائی ڈیٹیل پروڈکٹ شاٹس کے لیے بہترین۔",
        rows: ["وضاحت کو ترجیح", "کم بچت", "جب ہر پکسل تفصیل اہم ہو"],
      },
      {
        name: "متوازن",
        bestFor: "ویب سائٹس اور زیادہ تر مارکیٹنگ صفحات کے لیے بہترین۔",
        rows: ["مضبوط سائز کمی", "روزانہ صاف کوالٹی", "ڈیفالٹ نقطہ آغاز"],
      },
      {
        name: "اعلیٰ کمپریشن",
        bestFor: "تیز لوڈنگ صفحات اور تھمب نیلز کے لیے بہترین۔",
        rows: ["جارحانہ وزن کمی", "احتیاط سے پری ویو", "کارڈز اور لسٹس کے لیے بہترین"],
      },
    ],
  },
  useCases: {
    eyebrow: "عام استعمالات",
    title: "Compress WebP سب سے زیادہ کہاں مدد کرتا ہے",
    cards: [
      {
        title: "لینڈنگ پیجز",
        body: "ایکسپورٹ کے بعد بھی بھاری لگنے والے مہمات کے ہیرو اور سیکشن آرٹ سخت کریں۔",
      },
      {
        title: "ای کامرس اسٹورز",
        body: "جدید فارمیٹ چھوڑے بغیر ہلکی پروڈکٹ WebP گیلریز بھیجیں۔",
      },
      {
        title: "بلاگز",
        body: "مواد سے بھری سائٹس پر پوسٹ امیجز قابلِ مطالعہ رکھیں اور بینڈوتھ کاٹیں۔",
      },
      {
        title: "موبائل ایپس",
        body: "WebP کے طور پر دیے گئے اثاثہ پیکس اور ان اپ مارکیٹنگ تخلیقات کم کریں۔",
      },
    ],
  },
  tips: {
    eyebrow: "بہتر نتائج",
    title: "آپٹیمائزیشن کے مشورے",
    items: [
      "ویب سائٹس کے لیے پہلا پاس متوازن کوالٹی استعمال کریں۔",
      "ڈاؤن لوڈ سے پہلے پری ویو کریں — جب کوالٹی بائٹس کی بچت سے زیادہ گرے تو رک جائیں۔",
      "اگر لے آؤٹ باکس فائل سے بہت چھوٹا ہو تو پہلے ری سائز کریں۔",
      "ہیرو امیجز احتیاط سے کمپریس کریں؛ وہ اکثر LCP پر غالب ہوتے ہیں۔",
      "CDN یا CMS اثاثے بدلنے سے پہلے اصل فائلیں ماسٹر رکھیں۔",
      "امیجز بدلنے کے بعد اسٹیجنگ یا پروڈکشن پر پیج سپیڈ ٹیسٹ کریں۔",
    ],
  },
  faqHeading: "عمومی سوالات",
  faqs: [
    {
      q: "کیا WebP کو مزید کمپریس کیا جا سکتا ہے؟",
      a: "ہاں۔ بہت سی ایکسپورٹ شدہ WebP فائلیں ویب سائٹس کی ضرورت سے اعلیٰ کوالٹی استعمال کرتی ہیں۔ محتاط دوبارہ انکوڈ سے فائل سائز کم ہو سکتا ہے جبکہ نظر قریب قریب ویسا ہی رہے۔",
    },
    {
      q: "کیا کمپریشن کے بعد WebP کوالٹی کم ہو گی؟",
      a: "پری سیٹ کے مطابق کمپریشن لاسی ہو سکتا ہے۔ پروڈکشن اثاثے بدلنے سے پہلے اہم تفصیلات کا پری ویو کریں۔",
    },
    {
      q: "لاسی اور لاسلیس WebP کمپریشن میں کیا فرق ہے؟",
      a: "لاسی WebP چھوٹی فائلوں کے لیے معمولی بصری سمجھوتے کرتا ہے۔ زیادہ محفوظ سیٹنگز زیادہ تفصیل رکھتی ہیں مگر اکثر بھاری رہتی ہیں۔ مہمان پری سیٹس غیر سپورٹڈ موڈ گھڑنے کی بجائے عملی کوالٹی لیولز ہیں۔",
    },
    {
      q: "کیا ویب سائٹس کے لیے WebP پہلے سے کافی کمپریسڈ ہے؟",
      a: "ہمیشہ نہیں۔ ڈیزائنر ایکسپورٹس اور AI کینوس اب بھی بڑے ہو سکتے ہیں۔ جب ڈاؤن لوڈ اب بھی LCP یا بینڈوتھ بجٹ ضائع کرے تو کمپریس کریں۔",
    },
    {
      q: "کیا ایک ساتھ کئی WebP فائلیں کمپریس ہو سکتی ہیں؟",
      a: "جب مہمان یا اکاؤنٹ حدود میں ملٹی فائل کمپریشن دستیاب ہو تو Bulk Image Tools استعمال کریں۔",
    },
    {
      q: "کیا Compress WebP اپ لوڈز نجی ہیں؟",
      a: "مہمان تصاویر نجی عارضی اسٹوریج استعمال کرتی ہیں اور صفحے پر دکھائی گئی برقرار رکھنے کی مدت کے مطابق خودبخود حذف ہوتی ہیں۔",
    },
    {
      q: "Compress WebP کی مہمان حدود کیا ہیں؟",
      a: "مفت مہمان آپریشنز اور زیادہ سے زیادہ فائل سائز اپ لوڈر کے اوپر استعمال بار میں نظر آتی ہیں۔ اعلیٰ حدود کے لیے اکاؤنٹ درکار ہو سکتا ہے۔",
    },
    {
      q: "Compress WebP کی زیادہ سے زیادہ اپ لوڈ سائز کیا ہے؟",
      a: "زیادہ سے زیادہ سائز استعمال بار میں دکھائی گئی مہمان اپ لوڈ حد کے برابر ہے۔ بڑی فائلیں کمپریشن سے پہلے مسترد ہوتی ہیں۔",
    },
    {
      q: "کچھ WebP فائلیں اب بھی بڑی کیوں ہوتی ہیں؟",
      a: "اعلیٰ کوالٹی سیٹنگز، بڑے پکسل ابعاد اور تفصیلی فوٹوگرافی WebP بھاری رکھتی ہیں۔ جب لے آؤٹ کو مکمل ریزولوشن نہ چاہیے تو پہلے ری سائز کریں۔",
    },
    {
      q: "کیا Compress WebP اصل امیج کو اوور رائٹ کرتا ہے؟",
      a: "نہیں۔ کمپریشن نئی آپٹیمائزڈ WebP ڈاؤن لوڈ بناتی ہے۔ آپ کی ڈیوائس پر اصل فائل جوں کی توں رہتی ہے۔",
    },
  ],
  related: {
    eyebrow: "مزید آپٹیمائزیشن",
    title: "متعلقہ امیج ٹولز",
    tools: [
      {href: "/resize-webp", title: "Resize WebP", body: "کمپریشن سے پہلے یا بعد ابعاد درست کریں۔"},
      {href: "/webp-to-jpg", title: "Convert WebP to JPG", body: "جب پارٹنر WebP قبول نہ کرے تو JPG بنائیں۔"},
      {href: "/webp-to-png", title: "Convert WebP to PNG", body: "جب ڈیزائن ٹولز چاہیں تو ایڈیٹ ایبل PNG ماسٹر لیں۔"},
      {href: "/compress-jpg", title: "Compress JPG", body: "ویب کے لیے فوٹوگرافک JPG ماسٹرز آپٹیمائز کریں۔"},
      {href: "/compress-png", title: "Compress PNG", body: "شفافیت رکھتے ہوئے PNG وزن کم کریں۔"},
      {href: "/bulk-image-tools", title: "Bulk Compress Images", body: "ایک مہمان ورک فلو میں کئی تصاویر پروسیس کریں۔"},
    ],
  },
  cta: {
    title: "ایک اور WebP کمپریس کریں؟",
    body: "ایک اور WebP تصویر اپ لوڈ کریں یا اضافی امیج آپٹیمائزیشن ٹولز اور اعلیٰ استعمال کی حدود کے لیے مفت اکاؤنٹ بنائیں۔",
    primaryLabel: "ایک اور تصویر کمپریس کریں",
    secondaryLabel: "مفت اکاؤنٹ بنائیں",
    secondaryHref: "/register",
  },
};

export function getCompressWebpCopy(locale: string): CompressWebpCopy {
  return localizedCopy(locale, {en, ur});
}

export function compressWebpSeoCompat() {
  const c = en;
  return {
    intro: [
      c.hero.paragraph,
      "Guest sessions stay private on temporary storage, and the download is a new optimized WebP rather than an overwrite of your original.",
      "This landing focuses on making already-modern WebP lighter for web performance — not photographic JPG compression or PNG logo workflows.",
    ].join(" "),
    why: [
      c.intro.paragraphs[0],
      c.whyCompress.paragraphs[0],
      c.whyCompress.paragraphs[1],
      "Unlike Compress JPG (photos) or Compress PNG (transparent graphics), Compress WebP keeps the WebP container for CDN and browser delivery that already expects WebP.",
      c.guide.paragraphs[0],
    ].join(" "),
    benefits: c.benefits.cards.map((card) => ({title: card.title, body: card.body})),
    howTo: [
      "Upload a WebP image",
      "Choose a quality preset",
      "Compress with the guest engine",
      "Download the optimized WebP",
    ] as [string, string, string, string],
    technicalTitle: c.guide.title,
    technical: [...c.guide.paragraphs, ...c.guide.topics.slice(0, 4), c.whyCompress.points.join(", ")].join(" "),
    faqs: c.faqs,
    ctaLabel: c.cta.primaryLabel,
  };
}

export type CompressWebpLocale = AppLocale;
