import {localizedCopy} from "@/lib/marketing/localized-copy";
/**
 * Geotag Images hub — JPEG-only GPS write; honest about PNG/WebP limits.
 */
import {isAppLocale, type AppLocale} from "@/i18n/routing";

export type GeotagImageFaq = {q: string; a: string};

export type GeotagImageCopy = {
  metaTitle: string;
  metaDescription: string;
  h1: string;
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
  };
  benefits: {
    eyebrow: string;
    title: string;
    cards: {
      title: string;
      body: string;
      icon: "gps" | "browser" | "privacy" | "jpeg" | "replace" | "mobile" | "safe" | "fast";
    }[];
  };
  howTo: {
    eyebrow: string;
    title: string;
    steps: {title: string; body: string}[];
    imageAlt: string;
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
  faqs: GeotagImageFaq[];
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

const en: GeotagImageCopy = {
  metaTitle: "Geotag Images Online Free | Img Pilot",
  metaDescription:
    "Add GPS location to JPEG photos online. Write latitude, longitude and optional altitude to JPG EXIF metadata in your browser with private processing.",
  h1: "Geotag Images Online",
  breadcrumbCurrent: "Geotag Images Online",
  hero: {
    badge: "ONLINE IMAGE GEOTAGGER",
    paragraph:
      "Add GPS coordinates to JPEG photos directly in your browser. Enter latitude and longitude manually, use your current location, or inspect existing GPS before writing a new geotagged JPG download.",
    trust: ["JPEG GPS Write", "Browser Location", "Private Processing", "No Software"],
    uploadCta: "Geotag a Photo",
    heroImageAlt:
      "Browser geotagging tool showing a JPEG photo, map pin, latitude and longitude fields and a geotagged download",
  },
  guestBar: {
    title: "Guest usage",
    deletionTitle: "Automatic deletion",
    countdownLabel: "Temporary files delete automatically in",
  },
  upload: {
    heading: "Upload a JPEG Photo",
    supporting: "Drag and drop a JPG/JPEG image or browse your device.",
    chooseLabel: "Choose JPEG",
    formatsHint: "JPEG only for GPS write · PNG and WebP are not supported for geotagging",
    features: [
      {title: "JPEG GPS write", body: "Embeds latitude, longitude and optional altitude in JPG EXIF metadata."},
      {title: "Browser location", body: "Fill coordinates from your device when you approve location access."},
      {title: "Existing GPS inspect", body: "See whether a JPEG already carries readable GPS before replacing it."},
      {title: "Private processing", body: "Files stay in temporary private storage with automatic cleanup."},
    ],
  },
  intro: {
    eyebrow: "ADD LOCATION TO PHOTOS",
    title: "Geotag JPEG Images for Maps, Archives and Field Work",
    paragraphs: [
      "GPS metadata helps photos show up on maps, sort into location folders and prove where a shot was taken. Many cameras embed coordinates automatically, but phone exports, edited JPEGs and legacy uploads often arrive without location data.",
      "Img Pilot geotags JPEG files only. The guest engine writes EXIF GPS tags into a new JPG download — it does not claim PNG or WebP geotag support because those containers are not handled for GPS write in this tool.",
      "Upload a JPEG, set coordinates manually or from your browser, optionally add altitude and a short location label, then download the geotagged copy. Guest files expire on the countdown shown above the workspace.",
    ],
  },
  benefits: {
    eyebrow: "WHY USE THIS GEOTAGGER",
    title: "Honest GPS Write for Everyday JPEG Workflows",
    cards: [
      {
        title: "JPEG-only GPS embed",
        body: "Writes latitude, longitude and optional altitude into JPG EXIF — the format this engine actually supports.",
        icon: "jpeg",
      },
      {
        title: "Use browser location",
        body: "Approve location access once and let the tool fill decimal degrees for you.",
        icon: "browser",
      },
      {
        title: "Replace existing GPS safely",
        body: "Inspect readable GPS first, then confirm before overwriting coordinates in a JPEG that already has tags.",
        icon: "replace",
      },
      {
        title: "Private temporary storage",
        body: "Uploads and outputs stay in short-lived guest storage with automatic deletion.",
        icon: "privacy",
      },
      {
        title: "Map-ready coordinates",
        body: "Decimal-degree fields with validation so values stay inside real-world latitude and longitude ranges.",
        icon: "gps",
      },
      {
        title: "No install required",
        body: "Geotag from desktop or mobile browsers without desktop EXIF utilities.",
        icon: "mobile",
      },
      {
        title: "Verified round-trip",
        body: "The server checks written GPS against your submitted coordinates before marking the job complete.",
        icon: "safe",
      },
      {
        title: "Fast single-file flow",
        body: "One JPEG in, one geotagged JPEG out — ideal for quick field corrections.",
        icon: "fast",
      },
    ],
  },
  howTo: {
    eyebrow: "FOUR SIMPLE STEPS",
    title: "How to Geotag a JPEG Online",
    steps: [
      {
        title: "Upload JPEG",
        body: "Choose a JPG or JPEG file. Other formats show an honest JPEG-only notice and cannot be geotagged here.",
      },
      {
        title: "Set coordinates",
        body: "Type latitude and longitude, use browser location, and optionally add altitude or a short label.",
      },
      {
        title: "Confirm GPS replace",
        body: "If the file already has GPS, enable replace existing GPS before processing.",
      },
      {
        title: "Download geotagged JPG",
        body: "Download the new JPEG with embedded EXIF GPS metadata. Your original file on device stays unchanged.",
      },
    ],
    imageAlt:
      "Four-step geotag workflow: upload JPEG, enter coordinates, confirm GPS replace and download geotagged file",
  },
  useCases: {
    eyebrow: "COMMON USE CASES",
    title: "When Teams Add GPS to JPEG Photos",
    cards: [
      {
        title: "Real estate and inspections",
        body: "Attach proof-of-location to property photos before sharing with clients or compliance archives.",
      },
      {
        title: "Travel and journalism",
        body: "Restore map pins on edited JPEGs that lost EXIF during compression or social re-uploads.",
      },
      {
        title: "Field surveys",
        body: "Tag site photos with coordinates captured on a phone when the camera did not write GPS.",
      },
      {
        title: "Stock and archive prep",
        body: "Batch-fix individual JPEG masters that need location metadata before DAM import.",
      },
    ],
  },
  tips: {
    eyebrow: "PRACTICAL TIPS",
    title: "Geotagging Tips for Better Results",
    items: [
      "Use JPEG sources — PNG and WebP uploads cannot receive GPS writes in this guest tool.",
      "Check existing GPS before replacing tags on photos that already map correctly.",
      "Decimal degrees are easiest for manual entry; the tool validates latitude (−90 to 90) and longitude (−180 to 180).",
      "Browser location is advisory — always review coordinates before processing.",
      "Need to read metadata without writing? Use the Image Metadata viewer on PNG, WebP and JPEG.",
      "Guest uploads expire — download your geotagged JPEG before the session countdown ends.",
    ],
  },
  faqHeading: "Geotag Images FAQ",
  faqs: [
    {
      q: "Which image formats can be geotagged?",
      a: "This tool writes GPS metadata to JPEG (JPG) files only. PNG and WebP are not supported for geotag write in the guest engine.",
    },
    {
      q: "Can I geotag PNG or WebP images here?",
      a: "No. GPS write is limited to JPEG. You can inspect PNG and WebP metadata with the Image Metadata viewer, but geotagging requires a JPEG upload.",
    },
    {
      q: "How do I use my current location?",
      a: "After uploading a JPEG, click the browser location control and approve the permission prompt. Coordinates fill into the latitude and longitude fields for you to review.",
    },
    {
      q: "What happens if my JPEG already has GPS?",
      a: "The tool reads existing GPS when possible. To overwrite tags, enable replace existing GPS before processing.",
    },
    {
      q: "Does geotagging change my original file?",
      a: "No. The engine creates a new geotagged JPEG download. The file on your device stays untouched.",
    },
    {
      q: "Can I add altitude and a location label?",
      a: "Yes. Optional altitude in meters and a short location label can be stored alongside latitude and longitude when you provide them.",
    },
    {
      q: "Are guest geotag uploads private?",
      a: "Yes. Guest files use temporary private storage and delete automatically on the countdown shown above the workspace.",
    },
    {
      q: "What are the guest limits for geotagging?",
      a: "Daily operations and maximum upload size appear in the usage bar above the uploader. Larger workflows may require a free account.",
    },
  ],
  related: {
    eyebrow: "RELATED TOOLS",
    title: "Continue Your Image Workflow",
    tools: [
      {href: "/image-metadata", title: "Image Metadata Viewer", body: "Inspect EXIF, dimensions and GPS on JPG, PNG and WebP without writing changes."},
      {href: "/image-metadata-editor", title: "Metadata Editor", body: "Draft alt text and SEO fields, then export sidecar files or a renamed download."},
      {href: "/compress-image", title: "Image Compressor", body: "Reduce JPEG weight after geotagging for faster web delivery."},
      {href: "/convert-image", title: "Image Converter", body: "Convert containers when you need WebP or PNG after preparing metadata."},
      {href: "/resize-image", title: "Image Resizer", body: "Set delivery dimensions once location metadata is embedded."},
      {href: "/crop-image", title: "Image Cropper", body: "Reframe photos before tagging or publishing."},
    ],
  },
  cta: {
    title: "Ready to geotag your JPEG photos?",
    body: "Upload a JPEG now or create a free account for higher limits, saved projects and additional editing tools.",
    primaryLabel: "Geotag a Photo",
    secondaryLabel: "Create Free Account",
    secondaryHref: "/register",
  },
};

const ur: GeotagImageCopy = {
  metaTitle: "آن لائن امیجز کو جیو ٹیگ کریں مفت | Img Pilot",
  metaDescription:
    "JPEG تصاویر میں آن لائن GPS مقام شامل کریں۔ براؤزر میں JPG EXIF میٹا ڈیٹا میں عرض بلد، طول بلد اور اختیاری بلندی لکھیں۔",
  h1: "آن لائن امیجز کو جیو ٹیگ کریں",
  breadcrumbCurrent: "آن لائن امیجز کو جیو ٹیگ کریں",
  hero: {
    badge: "آن لائن امیج جیو ٹیگر",
    paragraph:
      "JPEG تصاویر میں براہ راست براؤزر میں GPS کوآرڈینیٹس شامل کریں۔ عرض بلد اور طول بلد دستی درج کریں، موجودہ مقام استعمال کریں، یا نیا جیو ٹیگ JPG ڈاؤن لوڈ لکھنے سے پہلے موجودہ GPS دیکھیں۔",
    trust: ["JPEG GPS رائٹ", "براؤزر لوکیشن", "نجی پروسیسنگ", "سافٹ ویئر نہیں"],
    uploadCta: "تصویر جیو ٹیگ کریں",
    heroImageAlt:
      "براؤزر جیو ٹیگنگ ٹول JPEG تصویر، نقشے کا پِن، عرض و طول بلد فیلڈز اور جیو ٹیگڈ ڈاؤن لوڈ دکھا رہا ہے",
  },
  guestBar: {
    title: "گیسٹ استعمال",
    deletionTitle: "خودکار حذف",
    countdownLabel: "عارضی فائلیں خودکار حذف ہوں گی",
  },
  upload: {
    heading: "JPEG تصویر اپلوڈ کریں",
    supporting: "JPG/JPEG تصویر ڈریگ اینڈ ڈراپ کریں یا ڈیوائس سے براؤز کریں۔",
    chooseLabel: "JPEG منتخب کریں",
    formatsHint: "GPS رائٹ صرف JPEG · PNG اور WebP جیو ٹیگنگ کے لیے سپورٹ نہیں",
    features: [
      {title: "JPEG GPS رائٹ", body: "JPG EXIF میں عرض بلد، طول بلد اور اختیاری بلندی شامل کرتا ہے۔"},
      {title: "براؤزر لوکیشن", body: "لوکیشن کی اجازت دینے پر ڈیوائس سے کوآرڈینیٹس بھریں۔"},
      {title: "موجودہ GPS معائنہ", body: "بدلنے سے پہلے دیکھیں JPEG میں پہلے سے GPS ہے یا نہیں۔"},
      {title: "نجی پروسیسنگ", body: "فائلیں عارضی نجی اسٹوریج میں رہتی ہیں اور خودکار صفائی ہوتی ہے۔"},
    ],
  },
  intro: {
    eyebrow: "تصاویر میں مقام شامل کریں",
    title: "نقشوں، آرکائیوز اور فیلڈ ورک کے لیے JPEG جیو ٹیگ",
    paragraphs: [
      "GPS میٹا ڈیٹا تصاویر کو نقشوں پر دکھانے، مقام کے فولڈرز میں ترتیب دینے اور شوٹ کہاں لیا گیا ثابت کرنے میں مدد کرتا ہے۔ بہت سے کیمرے خودکار کوآرڈینیٹس شامل کرتے ہیں، لیکن فون ایکسپورٹ، ایڈٹ شدہ JPEG اور پرانی اپلوڈز اکثر بغیر مقام کے آتے ہیں۔",
      "Img Pilot صرف JPEG فائلوں کو جیو ٹیگ کرتا ہے۔ گیسٹ انجن EXIF GPS ٹیگز نئے JPG ڈاؤن لوڈ میں لکھتا ہے — PNG یا WebP جیو ٹیگ کا دعویٰ نہیں کرتا کیونکہ GPS رائٹ ان فارمیٹس میں نہیں ہے۔",
      "JPEG اپلوڈ کریں، دستی یا براؤزر سے کوآرڈینیٹس سیٹ کریں، اختیاری بلندی یا مختصر لیبل شامل کریں، پھر جیو ٹیگڈ کاپی ڈاؤن لوڈ کریں۔ گیسٹ فائلیں ورک اسپیس کے اوپر کاؤنٹ ڈاؤن پر ختم ہوتی ہیں۔",
    ],
  },
  benefits: {
    eyebrow: "یہ جیو ٹیگر کیوں",
    title: "روزمرہ JPEG ورک فلو کے لیے ایماندار GPS رائٹ",
    cards: [
      {title: "صرف JPEG GPS", body: "JPG EXIF میں عرض بلد، طول بلد اور اختیاری بلندی — وہی فارمیٹ جو انجن سپورٹ کرتا ہے۔", icon: "jpeg"},
      {title: "براؤزر لوکیشن", body: "ایک بار اجازت دیں اور ٹول decimal degrees بھر دے۔", icon: "browser"},
      {title: "محفوظ GPS بدلیں", body: "پہلے موجود GPS دیکھیں، پھر اوور رائٹ کی تصدیق کریں۔", icon: "replace"},
      {title: "نجی عارضی اسٹوریج", body: "اپلوڈ اور آؤٹ پut مختصر مدت کے لیے نجی رہتے ہیں۔", icon: "privacy"},
      {title: "نقشے کے لیے کوآرڈینیٹس", body: "decimal degrees کی validation حقیقی حدود میں رکھتی ہے۔", icon: "gps"},
      {title: "انسٹال نہیں", body: "ڈیسک ٹاپ EXIF ٹولز کے بغیر براؤزر سے جیو ٹیگ۔", icon: "mobile"},
      {title: "تصدیق شدہ رائٹ", body: "سرور لکھے گئے GPS کو آپ کے کوآرڈینیٹس سے ملاتا ہے۔", icon: "safe"},
      {title: "تیز سنگل فائل", body: "ایک JPEG اندر، ایک جیو ٹیگڈ JPEG باہر۔", icon: "fast"},
    ],
  },
  howTo: {
    eyebrow: "چار آسان مراحل",
    title: "آن لائن JPEG کو کیسے جیو ٹیگ کریں",
    steps: [
      {title: "JPEG اپلوڈ", body: "JPG یا JPEG منتخب کریں۔ دوسرے فارمیٹس JPEG-only نوٹس دکھاتے ہیں۔"},
      {title: "کوآرڈینیٹس سیٹ", body: "عرض و طول بلد لکھیں، براؤزر لوکیشن استعمال کریں، بلندی یا لیبل شامل کریں۔"},
      {title: "GPS بدلنے کی تصدیق", body: "اگر پہلے سے GPS ہے تو replace existing GPS فعال کریں۔"},
      {title: "جیو ٹیگڈ JPG ڈاؤن لوڈ", body: "EXIF GPS والا نیا JPEG ڈاؤن لوڈ کریں۔ اصل فائل ویسی رہتی ہے۔"},
    ],
    imageAlt: "چار مرحلہ جیو ٹیگ: JPEG اپلوڈ، کوآرڈینیٹس، GPS تصدیق، ڈاؤن لوڈ",
  },
  useCases: {
    eyebrow: "عام استعمال",
    title: "ٹیمیں JPEG میں GPS کب شامل کرتی ہیں",
    cards: [
      {title: "ریئل اسٹیٹ و معائنہ", body: "کلائنٹس یا compliance آرکائیوز کے لیے مقام کا ثبوت منسلک کریں۔"},
      {title: "سفر و صحافت", body: "compression یا social re-upload سے GPS کھوئی JPEG پر نقشے کا پِن بحال کریں۔"},
      {title: "فیلڈ سروے", body: "جب کیمرے نے GPS نہیں لکھا فون سے کوآرڈینیٹس منسلک کریں۔"},
      {title: "اسٹاک و آرکائیو", body: "DAM درآمد سے پہلے انفرادی JPEG masters میں مقام درست کریں۔"},
    ],
  },
  tips: {
    eyebrow: "عملی تجاویز",
    title: "بہتر نتائج کے لیے جیو ٹیگنگ ٹپس",
    items: [
      "JPEG ماخذ استعمال کریں — PNG/WebP میں یہاں GPS رائٹ نہیں۔",
      "پہلے سے درست GPS والے فото پر replace سے پہلے چیک کریں۔",
      "decimal degrees دستی entry کے لیے آسان؛ validation حدود enforce کرتی ہے۔",
      "براؤزر لوکیشن مشورہ ہے — پروسیس سے پہلے کوآرڈینیٹس دیکھیں۔",
      "بغیر لکھے پڑھنا ہو تو Image Metadata viewer JPG, PNG, WebP پر استعمال کریں۔",
      "گیسٹ فائلیں ختم ہوتی ہیں — کاؤنٹ ڈاؤن سے پہلے جیو ٹیگڈ JPEG ڈاؤن لوڈ کریں۔",
    ],
  },
  faqHeading: "جیو ٹیگ امیجز FAQ",
  faqs: [
    {q: "کون سے فارمیٹس جیو ٹیگ ہو سکتے ہیں؟", a: "یہ ٹول صرف JPEG (JPG) میں GPS لکھتا ہے۔ PNG اور WebP guest engine میں geotag write سپورٹ نہیں۔"},
    {q: "کیا PNG یا WebP یہاں جیو ٹیگ ہو سکتے ہیں؟", a: "نہیں۔ GPS رائٹ JPEG تک محدود ہے۔ PNG/WebP metadata viewer سے دیکھ سکتے ہیں۔"},
    {q: "موجودہ مقام کیسے استعمال کریں؟", a: "JPEG اپلوڈ کے بعد browser location پر کلک کریں اور permission دیں۔ کوآرڈینیٹس فیلڈز میں بھر جائیں گے۔"},
    {q: "اگر JPEG میں پہلے سے GPS ہو؟", a: "ٹول ممکن ہو تو existing GPS پڑھتا ہے۔ اوور رائٹ کے لیے replace existing GPS فعال کریں۔"},
    {q: "کیا اصل فائل بدلتی ہے؟", a: "نہیں۔ نیا geotagged JPEG بنتا ہے۔ آپ کی ڈیوائس والی فائل ویسی رہتی ہے۔"},
    {q: "بلندی اور location label شامل کر سکتے ہیں؟", a: "ہاں۔ اختیاری altitude (میٹر) اور مختصر label عرض و طول کے ساتھ محفوظ ہو سکتے ہیں۔"},
    {q: "کیا گیسٹ اپلوڈز نجی ہیں؟", a: "ہاں۔ عارضی نجی اسٹوریج اور کاؤنٹ ڈاؤن پر خودکار حذف۔"},
    {q: "گیسٹ حدود کیا ہیں؟", a: "روزانہ آپریشنز اور زیادہ سے زیادہ اپلوڈ سائز usage bar میں دکھتے ہیں۔"},
  ],
  related: {
    eyebrow: "متعلقہ ٹولز",
    title: "امیج ورک فلو جاری رکھیں",
    tools: [
      {href: "/image-metadata", title: "Image Metadata Viewer", body: "JPG, PNG, WebP پر EXIF، ابعاد اور GPS بغیر تبدیلی دیکھیں۔"},
      {href: "/image-metadata-editor", title: "Metadata Editor", body: "alt text اور SEO فیلڈز draft کریں، sidecar یا renamed download برآمد کریں۔"},
      {href: "/compress-image", title: "Image Compressor", body: "جیو ٹیگ کے بعد JPEG وزن کم کریں۔"},
      {href: "/convert-image", title: "Image Converter", body: "WebP یا PNG چاہیے تو کنٹینر بدلیں۔"},
      {href: "/resize-image", title: "Image Resizer", body: "مقام metadata کے بعد delivery ابعاد سیٹ کریں۔"},
      {href: "/crop-image", title: "Image Cropper", body: "ٹیگ یا publish سے پہلے reframe کریں۔"},
    ],
  },
  cta: {
    title: "JPEG تصاویر جیو ٹیگ کرنے کے لیے تیار؟",
    body: "ابھی JPEG اپلوڈ کریں یا زیادہ حدود اور محفوظ پروجیکٹس کے لیے مفت اکاؤنٹ بنائیں۔",
    primaryLabel: "تصویر جیو ٹیگ کریں",
    secondaryLabel: "مفت اکاؤنٹ بنائیں",
    secondaryHref: "/register",
  },
};

export function getGeotagImageCopy(locale: string): GeotagImageCopy {
  return localizedCopy(locale, {en, ur});
}

export function isGeotagImageLocale(locale: string): locale is AppLocale {
  return isAppLocale(locale);
}
