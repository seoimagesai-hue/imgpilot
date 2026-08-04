/**
 * Resize PNG landing — logos / UI / icons / screenshots (distinct from Resize JPG).
 */
import type {AppLocale} from "@/i18n/routing";

export type ResizePngFaq = {q: string; a: string};

export type ResizePngPresetCard = {
  id: string;
  title: string;
  width: number;
  height: number;
  custom?: boolean;
};

export type ResizePngCopy = {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  breadcrumbParent: {href: "/resize-image"; label: string};
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
    cards: ResizePngPresetCard[];
  };
  benefits: {
    eyebrow: string;
    title: string;
    cards: {
      title: string;
      body: string;
      icon: "transparency" | "dimensions" | "aspect" | "browser" | "privacy" | "safe";
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
    noteTitle: string;
    noteBefore: string;
    noteLink: string;
    noteAfter: string;
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
  faqs: ResizePngFaq[];
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
    href: "/compress-png";
  };
};

export const RESIZE_PNG_POPULAR_SIZES = [
  {id: "website-logo", label: "Website Logo", width: 500, height: 500},
  {id: "instagram-logo", label: "Instagram Logo", width: 1080, height: 1080},
  {id: "app-icon", label: "App Icon", width: 1024, height: 1024},
  {id: "favicon", label: "Favicon", width: 512, height: 512},
  {id: "presentation", label: "Presentation Graphic", width: 1600, height: 900},
] as const;

