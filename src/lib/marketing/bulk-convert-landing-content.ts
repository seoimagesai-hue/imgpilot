/**
 * Bulk Convert landing — commercial batch format conversion for agencies, ecommerce, developers.
 * Distinct from single-image convert pair landings.
 */
import type {AppLocale} from "@/i18n/routing";

export type BulkConvertFaq = {q: string; a: string};

export type BulkConvertCopy = {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  breadcrumbParent: {href: "/bulk-image-tools"; label: string};
  breadcrumbCurrent: string;
  hero: {
    badge: string;
    paragraph: string;
    trust: string[];
    uploadCta: string;
    learnMoreCta: string;
    heroImageAlt: string;
  };
  upload: {
    heading: string;
    supporting: string;
    chooseLabel: string;
    formatsHint: string;
    statsImagesTemplate: string;
    statsBytesTemplate: string;
    statsOutputTemplate: string;
  };
  conversions: {
    eyebrow: string;
    title: string;
    intro: string;
    cards: {from: string; to: string; href: string; body: string}[];
  };
  intro: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
    imageAlt: string;
  };
  workflow: {
    eyebrow: string;
    title: string;
    steps: {title: string; body: string}[];
    imageAlt: string;
  };
  benefits: {
    eyebrow: string;
    title: string;
    cards: {
      title: string;
      body: string;
      icon:
        | "batch"
        | "formats"
        | "consistent"
        | "zip"
        | "browser"
        | "privacy"
        | "safe"
        | "install";
    }[];
  };
  workflows: {
    eyebrow: string;
    title: string;
    cards: {title: string; body: string}[];
  };
  guide: {
    title: string;
    paragraphs: string[];
    tableCaption: string;
    columns: {format: string; points: string[]}[];
    recommendations: string[];
  };
  tips: {
    eyebrow: string;
    title: string;
    items: string[];
  };
  faqHeading: string;
  faqs: BulkConvertFaq[];
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

