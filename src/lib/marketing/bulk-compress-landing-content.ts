/**
 * Bulk Compress landing — commercial batch optimization for storage, CWV and workflows.
 * Distinct from single-image Compress JPG/PNG/WebP landings.
 */
import type {AppLocale} from "@/i18n/routing";

export type BulkCompressFaq = {q: string; a: string};

export type BulkCompressCopy = {
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
    statsReadyLabel: string;
  };
  batchFeatures: {
    eyebrow: string;
    title: string;
    cards: {title: string; body: string}[];
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
        | "smaller"
        | "speed"
        | "bandwidth"
        | "zip"
        | "browser"
        | "privacy"
        | "safe";
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
    points: string[];
    tableCaption: string;
    tableHeadingProfile: string;
    tableHeadingBestFor: string;
    tableRows: {profile: string; bestFor: string}[];
    note: string;
  };
  tips: {
    eyebrow: string;
    title: string;
    items: string[];
  };
  faqHeading: string;
  faqs: BulkCompressFaq[];
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

const en: BulkCompressCopy = {
  metaTitle: "Bulk Compress Images Online Free | SEO Images",
  metaDescription:
    "Compress multiple JPG, PNG and WebP images at once. Batch optimize images online and download all compressed files together in a ZIP archive.",
  h1: "Bulk Compress Images Online",
  breadcrumbParent: {href: "/bulk-image-tools", label: "Bulk Tools"},
  breadcrumbCurrent: "Bulk Compress Images",
  hero: {
    badge: "BULK IMAGE COMPRESSOR",
    paragraph:
      "Compress dozens or even hundreds of images in one workflow. Reduce file sizes for JPG, PNG and WebP images while maintaining excellent visual quality and download everything together as a ZIP archive.",
    trust: ["Batch Compression", "ZIP Download", "Secure Processing", "No Software Required"],
    uploadCta: "Upload Multiple Images",
    learnMoreCta: "View Features",
    heroImageAlt:
      "Bulk image compression dashboard with thumbnails entering a quality engine and leaving as a ZIP download",
  },
  upload: {
    heading: "Upload Multiple Images",
    supporting: "Drag and drop multiple JPG, PNG or WebP images or browse your device.",
    chooseLabel: "Choose Images",
    formatsHint: "JPG · PNG · WebP · Guest batch file count and size limits appear above the uploader",
    statsImagesTemplate: "{count} Images Ready",
    statsBytesTemplate: "{size} Total",
    statsReadyLabel: "Ready for Processing",
  },
  batchFeatures: {
    eyebrow: "COMPRESSION FEATURES",
    title: "One Profile. Every File. One ZIP.",
    cards: [
      {
        title: "One Compression Profile",
        body: "Apply one compression level to every uploaded image so galleries and catalogs stay visually consistent.",
      },
      {
        title: "Batch Queue",
        body: "Automatically process all uploaded files in a private guest queue.",
      },
      {
        title: "ZIP Download",
        body: "Download every optimized image together when the batch finishes.",
      },
      {
        title: "Original Files Protected",
        body: "Only new compressed copies are created — masters on your device stay unchanged.",
      },
    ],
  },
  intro: {
    eyebrow: "SAVE STORAGE AND BANDWIDTH",
    title: "Compress Hundreds of Images in One Session",
    paragraphs: [
      "Large image libraries can quickly consume storage space, increase bandwidth usage and slow website performance.",
      "Instead of compressing files individually, upload an entire batch and optimize every image automatically using the same compression settings.",
      "This workflow is ideal for ecommerce stores, marketing teams, agencies, photographers and content publishers who need smaller files without leaving the browser.",
    ],
    imageAlt:
      "One compression setting applied to dozens of thumbnails with queue progress and size reduction indicators",
  },
  workflow: {
    eyebrow: "FOUR CLEAR STEPS",
    title: "Batch Compression Workflow",
    steps: [
      {
        title: "Upload Images",
        body: "Add a batch of JPG, PNG or WebP files within the guest limits shown above the workspace.",
      },
      {
        title: "Choose Compression Level",
        body: "Set the shared quality slider once for the whole batch — higher values keep more detail, lower values chase smaller files.",
      },
      {
        title: "Automatic Processing",
        body: "Start the queue and watch each image move through private temporary compression.",
      },
      {
        title: "Download ZIP",
        body: "Download all successful outputs together, or grab individual files when needed.",
      },
    ],
    imageAlt:
      "Four-step bulk compress workflow: upload, quality settings, automatic processing and ZIP download",
  },
  benefits: {
    eyebrow: "WHY TEAMS BULK COMPRESS",
    title: "Smaller Libraries. Faster Delivery. Less Busywork.",
    cards: [
      {
        title: "Compress Hundreds of Images",
        body: "Tackle large media libraries in one session instead of opening every file by hand.",
        icon: "batch",
      },
      {
        title: "Smaller File Sizes",
        body: "Cut unnecessary weight so catalogs, galleries and campaign packs transfer faster.",
        icon: "smaller",
      },
      {
        title: "Faster Websites",
        body: "Lighter images help pages load sooner for shoppers, readers and mobile visitors.",
        icon: "speed",
      },
      {
        title: "Lower Bandwidth Usage",
        body: "Serve less data per view when media libraries stay optimized after each batch.",
        icon: "bandwidth",
      },
      {
        title: "ZIP Downloads",
        body: "Hand off an entire optimized set as one archive for CMS uploads, clients or QA.",
        icon: "zip",
      },
      {
        title: "Browser Based",
        body: "No desktop install for a quick optimization pass — open the page and start uploading.",
        icon: "browser",
      },
      {
        title: "Private Processing",
        body: "Guest files use temporary private storage and are not published to a public gallery.",
        icon: "privacy",
      },
      {
        title: "Original Files Protected",
        body: "Outputs are new compressed copies. Keep masters offline before replacing production assets.",
        icon: "safe",
      },
    ],
  },
  workflows: {
    eyebrow: "BUSINESS USE CASES",
    title: "Built for High-Volume Image Work",
    cards: [
      {
        title: "Ecommerce Catalogs",
        body: "Reduce product image weight across listing grids and PDPs without redoing every SKU by hand.",
      },
      {
        title: "Photography Delivery",
        body: "Deliver optimized galleries faster while keeping a quality profile the client expects.",
      },
      {
        title: "Agency Projects",
        body: "Compress client image libraries in one queue before handoff or CMS import.",
      },
      {
        title: "Marketing Teams",
        body: "Optimize campaign assets before publishing so ads and landing pages stay lean.",
      },
      {
        title: "Content Publishers",
        body: "Prepare blog and article images in a shared quality profile for consistent pages.",
      },
      {
        title: "Website Migration",
        body: "Optimize an existing media library before it lands on a redesigned site or CDN.",
      },
    ],
  },
  guide: {
    title: "How Batch Compression Works",
    paragraphs: [
      "Guest bulk compression applies one quality setting across every accepted file in the batch. Same-format optimization keeps JPG, PNG and WebP in their containers while reducing encoded weight.",
      "Use the quality slider as a practical control: raise it for photography detail, lower it when bandwidth and storage matter more than maximum fidelity.",
    ],
    points: [
      "Lossy compression removes detail to shrink photographic JPG and WebP files",
      "Lossless-leaning PNG passes focus on encoded weight without inventing a new format",
      "Quality settings let the whole batch share one visual/size trade-off",
      "File-size reduction depends on content — busy photos shrink differently than flat graphics",
      "Preview individual completed outputs when you need a spot check before ZIP download",
      "Compression consistency comes from one shared profile for every file in the queue",
    ],
    tableCaption: "Recommended quality intent for the bulk compress slider",
    tableHeadingProfile: "Profile intent",
    tableHeadingBestFor: "Best for",
    tableRows: [
      {profile: "Maximum Quality", bestFor: "Best for photography and detail-critical delivery."},
      {profile: "Balanced", bestFor: "Best for websites, catalogs and everyday publishing."},
      {profile: "Maximum Compression", bestFor: "Best when file size is the priority over fine detail."},
    ],
    note: "Always preview a few sample images before replacing an entire website library.",
  },
  tips: {
    eyebrow: "BETTER BATCHES",
    title: "Best Practices",
    items: [
      "Upload similar image types together when a shared quality profile fits the whole set.",
      "Select one quality profile for the batch before you start processing.",
      "Keep originals as masters before replacing production libraries.",
      "Preview a few completed results, then trust the same profile for the rest of the ZIP.",
      "Resize oversized images first with Bulk Resize when dimensions are far larger than the layout needs.",
      "Organize downloaded ZIP folders by campaign, client or page section.",
    ],
  },
  faqHeading: "Frequently Asked Questions",
  faqs: [
    {
      q: "Can I bulk compress hundreds of images online?",
      a: "Guest sessions follow the file-count and daily operation limits shown above the uploader. Large libraries may need multiple batches or an account with higher limits — the workflow itself is built for multi-file compression.",
    },
    {
      q: "Can JPG, PNG and WebP be bulk compressed together?",
      a: "Yes. The bulk compressor accepts JPEG, PNG and WebP in the same selection. Unsupported types are rejected before upload.",
    },
    {
      q: "Will every file in a Bulk Compress batch use the same settings?",
      a: "Yes. One quality setting is applied to every accepted file in that batch so outputs stay consistent.",
    },
    {
      q: "Can I download everything from Bulk Compress in one ZIP?",
      a: "Yes. After processing finishes, download successful outputs together as a ZIP, or download individual completed images.",
    },
    {
      q: "Are original images changed by Bulk Compress?",
      a: "No. The tool creates compressed copies. Files on your device remain unchanged.",
    },
    {
      q: "Are Bulk Compress uploads private?",
      a: "Guest images use private temporary storage and are deleted automatically according to the retention policy shown in the workspace.",
    },
    {
      q: "What guest limits apply to Bulk Compress?",
      a: "Maximum files per batch, total batch bytes, per-file size and daily operations appear in the usage summary above the uploader. Hitting a limit gates the batch until you reduce the selection or sign in.",
    },
    {
      q: "What is the maximum number of files for Bulk Compress?",
      a: "The maximum file count is the guest bulk max shown in the limit summary. Extra files beyond that limit are not processed in the same batch.",
    },
    {
      q: "What is the maximum upload size for a Bulk Compress batch?",
      a: "Batches cannot exceed the guest total batch size or per-file size shown in the limit summary. Oversized selections are gated before processing.",
    },
    {
      q: "Can Bulk Compress processing be cancelled after it starts?",
      a: "Once a batch is running, items already queued continue under guest processing rules. Clear the selection before starting if you need to change the set. Failed or skipped items are reported in the batch summary.",
    },
    {
      q: "Will Bulk Compress decrease image quality?",
      a: "Lower quality settings trade detail for smaller files. Raise the slider for photography when fidelity matters more than size, and always spot-check a few outputs before replacing a live library.",
    },
    {
      q: "Should I resize images before bulk compressing them?",
      a: "Often yes when assets are much larger than the layout needs. Cropping away unused pixels and resizing first prevents compressing unnecessary resolution — then run Bulk Compress.",
    },
  ],
  related: {
    eyebrow: "CONTINUE WITH BULK & COMPRESS",
    title: "Related Tools",
    tools: [
      {
        href: "/bulk-resize",
        title: "Bulk Resize Images",
        body: "Normalize dimensions across a batch before or after compression.",
      },
      {
        href: "/bulk-convert",
        title: "Bulk Convert Images",
        body: "Convert many files to JPG, PNG or WebP in one queue.",
      },
      {href: "/compress-jpg", title: "Compress JPG", body: "Single-image JPG compression with quality guidance."},
      {href: "/compress-png", title: "Compress PNG", body: "Single-image PNG compression for graphics and UI."},
      {href: "/compress-webp", title: "Compress WebP", body: "Single-image WebP compression for modern delivery."},
      {href: "/compress-image", title: "Image Compressor", body: "Compress a single image when batching is not needed."},
    ],
  },
  cta: {
    title: "Ready to Compress Another Batch?",
    body: "Upload another collection of images or create a free account for larger batch limits and saved projects.",
    primaryLabel: "Compress More Images",
    secondaryLabel: "Create Free Account",
    secondaryHref: "/register",
  },
};

