import {localizedCopy} from "@/lib/marketing/localized-copy";
/**
 * Image Metadata viewer hub — inspect-only; never rewrites the source image.
 */
import {isAppLocale, type AppLocale} from "@/i18n/routing";

export type ImageMetadataFaq = {q: string; a: string};

export type ImageMetadataCopy = {
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
      icon: "inspect" | "exif" | "gps" | "dimensions" | "export" | "privacy" | "browser" | "safe";
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
  faqs: ImageMetadataFaq[];
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

const en: ImageMetadataCopy = {
  metaTitle: "View Image Metadata Online Free | Img Pilot",
  metaDescription:
    "Inspect EXIF, dimensions and GPS on JPG, PNG and WebP images online. Read-only image metadata viewer with safe allow-listed fields and copy or export summaries.",
  h1: "View Image Metadata Online",
  breadcrumbCurrent: "View Image Metadata Online",
  hero: {
    badge: "IMAGE METADATA VIEWER",
    paragraph:
      "Inspect EXIF, dimensions, camera settings and GPS on JPG, PNG and WebP images directly in your browser. This viewer reads metadata only — it never rewrites your uploaded file.",
    trust: ["JPG", "PNG", "WebP", "Read Only", "Private Processing"],
    uploadCta: "Inspect Metadata",
    heroImageAlt:
      "Browser metadata viewer showing EXIF panels for dimensions, camera settings and GPS on a photo file",
  },
  guestBar: {
    title: "Guest usage",
    deletionTitle: "Automatic deletion",
    countdownLabel: "Temporary files delete automatically in",
  },
  upload: {
    heading: "Upload Your Image",
    supporting: "Drag and drop JPG, PNG or WebP images or browse your device.",
    chooseLabel: "Choose Image",
    formatsHint: "JPG · PNG · WebP · Viewer only — no metadata write to the source file",
    features: [
      {title: "Safe field allow-list", body: "Shows dimensions, camera, color and GPS fields the engine can read safely."},
      {title: "Read-only inspect", body: "Never modifies your uploaded image — inspect results only."},
      {title: "Copy and export", body: "Copy GPS text or download JSON/TXT summaries from the results panel."},
      {title: "Private processing", body: "Files stay in temporary private storage with automatic cleanup."},
    ],
  },
  intro: {
    eyebrow: "UNDERSTAND YOUR FILES",
    title: "Inspect Image Metadata Before You Publish or Archive",
    paragraphs: [
      "Image files carry more than pixels. EXIF blocks can record camera make and model, exposure settings, capture date, orientation, color profile hints and sometimes GPS coordinates. That context helps debug wrong rotations, trace photo origins and decide whether location data should travel with a public upload.",
      "Img Pilot metadata viewer is inspect-only. Upload JPG, PNG or WebP, run a read pass, and review allow-listed fields in the workspace. The engine does not write metadata back into your file — for drafting alt text or SEO sidecars, use the Metadata Editor instead.",
      "Guest uploads expire on the countdown above the workspace. Copy or export summaries before the session ends if you need them offline.",
    ],
  },
  benefits: {
    eyebrow: "WHY INSPECT METADATA",
    title: "Read-Only Metadata You Can Trust",
    cards: [
      {title: "Viewer-only engine", body: "Inspect without creating a derivative image or altering EXIF in the source.", icon: "inspect"},
      {title: "EXIF and camera fields", body: "See make, model, ISO, exposure, focal length and capture date when present.", icon: "exif"},
      {title: "GPS read support", body: "Check whether readable latitude and longitude exist — separate from JPEG geotag write.", icon: "gps"},
      {title: "Dimensions and format", body: "Width, height, aspect ratio, alpha, animation and byte size at a glance.", icon: "dimensions"},
      {title: "Copy and export", body: "Copy GPS strings or download JSON/TXT summaries from the results panel.", icon: "export"},
      {title: "Private temporary storage", body: "Uploads stay in short-lived guest storage with automatic deletion.", icon: "privacy"},
      {title: "Browser-based workflow", body: "No desktop EXIF app required for quick checks.", icon: "browser"},
      {title: "Safe allow-list schema", body: "Only vetted fields are returned — no raw binary dumps in the guest UI.", icon: "safe"},
    ],
  },
  howTo: {
    eyebrow: "THREE QUICK STEPS",
    title: "How to View Image Metadata Online",
    steps: [
      {title: "Upload image", body: "Choose a JPG, PNG or WebP file within guest limits shown above the uploader."},
      {title: "Run inspect", body: "Start the metadata inspect job and wait for the safe summary panel."},
      {title: "Review and export", body: "Browse EXIF sections, copy GPS text or export JSON/TXT — no file rewrite occurs."},
    ],
    imageAlt: "Three-step metadata viewer workflow: upload image, run inspect and review EXIF panels",
  },
  useCases: {
    eyebrow: "COMMON USE CASES",
    title: "When Teams Inspect Metadata First",
    cards: [
      {title: "QA before publish", body: "Confirm dimensions, orientation and color profile before CMS upload."},
      {title: "Privacy checks", body: "See whether GPS or camera serial fields exist before sharing publicly."},
      {title: "Support debugging", body: "Compare EXIF from client exports against expected camera settings."},
      {title: "Archive triage", body: "Sort unknown files by capture date or format without opening desktop tools."},
    ],
  },
  tips: {
    eyebrow: "PRACTICAL TIPS",
    title: "Metadata Viewer Tips",
    items: [
      "This tool reads metadata only — it does not geotag JPEG or edit EXIF embedded in the image.",
      "GPS may be present but unreadable on some files; the viewer reports readable vs present separately.",
      "Social re-uploads often strip EXIF — expect empty camera blocks on heavily compressed shares.",
      "Need to draft alt text or SEO fields? Switch to the Metadata Editor for sidecar exports.",
      "Need to write GPS into JPEG? Use the Geotag Images tool — JPEG only for GPS write.",
      "Export JSON/TXT before the guest countdown expires if you need an offline record.",
    ],
  },
  faqHeading: "Image Metadata FAQ",
  faqs: [
    {q: "Does this tool modify my image?", a: "No. metadata.inspect is viewer-only. Your uploaded file is never rewritten with new EXIF or IPTC tags."},
    {q: "Which formats are supported?", a: "JPG, PNG and WebP still images within guest upload limits."},
    {q: "Can I edit metadata here?", a: "No. Use the Metadata Editor to draft alt text and export sidecar files, or Geotag Images to write GPS into JPEG."},
    {q: "What metadata fields are shown?", a: "A safe allow-list including dimensions, format, camera settings, color hints and GPS summary when readable."},
    {q: "Can I copy GPS coordinates?", a: "Yes. When GPS is readable, copy actions are available in the results panel alongside JSON/TXT export."},
    {q: "Why is some EXIF missing?", a: "Exports from social platforms, messengers and some editors strip metadata. The viewer reports only what remains in the file."},
    {q: "Are guest uploads private?", a: "Yes. Guest files use temporary private storage and delete on the session countdown shown above the workspace."},
    {q: "What are the guest limits?", a: "Daily operations and maximum upload size appear in the usage bar above the uploader."},
  ],
  related: {
    eyebrow: "RELATED TOOLS",
    title: "Continue Your Metadata Workflow",
    tools: [
      {href: "/image-metadata-editor", title: "Metadata Editor", body: "Draft alt text and SEO fields, validate lengths and export sidecar files."},
      {href: "/geotag-image", title: "Geotag Images", body: "Write GPS coordinates into JPEG EXIF when you need embedded location tags."},
      {href: "/compress-image", title: "Image Compressor", body: "Reduce file weight after confirming metadata and dimensions."},
      {href: "/convert-image", title: "Image Converter", body: "Change container format when delivery requirements differ from the source."},
      {href: "/resize-image", title: "Image Resizer", body: "Match template dimensions once you know the native pixel size."},
      {href: "/crop-image", title: "Image Cropper", body: "Reframe before inspect or publish when composition needs adjustment."},
    ],
  },
  cta: {
    title: "Ready to inspect your image metadata?",
    body: "Upload an image now or create a free account for higher limits, saved projects and additional tools.",
    primaryLabel: "Inspect Metadata",
    secondaryLabel: "Create Free Account",
    secondaryHref: "/register",
  },
};

const ur: ImageMetadataCopy = {
  metaTitle: "آن لائن امیج میٹا ڈیٹا دیکھیں مفت | Img Pilot",
  metaDescription:
    "JPG, PNG اور WebP تصاویر پر EXIF، ابعاد اور GPS آن لائن دیکھیں۔ صرف پڑھنے والا metadata viewer محفوظ فیلڈز کے ساتھ۔",
  h1: "آن لائن امیج میٹا ڈیٹا دیکھیں",
  breadcrumbCurrent: "آن لائن امیج میٹا ڈیٹا دیکھیں",
  hero: {
    badge: "IMAGE METADATA VIEWER",
    paragraph:
      "JPG, PNG اور WebP تصاویر پر EXIF، ابعاد، کیمرہ سیٹنگز اور GPS براؤزر میں دیکھیں۔ یہ viewer صرف پڑھتا ہے — اپلوڈ شدہ فائل کبھی نہیں بدلتی۔",
    trust: ["JPG", "PNG", "WebP", "صرف پڑھیں", "نجی پروسیسنگ"],
    uploadCta: "میٹا ڈیٹا دیکھیں",
    heroImageAlt: "براؤزر metadata viewer EXIF پینلز ابعاد، کیمرہ اور GPS دکھا رہا ہے",
  },
  guestBar: {
    title: "گیسٹ استعمال",
    deletionTitle: "خودکار حذف",
    countdownLabel: "عارضی فائلیں خودکار حذف ہوں گی",
  },
  upload: {
    heading: "اپنی تصویر اپلوڈ کریں",
    supporting: "JPG, PNG یا WebP ڈریگ اینڈ ڈراپ کریں یا براؤز کریں۔",
    chooseLabel: "تصویر منتخب کریں",
    formatsHint: "JPG · PNG · WebP · صرف viewer — ماخذ فائل میں کوئی write نہیں",
    features: [
      {title: "محفوظ allow-list", body: "ابعاد، کیمرہ، رنگ اور GPS — جو انجن safely پڑھ سکتا ہے۔"},
      {title: "صرف inspect", body: "اپلوڈ شدہ تصویر میں کوئی تبدیلی نہیں۔"},
      {title: "کاپی و export", body: "GPS text کاپی یا JSON/TXT summaries ڈاؤن لوڈ کریں۔"},
      {title: "نجی پروسیسنگ", body: "عارضی نجی اسٹوریج اور خودکار صفائی۔"},
    ],
  },
  intro: {
    eyebrow: "اپنی فائلیں سمجھیں",
    title: "شائع یا آرکائیو سے پہلے metadata دیکھیں",
    paragraphs: [
      "امیج فائلوں میں pixels سے زیادہ ہوتا ہے۔ EXIF میں کیمرہ، exposure، تاریخ، orientation، color profile اور有时 GPS ہو سکتا ہے۔",
      "Img Pilot metadata viewer inspect-only ہے۔ JPG, PNG یا WebP اپلوڈ کریں اور allow-listed فیلڈز دیکھیں۔ فائل rewrite نہیں ہوتی — alt text یا SEO sidecars کے لیے Metadata Editor استعمال کریں۔",
      "گیسٹ اپلوڈز کاؤنٹ ڈاؤن پر ختم ہوتے ہیں۔ offline record چاہیے تو summaries export کریں۔",
    ],
  },
  benefits: {
    eyebrow: "metadata کیوں دیکھیں",
    title: "قابل اعتماد read-only metadata",
    cards: [
      {title: "صرف viewer", body: "derivative یا EXIF تبدیلی کے بغیر inspect۔", icon: "inspect"},
      {title: "EXIF و کیمرہ", body: "make, model, ISO, exposure, focal length, تاریخ جب موجود ہو۔", icon: "exif"},
      {title: "GPS پڑھنا", body: "readable latitude/longitude چیک — JPEG geotag write سے الگ۔", icon: "gps"},
      {title: "ابعاد و format", body: "چوڑائی، اونچائی، aspect ratio، alpha اور سائز۔", icon: "dimensions"},
      {title: "کاپی و export", body: "GPS strings یا JSON/TXT summaries۔", icon: "export"},
      {title: "نجی عارضی storage", body: "مختصر مدتی guest storage۔", icon: "privacy"},
      {title: "براؤزر ورک فلو", body: "Desktop EXIF app کی ضرورت نہیں۔", icon: "browser"},
      {title: "محفوظ schema", body: "صرف vetted فیلڈز — raw binary dumps نہیں۔", icon: "safe"},
    ],
  },
  howTo: {
    eyebrow: "تین فوری مراحل",
    title: "آن لائن metadata کیسے دیکھیں",
    steps: [
      {title: "تصویر اپلوڈ", body: "guest limits کے اندر JPG, PNG یا WebP منتخب کریں۔"},
      {title: "inspect چلائیں", body: "metadata inspect job شروع کریں اور summary panel دیکھیں۔"},
      {title: "جائزہ و export", body: "EXIF sections، GPS copy یا JSON/TXT — فائل rewrite نہیں۔"},
    ],
    imageAlt: "تین مرحلہ metadata viewer: اپلوڈ، inspect، EXIF panels",
  },
  useCases: {
    eyebrow: "عام استعمال",
    title: "ٹیمیں metadata پہلے کب دیکhti ہیں",
    cards: [
      {title: "شائع سے پہلے QA", body: "CMS اپلوڈ سے پہلے ابعاد، orientation اور color profile۔"},
      {title: "پرائیویسی چیک", body: "عوامی شیئر سے پہلے GPS یا serial فیلڈز۔"},
      {title: "سپورٹ debugging", body: "کلائنٹ export کی EXIF توقعات سے موازنہ۔"},
      {title: "آرکائیو triage", body: "تاریخ یا format سے unknown فائلیں sort کریں۔"},
    ],
  },
  tips: {
    eyebrow: "عملی تجاویز",
    title: "Metadata viewer ٹپس",
    items: [
      "یہ tool صرف پڑھتا ہے — JPEG geotag یا embedded EXIF edit نہیں کرتا۔",
      "GPS present لیکن unreadable ہو سکتا ہے — viewer الگ رپورٹ کرتا ہے۔",
      "Social re-uploads اکثر EXIF ہٹاتے ہیں۔",
      "alt text یا SEO fields؟ Metadata Editor استعمال کریں۔",
      "JPEG میں GPS لکھنا؟ Geotag Images — صرف JPEG GPS write۔",
      "کاؤنٹ ڈاؤن سے پہلے JSON/TXT export کریں۔",
    ],
  },
  faqHeading: "Image Metadata FAQ",
  faqs: [
    {q: "کیا یہ tool تصویر بدلتا ہے؟", a: "نہیں۔ metadata.inspect viewer-only ہے۔ فائل rewrite نہیں ہوتی۔"},
    {q: "کون سے formats؟", a: "guest limits کے اندر JPG, PNG اور WebP still images۔"},
    {q: "یہاں metadata edit؟", a: "نہیں۔ Metadata Editor sidecars کے لیے؛ JPEG GPS کے لیے Geotag Images۔"},
    {q: "کون سی فیلڈز دکھتی ہیں؟", a: "محفوظ allow-list: ابعاد، format، camera، color hints، GPS summary۔"},
    {q: "GPS کاپی؟", a: "readable GPS پر copy actions اور JSON/TXT export۔"},
    {q: "EXIF کیوں missing؟", a: "Social platforms اور کچھ editors metadata ہٹاتے ہیں۔"},
    {q: "گیسٹ اپلوڈز نجی؟", a: "ہاں۔ عارضی storage اور کاؤنٹ ڈاؤن پر حذف۔"},
    {q: "گیسٹ حدود؟", a: "usage bar میں daily operations اور max upload size۔"},
  ],
  related: {
    eyebrow: "متعلقہ ٹولز",
    title: "metadata workflow جاری رکھیں",
    tools: [
      {href: "/image-metadata-editor", title: "Metadata Editor", body: "alt text draft، validation، sidecar export۔"},
      {href: "/geotag-image", title: "Geotag Images", body: "JPEG EXIF میں GPS embedded tags۔"},
      {href: "/compress-image", title: "Image Compressor", body: "metadata confirm کے بعد وزن کم کریں۔"},
      {href: "/convert-image", title: "Image Converter", body: "delivery format بدلیں۔"},
      {href: "/resize-image", title: "Image Resizer", body: "template ابعاد match کریں۔"},
      {href: "/crop-image", title: "Image Cropper", body: "composition adjust کریں۔"},
    ],
  },
  cta: {
    title: "امیج metadata دیکھنے کے لیے تیار؟",
    body: "ابھی تصویر اپلوڈ کریں یا زیادہ حدود کے لیے مفت اکاؤنٹ بنائیں۔",
    primaryLabel: "میٹا ڈیٹا دیکھیں",
    secondaryLabel: "مفت اکاؤنٹ بنائیں",
    secondaryHref: "/register",
  },
};

export function getImageMetadataCopy(locale: string): ImageMetadataCopy {
  return localizedCopy(locale, {en, ur});
}

export function isImageMetadataLocale(locale: string): locale is AppLocale {
  return isAppLocale(locale);
}