const en: ResizePngCopy = {
  metaTitle: "Resize PNG Images Online Free | SEO Images",
  metaDescription:
    "Resize PNG images online while preserving transparency. Change image dimensions securely and download your resized PNG in seconds.",
  h1: "Resize PNG Images Online",
  breadcrumbParent: {href: "/resize-image", label: "Resize Image"},
  hero: {
    badge: "PNG IMAGE RESIZER",
    paragraph:
      "Resize PNG images without losing transparency. Upload your image, enter custom dimensions or choose a preset, then download a resized PNG that's ready for websites, mobile apps, presentations and digital design.",
    trust: [
      "Transparency Supported",
      "No Installation",
      "Secure Temporary Storage",
      "Original File Protected",
    ],
    uploadCta: "Upload PNG",
    heroImageAlt: "PNG resize editor with a transparent logo inside resize handles",
  },
  guestBar: {
    title: "Guest usage",
    deletionTitle: "Automatic deletion",
    countdownLabel: "Temporary files delete automatically in",
  },
  upload: {
    heading: "Upload a PNG Image",
    supporting: "Drag and drop your PNG image, paste it from the clipboard or browse your computer.",
    chooseLabel: "Choose PNG",
    formatsHint: "PNG · Maximum file size follows guest limits shown above",
    features: [
      {title: "Transparent PNG Support", body: "Alpha channels stay available for logos and UI assets."},
      {title: "Aspect Ratio Lock", body: "Keep proportions locked to avoid stretched graphics."},
      {title: "Automatic File Deletion", body: "Guest files are removed after the retention countdown."},
      {title: "Private Processing", body: "Uploads stay in temporary private storage."},
    ],
  },
  intro: {
    eyebrow: "RESIZE PNG IMAGES",
    title: "Change PNG Dimensions Without Losing Transparency",
    paragraphs: [
      "PNG images are commonly used for logos, interface graphics, screenshots and illustrations because they preserve sharp edges and transparent backgrounds.",
      "This tool allows you to resize PNG images while maintaining their transparency and producing a resized PNG ready for web or design projects.",
      "The tool creates a new resized file. Your original PNG remains unchanged on your device.",
    ],
    imageAlt: "Transparent logo resized from a large square to a smaller square while preserving transparency",
  },
  presets: {
    eyebrow: "COMMON SIZE PRESETS",
    title: "Popular PNG Dimensions for Design Work",
    intro: "After you upload a PNG, use these sizes in the tool, or enter any custom width and height.",
    cards: [
      {id: "website-logo", title: "Website Logo", width: 500, height: 500},
      {id: "instagram-logo", title: "Instagram Logo", width: 1080, height: 1080},
      {id: "app-icon", title: "App Icon", width: 1024, height: 1024},
      {id: "favicon", title: "Favicon", width: 512, height: 512},
      {id: "presentation", title: "Presentation Graphic", width: 1600, height: 900},
      {id: "custom", title: "Custom Size", width: 0, height: 0, custom: true},
    ],
  },
  benefits: {
    eyebrow: "WHY RESIZE PNG",
    title: "Built for Logos, Icons and UI Graphics",
    cards: [
      {
        title: "Transparency Preserved",
        body: "Resize without removing transparent backgrounds needed for clean overlays.",
        icon: "transparency",
      },
      {
        title: "Perfect Dimensions",
        body: "Enter a custom width and height or apply a ready-made design preset.",
        icon: "dimensions",
      },
      {
        title: "Aspect Ratio Lock",
        body: "Prevent stretching so icons and logos keep their intended shape.",
        icon: "aspect",
      },
      {
        title: "Browser Based",
        body: "Nothing to install — resize PNGs directly in a modern web browser.",
        icon: "browser",
      },
      {
        title: "Private Processing",
        body: "Guest files use temporary storage only and are not added to a public gallery.",
        icon: "privacy",
      },
      {
        title: "Original Protected",
        body: "The original image never changes. You download a new resized PNG.",
        icon: "safe",
      },
    ],
  },
  howTo: {
    eyebrow: "THREE SIMPLE STEPS",
    title: "How to Resize a PNG Image",
    steps: [
      {
        title: "Upload PNG",
        body: "Choose a PNG from your device, drag it into the upload area or paste it from the clipboard.",
      },
      {
        title: "Choose Size",
        body: "Pick a preset or enter custom dimensions. Keep aspect ratio locked unless you need a new shape.",
      },
      {
        title: "Download Resized PNG",
        body: "Process the image, preview the result and download the resized PNG.",
      },
    ],
    imageAlt: "Workflow showing upload, resize controls and download for a transparent PNG",
  },
  guide: {
    title: "Understanding PNG Image Dimensions",
    paragraphs: [
      "Pixel dimensions describe how wide and tall an image is. For example, an 800 × 800 PNG is square, while 1600 × 900 suits wide presentation graphics.",
      "Aspect ratio is the relationship between width and height. Locking it prevents logos and UI art from looking stretched.",
      "Transparency lets a PNG sit cleanly on any page background. Resizing changes the pixel box; compression later can reduce bytes further.",
    ],
    points: [
      "Pixel dimensions — width and height in pixels",
      "Aspect ratio — keep proportions unless a new shape is required",
      "Transparency — useful for logos, icons and overlays",
      "Scaling — downscaling is usually safer than enlarging tiny sources",
      "When to resize — match platform slots, app icons and layout boxes",
      "Resize vs compress — resize changes dimensions; compress targets file weight",
    ],
    noteTitle: "Need a smaller file?",
    noteBefore: "Use ",
    noteLink: "Compress PNG",
    noteAfter: " after resizing when you need to reduce download size further.",
  },
  useCases: {
    eyebrow: "BEST USE CASES",
    title: "Where PNG Resizing Helps Design Teams",
    cards: [
      {
        title: "Company Logos",
        body: "Deliver clean logo sizes for headers, emails, press kits and partner pages.",
      },
      {
        title: "Website Icons",
        body: "Match icon slots in menus, feature grids and documentation without soft edges.",
      },
      {
        title: "App Graphics",
        body: "Prepare UI assets and marketing app icons at the exact pixel boxes you need.",
      },
      {
        title: "Screenshots",
        body: "Scale documentation captures so help centres load faster without overflow.",
      },
    ],
  },
  tips: {
    eyebrow: "BETTER RESULTS",
    title: "PNG Resizing Tips",
    items: [
      "Keep the aspect ratio locked unless you intentionally need a different shape.",
      "Resize before compression when both dimensions and file size must change.",
      "Avoid enlarging very small images because edges can look soft or pixelated.",
      "Keep a copy of the highest-quality original PNG.",
      "Use exact platform or design-system dimensions before export.",
      "Preview transparent edges so anti-aliased outlines still look clean.",
    ],
  },
  faqHeading: "Frequently Asked Questions",
  faqs: [
    {
      q: "Can a PNG be resized without losing transparency?",
      a: "Yes. This page keeps the PNG container and is intended for assets that need transparent backgrounds. Always preview logos and overlays before publishing.",
    },
    {
      q: "Can I resize a logo with this tool?",
      a: "Yes. PNG resizing is well suited to company logos and marks, especially when you need a transparent background at a specific size.",
    },
    {
      q: "Does resizing reduce PNG quality?",
      a: "Downscaling usually keeps graphics usable. Enlarging a tiny source can make edges look soft. Start from the highest-quality original you have.",
    },
    {
      q: "Will the original PNG change?",
      a: "No. A new resized PNG is created for download. The original file on your device remains unchanged.",
    },
    {
      q: "Can I enlarge a small PNG?",
      a: "Yes, but enlargement cannot invent detail. For app icons and logos, start with a larger source whenever possible.",
    },
    {
      q: "Which dimensions are supported?",
      a: "You can enter custom width and height within the guest resize limits, or apply a popular preset after uploading an image.",
    },
    {
      q: "Is PNG resizing private?",
      a: "Guest images use private temporary storage and are deleted automatically according to the retention countdown on the page.",
    },
    {
      q: "What are the guest limits for resizing PNG?",
      a: "Free guest operations and maximum file size are shown in the usage bar above the uploader. Higher limits may require an account.",
    },
    {
      q: "What is the difference between PNG and JPG for resizing?",
      a: "PNG is better for logos, icons and screenshots that need transparency or sharp edges. JPG is usually better for photographs.",
    },
    {
      q: "Can I resize icons for apps and websites?",
      a: "Yes. Use the app icon, favicon or website logo presets, or enter the exact width and height your design system requires.",
    },
  ],
  related: {
    eyebrow: "CONTINUE EDITING",
    title: "Related PNG Tools",
    tools: [
      {href: "/compress-png", title: "Compress PNG", body: "Reduce PNG file size while keeping transparency when possible."},
      {href: "/png-to-jpg", title: "PNG to JPG", body: "Convert PNG graphics to JPG when transparency is not required."},
      {href: "/png-to-webp", title: "PNG to WebP", body: "Create a modern WebP version for website delivery."},
      {href: "/crop-png", title: "Crop PNG", body: "Trim unwanted areas from a PNG image."},
      {href: "/resize-jpg", title: "Resize JPG", body: "Change dimensions for photographic JPG images."},
      {
        href: "/bulk-image-tools",
        title: "Bulk Resize Images",
        body: "Resize several images in one workflow.",
      },
    ],
  },
  cta: {
    title: "Ready to Resize Another PNG?",
    body: "Upload another PNG or create a free account for higher usage limits and project history.",
    primaryLabel: "Resize Another PNG",
    secondaryLabel: "Create Free Account",
    secondaryHref: "/register",
  },
  compressNote: {
    before: "Need a smaller file after resizing? Use ",
    link: "Compress PNG",
    after: " to reduce download size.",
    href: "/compress-png",
  },
};