const en: BulkConvertCopy = {
  metaTitle: "Bulk Convert Images Online Free | SEO Images",
  metaDescription:
    "Convert multiple JPG, PNG and WebP images online. Batch convert image formats and download all converted files together in one ZIP archive.",
  h1: "Bulk Convert Images Online",
  breadcrumbParent: {href: "/bulk-image-tools", label: "Bulk Tools"},
  breadcrumbCurrent: "Bulk Convert Images",
  hero: {
    badge: "BULK IMAGE CONVERTER",
    paragraph:
      "Convert multiple JPG, PNG and WebP images at once. Upload an entire batch, choose the output format and download every converted image together as a ZIP archive without installing software.",
    trust: ["Batch Processing", "Multiple Formats", "ZIP Download", "Private Processing"],
    uploadCta: "Upload Multiple Images",
    learnMoreCta: "Supported Formats",
    heroImageAlt:
      "Bulk image conversion dashboard with JPG, PNG and WebP thumbnails entering a converter and leaving as a ZIP archive",
  },
  upload: {
    heading: "Upload Multiple Images",
    supporting: "Drag and drop multiple JPG, PNG or WebP images or browse your computer.",
    chooseLabel: "Choose Images",
    formatsHint: "JPG · PNG · WebP · Guest batch file count and size limits appear above the uploader",
    statsImagesTemplate: "{count} Images Selected",
    statsBytesTemplate: "{size} Total",
    statsOutputTemplate: "Output Format · {format}",
  },
  conversions: {
    eyebrow: "SUPPORTED CONVERSIONS",
    title: "Popular Batch Format Paths",
    intro:
      "Guest bulk convert accepts mixed JPG, PNG and WebP uploads, then writes every successful item to one chosen output format. Cards below map to supported still-image routes (AVIF is not offered in the bulk target picker).",
    cards: [
      {
        from: "JPG",
        to: "WebP",
        href: "/jpg-to-webp",
        body: "Ship lighter photo delivery for modern websites and campaigns.",
      },
      {
        from: "WebP",
        to: "JPG",
        href: "/webp-to-jpg",
        body: "Hand off universal JPG when partners cannot open WebP.",
      },
      {
        from: "PNG",
        to: "JPG",
        href: "/png-to-jpg",
        body: "Flatten graphics into compatible photo-style delivery when needed.",
      },
      {
        from: "PNG",
        to: "WebP",
        href: "/png-to-webp",
        body: "Keep transparency paths while shrinking web assets.",
      },
      {
        from: "WebP",
        to: "PNG",
        href: "/webp-to-png",
        body: "Export design-friendly PNG when editors need a lossless-friendly handoff.",
      },
      {
        from: "JPG",
        to: "PNG",
        href: "/jpg-to-png",
        body: "Convert photo sources to PNG when a pipeline expects PNG containers.",
      },
    ],
  },
  intro: {
    eyebrow: "BATCH IMAGE CONVERSION",
    title: "Convert Entire Image Libraries in One Workflow",
    paragraphs: [
      "Managing image libraries becomes much easier when every file can be converted automatically using the same output format.",
      "Instead of opening every image individually, upload an entire batch, choose your preferred output format and let the converter process everything in one session.",
      "This workflow is ideal for agencies, ecommerce businesses, developers and marketing teams working with large image collections.",
    ],
    imageAlt:
      "Mixed JPG, PNG and WebP formats entering one conversion engine and exiting as a unified output with ZIP download",
  },
  workflow: {
    eyebrow: "FOUR CLEAR STEPS",
    title: "Batch Conversion Workflow",
    steps: [
      {
        title: "Upload Images",
        body: "Add a batch of JPG, PNG or WebP files within the guest limits shown above the workspace.",
      },
      {
        title: "Choose Output Format",
        body: "Pick JPG, PNG or WebP once for the whole batch — the live Output Format chip reflects your selection.",
      },
      {
        title: "Automatic Batch Conversion",
        body: "Start the queue and watch each image convert through private temporary processing.",
      },
      {
        title: "Download ZIP",
        body: "Download all successful outputs together, or grab individual files when needed.",
      },
    ],
    imageAlt:
      "Four-step bulk convert workflow: upload, choose output format, automatic conversion and ZIP download",
  },
  benefits: {
    eyebrow: "WHY TEAMS BULK CONVERT",
    title: "One Output Format. Entire Libraries. Less Busywork.",
    cards: [
      {
        title: "Convert Hundreds of Images",
        body: "Process large collections in one guest session instead of converting files one by one.",
        icon: "batch",
      },
      {
        title: "Multiple Output Formats",
        body: "Choose JPG, PNG or WebP as the shared target for the whole batch.",
        icon: "formats",
      },
      {
        title: "Consistent Results",
        body: "Apply the same conversion intent across every accepted file for cleaner handoffs.",
        icon: "consistent",
      },
      {
        title: "ZIP Downloads",
        body: "Deliver the entire converted set as one archive for CMS imports, clients or QA.",
        icon: "zip",
      },
      {
        title: "Browser Based",
        body: "No desktop install for a quick format pass — open the page and start uploading.",
        icon: "browser",
      },
      {
        title: "Private Processing",
        body: "Guest files use temporary private storage and are not published to a public gallery.",
        icon: "privacy",
      },
      {
        title: "Original Files Protected",
        body: "Outputs are new converted copies. Keep masters offline before replacing production assets.",
        icon: "safe",
      },
      {
        title: "No Installation",
        body: "Convert campaign packs and site libraries without installing format utilities on every laptop.",
        icon: "install",
      },
    ],
  },
  workflows: {
    eyebrow: "BUSINESS USE CASES",
    title: "Built for High-Volume Format Work",
    cards: [
      {
        title: "Website Migration",
        body: "Convert legacy image libraries into the format your new stack prefers.",
      },
      {
        title: "Online Stores",
        body: "Standardize product images before catalog imports and marketplace uploads.",
      },
      {
        title: "Marketing Teams",
        body: "Prepare campaign assets in one shared output format before publishing.",
      },
      {
        title: "Photography Projects",
        body: "Deliver client galleries in the required container without file-by-file exports.",
      },
      {
        title: "Design Agencies",
        body: "Convert graphics batches for platforms that accept different formats.",
      },
      {
        title: "Software Development",
        body: "Generate optimized website assets for staging, CI assets packs or theme handoffs.",
      },
    ],
  },
  guide: {
    title: "Choose the Right Image Format",
    paragraphs: [
      "Bulk convert does not invent magic — it applies one target format across the queue. Pick the container that matches compatibility, transparency and performance needs for the destination.",
      "After conversion, use Bulk Compress or Bulk Resize when weight or dimensions still need another pass.",
    ],
    tableCaption: "When to prefer JPG, PNG or WebP as a batch output",
    columns: [
      {
        format: "JPG",
        points: ["Best for photographs", "Smaller photo files", "Universal compatibility"],
      },
      {
        format: "PNG",
        points: ["Transparency", "Graphics and logos", "UI assets"],
      },
      {
        format: "WebP",
        points: ["Modern compression", "Smaller websites", "Transparency support", "High performance"],
      },
    ],
    recommendations: [
      "Choose JPG when compatibility matters most.",
      "Choose PNG for editing pipelines and transparent graphics.",
      "Choose WebP for modern websites and performance budgets.",
    ],
  },
  tips: {
    eyebrow: "BETTER BATCHES",
    title: "Best Practices",
    items: [
      "Upload similar projects together when one output format fits the whole set.",
      "Select one output format for the batch before you start processing.",
      "Keep original files as masters before replacing production libraries.",
      "Preview converted samples when transparency or photo tones matter.",
      "Compress after conversion with Bulk Compress if weight still matters.",
      "Organize ZIP downloads by campaign, client or destination system.",
    ],
  },
  faqHeading: "Frequently Asked Questions",
  faqs: [
    {
      q: "Can I bulk convert hundreds of images online?",
      a: "Guest sessions follow the file-count and daily operation limits shown above the uploader. Large libraries may need multiple batches or an account with higher limits — the workflow itself is built for multi-file conversion.",
    },
    {
      q: "Can JPG, PNG and WebP be uploaded together for Bulk Convert?",
      a: "Yes. Mixed still-image selections are accepted. Each file is converted toward the single output format you chose for the batch when that path is supported.",
    },
    {
      q: "Can every image in a Bulk Convert batch use the same output format?",
      a: "Yes. One target format is applied across the batch so handoffs stay consistent.",
    },
    {
      q: "Will I receive a ZIP download from Bulk Convert?",
      a: "Yes. After processing finishes, download successful outputs together as a ZIP, or download individual completed images.",
    },
    {
      q: "Are original images changed by Bulk Convert?",
      a: "No. The tool creates converted copies. Files on your device remain unchanged.",
    },
    {
      q: "Are Bulk Convert uploads private?",
      a: "Guest images use private temporary storage and are deleted automatically according to the retention policy shown in the workspace.",
    },
    {
      q: "What guest limits apply to Bulk Convert?",
      a: "Maximum files per batch, total batch bytes, per-file size and daily operations appear in the usage summary above the uploader. Hitting a limit gates the batch until you reduce the selection or sign in.",
    },
    {
      q: "What is the maximum number of files for Bulk Convert?",
      a: "The maximum file count is the guest bulk max shown in the limit summary. Extra files beyond that limit are not processed in the same batch.",
    },
    {
      q: "What is the maximum upload size for a Bulk Convert batch?",
      a: "Batches cannot exceed the guest total batch size or per-file size shown in the limit summary. Oversized selections are gated before processing.",
    },
    {
      q: "Can Bulk Convert processing be cancelled after it starts?",
      a: "Once a batch is running, items already queued continue under guest processing rules. Clear the selection before starting if you need to change the set. Failed or skipped items are reported in the batch summary.",
    },
    {
      q: "Which output format should I choose for Bulk Convert?",
      a: "Choose JPG for maximum compatibility with photos, PNG when transparency or editing pipelines matter, and WebP for modern web performance. The Output Format chip shows your live selection.",
    },
    {
      q: "Can I convert transparent PNG images in a bulk batch?",
      a: "Yes when the output keeps alpha, such as PNG or WebP. Converting transparent PNG to JPG flattens transparency onto a solid background — preview samples before replacing brand kits.",
    },
  ],
  related: {
    eyebrow: "CONTINUE WITH BULK & CONVERT",
    title: "Related Tools",
    tools: [
      {
        href: "/bulk-resize",
        title: "Bulk Resize Images",
        body: "Normalize dimensions across a batch before or after conversion.",
      },
      {
        href: "/bulk-compress",
        title: "Bulk Compress Images",
        body: "Lighten converted files when weight still needs another pass.",
      },
      {href: "/convert-image", title: "Image Converter", body: "Convert a single image when you do not need a batch queue."},
      {href: "/resize-image", title: "Resize Images", body: "Resize one image with the shared guest resize tool."},
      {href: "/compress-image", title: "Compress Images", body: "Compress one image when batching is not needed."},
      {href: "/jpg-to-webp", title: "All Conversion Tools", body: "Start with JPG to WebP or browse related format pair pages."},
    ],
  },
  cta: {
    title: "Ready to Convert Another Batch?",
    body: "Upload another batch of images or create a free account for larger batch limits, project history and advanced tools.",
    primaryLabel: "Convert More Images",
    secondaryLabel: "Create Free Account",
    secondaryHref: "/register",
  },
};

