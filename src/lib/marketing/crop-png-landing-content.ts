import {localizedCopy} from "@/lib/marketing/localized-copy";
/**
 * Crop PNG landing — transparent logos / icons / UI graphics
 * (distinct from Crop JPG photographic composition).
 */
import type {AppLocale} from "@/i18n/routing";

export type CropPngFaq = {q: string; a: string};

export type CropPngCopy = {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  breadcrumbParent: {href: "/crop-image"; label: string};
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
  ratios: {
    eyebrow: string;
    title: string;
    intro: string;
    cards: {id: string; title: string; ratio: string; hint: string}[];
  };
  benefits: {
    eyebrow: string;
    title: string;
    cards: {
      title: string;
      body: string;
      icon: "alpha" | "crop" | "logo" | "organize" | "privacy" | "safe";
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
  faqs: CropPngFaq[];
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

const en: CropPngCopy = {
  metaTitle: "Crop PNG Images Online Free | Img Pilot",
  metaDescription:
    "Crop PNG images online while preserving transparent backgrounds. Remove unwanted areas and download a precisely cropped PNG securely.",
  h1: "Crop PNG Images Online",
  breadcrumbParent: {href: "/crop-image", label: "Crop Image"},
  breadcrumbCurrent: "Crop PNG Images Online",
  hero: {
    badge: "PNG IMAGE CROPPER",
    paragraph:
      "Crop PNG images while preserving transparent backgrounds. Remove unwanted areas from logos, icons, interface graphics and illustrations directly in your browser.",
    trust: [
      "Transparency Preserved",
      "Precise Crop Tool",
      "Private Processing",
      "No Software Required",
    ],
    uploadCta: "Upload PNG",
    heroImageAlt:
      "Browser PNG crop editor with a transparent logo on checkerboard, crop handles and aspect ratio controls",
  },
  guestBar: {
    title: "Guest usage",
    deletionTitle: "Automatic deletion",
    countdownLabel: "Temporary files delete automatically in",
  },
  upload: {
    heading: "Upload a PNG Image",
    supporting: "Drag and drop a PNG image, paste it from your clipboard or browse your computer.",
    chooseLabel: "Choose PNG",
    formatsHint: "PNG · Maximum file size follows guest limits shown above",
    features: [
      {title: "Transparent Backgrounds", body: "Keep alpha so logos and UI stay cut out after crop."},
      {title: "Precise Crop Area", body: "Drag handles to trim empty canvas around the graphic."},
      {title: "Private Processing", body: "Uploads stay in temporary private storage."},
      {title: "Automatic File Deletion", body: "Guest files are removed after the retention countdown."},
    ],
  },
  intro: {
    eyebrow: "PRECISION PNG CROPPING",
    title: "Crop PNG Images Without Losing Transparency",
    paragraphs: [
      "PNG images are widely used for graphics because they support transparent backgrounds and crisp edges. Cropping helps remove unnecessary space around logos, icons and interface elements while keeping transparency intact.",
      "This tool creates a newly cropped PNG while preserving your original image on your device.",
      "Cropping changes which pixels remain. It does not replace resize for target dimensions or compress for smaller file weight.",
    ],
    imageAlt:
      "Transparent PNG logo with large empty margins before crop and tightly trimmed after crop, transparency preserved",
  },
  ratios: {
    eyebrow: "POPULAR CROP PRESETS",
    title: "Ratios That Work for Graphics Assets",
    intro:
      "After upload, use these aspect options in the crop editor. Free crop stays unlocked for trimming logo margins and irregular UI art.",
    cards: [
      {id: "free", title: "Free Crop", ratio: "Free", hint: "Trim any transparent margin"},
      {id: "1:1", title: "Square", ratio: "1:1", hint: "Icons and avatar marks"},
      {id: "16:9", title: "Landscape", ratio: "16:9", hint: "Wide UI and banners"},
      {id: "3:4", title: "Portrait", ratio: "3:4", hint: "Tall stickers and cards"},
      {id: "icon", title: "Icon", ratio: "1:1", hint: "App and site icons"},
      {id: "logo", title: "Logo", ratio: "Free", hint: "Tight brand mark framing"},
      {id: "custom", title: "Custom Ratio", ratio: "Free", hint: "Unlock and refine"},
    ],
  },
  benefits: {
    eyebrow: "WHY CROP PNG",
    title: "Cleaner Transparent Assets for Design Work",
    cards: [
      {
        title: "Transparency Preserved",
        body: "Keep see-through backgrounds so logos and overlays stay clean on any page color.",
        icon: "alpha",
      },
      {
        title: "Precise Cropping",
        body: "Drag crop handles to remove empty canvas without flattening the graphic.",
        icon: "crop",
      },
      {
        title: "Perfect for Logos",
        body: "Tighten brand marks exported with oversized transparent padding.",
        icon: "logo",
      },
      {
        title: "Better Asset Organization",
        body: "Hand designers and developers tighter files that match real visual bounds.",
        icon: "organize",
      },
      {
        title: "Private Processing",
        body: "Files remain temporary and are not published to a public gallery.",
        icon: "privacy",
      },
      {
        title: "Original Protected",
        body: "Download a new cropped PNG. The original file on your device stays unchanged.",
        icon: "safe",
      },
    ],
  },
  howTo: {
    eyebrow: "THREE SIMPLE STEPS",
    title: "How to Crop a PNG Image",
    steps: [
      {
        title: "Upload PNG",
        body: "Choose a PNG from your device, drag it into the upload area or paste it from your clipboard.",
      },
      {
        title: "Crop",
        body: "Drag the crop box, optionally lock a ratio, and preview transparent edges before you process.",
      },
      {
        title: "Download PNG",
        body: "Process the image and download the newly cropped PNG.",
      },
    ],
    imageAlt: "Three steps for uploading PNG, selecting a crop and downloading the cropped PNG",
  },
  guide: {
    title: "Why Crop Transparent PNG Images?",
    paragraphs: [
      "Exports from design tools often include large empty transparent margins that waste layout space and make assets awkward to place.",
      "Cropping trims that unused canvas while leaving the visible graphic and its transparency intact.",
    ],
    points: [
      "Remove empty margins around logos and icons",
      "Prepare brand marks for headers and footers",
      "Optimize UI assets before packing into kits",
      "Improve presentations with tighter overlays",
      "Create cleaner exports for developers and partners",
      "Deliver better website graphics without opaque boxes",
    ],
    note: "Cropping transparent images removes unnecessary canvas space without affecting the visible graphic.",
  },
  useCases: {
    eyebrow: "COMMON USE CASES",
    title: "Where Crop PNG Helps Most",
    cards: [
      {
        title: "Company Logos",
        body: "Trim oversized transparent padding from brand exports before publishing.",
      },
      {
        title: "Website Icons",
        body: "Frame icons cleanly for navigation, badges and product UI.",
      },
      {
        title: "UI Components",
        body: "Crop interface chrome and illustrations that arrived with unused canvas.",
      },
      {
        title: "Product Stickers",
        body: "Tighten transparent stickers and badges for ecommerce overlays.",
      },
    ],
  },
  tips: {
    eyebrow: "BETTER RESULTS",
    title: "Cropping Tips",
    items: [
      "Remove unnecessary transparent margins before you resize or compress.",
      "Keep aspect ratio locked where icons or slots require a fixed shape.",
      "Preview transparent edges on light and dark backgrounds.",
      "Keep the original PNG as a master before replacing brand kits.",
      "Use square crops for many icons and profile marks.",
      "Export optimized assets afterward with Resize PNG or Compress PNG when needed.",
    ],
  },
  faqHeading: "Frequently Asked Questions",
  faqs: [
    {
      q: "Can PNG transparency be preserved when cropping?",
      a: "Yes for supported alpha paths. The crop keeps the PNG container so transparent backgrounds remain available — always preview logos before publishing.",
    },
    {
      q: "Will cropping a PNG reduce image quality?",
      a: "Cropping removes pixels outside the box; it does not add compression by itself. Softness usually comes from later resizing or heavy compression passes.",
    },
    {
      q: "Can I crop PNG logos online?",
      a: "Yes. This landing is built for transparent logos with empty margins around the mark.",
    },
    {
      q: "Can I crop PNG icons?",
      a: "Yes. Use free crop to tighten irregular icons or lock 1:1 when you need a square icon frame.",
    },
    {
      q: "Will Crop PNG change the original image?",
      a: "No. The tool creates a new cropped PNG download. The original on your device stays unchanged.",
    },
    {
      q: "Are Crop PNG uploads private?",
      a: "Guest images use private temporary storage and are deleted automatically according to the retention countdown on the page.",
    },
    {
      q: "What are the guest limits for Crop PNG?",
      a: "Free guest operations and maximum file size appear in the usage bar above the uploader. Higher limits may require an account.",
    },
    {
      q: "What is the maximum upload size for Crop PNG?",
      a: "The maximum size matches the guest upload limit shown in the usage bar. Oversized files are rejected before cropping starts.",
    },
    {
      q: "What is the difference between cropping and resizing a PNG?",
      a: "Cropping changes which area remains. Resizing changes the pixel dimensions of the remaining image. Crop first to remove empty margins, then resize if a slot needs exact width and height.",
    },
    {
      q: "Can I crop transparent backgrounds without filling them in?",
      a: "Yes. Crop PNG keeps transparency instead of converting to an opaque JPG. Choose PNG to JPG only when you intentionally want a solid background.",
    },
  ],
  related: {
    eyebrow: "CONTINUE EDITING",
    title: "Related Image Tools",
    tools: [
      {href: "/resize-png", title: "Resize PNG", body: "Fit the cropped PNG to an exact layout box."},
      {href: "/compress-png", title: "Compress PNG", body: "Reduce PNG weight after trimming margins."},
      {href: "/png-to-webp", title: "PNG to WebP", body: "Ship smaller transparent assets to the web."},
      {href: "/png-to-jpg", title: "PNG to JPG", body: "Flatten transparency when partners need JPG."},
      {href: "/crop-jpg", title: "Crop JPG", body: "Crop photographic JPG images for composition."},
      {href: "/bulk-image-tools", title: "Bulk Image Tools", body: "Process several images in one guest workflow."},
    ],
  },
  cta: {
    title: "Ready to Crop Another PNG?",
    body: "Upload another PNG or create a free account for more image editing tools and higher usage limits.",
    primaryLabel: "Crop Another Image",
    secondaryLabel: "Create Free Account",
    secondaryHref: "/register",
  },
};

const ur: CropPngCopy = {
  metaTitle: "آن لائن PNG امیجز کراپ کریں مفت | Img Pilot",
  metaDescription:
    "شفاف پس منظر برقرار رکھتے ہوئے PNG تصاویر آن لائن کراپ کریں۔ غیر مطلوبہ حصے ہٹائیں اور درست کراپ شدہ PNG محفوظ انداز میں ڈاؤن لوڈ کریں۔",
  h1: "آن لائن PNG امیجز کراپ کریں",
  breadcrumbParent: {href: "/crop-image", label: "تصویر کراپ کریں"},
  breadcrumbCurrent: "Crop PNG Images Online",
  hero: {
    badge: "PNG IMAGE CROPPER",
    paragraph:
      "شفاف پس منظر برقرار رکھتے ہوئے PNG امیجز کراپ کریں۔ لوگو، آئیکنز، انٹرفیس گرافکس اور الیسٹریشنز سے غیر مطلوبہ حصے براہِ راست براؤزر میں ہٹائیں۔",
    trust: ["شفافیت محفوظ", "درست کراپ ٹول", "نجی پروسیسنگ", "سافٹ ویئر کی ضرورت نہیں"],
    uploadCta: "PNG اپ لوڈ کریں",
    heroImageAlt: "براؤزر PNG کراپ ایڈیٹر چیکربورڈ پر شفاف لوگو، کراپ ہینڈلز اور آسپیوٹ کنٹرولز کے ساتھ",
  },
  guestBar: {
    title: "مہمان استعمال",
    deletionTitle: "خودکار حذف",
    countdownLabel: "عارضی فائلیں خود بخود حذف ہوں گی",
  },
  upload: {
    heading: "PNG تصویر اپ لوڈ کریں",
    supporting: "PNG گھسیٹیں، کلپ بورڈ سے چسپاں کریں یا کمپیوٹر سے چنیں۔",
    chooseLabel: "PNG چنیں",
    formatsHint: "PNG · زیادہ سے زیادہ فائل سائز اوپر دکھائی گئی مہمان حد کے مطابق",
    features: [
      {title: "شفاف پس منظر", body: "کراپ کے بعد بھی لوگو اور UI کٹ آؤٹ رہیں۔"},
      {title: "درست کراپ ایریا", body: "گرافک کے گرد خالی کینوس کاٹنے کے لیے ہینڈلز گھسیٹیں۔"},
      {title: "نجی پروسیسنگ", body: "اپ لوڈز عارضی نجی اسٹوریج میں رہتی ہیں۔"},
      {title: "خودکار فائل حذف", body: "برقرار رکھنے کی مدت کے بعد مہمان فائلیں ہٹ جاتی ہیں۔"},
    ],
  },
  intro: {
    eyebrow: "درست PNG کراپنگ",
    title: "شفافیت کھائے بغیر PNG امیجز کراپ کریں",
    paragraphs: [
      "PNG گرافکس کے لیے وسیع استعمال ہوتی ہے کیونکہ شفاف پس منظر اور تیز کنارے رکھتی ہے۔ کراپنگ لوگو، آئیکنز اور انٹرفیس عناصر کے گرد غیر ضروری جگہ ہٹاتی ہے جبکہ شفافیت برقرار رہتی ہے۔",
      "یہ ٹول نئی کراپ شدہ PNG بناتا ہے جبکہ اصل تصویر آپ کی ڈیوائس پر محفوظ رہتی ہے۔",
      "کراپنگ بتاتی ہے کون سے پکسلز رہیں۔ یہ ٹارگٹ ابعاد کے لیے ری سائز یا فائل وزن کے لیے کمپریس کا متبادل نہیں۔",
    ],
    imageAlt: "شفاف PNG لوگو بڑے خالی حاشیوں کے ساتھ پہلے اور سخت کراپ کے بعد، شفافیت محفوظ",
  },
  ratios: {
    eyebrow: "مشہور کراپ پری سیٹس",
    title: "گرافکس اثاثوں کے لیے موزوں ریشوز",
    intro:
      "اپ لوڈ کے بعد کراپ ایڈیٹر میں یہ آسپیوٹ اختیارات استعمال کریں۔ لوگو حاشیے اور غیر معیاری UI آرٹ کے لیے فری کراپ کھلا رہتا ہے۔",
    cards: [
      {id: "free", title: "فری کراپ", ratio: "Free", hint: "کوئی بھی شفاف حاشیہ کاٹیں"},
      {id: "1:1", title: "اسکوائر", ratio: "1:1", hint: "آئیکنز اور اوتار مارکس"},
      {id: "16:9", title: "لینڈسکیپ", ratio: "16:9", hint: "چوڑا UI اور بینرز"},
      {id: "3:4", title: "پورٹریٹ", ratio: "3:4", hint: "لمبے اسٹیکرز اور کارڈز"},
      {id: "icon", title: "آئیکن", ratio: "1:1", hint: "ایپ اور سائٹ آئیکنز"},
      {id: "logo", title: "لوگو", ratio: "Free", hint: "ٹائٹ برانڈ مارک فریمنگ"},
      {id: "custom", title: "حسبِ ضرورت ریشو", ratio: "Free", hint: "ان لاک کر کے بہتر بنائیں"},
    ],
  },
  benefits: {
    eyebrow: "PNG کیوں کراپ کریں",
    title: "ڈیزائن ورک کے لیے صاف شفاف اثاثے",
    cards: [
      {
        title: "شفافیت محفوظ",
        body: "شفاف پس منظر رکھیں تاکہ لوگو اور اوورلیز کسی بھی صفحہ رنگ پر صاف رہیں۔",
        icon: "alpha",
      },
      {
        title: "درست کراپنگ",
        body: "گرافک فلیٹن کیے بغیر خالی کینوس ہٹانے کے لیے ہینڈلز گھسیٹیں۔",
        icon: "crop",
      },
      {
        title: "لوگو کے لیے بہترین",
        body: "بڑے شفاف پیڈنگ والے برانڈ مارکس سخت کریں۔",
        icon: "logo",
      },
      {
        title: "بہتر اثاثہ تنظیم",
        body: "ڈیزائنرز اور ڈیولپرز کو حقیقی بصری حدود سے ملتی جلتی ٹائٹ فائلیں دیں۔",
        icon: "organize",
      },
      {
        title: "نجی پروسیسنگ",
        body: "فائلیں عارضی رہتی ہیں اور عوامی گیلری میں نہیں جاتیں۔",
        icon: "privacy",
      },
      {
        title: "اصل محفوظ",
        body: "نئی کراپ شدہ PNG ڈاؤن لوڈ کریں۔ اصل فائل جوں کی توں رہتی ہے۔",
        icon: "safe",
      },
    ],
  },
  howTo: {
    eyebrow: "تین آسان مراحل",
    title: "PNG امیج کیسے کراپ کریں",
    steps: [
      {
        title: "PNG اپ لوڈ کریں",
        body: "ڈیوائس سے PNG چنیں، اپ لوڈ ایریا میں گھسیٹیں، یا کلپ بورڈ سے چسپاں کریں۔",
      },
      {
        title: "کراپ کریں",
        body: "کراپ باکس گھسیٹیں، اختیاری طور پر ریشو لاک کریں، اور پروسیس سے پہلے شفاف کنارے دیکھیں۔",
      },
      {
        title: "PNG ڈاؤن لوڈ کریں",
        body: "امیج پروسیس کریں اور نئی کراپ شدہ PNG ڈاؤن لوڈ کریں۔",
      },
    ],
    imageAlt: "PNG اپ لوڈ، کراپ انتخاب اور کراپ شدہ PNG ڈاؤن لوڈ کے تین مراحل",
  },
  guide: {
    title: "شفاف PNG امیجز کیوں کراپ کریں؟",
    paragraphs: [
      "ڈیزائن ٹولز کی ایکسپورٹس اکثر بڑے خالی شفاف حاشیے رکھتی ہیں جو لے آؤٹ جگہ ضائع کرتے ہیں اور اثاثے رکھنا مشکل بنا دیتے ہیں۔",
      "کراپنگ اس غیر استعمال شدہ کینوس کو کاٹتی ہے جبکہ دکھائی دینے والا گرافک اور اس کی شفافیت برقرار رہتی ہے۔",
    ],
    points: [
      "لوگو اور آئیکنز کے گرد خالی حاشیے ہٹائیں",
      "ہیڈر اور فوٹر کے لیے برانڈ مارکس تیار کریں",
      "کٹس میں پیک کرنے سے پہلے UI اثاثے آپٹیمائز کریں",
      "ٹائٹ اوورلیز سے پریزنٹیشنز بہتر بنائیں",
      "ڈیولپرز اور پارٹنرز کے لیے صاف ایکسپورٹس بنائیں",
      "غیر شفاف باکسز کے بغیر بہتر ویب سائٹ گرافکس دیں",
    ],
    note: "شفاف امیجز کراپ کرنے سے غیر ضروری کینوس جگہ ہٹتی ہے بغیر دکھائی دینے والے گرافک کو متاثر کیے۔",
  },
  useCases: {
    eyebrow: "عام استعمالات",
    title: "Crop PNG سب سے زیادہ کہاں مدد کرتا ہے",
    cards: [
      {
        title: "کمپنی لوگو",
        body: "شائع کرنے سے پہلے برانڈ ایکسپورٹس سے بڑی شفاف پیڈنگ کاٹیں۔",
      },
      {
        title: "ویب سائٹ آئیکنز",
        body: "نیویگیشن، بیجز اور پروڈکٹ UI کے لیے آئیکنز صاف فریم کریں۔",
      },
      {
        title: "UI کمپوننٹس",
        body: "غیر استعمال شدہ کینوس والے انٹرفیس اور الیسٹریشنز کراپ کریں۔",
      },
      {
        title: "پروڈکٹ اسٹیکرز",
        body: "ای کامرس اوورلیز کے لیے شفاف اسٹیکرز اور بیجز سخت کریں۔",
      },
    ],
  },
  tips: {
    eyebrow: "بہتر نتائج",
    title: "کراپنگ کے مشورے",
    items: [
      "ری سائز یا کمپریس سے پہلے غیر ضروری شفاف حاشیے ہٹائیں۔",
      "جہاں آئیکنز یا سلاٹس کو فکسڈ شکل چاہیے تناسب لاک رکھیں۔",
      "ہلکے اور گہرے پس منظر پر شفاف کنارے پری ویو کریں۔",
      "برانڈ کٹس بدلنے سے پہلے اصل PNG ماسٹر رکھیں۔",
      "بہت سے آئیکنز اور پروفائل مارکس کے لیے اسکوائر کراپ استعمال کریں۔",
      "ضرورت ہو تو بعد میں Resize PNG یا Compress PNG سے آپٹیمائز ایکسپورٹ کریں۔",
    ],
  },
  faqHeading: "عمومی سوالات",
  faqs: [
    {
      q: "کیا کراپ کرتے وقت PNG شفافیت محفوظ رہتی ہے؟",
      a: "سپورٹڈ الفا راستوں پر ہاں۔ کراپ PNG کنٹینر رکھتا ہے تاکہ شفاف پس منظر دستیاب رہیں — شائع کرنے سے پہلے لوگو پری ویو کریں۔",
    },
    {
      q: "کیا PNG کراپ سے امیج کوالٹی کم ہوتی ہے؟",
      a: "کراپنگ باکس کے باہر پکسلز ہٹاتی ہے؛ خود کمپریشن شامل نہیں کرتی۔ دھندلاپن عموماً بعد کے ری سائز یا سخت کمپریشن سے آتا ہے۔",
    },
    {
      q: "کیا PNG لوگو آن لائن کراپ ہو سکتے ہیں؟",
      a: "ہاں۔ یہ لینڈنگ شفاف لوگو اور ان کے گرد خالی حاشیوں کے لیے بنائی گئی ہے۔",
    },
    {
      q: "کیا PNG آئیکنز کراپ ہو سکتے ہیں؟",
      a: "ہاں۔ غیر معیاری آئیکنز سخت کرنے کے لیے فری کراپ استعمال کریں یا اسکوائر آئیکن فریم کے لیے 1:1 لاک کریں۔",
    },
    {
      q: "کیا Crop PNG اصل امیج بدل دیتا ہے؟",
      a: "نہیں۔ ٹول نئی کراپ شدہ PNG ڈاؤن لوڈ بناتا ہے۔ آپ کی ڈیوائس پر اصل جوں کی توں رہتی ہے۔",
    },
    {
      q: "کیا Crop PNG اپ لوڈز نجی ہیں؟",
      a: "مہمان تصاویر نجی عارضی اسٹوریج استعمال کرتی ہیں اور صفحے پر دکھائی گئی برقرار رکھنے کی مدت کے مطابق خودبخود حذف ہوتی ہیں۔",
    },
    {
      q: "Crop PNG کی مہمان حدود کیا ہیں؟",
      a: "مفت مہمان آپریشنز اور زیادہ سے زیادہ فائل سائز اپ لوڈر کے اوپر استعمال بار میں نظر آتی ہیں۔ اعلیٰ حدود کے لیے اکاؤنٹ درکار ہو سکتا ہے۔",
    },
    {
      q: "Crop PNG کی زیادہ سے زیادہ اپ لوڈ سائز کیا ہے؟",
      a: "زیادہ سے زیادہ سائز استعمال بار میں دکھائی گئی مہمان اپ لوڈ حد کے برابر ہے۔ بڑی فائلیں کراپ سے پہلے مسترد ہوتی ہیں۔",
    },
    {
      q: "PNG کراپ اور ری سائز میں کیا فرق ہے؟",
      a: "کراپنگ بتاتی ہے کون سا حصہ رہے۔ ری سائز رہ جانے والی امیج کے پکسل ابعاد بدلتا ہے۔ پہلے خالی حاشیے ہٹانے کے لیے کراپ کریں، پھر اگر سلاٹ کو عین چوڑائی اور اونچائی چاہیے تو ری سائز کریں۔",
    },
    {
      q: "کیا شفاف پس منظر بھرتے بغیر کراپ ہو سکتے ہیں؟",
      a: "ہاں۔ Crop PNG شفافیت رکھتا ہے بجائے غیر شفاف JPG بنانے کے۔ صرف تب PNG to JPG چنیں جب جان بوجھ کر ٹھوس پس منظر چاہیے۔",
    },
  ],
  related: {
    eyebrow: "مزید ایڈیٹنگ",
    title: "متعلقہ امیج ٹولز",
    tools: [
      {href: "/resize-png", title: "Resize PNG", body: "کراپ شدہ PNG کو عین لے آؤٹ باکس پر فٹ کریں۔"},
      {href: "/compress-png", title: "Compress PNG", body: "حاشیے کاٹنے کے بعد PNG وزن کم کریں۔"},
      {href: "/png-to-webp", title: "PNG to WebP", body: "ویب کے لیے چھوٹی شفاف اثاثے بھیجیں۔"},
      {href: "/png-to-jpg", title: "PNG to JPG", body: "جب پارٹنر JPG چاہے تو شفافیت فلیٹن کریں۔"},
      {href: "/crop-jpg", title: "Crop JPG", body: "کمپوزیشن کے لیے فوٹوگرافک JPG کراپ کریں۔"},
      {href: "/bulk-image-tools", title: "Bulk Image Tools", body: "ایک مہمان ورک فلو میں کئی تصاویر پروسیس کریں۔"},
    ],
  },
  cta: {
    title: "ایک اور PNG کراپ کریں؟",
    body: "ایک اور PNG اپ لوڈ کریں یا مزید امیج ایڈیٹنگ ٹولز اور اعلیٰ استعمال کی حدود کے لیے مفت اکاؤنٹ بنائیں۔",
    primaryLabel: "ایک اور تصویر کراپ کریں",
    secondaryLabel: "مفت اکاؤنٹ بنائیں",
    secondaryHref: "/register",
  },
};

export function getCropPngCopy(locale: string): CropPngCopy {
  return localizedCopy(locale, {en, ur});
}

export function cropPngSeoCompat() {
  const c = en;
  return {
    intro: [
      c.hero.paragraph,
      "Guest sessions stay private on temporary storage, and the download is a new cropped PNG rather than an overwrite of your original.",
      "This landing focuses on transparent logos, icons and UI graphics — not photographic JPG composition crops.",
    ].join(" "),
    why: [
      c.intro.paragraphs[0],
      c.guide.paragraphs[0],
      "Unlike Crop JPG (photo framing), Crop PNG keeps alpha so empty transparent margins can be trimmed without inventing a solid background.",
      c.benefits.cards[0]!.body,
      c.guide.note,
    ].join(" "),
    benefits: c.benefits.cards.map((card) => ({title: card.title, body: card.body})),
    howTo: [
      "Upload a PNG image",
      "Select the crop area",
      "Crop with the guest engine",
      "Download the cropped PNG",
    ] as [string, string, string, string],
    technicalTitle: c.guide.title,
    technical: [...c.guide.paragraphs, ...c.guide.points.slice(0, 4), c.guide.note].join(" "),
    faqs: c.faqs,
    ctaLabel: c.cta.primaryLabel,
  };
}

export type CropPngLocale = AppLocale;