const ur: BulkCompressCopy = {
  metaTitle: "آن لائن بلک کمپریس امیجز مفت | SEO Images",
  metaDescription:
    "ایک ساتھ متعدد JPG، PNG اور WebP امیجز کمپریس کریں۔ آن لائن بیچ آپٹیمائز کریں اور تمام کمپریس شدہ فائلیں ایک ZIP میں ڈاؤن لوڈ کریں۔",
  h1: "آن لائن بلک کمپریس امیجز",
  breadcrumbParent: {href: "/bulk-image-tools", label: "Bulk Tools"},
  breadcrumbCurrent: "Bulk Compress Images",
  hero: {
    badge: "BULK IMAGE COMPRESSOR",
    paragraph:
      "ایک ورک فلو میں درجنوں یا سینکڑوں امیجز کمپریس کریں۔ JPG، PNG اور WebP کی فائل سائزز کم کریں جبکہ بہترین بصری معیار برقرار رکھیں اور سب کچھ ایک ZIP آرکائیو میں ڈاؤن لوڈ کریں۔",
    trust: ["بیچ کمپریشن", "ZIP ڈاؤن لوڈ", "محفوظ پروسیسنگ", "سافٹ ویئر درکار نہیں"],
    uploadCta: "متعدد امیجز اپ لوڈ کریں",
    learnMoreCta: "فیچرز دیکھیں",
    heroImageAlt:
      "بلک امیج کمپریشن ڈیش بورڈ جہاں تھمب نیلز کوالٹی انجن میں جاتی ہیں اور ZIP ڈاؤن لوڈ بنتی ہیں",
  },
  upload: {
    heading: "متعدد امیجز اپ لوڈ کریں",
    supporting: "متعدد JPG، PNG یا WebP گھسیٹیں یا ڈیوائس سے چنیں۔",
    chooseLabel: "امیجز چنیں",
    formatsHint: "JPG · PNG · WebP · مہمان بیچ فائل شمار اور سائز کی حدود اپ لوڈر کے اوپر دکھائی دیتی ہیں",
    statsImagesTemplate: "{count} امیجز تیار",
    statsBytesTemplate: "{size} کل",
    statsReadyLabel: "پروسیسنگ کے لیے تیار",
  },
  batchFeatures: {
    eyebrow: "کمپریشن فیچرز",
    title: "ایک پروفائل۔ ہر فائل۔ ایک ZIP۔",
    cards: [
      {
        title: "ایک کمپریشن پروفائل",
        body: "ہر اپ لوڈ شدہ امیج پر ایک کمپریشن لیول لگائیں تاکہ گیلریز اور کیٹلاگ بصری طور پر مستقل رہیں۔",
      },
      {
        title: "بیچ قطار",
        body: "تمام اپ لوڈ شدہ فائلیں نجی مہمان قطار میں خود بخود پروسیس کریں۔",
      },
      {
        title: "ZIP ڈاؤن لوڈ",
        body: "بیچ مکمل ہونے پر ہر آپٹیمائزڈ امیج ایک ساتھ ڈاؤن لوڈ کریں۔",
      },
      {
        title: "اصل فائلیں محفوظ",
        body: "صرف نئی کمپریس شدہ کاپیاں بنتی ہیں — ڈیوائس پر ماسٹرز جوں کے توں رہتے ہیں۔",
      },
    ],
  },
  intro: {
    eyebrow: "اسٹوریج اور بینڈوتھ بچائیں",
    title: "ایک سیشن میں سینکڑوں امیجز کمپریس کریں",
    paragraphs: [
      "بڑی امیج لائبریریز جلدی اسٹوریج کھاتی ہیں، بینڈوتھ بڑھاتی ہیں اور ویب سائٹ پرفارمنس سست کر سکتی ہیں۔",
      "فائلیں انفرادی کمپریس کرنے کے بجائے پوری بیچ اپ لوڈ کریں اور ایک ہی سیٹنگز سے ہر امیج خود بخود آپٹیمائز کریں۔",
      "یہ ورک فلو ای کامرس اسٹورز، مارکیٹنگ ٹیموں، ایجنسیز، فوٹوگرافرز اور کنٹنٹ پبلشرز کے لیے موزوں ہے جنہیں براؤزر چھوڑے بغیر چھوٹی فائلیں چاہیے۔",
    ],
    imageAlt: "درجنوں تھمب نیلز پر ایک کمپریشن سیٹنگ، قطار کی پیشرفت اور سائز کمی کے اشارے",
  },
  workflow: {
    eyebrow: "چار واضح مراحل",
    title: "بیچ کمپریشن ورک فلو",
    steps: [
      {
        title: "امیجز اپ لوڈ کریں",
        body: "ورک اسپیس کے اوپر دکھائی گئی مہمان حدود کے اندر JPG، PNG یا WebP کی بیچ شامل کریں۔",
      },
      {
        title: "کمپریشن لیول چنیں",
        body: "پوری بیچ کے لیے ایک بار مشترکہ کوالٹی سلائیڈر سیٹ کریں — زیادہ ویلیو تفصیل رکھتی ہے، کم ویلیو چھوٹی فائلیں دھونڈتی ہے۔",
      },
      {
        title: "خودکار پروسیسنگ",
        body: "قطار شروع کریں اور ہر امیج کو نجی عارضی کمپریشن سے گزرتے دیکھیں۔",
      },
      {
        title: "ZIP ڈاؤن لوڈ کریں",
        body: "تمام کامیاب آؤٹ پٹس ایک ساتھ ڈاؤن لوڈ کریں، یا ضرورت ہو تو الگ فائلیں لیں۔",
      },
    ],
    imageAlt: "چار مرحلہ بلک کمپریس ورک فلو: اپ لوڈ، کوالٹی سیٹنگز، خودکار پروسیسنگ اور ZIP ڈاؤن لوڈ",
  },
  benefits: {
    eyebrow: "ٹیمیں بلک کمپریس کیوں کرتی ہیں",
    title: "چھوٹی لائبریریز۔ تیز ڈیلیوری۔ کم مصروفیت۔",
    cards: [
      {
        title: "سینکڑوں امیجز کمپریس کریں",
        body: "ہر فائل ہاتھ سے کھولنے کے بجائے ایک سیشن میں بڑی میڈیا لائبریریز سنبھالیں۔",
        icon: "batch",
      },
      {
        title: "چھوٹی فائل سائزز",
        body: "غیر ضروری وزن کاٹیں تاکہ کیٹلاگ، گیلریز اور مہم پیکس تیز منتقل ہوں۔",
        icon: "smaller",
      },
      {
        title: "تیز ویب سائٹس",
        body: "ہلکی امیجز خریداروں، قارئین اور موبائل زائرین کے لیے صفحات جلدی لوڈ کرنے میں مدد دیتی ہیں۔",
        icon: "speed",
      },
      {
        title: "کم بینڈوتھ استعمال",
        body: "جب میڈیا لائبریریز ہر بیچ کے بعد آپٹیمائز رہیں تو فی ویو کم ڈیٹا بھیجیں۔",
        icon: "bandwidth",
      },
      {
        title: "ZIP ڈاؤن لوڈز",
        body: "CMS اپ لوڈز، کلائنٹس یا QA کے لیے پورا آپٹیمائزڈ سیٹ ایک آرکائیو میں دیں۔",
        icon: "zip",
      },
      {
        title: "براؤزر پر مبنی",
        body: "تیز آپٹیمائزیشن پاس کے لیے ڈیسک ٹاپ انسٹال نہیں — صفحہ کھولیں اور اپ لوڈ شروع کریں۔",
        icon: "browser",
      },
      {
        title: "نجی پروسیسنگ",
        body: "مہمان فائلیں عارضی نجی اسٹوریج استعمال کرتی ہیں اور عوامی گیلری میں نہیں جاتیں۔",
        icon: "privacy",
      },
      {
        title: "اصل فائلیں محفوظ",
        body: "آؤٹ پٹس نئی کمپریس شدہ کاپیاں ہیں۔ پروڈکشن بدلنے سے پہلے ماسٹرز آف لائن رکھیں۔",
        icon: "safe",
      },
    ],
  },
  workflows: {
    eyebrow: "بزنس استعمال کے کیسز",
    title: "ہائی والیوم امیج ورک کے لیے",
    cards: [
      {
        title: "ای کامرس کیٹلاگز",
        body: "ہر SKU ہاتھ سے دہرائے بغیر لسٹنگ گرڈز اور PDP پر پروڈکٹ امیج وزن کم کریں۔",
      },
      {
        title: "فوٹوگرافی ڈیلیوری",
        body: "آپٹیمائزڈ گیلریز تیز تر دیں جبکہ کلائنٹ کے متوقع کوالٹی پروفائل رکھیں۔",
      },
      {
        title: "ایجنسی پروجیکٹس",
        body: "ہینڈ آف یا CMS امپورٹ سے پہلے کلائنٹ امیج لائبریریز ایک قطار میں کمپریس کریں۔",
      },
      {
        title: "مارکیٹنگ ٹیمیں",
        body: "شائع کرنے سے پہلے مہم اثاثے آپٹیمائز کریں تاکہ اشتہارات اور لینڈنگ پیجز ہلکے رہیں۔",
      },
      {
        title: "کنٹنٹ پبلشرز",
        body: "مستقل صفحات کے لیے مشترکہ کوالٹی پروفائل میں بلاگ اور آرٹیکل امیجز تیار کریں۔",
      },
      {
        title: "ویب سائٹ مائگریشن",
        body: "دوبارہ ڈیزائن شدہ سائٹ یا CDN پر جانے سے پہلے موجودہ میڈیا لائبریری آپٹیمائز کریں۔",
      },
    ],
  },
  guide: {
    title: "بیچ کمپریشن کیسے کام کرتی ہے",
    paragraphs: [
      "مہمان بلک کمپریشن بیچ کی ہر قبول شدہ فائل پر ایک کوالٹی سیٹنگ لگاتی ہے۔ سیم فارمیٹ آپٹیمائزیشن JPG، PNG اور WebP کو ان کے کنٹینرز میں رکھتی ہے جبکہ انکوڈڈ وزن کم کرتی ہے۔",
      "کوالٹی سلائیڈر کو عملی کنٹرول سمجھیں: فوٹوگرافی تفصیل کے لیے اوپر کریں، جب بینڈوتھ اور اسٹوریج زیادہ اہم ہوں تو نیچے کریں۔",
    ],
    points: [
      "لاسی کمپریشن فوٹوگرافک JPG اور WebP فائلیں چھوٹی کرنے کے لیے تفصیل کم کرتی ہے",
      "لاسلیس مائل PNG پاسز نیا فارمیٹ بنائے بغیر انکوڈڈ وزن پر فوکس کرتے ہیں",
      "کوالٹی سیٹنگز پوری بیچ کو ایک بصری/سائز تجارتی فیصلہ دیتی ہیں",
      "فائل سائز کمی مواد پر منحصر ہے — مصروف فوٹوز فلیٹ گرافکس سے مختلف سکڑتی ہیں",
      "ZIP سے پہلے اسپاٹ چیک کے لیے مکمل شدہ آؤٹ پٹس الگ دیکھیں",
      "کمپریشن مستقل مزاجی قطار کی ہر فائل کے لیے ایک مشترکہ پروفائل سے آتی ہے",
    ],
    tableCaption: "بلک کمپریس سلائیڈر کے لیے تجویز کردہ کوالٹی ارادہ",
    tableHeadingProfile: "پروفائل ارادہ",
    tableHeadingBestFor: "کس کے لیے بہترین",
    tableRows: [
      {profile: "Maximum Quality", bestFor: "فوٹوگرافی اور تفصیل اہم ڈیلیوری کے لیے بہترین۔"},
      {profile: "Balanced", bestFor: "ویب سائٹس، کیٹلاگز اور روزمرہ پبلشنگ کے لیے بہترین۔"},
      {profile: "Maximum Compression", bestFor: "جب فائل سائز باریک تفصیل سے زیادہ ترجیح ہو۔"},
    ],
    note: "پوری ویب سائٹ لائبریری بدلنے سے پہلے ہمیشہ چند نمونہ امیجز کا پیش منظر دیکھیں۔",
  },
  tips: {
    eyebrow: "بہتر بیچز",
    title: "بہترین طریقے",
    items: [
      "جب مشترکہ کوالٹی پروفائل پورے سیٹ پر فٹ ہو تو مشابہ امیج اقسام ایک ساتھ اپ لوڈ کریں۔",
      "پروسیسنگ شروع کرنے سے پہلے بیچ کے لیے ایک کوالٹی پروفائل چنیں۔",
      "پروڈکشن لائبریریز بدلنے سے پہلے اصل بطور ماسٹر رکھیں۔",
      "چند مکمل نتائج دیکھیں، پھر باقی ZIP کے لیے اسی پروفائل پر بھروسہ کریں۔",
      "جب ابعاد لے آؤٹ سے بہت بڑی ہوں تو پہلے Bulk Resize سے اوور سائزڈ امیجز ری سائز کریں۔",
      "ڈاؤن لوڈ شدہ ZIP فولڈرز کو مہم، کلائنٹ یا صفحہ سیکشن کے مطابق منظم کریں۔",
    ],
  },
  faqHeading: "اکثر پوچھے گئے سوالات",
  faqs: [
    {
      q: "کیا آن لائن سینکڑوں امیجز بلک کمپریس ہو سکتی ہیں؟",
      a: "مہمان سیشنز اپ لوڈر کے اوپر دکھائی گئی فائل شمار اور روزانہ آپریشن حدود کی پیروی کرتی ہیں۔ بڑی لائبریریز کے لیے متعدد بیچز یا اعلیٰ حدود والا اکاؤنٹ درکار ہو سکتا ہے — خود ورک فلو ملٹی فائل کمپریشن کے لیے بنا ہے۔",
    },
    {
      q: "کیا JPG، PNG اور WebP ایک ساتھ بلک کمپریس ہو سکتی ہیں؟",
      a: "ہاں۔ بلک کمپریسر ایک ہی انتخاب میں JPEG، PNG اور WebP قبول کرتا ہے۔ غیر سپورٹڈ اقسام اپ لوڈ سے پہلے مسترد ہوتی ہیں۔",
    },
    {
      q: "کیا Bulk Compress بیچ کی ہر فائل ایک سیٹنگ استعمال کرے گی؟",
      a: "ہاں۔ اس بیچ کی ہر قبول شدہ فائل پر ایک ہی کوالٹی سیٹنگ لگتی ہے تاکہ آؤٹ پٹس مستقل رہیں۔",
    },
    {
      q: "کیا Bulk Compress سے سب کچھ ایک ZIP میں ڈاؤن لوڈ ہو سکتا ہے؟",
      a: "ہاں۔ پروسیسنگ مکمل ہونے پر کامیاب آؤٹ پٹس ایک ZIP میں ڈاؤن لوڈ کریں، یا مکمل شدہ امیجز الگ لیں۔",
    },
    {
      q: "کیا Bulk Compress اصل امیجز بدل دیتا ہے؟",
      a: "نہیں۔ ٹول کمپریس شدہ کاپیاں بناتا ہے۔ آپ کی ڈیوائس پر فائلیں جوں کی توں رہتی ہیں۔",
    },
    {
      q: "کیا Bulk Compress اپ لوڈز نجی ہیں؟",
      a: "مہمان امیجز نجی عارضی اسٹوریج استعمال کرتی ہیں اور ورک اسپیس میں دکھائی گئی برقرار رکھنے کی پالیسی کے مطابق خود بخود حذف ہو جاتی ہیں۔",
    },
    {
      q: "Bulk Compress پر کون سی مہمان حدود لاگو ہوتی ہیں؟",
      a: "فی بیچ زیادہ سے زیادہ فائلیں، کل بیچ بائٹس، فی فائل سائز اور روزانہ آپریشنز اپ لوڈر کے اوپر خلاصے میں دکھائی دیتی ہیں۔ حد لگنے پر انتخاب کم کریں یا سائن ان کریں۔",
    },
    {
      q: "Bulk Compress کی زیادہ سے زیادہ فائلوں کی تعداد کیا ہے؟",
      a: "زیادہ سے زیادہ فائل شمار حد خلاصے میں دکھائی گئی مہمان بلک حد ہے۔ اس سے زائد فائلیں اسی بیچ میں پروسیس نہیں ہوتیں۔",
    },
    {
      q: "Bulk Compress بیچ کی زیادہ سے زیادہ اپ لوڈ سائز کیا ہے؟",
      a: "بیچز حد خلاصے میں دکھائی گئی مہمان کل بیچ سائز یا فی فائل سائز سے زیادہ نہیں ہو سکتیں۔ بہت بڑے انتخاب پروسیسنگ سے پہلے روکے جاتے ہیں۔",
    },
    {
      q: "کیا شروع ہونے کے بعد Bulk Compress پروسیسنگ منسوخ ہو سکتی ہے؟",
      a: "بیچ چلنے کے بعد پہلے سے قطار میں موجود آئٹمز مہمان پروسیسنگ قواعد کے تحت جاری رہتے ہیں۔ سیٹ بدلنے کے لیے شروع سے پہلے انتخاب صاف کریں۔ ناکام یا چھوڑے گئے آئٹمز خلاصے میں رپورٹ ہوتے ہیں۔",
    },
    {
      q: "کیا Bulk Compress سے امیج کوالٹی کم ہو گی؟",
      a: "کم کوالٹی سیٹنگز تفصیل کے بدلے چھوٹی فائلیں دیتی ہیں۔ جب وفاداری سائز سے زیادہ اہم ہو تو فوٹوگرافی کے لیے سلائیڈر اوپر کریں، اور لائیو لائبریری بدلنے سے پہلے چند آؤٹ پٹس چیک کریں۔",
    },
    {
      q: "کیا بلک کمپریس سے پہلے امیجز ری سائز کرنی چاہییں؟",
      a: "اکثر ہاں جب اثاثے لے آؤٹ کی ضرورت سے بہت بڑے ہوں۔ پہلے غیر ضروری ریزولیوشن ہٹائیں/ری سائز کریں، پھر Bulk Compress چلائیں۔",
    },
  ],
  related: {
    eyebrow: "بلک اور کمپریس جاری رکھیں",
    title: "متعلقہ ٹولز",
    tools: [
      {
        href: "/bulk-resize",
        title: "Bulk Resize Images",
        body: "کمپریشن سے پہلے یا بعد بیچ کے ابعاد نارملائز کریں۔",
      },
      {
        href: "/bulk-convert",
        title: "Bulk Convert Images",
        body: "ایک قطار میں بہت سی فائلیں JPG، PNG یا WebP میں تبدیل کریں۔",
      },
      {href: "/compress-jpg", title: "Compress JPG", body: "کوالٹی رہنمائی کے ساتھ سنگل امیج JPG کمپریشن۔"},
      {href: "/compress-png", title: "Compress PNG", body: "گرافکس اور UI کے لیے سنگل امیج PNG کمپریشن۔"},
      {href: "/compress-webp", title: "Compress WebP", body: "جدید ڈیلیوری کے لیے سنگل امیج WebP کمپریشن۔"},
      {
        href: "/compress-image",
        title: "Image Compressor",
        body: "جب بیچنگ درکار نہ ہو تو ایک امیج کمپریس کریں۔",
      },
    ],
  },
  cta: {
    title: "ایک اور بیچ کمپریس کریں؟",
    body: "امیجز کا ایک اور مجموعہ اپ لوڈ کریں یا بڑی بیچ حدود اور محفوظ پروجیکٹس کے لیے مفت اکاؤنٹ بنائیں۔",
    primaryLabel: "مزید امیجز کمپریس کریں",
    secondaryLabel: "مفت اکاؤنٹ بنائیں",
    secondaryHref: "/register",
  },
};

export function getBulkCompressCopy(locale: string): BulkCompressCopy {
  return locale === "ur" ? ur : en;
}

export type BulkCompressLocale = AppLocale;