const ur: BulkConvertCopy = {
  metaTitle: "آن لائن بلک کنورٹ امیجز مفت | SEO Images",
  metaDescription:
    "آن لائن متعدد JPG، PNG اور WebP امیجز کنورٹ کریں۔ بیچ میں فارمیٹس تبدیل کریں اور تمام کنورٹ شدہ فائلیں ایک ZIP میں ڈاؤن لوڈ کریں۔",
  h1: "آن لائن بلک کنورٹ امیجز",
  breadcrumbParent: {href: "/bulk-image-tools", label: "Bulk Tools"},
  breadcrumbCurrent: "Bulk Convert Images",
  hero: {
    badge: "BULK IMAGE CONVERTER",
    paragraph:
      "ایک ساتھ متعدد JPG، PNG اور WebP امیجز کنورٹ کریں۔ پوری بیچ اپ لوڈ کریں، آؤٹ پٹ فارمیٹ چنیں اور ہر کنورٹ شدہ امیج سافٹ ویئر انسٹال کیے بغیر ایک ZIP آرکائیو میں ڈاؤن لوڈ کریں۔",
    trust: ["بیچ پروسیسنگ", "متعدد فارمیٹس", "ZIP ڈاؤن لوڈ", "نجی پروسیسنگ"],
    uploadCta: "متعدد امیجز اپ لوڈ کریں",
    learnMoreCta: "سپورٹڈ فارمیٹس",
    heroImageAlt:
      "بلک امیج کنورژن ڈیش بورڈ جہاں JPG، PNG اور WebP تھمب نیلز کنورٹر میں جاتی ہیں اور ZIP بنتی ہے",
  },
  upload: {
    heading: "متعدد امیجز اپ لوڈ کریں",
    supporting: "متعدد JPG، PNG یا WebP گھسیٹیں یا کمپیوٹر سے چنیں۔",
    chooseLabel: "امیجز چنیں",
    formatsHint: "JPG · PNG · WebP · مہمان بیچ فائل شمار اور سائز کی حدود اپ لوڈر کے اوپر دکھائی دیتی ہیں",
    statsImagesTemplate: "{count} امیجز منتخب",
    statsBytesTemplate: "{size} کل",
    statsOutputTemplate: "آؤٹ پٹ فارمیٹ · {format}",
  },
  conversions: {
    eyebrow: "سپورٹڈ کنورژنز",
    title: "مشہور بیچ فارمیٹ راستے",
    intro:
      "مہمان بلک کنورٹ مخلوط JPG، PNG اور WebP اپ لوڈز قبول کرتا ہے، پھر ہر کامیاب آئٹم کو ایک منتخب آؤٹ پٹ فارمیٹ میں لکھتا ہے۔ نیچے کارڈز سپورٹڈ اسٹل امیج راستوں پر میپ ہوتے ہیں (بلک ٹارگٹ پکر میں AVIF نہیں)۔",
    cards: [
      {
        from: "JPG",
        to: "WebP",
        href: "/jpg-to-webp",
        body: "جدید ویب سائٹس اور مہمات کے لیے ہلکی فوٹو ڈیلیوری۔",
      },
      {
        from: "WebP",
        to: "JPG",
        href: "/webp-to-jpg",
        body: "جب پارٹنر WebP نہ کھول سکے تو عالمی JPG دیں۔",
      },
      {
        from: "PNG",
        to: "JPG",
        href: "/png-to-jpg",
        body: "ضرورت ہو تو گرافکس کو مطابقت پذیر فوٹو طرز ڈیلیوری میں فلیٹن کریں۔",
      },
      {
        from: "PNG",
        to: "WebP",
        href: "/png-to-webp",
        body: "ویب اثاثے سکڑاتے ہوئے شفافیت کے راستے رکھیں۔",
      },
      {
        from: "WebP",
        to: "PNG",
        href: "/webp-to-png",
        body: "جب ایڈیٹرز کو چاہیے تو ڈیزائن موافق PNG ایکسپورٹ کریں۔",
      },
      {
        from: "JPG",
        to: "PNG",
        href: "/jpg-to-png",
        body: "جب پائپ لائن PNG کنٹینرز چاہے تو فوٹو ذرائع کو PNG میں تبدیل کریں۔",
      },
    ],
  },
  intro: {
    eyebrow: "بیچ امیج کنورژن",
    title: "ایک ورک فلو میں پوری امیج لائبریریز کنورٹ کریں",
    paragraphs: [
      "امیج لائبریریز سنبھالنا اس وقت آسان ہو جاتا ہے جب ہر فائل ایک ہی آؤٹ پٹ فارمیٹ میں خود بخود کنورٹ ہو سکے۔",
      "ہر امیج الگ کھولنے کے بجائے پوری بیچ اپ لوڈ کریں، پسندیدہ آؤٹ پٹ فارمیٹ چنیں اور کنورٹر کو ایک سیشن میں سب پروسیس کرنے دیں۔",
      "یہ ورک فلو ایجنسیز، ای کامرس بزنسز، ڈیولپرز اور مارکیٹنگ ٹیموں کے لیے موزوں ہے جو بڑی امیج کلیکشنز پر کام کرتی ہیں۔",
    ],
    imageAlt: "مخلوط JPG، PNG اور WebP ایک کنورژن انجن میں داخل ہو کر متحد آؤٹ پٹ اور ZIP بنتے ہیں",
  },
  workflow: {
    eyebrow: "چار واضح مراحل",
    title: "بیچ کنورژن ورک فلو",
    steps: [
      {
        title: "امیجز اپ لوڈ کریں",
        body: "ورک اسپیس کے اوپر دکھائی گئی مہمان حدود کے اندر JPG، PNG یا WebP کی بیچ شامل کریں۔",
      },
      {
        title: "آؤٹ پٹ فارمیٹ چنیں",
        body: "پوری بیچ کے لیے ایک بار JPG، PNG یا WebP چنیں — لائیو آؤٹ پٹ فارمیٹ چپ آپ کا انتخاب دکھاتی ہے۔",
      },
      {
        title: "خودکار بیچ کنورژن",
        body: "قطار شروع کریں اور ہر امیج کو نجی عارضی پروسیسنگ سے کنورٹ ہوتے دیکھیں۔",
      },
      {
        title: "ZIP ڈاؤن لوڈ کریں",
        body: "تمام کامیاب آؤٹ پٹس ایک ساتھ ڈاؤن لوڈ کریں، یا ضرورت ہو تو الگ فائلیں لیں۔",
      },
    ],
    imageAlt: "چار مرحلہ بلک کنورٹ ورک فلو: اپ لوڈ، آؤٹ پٹ فارمیٹ، خودکار کنورژن اور ZIP ڈاؤن لوڈ",
  },
  benefits: {
    eyebrow: "ٹیمیں بلک کنورٹ کیوں کرتی ہیں",
    title: "ایک آؤٹ پٹ فارمیٹ۔ پوری لائبریریز۔ کم مصروفیت۔",
    cards: [
      {
        title: "سینکڑوں امیجز کنورٹ کریں",
        body: "فائل بہ فائل کنورٹ کرنے کے بجائے ایک مہمان سیشن میں بڑی کلیکشنز پروسیس کریں۔",
        icon: "batch",
      },
      {
        title: "متعدد آؤٹ پٹ فارمیٹس",
        body: "پوری بیچ کے لیے مشترکہ ٹارگٹ کے طور پر JPG، PNG یا WebP چنیں۔",
        icon: "formats",
      },
      {
        title: "مستقل نتائج",
        body: "ہر قبول شدہ فائل پر وہی کنورژن ارادہ لگائیں تاکہ ہینڈ آفز صاف رہیں۔",
        icon: "consistent",
      },
      {
        title: "ZIP ڈاؤن لوڈز",
        body: "CMS امپورٹس، کلائنٹس یا QA کے لیے پورا کنورٹ شدہ سیٹ ایک آرکائیو میں دیں۔",
        icon: "zip",
      },
      {
        title: "براؤزر پر مبنی",
        body: "تیز فارمیٹ پاس کے لیے ڈیسک ٹاپ انسٹال نہیں — صفحہ کھولیں اور اپ لوڈ شروع کریں۔",
        icon: "browser",
      },
      {
        title: "نجی پروسیسنگ",
        body: "مہمان فائلیں عارضی نجی اسٹوریج استعمال کرتی ہیں اور عوامی گیلری میں نہیں جاتیں۔",
        icon: "privacy",
      },
      {
        title: "اصل فائلیں محفوظ",
        body: "آؤٹ پٹس نئی کنورٹ شدہ کاپیاں ہیں۔ پروڈکشن بدلنے سے پہلے ماسٹرز آف لائن رکھیں۔",
        icon: "safe",
      },
      {
        title: "انسٹالیشن نہیں",
        body: "ہر لیپ ٹاپ پر فارمیٹ یوٹیلیٹیز انسٹال کیے بغیر مہم پیکس اور سائٹ لائبریریز کنورٹ کریں۔",
        icon: "install",
      },
    ],
  },
  workflows: {
    eyebrow: "بزنس استعمال کے کیسز",
    title: "ہائی والیوم فارمیٹ ورک کے لیے",
    cards: [
      {
        title: "ویب سائٹ مائگریشن",
        body: "لیگیسی امیج لائبریریز کو اس فارمیٹ میں تبدیل کریں جو نیا اسٹیک ترجیح دیتا ہے۔",
      },
      {
        title: "آن لائن اسٹورز",
        body: "کیٹلاگ امپورٹس اور مارکیٹ پلیس اپ لوڈز سے پہلے پروڈکٹ امیجز معیاری بنائیں۔",
      },
      {
        title: "مارکیٹنگ ٹیمیں",
        body: "شائع کرنے سے پہلے مہم اثاثے ایک مشترکہ آؤٹ پٹ فارمیٹ میں تیار کریں۔",
      },
      {
        title: "فوٹوگرافی پروجیکٹس",
        body: "فائل بہ فائل ایکسپورٹ کے بغیر مطلوبہ کنٹینر میں کلائنٹ گیلریز دیں۔",
      },
      {
        title: "ڈیزائن ایجنسیز",
        body: "مختلف پلیٹ فارمز کے لیے گرافکس بیچز کنورٹ کریں۔",
      },
      {
        title: "سافٹ ویئر ڈویلپمنٹ",
        body: "اسٹیجنگ، CI اثاثہ پیکس یا تھیم ہینڈ آفز کے لیے آپٹیمائزڈ ویب اثاثے بنائیں۔",
      },
    ],
  },
  guide: {
    title: "صحیح امیج فارمیٹ چنیں",
    paragraphs: [
      "بلک کنورٹ جادو نہیں بناتا — یہ قطار پر ایک ٹارگٹ فارمیٹ لگاتا ہے۔ مطابقت، شفافیت اور پرفارمنس کی ضرورت کے مطابق کنٹینر چنیں۔",
      "کنورژن کے بعد اگر وزن یا ابعاد اب بھی کام مانگیں تو Bulk Compress یا Bulk Resize استعمال کریں۔",
    ],
    tableCaption: "بیچ آؤٹ پٹ کے طور پر JPG، PNG یا WebP کب ترجیح دیں",
    columns: [
      {
        format: "JPG",
        points: ["فوٹوز کے لیے بہترین", "چھوٹی فوٹو فائلیں", "عالمی مطابقت"],
      },
      {
        format: "PNG",
        points: ["شفافیت", "گرافکس اور لوگو", "UI اثاثے"],
      },
      {
        format: "WebP",
        points: ["جدید کمپریشن", "چھوٹی ویب سائٹس", "شفافیت سپورٹ", "اعلیٰ پرفارمنس"],
      },
    ],
    recommendations: [
      "جب مطابقت سب سے اہم ہو تو JPG چنیں۔",
      "ایڈیٹنگ پائپ لائنز اور شفاف گرافکس کے لیے PNG چنیں۔",
      "جدید ویب سائٹس اور پرفارمنس بجٹ کے لیے WebP چنیں۔",
    ],
  },
  tips: {
    eyebrow: "بہتر بیچز",
    title: "بہترین طریقے",
    items: [
      "جب ایک آؤٹ پٹ فارمیٹ پورے سیٹ پر فٹ ہو تو مشابہ پروجیکٹس ایک ساتھ اپ لوڈ کریں۔",
      "پروسیسنگ شروع کرنے سے پہلے بیچ کے لیے ایک آؤٹ پٹ فارمیٹ چنیں۔",
      "پروڈکشن لائبریریز بدلنے سے پہلے اصل فائلیں بطور ماسٹر رکھیں۔",
      "جب شفافیت یا فوٹو ٹونز اہم ہوں تو کنورٹ شدہ نمونے دیکھیں۔",
      "اگر وزن اب بھی اہم ہو تو کنورژن کے بعد Bulk Compress استعمال کریں۔",
      "ZIP ڈاؤن لوڈز کو مہم، کلائنٹ یا منزل سسٹم کے مطابق منظم کریں۔",
    ],
  },
  faqHeading: "اکثر پوچھے گئے سوالات",
  faqs: [
    {
      q: "کیا آن لائن سینکڑوں امیجز بلک کنورٹ ہو سکتی ہیں؟",
      a: "مہمان سیشنز اپ لوڈر کے اوپر دکھائی گئی فائل شمار اور روزانہ آپریشن حدود کی پیروی کرتی ہیں۔ بڑی لائبریریز کے لیے متعدد بیچز یا اعلیٰ حدود والا اکاؤنٹ درکار ہو سکتا ہے — خود ورک فلو ملٹی فائل کنورژن کے لیے بنا ہے۔",
    },
    {
      q: "کیا Bulk Convert کے لیے JPG، PNG اور WebP ایک ساتھ اپ لوڈ ہو سکتی ہیں؟",
      a: "ہاں۔ مخلوط اسٹل امیج انتخاب قبول ہوتے ہیں۔ جب راستہ سپورٹڈ ہو تو ہر فائل بیچ کے منتخب آؤٹ پٹ فارمیٹ کی طرف کنورٹ ہوتی ہے۔",
    },
    {
      q: "کیا Bulk Convert بیچ کی ہر امیج ایک ہی آؤٹ پٹ فارمیٹ استعمال کر سکتی ہے؟",
      a: "ہاں۔ پوری بیچ پر ایک ٹارگٹ فارمیٹ لگتا ہے تاکہ ہینڈ آفز مستقل رہیں۔",
    },
    {
      q: "کیا Bulk Convert سے ZIP ڈاؤن لوڈ ملے گا؟",
      a: "ہاں۔ پروسیسنگ مکمل ہونے پر کامیاب آؤٹ پٹس ایک ZIP میں ڈاؤن لوڈ کریں، یا مکمل شدہ امیجز الگ لیں۔",
    },
    {
      q: "کیا Bulk Convert اصل امیجز بدل دیتا ہے؟",
      a: "نہیں۔ ٹول کنورٹ شدہ کاپیاں بناتا ہے۔ آپ کی ڈیوائس پر فائلیں جوں کی توں رہتی ہیں۔",
    },
    {
      q: "کیا Bulk Convert اپ لوڈز نجی ہیں؟",
      a: "مہمان امیجز نجی عارضی اسٹوریج استعمال کرتی ہیں اور ورک اسپیس میں دکھائی گئی برقرار رکھنے کی پالیسی کے مطابق خود بخود حذف ہو جاتی ہیں۔",
    },
    {
      q: "Bulk Convert پر کون سی مہمان حدود لاگو ہوتی ہیں؟",
      a: "فی بیچ زیادہ سے زیادہ فائلیں، کل بیچ بائٹس، فی فائل سائز اور روزانہ آپریشنز اپ لوڈر کے اوپر خلاصے میں دکھائی دیتی ہیں۔ حد لگنے پر انتخاب کم کریں یا سائن ان کریں۔",
    },
    {
      q: "Bulk Convert کی زیادہ سے زیادہ فائلوں کی تعداد کیا ہے؟",
      a: "زیادہ سے زیادہ فائل شمار حد خلاصے میں دکھائی گئی مہمان بلک حد ہے۔ اس سے زائد فائلیں اسی بیچ میں پروسیس نہیں ہوتیں۔",
    },
    {
      q: "Bulk Convert بیچ کی زیادہ سے زیادہ اپ لوڈ سائز کیا ہے؟",
      a: "بیچز حد خلاصے میں دکھائی گئی مہمان کل بیچ سائز یا فی فائل سائز سے زیادہ نہیں ہو سکتیں۔ بہت بڑے انتخاب پروسیسنگ سے پہلے روکے جاتے ہیں۔",
    },
    {
      q: "کیا شروع ہونے کے بعد Bulk Convert پروسیسنگ منسوخ ہو سکتی ہے؟",
      a: "بیچ چلنے کے بعد پہلے سے قطار میں موجود آئٹمز مہمان پروسیسنگ قواعد کے تحت جاری رہتے ہیں۔ سیٹ بدلنے کے لیے شروع سے پہلے انتخاب صاف کریں۔ ناکام یا چھوڑے گئے آئٹمز خلاصے میں رپورٹ ہوتے ہیں۔",
    },
    {
      q: "Bulk Convert کے لیے کون سا آؤٹ پٹ فارمیٹ چنوں؟",
      a: "فوٹوز کی زیادہ سے زیادہ مطابقت کے لیے JPG، شفافیت یا ایڈیٹنگ پائپ لائنز کے لیے PNG، اور جدید ویب پرفارمنس کے لیے WebP چنیں۔ آؤٹ پٹ فارمیٹ چپ آپ کا لائیو انتخاب دکھاتی ہے۔",
    },
    {
      q: "کیا بلک بیچ میں شفاف PNG امیجز کنورٹ ہو سکتی ہیں؟",
      a: "ہاں جب آؤٹ پٹ الفا رکھے، جیسے PNG یا WebP۔ شفاف PNG کو JPG میں کنورٹ کرنا شفافیت کو ٹھوس پس منظر پر فلیٹن کرتا ہے — برانڈ کٹس بدلنے سے پہلے نمونے دیکھیں۔",
    },
  ],
  related: {
    eyebrow: "بلک اور کنورٹ جاری رکھیں",
    title: "متعلقہ ٹولز",
    tools: [
      {
        href: "/bulk-resize",
        title: "Bulk Resize Images",
        body: "کنورژن سے پہلے یا بعد بیچ کے ابعاد نارملائز کریں۔",
      },
      {
        href: "/bulk-compress",
        title: "Bulk Compress Images",
        body: "جب وزن اب بھی کام مانگے تو کنورٹ شدہ فائلیں ہلکی کریں۔",
      },
      {
        href: "/convert-image",
        title: "Image Converter",
        body: "جب بیچ قطار درکار نہ ہو تو ایک امیج کنورٹ کریں۔",
      },
      {href: "/resize-image", title: "Resize Images", body: "مشترکہ مہمان ری سائز ٹول سے ایک امیج ری سائز کریں۔"},
      {href: "/compress-image", title: "Compress Images", body: "جب بیچنگ درکار نہ ہو تو ایک امیج کمپریس کریں۔"},
      {
        href: "/jpg-to-webp",
        title: "All Conversion Tools",
        body: "JPG to WebP سے شروع کریں یا متعلقہ فارمیٹ جوڑی صفحات دیکھیں۔",
      },
    ],
  },
  cta: {
    title: "ایک اور بیچ کنورٹ کریں؟",
    body: "امیجز کی ایک اور بیچ اپ لوڈ کریں یا بڑی بیچ حدود، پروجیکٹ ہسٹری اور ایڈوانسڈ ٹولز کے لیے مفت اکاؤنٹ بنائیں۔",
    primaryLabel: "مزید امیجز کنورٹ کریں",
    secondaryLabel: "مفت اکاؤنٹ بنائیں",
    secondaryHref: "/register",
  },
};

export function getBulkConvertCopy(locale: string): BulkConvertCopy {
  return locale === "ur" ? ur : en;
}

export type BulkConvertLocale = AppLocale;