const ur: ResizePngCopy = {
  metaTitle: "آن لائن PNG تصاویر کا سائز بدلیں مفت | SEO Images",
  metaDescription:
    "شفافیت برقرار رکھتے ہوئے آن لائن PNG تصاویر کا سائز بدلیں۔ ابعاد محفوظ طریقے سے تبدیل کریں اور سیکنڈز میں ری سائزڈ PNG ڈاؤن لوڈ کریں۔",
  h1: "آن لائن PNG تصاویر کا سائز بدلیں",
  breadcrumbParent: {href: "/resize-image", label: "تصویر کا سائز بدلیں"},
  hero: {
    badge: "PNG امیج ری سائزر",
    paragraph:
      "شفافیت کھونے بغیر PNG تصاویر کا سائز بدلیں۔ تصویر اپ لوڈ کریں، حسبِ ضرورت ابعاد درج کریں یا پری سیٹ چنیں، پھر ویب سائٹس، موبائل ایپس، پریزنٹیشنز اور ڈیجیٹل ڈیزائن کے لیے تیار ری سائزڈ PNG ڈاؤن لوڈ کریں۔",
    trust: [
      "شفافیت سپورٹ",
      "انسٹالیشن نہیں",
      "محفوظ عارضی اسٹوریج",
      "اصل فائل محفوظ",
    ],
    uploadCta: "PNG اپ لوڈ کریں",
    heroImageAlt: "شفاف لوگو اور ری سائز ہینڈلز والا PNG ایڈیٹر",
  },
  guestBar: {
    title: "مہمان استعمال",
    deletionTitle: "خودکار حذف",
    countdownLabel: "عارضی فائلیں خودبخود حذف ہونے میں باقی:",
  },
  upload: {
    heading: "PNG تصویر اپ لوڈ کریں",
    supporting: "PNG گھسیٹ کر چھوڑیں، کلپ بورڈ سے چسپاں کریں، یا کمپیوٹر سے منتخب کریں۔",
    chooseLabel: "PNG منتخب کریں",
    formatsHint: "PNG · زیادہ سے زیادہ فائل سائز اوپر دکھائی گئی مہمان حدود کے مطابق",
    features: [
      {title: "شفاف PNG سپورٹ", body: "لوگو اور UI اثاثوں کے لیے الفا چینل دستیاب رہتا ہے۔"},
      {title: "تناسب لاک", body: "تناسب لاک رکھیں تاکہ گرافکس کھنچے نہ لگیں۔"},
      {title: "خودکار حذف", body: "مہمان فائلیں برقرار رکھنے کی مدت کے بعد ہٹا دی جاتی ہیں۔"},
      {title: "نجی پروسیسنگ", body: "اپ لوڈز عارضی نجی اسٹوریج میں رہتی ہیں۔"},
    ],
  },
  intro: {
    eyebrow: "PNG تصاویر کا سائز بدلیں",
    title: "شفافیت کھونے بغیر PNG ابعاد تبدیل کریں",
    paragraphs: [
      "PNG تصاویر لوگو، انٹرفیس گرافکس، اسکرین شاٹس اور السٹریشنز کے لیے عام ہیں کیونکہ وہ تیز کنارے اور شفاف پس منظر محفوظ رکھتی ہیں۔",
      "یہ ٹول شفافیت برقرار رکھتے ہوئے PNG کا سائز بدل کر ویب یا ڈیزائن پروجیکٹس کے لیے تیار ری سائزڈ PNG بناتا ہے۔",
      "ٹول ایک نئی ری سائزڈ فائل بناتا ہے۔ آپ کی اصل PNG ڈیوائس پر جوں کی توں رہتی ہے۔",
    ],
    imageAlt: "شفاف لوگو بڑے مربع سے چھوٹے مربع میں ری سائز، شفافیت برقرار",
  },
  presets: {
    eyebrow: "عام سائز پری سیٹس",
    title: "ڈیزائن ورک کے لیے مقبول PNG ابعاد",
    intro: "PNG اپ لوڈ کے بعد ان سائزز کو ٹول میں استعمال کریں، یا کوئی بھی حسبِ ضرورت چوڑائی اور اونچائی درج کریں۔",
    cards: [
      {id: "website-logo", title: "ویب سائٹ لوگو", width: 500, height: 500},
      {id: "instagram-logo", title: "انسٹاگرام لوگو", width: 1080, height: 1080},
      {id: "app-icon", title: "ایپ آئیکن", width: 1024, height: 1024},
      {id: "favicon", title: "فیویکون", width: 512, height: 512},
      {id: "presentation", title: "پریزنٹیشن گرافک", width: 1600, height: 900},
      {id: "custom", title: "حسبِ ضرورت سائز", width: 0, height: 0, custom: true},
    ],
  },
  benefits: {
    eyebrow: "PNG کیوں ری سائز کریں",
    title: "لوگو، آئیکنز اور UI گرافکس کے لیے",
    cards: [
      {
        title: "شفافیت محفوظ",
        body: "صاف اوورلیز کے لیے شفاف پس منظر ہٹائے بغیر سائز بدلیں۔",
        icon: "transparency",
      },
      {
        title: "درست ابعاد",
        body: "حسبِ ضرورت چوڑائی اور اونچائی درج کریں یا تیار ڈیزائن پری سیٹ لگائیں۔",
        icon: "dimensions",
      },
      {
        title: "تناسب لاک",
        body: "آئیکنز اور لوگو کو کھنچاؤ سے بچائیں تاکہ شکل درست رہے۔",
        icon: "aspect",
      },
      {
        title: "براؤزر پر مبنی",
        body: "کچھ انسٹال کیے بغیر جدید ویب براؤزر میں PNG ری سائز کریں۔",
        icon: "browser",
      },
      {
        title: "نجی پروسیسنگ",
        body: "مہمان فائلیں صرف عارضی اسٹوریج استعمال کرتی ہیں اور عوامی گیلری میں نہیں جاتیں۔",
        icon: "privacy",
      },
      {
        title: "اصل محفوظ",
        body: "اصل تصویر کبھی نہیں بدلتی۔ آپ نئی ری سائزڈ PNG ڈاؤن لوڈ کرتے ہیں۔",
        icon: "safe",
      },
    ],
  },
  howTo: {
    eyebrow: "تین آسان مراحل",
    title: "PNG تصویر کیسے ری سائز کریں",
    steps: [
      {
        title: "PNG اپ لوڈ کریں",
        body: "ڈیوائس سے PNG چنیں، اپ لوڈ ایریا میں گھسیٹیں، یا کلپ بورڈ سے چسپاں کریں۔",
      },
      {
        title: "سائز چنیں",
        body: "پری سیٹ لگائیں یا حسبِ ضرورت ابعاد درج کریں۔ جب تک نئی شکل درکار نہ ہو تناسب لاک رکھیں۔",
      },
      {
        title: "ری سائزڈ PNG ڈاؤن لوڈ کریں",
        body: "تصویر پروسیس کریں، نتیجہ دیکھیں اور ری سائزڈ PNG ڈاؤن لوڈ کریں۔",
      },
    ],
    imageAlt: "شفاف PNG کے لیے اپ لوڈ، ری سائز کنٹرولز اور ڈاؤن لوڈ کا ورک فلو",
  },
  guide: {
    title: "PNG امیج ابعاد کیا ہیں",
    paragraphs: [
      "پکسل ابعاد بتاتے ہیں کہ تصویر کتنی چوڑی اور اونچی ہے۔ مثلاً 800 × 800 مربع ہے، جبکہ 1600 × 900 چوڑے پریزنٹیشن گرافکس کے لیے موزوں ہے۔",
      "تناسب چوڑائی اور اونچائی کا تعلق ہے۔ اسے لاک رکھنے سے لوگو اور UI آرٹ کھنچے نہیں لگتے۔",
      "شفافیت PNG کو کسی بھی صفحہ پس منظر پر صاف دکھاتی ہے۔ ری سائز پکسل باکس بدلتا ہے؛ بعد میں کمپریشن بائٹس مزید کم کر سکتی ہے۔",
    ],
    points: [
      "پکسل ابعاد — چوڑائی اور اونچائی پکسلز میں",
      "تناسب — جب تک نئی شکل درکار نہ ہو تناسب رکھیں",
      "شفافیت — لوگو، آئیکنز اور اوورلیز کے لیے مفید",
      "اسکیلنگ — چھوٹے سورس کو بڑا کرنے سے نیچے لانا عموماً محفوظ تر",
      "کب ری سائز کریں — پلیٹ فارم سلاٹس، ایپ آئیکنز اور لے آؤٹ باکسز کے مطابق",
      "ری سائز بمقابلہ کمپریس — ری سائز ابعاد بدلتا ہے؛ کمپریس فائل وزن کم کرتا ہے",
    ],
    noteTitle: "چھوٹی فائل چاہیے؟",
    noteBefore: "ری سائز کے بعد ",
    noteLink: "Compress PNG",
    noteAfter: " استعمال کریں جب ڈاؤن لوڈ سائز مزید کم کرنا ہو۔",
  },
  useCases: {
    eyebrow: "بہترین استعمالات",
    title: "ڈیزائن ٹیموں کے لیے PNG ری سائز کہاں مدد کرتا ہے",
    cards: [
      {
        title: "کمپنی لوگو",
        body: "ہیڈر، ای میل، پریس کٹ اور پارٹنر صفحات کے لیے صاف لوگو سائز تیار کریں۔",
      },
      {
        title: "ویب سائٹ آئیکنز",
        body: "مینو، فیچر گرڈز اور دستاویزات میں آئیکن سلاٹس بغیر نرم کناروں کے پورا کریں۔",
      },
      {
        title: "ایپ گرافکس",
        body: "UI اثاثے اور مارکیٹنگ ایپ آئیکنز درست پکسل باکسز پر تیار کریں۔",
      },
      {
        title: "اسکرین شاٹس",
        body: "دستاویزی کیپچرز اسکیل کریں تاکہ ہیلپ سینٹرز تیز لوڈ ہوں اور اوور فلو نہ ہو۔",
      },
    ],
  },
  tips: {
    eyebrow: "بہتر نتائج",
    title: "PNG ری سائز کے مشورے",
    items: [
      "جب تک جان بوجھ کر نئی شکل نہ چاہیے تناسب لاک رکھیں۔",
      "جب ابعاد اور فائل سائز دونوں بدلنے ہوں تو پہلے ری سائز، پھر کمپریس کریں۔",
      "بہت چھوٹی تصاویر بڑا کرنے سے گریز کریں کیونکہ کنارے نرم یا پکسل دار لگ سکتے ہیں۔",
      "سب سے اعلیٰ کوالٹی والی اصل PNG کا بیک اپ رکھیں۔",
      "ایکسپورٹ سے پہلے عین پلیٹ فارم یا ڈیزائن سسٹم ابعاد استعمال کریں۔",
      "شفاف کنارے چیک کریں تاکہ اینٹی الیاسڈ آؤٹ لائن صاف نظر آئے۔",
    ],
  },
  faqHeading: "عمومی سوالات",
  faqs: [
    {
      q: "کیا شفافیت کھونے بغیر PNG ری سائز ہو سکتی ہے؟",
      a: "ہاں۔ یہ صفحہ PNG کنٹینر رکھتا ہے اور شفاف پس منظر والے اثاثوں کے لیے ہے۔ شائع کرنے سے پہلے لوگو اور اوورلیز ضرور دیکھیں۔",
    },
    {
      q: "کیا لوگو ری سائز ہو سکتا ہے؟",
      a: "ہاں۔ خاص طور پر جب مخصوص سائز پر شفاف پس منظر درکار ہو تو کمپنی لوگو اور مارکس کے لیے موزوں ہے۔",
    },
    {
      q: "کیا ری سائز سے PNG کوالٹی کم ہوتی ہے؟",
      a: "نیچے لانا عموماً گرافکس قابلِ استعمال رکھتا ہے۔ بہت چھوٹا سورس بڑا کرنے سے کنارے نرم ہو سکتے ہیں۔ سب سے اعلیٰ اصل سے شروع کریں۔",
    },
    {
      q: "کیا اصل PNG بدل جائے گی؟",
      a: "نہیں۔ ڈاؤن لوڈ کے لیے نئی ری سائزڈ PNG بنتی ہے۔ ڈیوائس پر اصل فائل جوں کی توں رہتی ہے۔",
    },
    {
      q: "کیا چھوٹی PNG بڑی کی جا سکتی ہے؟",
      a: "ہاں، مگر اضافہ تفصیل نہیں بنا سکتا۔ ایپ آئیکنز اور لوگو کے لیے ممکن ہو تو بڑا سورس استعمال کریں۔",
    },
    {
      q: "کون سے ابعاد سپورٹ ہیں؟",
      a: "مہمان ری سائز حدود کے اندر حسبِ ضرورت چوڑائی اور اونچائی درج کر سکتے ہیں، یا اپ لوڈ کے بعد مقبول پری سیٹ لگائیں۔",
    },
    {
      q: "کیا PNG ری سائز نجی ہے؟",
      a: "مہمان تصاویر نجی عارضی اسٹوریج استعمال کرتی ہیں اور صفحے پر دکھائی گئی برقرار رکھنے کی مدت کے مطابق خودبخود حذف ہوتی ہیں۔",
    },
    {
      q: "PNG ری سائز کی مہمان حدود کیا ہیں؟",
      a: "مفت مہمان آپریشنز اور زیادہ سے زیادہ فائل سائز اپ لوڈر کے اوپر استعمال بار میں دکھائی جاتی ہیں۔ اعلیٰ حدود کے لیے اکاؤنٹ درکار ہو سکتا ہے۔",
    },
    {
      q: "ری سائز کے لیے PNG اور JPG میں فرق کیا ہے؟",
      a: "لوگو، آئیکنز اور اسکرین شاٹس کے لیے جہاں شفافیت یا تیز کنارے درکار ہوں PNG بہتر ہے۔ فوٹوگرافز کے لیے عموماً JPG بہتر ہے۔",
    },
    {
      q: "کیا ایپس اور ویب سائٹس کے آئیکنز ری سائز ہو سکتے ہیں؟",
      a: "ہاں۔ ایپ آئیکن، فیویکون یا ویب سائٹ لوگو پری سیٹ استعمال کریں، یا اپنے ڈیزائن سسٹم کی عین چوڑائی اور اونچائی درج کریں۔",
    },
  ],
  related: {
    eyebrow: "مزید ایڈیٹنگ",
    title: "متعلقہ PNG ٹولز",
    tools: [
      {href: "/compress-png", title: "Compress PNG", body: "جہاں ممکن ہو شفافیت رکھتے ہوئے PNG فائل سائز کم کریں۔"},
      {href: "/png-to-jpg", title: "PNG to JPG", body: "جب شفافیت درکار نہ ہو PNG کو JPG میں بدلیں۔"},
      {href: "/png-to-webp", title: "PNG to WebP", body: "ویب ڈیلیوری کے لیے جدید WebP ورژن بنائیں۔"},
      {href: "/crop-png", title: "Crop PNG", body: "PNG کے غیر ضروری حصے کاٹیں۔"},
      {href: "/resize-jpg", title: "Resize JPG", body: "فوٹوگرافک JPG کے ابعاد بدلیں۔"},
      {
        href: "/bulk-image-tools",
        title: "Bulk Resize Images",
        body: "ایک ورک فلو میں کئی تصاویر ری سائز کریں۔",
      },
    ],
  },
  cta: {
    title: "ایک اور PNG ری سائز کریں؟",
    body: "ایک اور PNG اپ لوڈ کریں یا اعلیٰ حدود اور پروجیکٹ ہسٹری کے لیے مفت اکاؤنٹ بنائیں۔",
    primaryLabel: "ایک اور PNG ری سائز کریں",
    secondaryLabel: "مفت اکاؤنٹ بنائیں",
    secondaryHref: "/register",
  },
  compressNote: {
    before: "ری سائز کے بعد چھوٹی فائل چاہیے؟ ",
    link: "Compress PNG",
    after: " سے ڈاؤن لوڈ سائز کم کریں۔",
    href: "/compress-png",
  },
};

