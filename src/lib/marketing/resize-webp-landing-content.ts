/**
 * Resize WebP landing — responsive web delivery / modern screens
 * (distinct from Resize JPG photos and Resize PNG logos/UI).
 */
import type {AppLocale} from "@/i18n/routing";

export type ResizeWebpFaq = {q: string; a: string};

export type ResizeWebpPresetCard = {
  id: string;
  title: string;
  width: number;
  height: number;
  custom?: boolean;
};

export type ResizeWebpCopy = {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  breadcrumbParent: {href: "/resize-image"; label: string};
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
  presets: {
    eyebrow: string;
    title: string;
    intro: string;
    cards: ResizeWebpPresetCard[];
  };
  benefits: {
    eyebrow: string;
    title: string;
    cards: {
      title: string;
      body: string;
      icon: "responsive" | "dimensions" | "aspect" | "webp" | "privacy" | "safe";
    }[];
  };
  howTo: {
    eyebrow: string;
    title: string;
    steps: {title: string; body: string}[];
    imageAlt: string;
  };
  guide: {
    title: string;
    paragraphs: string[];
    points: string[];
    tableCaption: string;
    tableRows: {device: string; role: string}[];
    noteTitle: string;
    noteBefore: string;
    noteLink: string;
    noteAfter: string;
    noteHref: "/compress-webp";
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
  faqs: ResizeWebpFaq[];
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
  compressNote: {
    before: string;
    link: string;
    after: string;
    href: "/compress-webp";
  };
};

export const RESIZE_WEBP_POPULAR_SIZES = [
  {id: "desktop-hero", label: "Desktop Hero", width: 1920, height: 1080},
  {id: "laptop-banner", label: "Laptop Banner", width: 1600, height: 900},
  {id: "tablet", label: "Tablet", width: 1024, height: 768},
  {id: "mobile-hero", label: "Mobile Hero", width: 1080, height: 1920},
  {id: "blog-image", label: "Blog Image", width: 1200, height: 800},
  {id: "thumbnail", label: "Thumbnail", width: 800, height: 450},
] as const;

const en: ResizeWebpCopy = {
  metaTitle: "Resize WebP Images Online Free | SEO Images",
  metaDescription:
    "Resize WebP images online for responsive websites, blogs and mobile devices. Change dimensions securely and download resized WebP images instantly.",
  h1: "Resize WebP Images Online",
  breadcrumbParent: {href: "/resize-image", label: "Resize Image"},
  breadcrumbCurrent: "Resize WebP Images Online",
  hero: {
    badge: "WEBP IMAGE RESIZER",
    paragraph:
      "Resize WebP images without sacrificing quality. Change image dimensions for websites, responsive layouts, mobile devices and social media while keeping modern WebP efficiency.",
    trust: [
      "Modern Web Format",
      "Responsive Images",
      "Private Processing",
      "No Software Required",
    ],
    uploadCta: "Upload WebP",
    heroImageAlt:
      "Browser WebP resize editor with resize handles, width and height inputs, aspect ratio lock and device icons",
  },
  guestBar: {
    title: "Guest usage",
    deletionTitle: "Automatic deletion",
    countdownLabel: "Temporary files delete automatically in",
  },
  upload: {
    heading: "Upload a WebP Image",
    supporting: "Drag and drop a WebP image, paste it from your clipboard or browse your device.",
    chooseLabel: "Choose WebP",
    formatsHint: "WebP · Maximum file size follows guest limits shown above",
    features: [
      {title: "Aspect Ratio Lock", body: "Keep proportions locked unless you intentionally need a new shape."},
      {title: "Responsive Presets", body: "Start from common desktop, tablet and mobile layout boxes."},
      {title: "Private Processing", body: "Uploads stay in temporary private storage."},
      {title: "Automatic File Deletion", body: "Guest files are removed after the retention countdown."},
    ],
  },
  intro: {
    eyebrow: "RESPONSIVE WEB IMAGES",
    title: "Resize WebP Images for Every Screen Size",
    paragraphs: [
      "Modern websites use multiple image sizes to deliver the best experience across desktops, tablets and mobile devices. Resizing WebP images allows you to create responsive versions that reduce unnecessary downloads while maintaining excellent image quality.",
      "This tool creates a resized WebP image while leaving the original file unchanged on your device.",
    ],
    imageAlt:
      "One large WebP image transformed into desktop, tablet and mobile responsive versions",
  },
  presets: {
    eyebrow: "POPULAR SIZE PRESETS",
    title: "Responsive WebP Dimensions",
    intro: "After you upload a WebP, apply a preset in the tool or enter any custom width and height that fits your layout.",
    cards: [
      {id: "desktop-hero", title: "Desktop Hero", width: 1920, height: 1080},
      {id: "laptop-banner", title: "Laptop Banner", width: 1600, height: 900},
      {id: "tablet", title: "Tablet", width: 1024, height: 768},
      {id: "mobile-hero", title: "Mobile Hero", width: 1080, height: 1920},
      {id: "blog-image", title: "Blog Image", width: 1200, height: 800},
      {id: "thumbnail", title: "Thumbnail", width: 800, height: 450},
      {id: "custom", title: "Custom Size", width: 0, height: 0, custom: true},
    ],
  },
  benefits: {
    eyebrow: "WHY RESIZE WEBP",
    title: "Built for Responsive Modern Web Delivery",
    cards: [
      {
        title: "Responsive Images",
        body: "Create screen-specific WebP sizes so visitors do not download oversized heroes on phones.",
        icon: "responsive",
      },
      {
        title: "Custom Dimensions",
        body: "Enter exact width and height for CMS slots, cards, banners and app screens.",
        icon: "dimensions",
      },
      {
        title: "Aspect Ratio Protection",
        body: "Lock proportions to avoid stretched photography and marketing art.",
        icon: "aspect",
      },
      {
        title: "Modern WebP Output",
        body: "Stay on WebP so CDNs and browsers keep modern delivery efficiency.",
        icon: "webp",
      },
      {
        title: "Private Processing",
        body: "Files remain temporary and are not published to a public gallery.",
        icon: "privacy",
      },
      {
        title: "Original File Protected",
        body: "Download a new resized WebP. Your source file stays unchanged.",
        icon: "safe",
      },
    ],
  },
  howTo: {
    eyebrow: "THREE SIMPLE STEPS",
    title: "How to Resize a WebP Image",
    steps: [
      {
        title: "Upload WebP",
        body: "Choose a WebP from your device, drag it into the upload area or paste it from your clipboard.",
      },
      {
        title: "Choose Size",
        body: "Pick a responsive preset or enter custom dimensions. Keep aspect ratio locked unless you need a new shape.",
      },
      {
        title: "Download Resized WebP",
        body: "Process the image, preview the result and download the resized WebP.",
      },
    ],
    imageAlt: "Three steps for uploading WebP, choosing resize controls and downloading the result",
  },
  guide: {
    title: "Why Responsive Images Matter",
    paragraphs: [
      "Responsive design serves the right visual weight for each viewport instead of forcing every visitor to download a desktop-scale WebP.",
      "Matching dimensions to layout boxes also reduces decode work and helps pages feel faster on mobile networks.",
    ],
    points: [
      "Responsive design — ship multiple sizes for different breakpoints",
      "Different screen sizes — desktop, tablet and phone need different pixel boxes",
      "Faster loading — smaller canvases mean fewer bytes when paired with efficient WebP",
      "Reduced bandwidth — cut CDN and mobile data usage for repeat views",
      "Improved user experience — fewer layout delays around image slots",
      "SEO benefits — stronger Core Web Vitals signals when LCP images are sized honestly",
    ],
    tableCaption: "Typical responsive WebP roles",
    tableRows: [
      {device: "Desktop", role: "Large hero"},
      {device: "Tablet", role: "Medium image"},
      {device: "Mobile", role: "Smaller optimized version"},
    ],
    noteTitle: "Need a lighter file after resizing?",
    noteBefore: "Use ",
    noteLink: "Compress WebP",
    noteAfter: " after you lock dimensions when you still need smaller downloads.",
    noteHref: "/compress-webp",
  },
  useCases: {
    eyebrow: "COMMON USE CASES",
    title: "Where Resize WebP Helps Most",
    cards: [
      {
        title: "Responsive Websites",
        body: "Produce breakpoint-ready WebP assets for CSS layouts and srcset workflows.",
      },
      {
        title: "Landing Pages",
        body: "Fit campaign heroes and section art to exact marketing layout boxes.",
      },
      {
        title: "Blogs",
        body: "Create featured and in-article WebP sizes that match your content templates.",
      },
      {
        title: "Online Stores",
        body: "Standardize product gallery and card dimensions while staying on WebP.",
      },
    ],
  },
  tips: {
    eyebrow: "BETTER RESULTS",
    title: "Resizing Tips",
    items: [
      "Keep aspect ratio locked unless a layout intentionally needs a new shape.",
      "Use exact layout dimensions from your design system or CMS slot.",
      "Resize before compression so you do not spend encode budget on unused pixels.",
      "Create separate mobile versions instead of shipping one oversized desktop file.",
      "Keep the original WebP as a master before replacing CDN assets.",
      "Test on multiple screen sizes after you publish the new files.",
    ],
  },
  faqHeading: "Frequently Asked Questions",
  faqs: [
    {
      q: "Can I resize WebP images online?",
      a: "Yes. Upload a WebP, choose a preset or custom width and height, process with the shared guest resize engine, then download the resized WebP.",
    },
    {
      q: "Does resizing WebP affect image quality?",
      a: "Downsizing to the real layout box is usually preferable to shipping oversized pixels. Extreme enlargements can look soft — preview before replacing production assets.",
    },
    {
      q: "Can I enlarge a small WebP file?",
      a: "You can enter larger dimensions, but enlargement cannot invent missing detail. Prefer a higher-resolution master when possible.",
    },
    {
      q: "Will Resize WebP change the original file?",
      a: "No. The tool creates a new resized WebP download. The original on your device stays unchanged.",
    },
    {
      q: "What are the best WebP dimensions for websites?",
      a: "Match the CSS layout box for each breakpoint. Common starts include 1920×1080 heroes, 1200×800 blog images and smaller mobile variants.",
    },
    {
      q: "How do resized WebP files help responsive images?",
      a: "Serving right-sized WebP assets reduces unnecessary downloads on phones and mid-size tablets while keeping modern format efficiency.",
    },
    {
      q: "What are the guest limits for Resize WebP?",
      a: "Free guest operations and maximum file size appear in the usage bar above the uploader. Higher limits may require an account.",
    },
    {
      q: "Are Resize WebP uploads private?",
      a: "Guest images use private temporary storage and are deleted automatically according to the retention countdown on the page.",
    },
    {
      q: "What is the maximum upload size for Resize WebP?",
      a: "The maximum size matches the guest upload limit shown in the usage bar. Oversized files are rejected before resizing starts.",
    },
    {
      q: "What is the difference between resizing and compressing WebP?",
      a: "Resizing changes pixel dimensions. Compressing targets file weight at similar dimensions. Resize first for the layout, then compress if the download is still heavy.",
    },
  ],
  related: {
    eyebrow: "CONTINUE OPTIMIZING",
    title: "Related Image Tools",
    tools: [
      {href: "/compress-webp", title: "Compress WebP", body: "Reduce WebP file weight after you lock dimensions."},
      {href: "/webp-to-jpg", title: "Convert WebP to JPG", body: "Create JPG when partners cannot accept WebP."},
      {href: "/webp-to-png", title: "Convert WebP to PNG", body: "Get an editable PNG master for design tools."},
      {href: "/resize-jpg", title: "Resize JPG", body: "Resize photographic JPG masters for the web."},
      {href: "/resize-png", title: "Resize PNG", body: "Resize transparent PNG logos and UI graphics."},
      {href: "/bulk-image-tools", title: "Bulk Resize Images", body: "Process several images in one guest workflow."},
    ],
  },
  cta: {
    title: "Ready to Resize Another WebP?",
    body: "Upload another WebP image or create a free account to unlock more image tools and higher usage limits.",
    primaryLabel: "Resize Another Image",
    secondaryLabel: "Create Free Account",
    secondaryHref: "/register",
  },
  compressNote: {
    before: "Need a lighter download after resizing? Use ",
    link: "Compress WebP",
    after: ".",
    href: "/compress-webp",
  },
};

const ur: ResizeWebpCopy = {
  metaTitle: "آن لائن WebP امیجز ری سائز کریں مفت | SEO Images",
  metaDescription:
    "ریسپانسو ویب سائٹس، بلاگز اور موبائل ڈیوائسز کے لیے WebP تصاویر آن لائن ری سائز کریں۔ محفوظ انداز میں ابعاد بدلیں اور فوری ڈاؤن لوڈ کریں۔",
  h1: "آن لائن WebP امیجز ری سائز کریں",
  breadcrumbParent: {href: "/resize-image", label: "تصویر ری سائز کریں"},
  breadcrumbCurrent: "Resize WebP Images Online",
  hero: {
    badge: "WEBP IMAGE RESIZER",
    paragraph:
      "کوالٹی قربان کیے بغیر WebP امیجز ری سائز کریں۔ ویب سائٹس، ریسپانسو لے آؤٹس، موبائل ڈیوائسز اور سوشل میڈیا کے لیے ابعاد بدلیں جبکہ جدید WebP کی کارکردگی برقرار رکھیں۔",
    trust: ["جدید ویب فارمیٹ", "ریسپانسو امیجز", "نجی پروسیسنگ", "سافٹ ویئر کی ضرورت نہیں"],
    uploadCta: "WebP اپ لوڈ کریں",
    heroImageAlt: "براؤزر WebP ری سائز ایڈیٹر ہینڈلز، چوڑائی/اونچائی، آسپیوٹ لاک اور ڈیوائس آئیکنز کے ساتھ",
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
      {title: "آسپیوٹ ریشو لاک", body: "تناسب لاک رکھیں جب تک جان بوجھ کر نئی شکل نہ چاہیے۔"},
      {title: "ریسپانسو پری سیٹس", body: "ڈیسکٹاپ، ٹیبلیٹ اور موبائل لے آؤٹ باکسز سے شروع کریں۔"},
      {title: "نجی پروسیسنگ", body: "اپ لوڈز عارضی نجی اسٹوریج میں رہتی ہیں۔"},
      {title: "خودکار فائل حذف", body: "برقرار رکھنے کی مدت کے بعد مہمان فائلیں ہٹ جاتی ہیں۔"},
    ],
  },
  intro: {
    eyebrow: "ریسپانسو ویب امیجز",
    title: "ہر اسکرین سائز کے لیے WebP امیجز ری سائز کریں",
    paragraphs: [
      "جدید ویب سائٹس ڈیسکٹاپ، ٹیبلیٹ اور موبائل پر بہترین تجربہ دینے کے لیے متعدد امیج سائز استعمال کرتی ہیں۔ WebP ری سائز کرنے سے ریسپانسو ورژن بنتے ہیں جو غیر ضروری ڈاؤن لوڈ کم کرتے ہیں اور معیار برقرار رکھتے ہیں۔",
      "یہ ٹول نئی ری سائز شدہ WebP بناتا ہے جبکہ اصل فائل آپ کی ڈیوائس پر جوں کی توں رہتی ہے۔",
    ],
    imageAlt: "ایک بڑی WebP کو ڈیسکٹاپ، ٹیبلیٹ اور موبائل ریسپانسو ورژنز میں بدلنا",
  },
  presets: {
    eyebrow: "مشہور سائز پری سیٹس",
    title: "ریسپانسو WebP ابعاد",
    intro: "WebP اپ لوڈ کے بعد ٹول میں پری سیٹ لگائیں یا کوئی بھی حسبِ ضرورت چوڑائی اور اونچائی درج کریں۔",
    cards: [
      {id: "desktop-hero", title: "ڈیسکٹاپ ہیرو", width: 1920, height: 1080},
      {id: "laptop-banner", title: "لیپ ٹاپ بینر", width: 1600, height: 900},
      {id: "tablet", title: "ٹیبلیٹ", width: 1024, height: 768},
      {id: "mobile-hero", title: "موبائل ہیرو", width: 1080, height: 1920},
      {id: "blog-image", title: "بلاگ امیج", width: 1200, height: 800},
      {id: "thumbnail", title: "تھمب نیل", width: 800, height: 450},
      {id: "custom", title: "حسبِ ضرورت سائز", width: 0, height: 0, custom: true},
    ],
  },
  benefits: {
    eyebrow: "WebP کیوں ری سائز کریں",
    title: "ریسپانسو جدید ویب ڈیلیوری کے لیے",
    cards: [
      {
        title: "ریسپانسو امیجز",
        body: "اسکرین کے مطابق WebP سائز بنائیں تاکہ فون پر بڑے ہیرو نہ ڈاؤن لوڈ ہوں۔",
        icon: "responsive",
      },
      {
        title: "حسبِ ضرورت ابعاد",
        body: "CMS سلاٹس، کارڈز، بینرز اور ایپ اسکرینز کے لیے عین چوڑائی اور اونچائی درج کریں۔",
        icon: "dimensions",
      },
      {
        title: "آسپیوٹ ریشو تحفظ",
        body: "تناسب لاک رکھیں تاکہ فوٹو اور مارکیٹنگ آرٹ کھنچے نہ لگیں۔",
        icon: "aspect",
      },
      {
        title: "جدید WebP آؤٹ پٹ",
        body: "WebP پر رہیں تاکہ CDN اور براؤزر جدید ڈیلیوری برقرار رکھیں۔",
        icon: "webp",
      },
      {
        title: "نجی پروسیسنگ",
        body: "فائلیں عارضی رہتی ہیں اور عوامی گیلری میں نہیں جاتیں۔",
        icon: "privacy",
      },
      {
        title: "اصل فائل محفوظ",
        body: "نئی ری سائز شدہ WebP ڈاؤن لوڈ کریں۔ سورس فائل جوں کی توں رہتی ہے۔",
        icon: "safe",
      },
    ],
  },
  howTo: {
    eyebrow: "تین آسان مراحل",
    title: "WebP امیج کیسے ری سائز کریں",
    steps: [
      {
        title: "WebP اپ لوڈ کریں",
        body: "ڈیوائس سے WebP چنیں، اپ لوڈ ایریا میں گھسیٹیں، یا کلپ بورڈ سے چسپاں کریں۔",
      },
      {
        title: "سائز چنیں",
        body: "ریسپانسو پری سیٹ لگائیں یا حسبِ ضرورت ابعاد درج کریں۔ جب تک نئی شکل نہ چاہیے تناسب لاک رکھیں۔",
      },
      {
        title: "ری سائز شدہ WebP ڈاؤن لوڈ کریں",
        body: "امیج پروسیس کریں، نتیجہ دیکھیں، پھر ری سائز شدہ WebP ڈاؤن لوڈ کریں۔",
      },
    ],
    imageAlt: "WebP اپ لوڈ، ری سائز کنٹرولز اور ڈاؤن لوڈ کے تین مراحل",
  },
  guide: {
    title: "ریسپانسو امیجز کیوں اہم ہیں",
    paragraphs: [
      "ریسپانسو ڈیزائن ہر ویو پورٹ کے لیے درست بصری وزن دیتا ہے بجائے اس کے کہ ہر وزٹر ڈیسکٹاپ سائز WebP ڈاؤن لوڈ کرے۔",
      "لے آؤٹ باکس سے ابعاد ملانا ڈی کوڈ کام بھی کم کرتا ہے اور موبائل نیٹ ورکس پر صفحات تیز محسوس ہوتے ہیں۔",
    ],
    points: [
      "ریسپانسو ڈیزائن — مختلف بریک پوائنٹس کے لیے متعدد سائز",
      "مختلف اسکرین سائز — ڈیسکٹاپ، ٹیبلیٹ اور فون کو الگ پکسل باکس چاہیے",
      "تیز لوڈنگ — چھوٹے کینوس مؤثر WebP کے ساتھ کم بائٹس",
      "کم بینڈوتھ — CDN اور موبائل ڈیٹا کاٹیں",
      "بہتر یوزر تجربہ — امیج سلاٹس کے ارد گرد کم تاخیر",
      "SEO فوائد — جب LCP امیجز ایمانداری سے سائز ہوں تو بہتر Core Web Vitals",
    ],
    tableCaption: "عمومی ریسپانسو WebP کردار",
    tableRows: [
      {device: "ڈیسکٹاپ", role: "بڑا ہیرو"},
      {device: "ٹیبلیٹ", role: "درمیانی امیج"},
      {device: "موبائل", role: "چھوٹا آپٹیمائزڈ ورژن"},
    ],
    noteTitle: "ری سائز کے بعد ہلکی فائل چاہیے؟",
    noteBefore: "ابعاد لاک کرنے کے بعد ",
    noteLink: "Compress WebP",
    noteAfter: " استعمال کریں جب ڈاؤن لوڈ اب بھی بھاری ہو۔",
    noteHref: "/compress-webp",
  },
  useCases: {
    eyebrow: "عام استعمالات",
    title: "Resize WebP سب سے زیادہ کہاں مدد کرتا ہے",
    cards: [
      {
        title: "ریسپانسو ویب سائٹس",
        body: "CSS لے آؤٹس اور srcset ورک فلوز کے لیے بریک پوائنٹ ریڈی WebP بنائیں۔",
      },
      {
        title: "لینڈنگ پیجز",
        body: "مہمات کے ہیرو اور سیکشن آرٹ کو عین مارکیٹنگ لے آؤٹ باکسز پر فٹ کریں۔",
      },
      {
        title: "بلاگز",
        body: "اپنے کنٹنٹ ٹیمپلیٹس کے مطابق فیچرڈ اور ان آرٹیکل WebP سائز بنائیں۔",
      },
      {
        title: "آن لائن اسٹورز",
        body: "WebP پر رہتے ہوئے پروڈکٹ گیلری اور کارڈ ابعاد معیاری بنائیں۔",
      },
    ],
  },
  tips: {
    eyebrow: "بہتر نتائج",
    title: "ری سائز کے مشورے",
    items: [
      "جب تک لے آؤٹ جان بوجھ کر نئی شکل نہ مانگے تناسب لاک رکھیں۔",
      "اپنے ڈیزائن سسٹم یا CMS سلاٹ کے عین ابعاد استعمال کریں۔",
      "کمپریشن سے پہلے ری سائز کریں تاکہ غیر استعمال شدہ پکسلز پر انکوڈ بجٹ خرچ نہ ہو۔",
      "ایک بڑی ڈیسکٹاپ فائل بھیجنے کی بجائے الگ موبائل ورژن بنائیں۔",
      "CDN اثاثے بدلنے سے پہلے اصل WebP ماسٹر رکھیں۔",
      "شائع کرنے کے بعد متعدد اسکرین سائزز پر ٹیسٹ کریں۔",
    ],
  },
  faqHeading: "عمومی سوالات",
  faqs: [
    {
      q: "کیا WebP امیجز آن لائن ری سائز ہو سکتی ہیں؟",
      a: "ہاں۔ WebP اپ لوڈ کریں، پری سیٹ یا حسبِ ضرورت چوڑائی و اونچائی چنیں، شیئرڈ مہمان ری سائز انجن چلائیں، پھر ری سائز شدہ WebP ڈاؤن لوڈ کریں۔",
    },
    {
      q: "کیا WebP ری سائز سے امیج کوالٹی متاثر ہوتی ہے؟",
      a: "اصل لے آؤٹ باکس تک ڈاون سائز کرنا عموماً بڑے پکسل بھیجنے سے بہتر ہے۔ انتہائی اینلارجمنٹ دھندلا ہو سکتی ہے — پروڈکشن سے پہلے پری ویو کریں۔",
    },
    {
      q: "کیا چھوٹی WebP کو بڑا کیا جا سکتا ہے؟",
      a: "بڑے ابعاد درج کر سکتے ہیں، مگر اینلارجمنٹ گمشدہ تفصیل ایجاد نہیں کر سکتی۔ ممکن ہو تو اعلیٰ ریزولوشن ماسٹر استعمال کریں۔",
    },
    {
      q: "کیا Resize WebP اصل فائل بدل دیتا ہے؟",
      a: "نہیں۔ ٹول نئی ری سائز شدہ WebP ڈاؤن لوڈ بناتا ہے۔ آپ کی ڈیوائس پر اصل جوں کی توں رہتی ہے۔",
    },
    {
      q: "ویب سائٹس کے لیے بہترین WebP ابعاد کیا ہیں؟",
      a: "ہر بریک پوائنٹ کے CSS لے آؤٹ باکس سے ملائیں۔ عام آغاز: 1920×1080 ہیرو، 1200×800 بلاگ امیجز اور چھوٹے موبائل ورژن۔",
    },
    {
      q: "ری سائز شدہ WebP ریسپانسو امیجز میں کیسے مدد کرتی ہیں؟",
      a: "درست سائز والی WebP فونز اور درمیانے ٹیبلیٹس پر غیر ضروری ڈاؤن لوڈ کم کرتی ہیں جبکہ جدید فارمیٹ کارکردگی رکھتی ہیں۔",
    },
    {
      q: "Resize WebP کی مہمان حدود کیا ہیں؟",
      a: "مفت مہمان آپریشنز اور زیادہ سے زیادہ فائل سائز اپ لوڈر کے اوپر استعمال بار میں نظر آتی ہیں۔ اعلیٰ حدود کے لیے اکاؤنٹ درکار ہو سکتا ہے۔",
    },
    {
      q: "کیا Resize WebP اپ لوڈز نجی ہیں؟",
      a: "مہمان تصاویر نجی عارضی اسٹوریج استعمال کرتی ہیں اور صفحے پر دکھائی گئی برقرار رکھنے کی مدت کے مطابق خودبخود حذف ہوتی ہیں۔",
    },
    {
      q: "Resize WebP کی زیادہ سے زیادہ اپ لوڈ سائز کیا ہے؟",
      a: "زیادہ سے زیادہ سائز استعمال بار میں دکھائی گئی مہمان اپ لوڈ حد کے برابر ہے۔ بڑی فائلیں ری سائز سے پہلے مسترد ہوتی ہیں۔",
    },
    {
      q: "WebP ری سائز اور کمپریس میں کیا فرق ہے؟",
      a: "ری سائز پکسل ابعاد بدلتا ہے۔ کمپریس ملتے جلتے ابعاد پر فائل وزن کم کرتا ہے۔ پہلے لے آؤٹ کے لیے ری سائز کریں، پھر اگر ڈاؤن لوڈ بھاری ہو تو کمپریس کریں۔",
    },
  ],
  related: {
    eyebrow: "مزید آپٹیمائزیشن",
    title: "متعلقہ امیج ٹولز",
    tools: [
      {href: "/compress-webp", title: "Compress WebP", body: "ابعاد لاک کرنے کے بعد WebP وزن کم کریں۔"},
      {href: "/webp-to-jpg", title: "Convert WebP to JPG", body: "جب پارٹنر WebP قبول نہ کرے تو JPG بنائیں۔"},
      {href: "/webp-to-png", title: "Convert WebP to PNG", body: "ڈیزائن ٹولز کے لیے ایڈیٹ ایبل PNG ماسٹر لیں۔"},
      {href: "/resize-jpg", title: "Resize JPG", body: "ویب کے لیے فوٹوگرافک JPG ماسٹرز ری سائز کریں۔"},
      {href: "/resize-png", title: "Resize PNG", body: "شفاف PNG لوگو اور UI گرافکس ری سائز کریں۔"},
      {href: "/bulk-image-tools", title: "Bulk Resize Images", body: "ایک مہمان ورک فلو میں کئی تصاویر پروسیس کریں۔"},
    ],
  },
  cta: {
    title: "ایک اور WebP ری سائز کریں؟",
    body: "ایک اور WebP تصویر اپ لوڈ کریں یا مزید امیج ٹولز اور اعلیٰ استعمال کی حدود کے لیے مفت اکاؤنٹ بنائیں۔",
    primaryLabel: "ایک اور تصویر ری سائز کریں",
    secondaryLabel: "مفت اکاؤنٹ بنائیں",
    secondaryHref: "/register",
  },
  compressNote: {
    before: "ری سائز کے بعد ہلکی ڈاؤن لوڈ چاہیے؟ ",
    link: "Compress WebP",
    after: " استعمال کریں۔",
    href: "/compress-webp",
  },
};