export function getResizePngCopy(locale: string): ResizePngCopy {
  return locale === "ur" ? ur : en;
}

export function resizePngSeoCompat() {
  const c = en;
  return {
    intro: [
      c.hero.paragraph,
      "Guest sessions stay private on temporary storage, and the download is a new PNG rather than an overwrite of your original asset.",
    ].join(" "),
    why: [
      c.intro.paragraphs[0],
      c.intro.paragraphs[1],
      "Unlike Resize JPG, this landing targets logos, UI chrome, icons, and screenshots where transparency and hard edges matter most for designers and developers.",
      "Popular design sizes such as website logos, app icons and favicons make it faster to match real layout slots without inventing unsupported exact-platform exports.",
      c.benefits.cards[0]!.body,
    ].join(" "),
    benefits: c.benefits.cards.map((card) => ({title: card.title, body: card.body})),
    howTo: [
      "Upload a PNG image",
      "Choose a design preset or custom dimensions",
      "Keep aspect ratio locked when needed",
      "Download the resized PNG",
    ] as [string, string, string, string],
    technicalTitle: c.guide.title,
    technical: [...c.guide.paragraphs, ...c.guide.points.slice(0, 3)].join(" "),
    faqs: c.faqs,
    ctaLabel: c.cta.primaryLabel,
  };
}

export type ResizePngLocale = AppLocale;