export function getResizeWebpCopy(locale: string): ResizeWebpCopy {
  return locale === "ur" ? ur : en;
}

export function resizeWebpSeoCompat() {
  const c = en;
  return {
    intro: [
      c.hero.paragraph,
      "Guest sessions stay private on temporary storage, and the download is a new resized WebP rather than an overwrite of your original.",
      "This landing focuses on responsive WebP delivery for modern websites — not photographic JPG resizing or transparent PNG logo workflows.",
    ].join(" "),
    why: [
      c.intro.paragraphs[0],
      c.guide.paragraphs[0],
      "Unlike Resize JPG (photos) or Resize PNG (logos and UI), Resize WebP keeps the modern container so CDN and browser delivery stay aligned.",
      c.benefits.cards[0]!.body,
      c.guide.noteAfter,
    ].join(" "),
    benefits: c.benefits.cards.map((card) => ({title: card.title, body: card.body})),
    howTo: [
      "Upload a WebP image",
      "Choose a responsive preset or custom size",
      "Resize with the guest engine",
      "Download the resized WebP",
    ] as [string, string, string, string],
    technicalTitle: c.guide.title,
    technical: [...c.guide.paragraphs, ...c.guide.points.slice(0, 4), c.guide.tableRows.map((r) => `${r.device}: ${r.role}`).join("; ")].join(" "),
    faqs: c.faqs,
    ctaLabel: c.cta.primaryLabel,
  };
}

export type ResizeWebpLocale = AppLocale;
