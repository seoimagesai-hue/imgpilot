/**
 * Bulk Resize landing — commercial batch resize for agencies, ecommerce, photographers.
 * Distinct from single-image Resize JPG/PNG/WebP landings.
 */
import type {AppLocale} from "@/i18n/routing";

export type BulkResizeFaq = {q: string; a: string};

export type BulkResizeCopy = {
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
        | "consistent"
        | "queue"
        | "zip"
        | "responsive"
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
  performance: {
    title: string;
    paragraphs: string[];
    points: string[];
    note: string;
  };
  tips: {
    eyebrow: string;
    title: string;
    items: string[];
  };
  faqHeading: string;
  faqs: BulkResizeFaq[];
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

const en: BulkResizeCopy = {
  metaTitle: "Bulk Resize Images Online Free | SEO Images",
  metaDescription:
    "Resize multiple JPG, PNG and WebP images at once. Batch process images online and download resized files together in a ZIP archive.",
  h1: "Bulk Resize Images Online",
  breadcrumbParent: {href: "/bulk-image-tools", label: "Bulk Tools"},
  breadcrumbCurrent: "Bulk Resize Images",
  hero: {
    badge: "BULK IMAGE RESIZER",
    paragraph:
      "Resize multiple images at once without repeating the same task for every file. Upload a batch of JPG, PNG or WebP images, choose one resize setting and download all resized images together.",
    trust: ["Batch Processing", "ZIP Download", "Secure Processing", "No Software Required"],
    uploadCta: "Upload Multiple Images",
    learnMoreCta: "Learn More",
    heroImageAlt:
      "Bulk image resize dashboard with thumbnails entering a resize engine and leaving as a ZIP download",
  },
  upload: {
    heading: "Upload Multiple Images",
    supporting: "Drag and drop multiple JPG, PNG or WebP images or browse your device.",
    chooseLabel: "Choose Images",
    formatsHint: "JPG · PNG · WebP · Guest batch file count and size limits appear above the uploader",
    statsImagesTemplate: "{count} Images Selected",
    statsBytesTemplate: "{size} Total",
    statsReadyLabel: "Ready for Processing",
  },
  batchFeatures: {
    eyebrow: "BUILT FOR BATCHES",
    title: "One Setting. Every Image. One ZIP.",
    cards: [
      {
        title: "One Resize Setting",
        body: "Apply one resize profile to every uploaded image so catalogs and campaigns stay consistent.",
      },
      {
        title: "Batch Queue",
        body: "Process multiple images efficiently instead of opening each file in a desktop editor.",
      },
      {
        title: "ZIP Download",
        body: "Download all resized files together when the batch finishes.",
      },
      {
        title: "Original Files Protected",
        body: "Create resized copies only — originals on your device stay unchanged.",
      },
    ],
  },
  intro: {
    eyebrow: "SAVE HOURS OF WORK",
    title: "Resize Hundreds of Images in One Workflow",
    paragraphs: [
      "Resizing images individually becomes slow and repetitive when managing online stores, client projects or marketing campaigns.",
      "This bulk resizer lets you upload multiple images, choose one resize configuration and process every image automatically.",
      "Whether you are preparing ecommerce products, blog images or responsive website assets, batch resizing helps keep your workflow consistent.",
    ],
    imageAlt:
      "One resize setting applied to dozens of image thumbnails with queue progress and consistent outputs",
  },
  workflow: {
    eyebrow: "FOUR CLEAR STEPS",
    title: "Bulk Resize Workflow",
    steps: [
      {
        title: "Upload Images",
        body: "Add a batch of JPG, PNG or WebP files within the guest limits shown above the workspace.",
      },
      {
        title: "Choose Resize Settings",
        body: "Pick width, height or fit-inside mode and set the target pixel value once for the whole batch.",
      },
      {
        title: "Batch Processing",
        body: "Start the queue and watch each image move through private temporary processing.",
      },
      {
        title: "Download ZIP",
        body: "Download all successful outputs together, or grab individual files when needed.",
      },
    ],
    imageAlt:
      "Four-step bulk resize workflow: upload, configure, batch process and ZIP download",
  },
  benefits: {
    eyebrow: "WHY TEAMS CHOOSE BULK RESIZE",
    title: "Professional Throughput Without Desktop Software",
    cards: [
      {
        title: "Resize Hundreds of Images",
        body: "Tackle large catalogs and campaign packs in one session instead of file-by-file edits.",
        icon: "batch",
      },
      {
        title: "Consistent Dimensions",
        body: "Apply the same resize profile across every selected image for cleaner layouts.",
        icon: "consistent",
      },
      {
        title: "Batch Processing",
        body: "Queue work in the browser while guest limits and progress stay visible.",
        icon: "queue",
      },
      {
        title: "ZIP Downloads",
        body: "Hand off an entire resized set as one archive for clients, CMS uploads or QA.",
        icon: "zip",
      },
      {
        title: "Responsive Images",
        body: "Prepare assets that fit product grids, article widths and marketing sections.",
        icon: "responsive",
      },
      {
        title: "Browser Based",
        body: "No desktop install for a quick batch pass — open the page and start uploading.",
        icon: "browser",
      },
      {
        title: "Private Processing",
        body: "Guest files use temporary private storage and are not published to a public gallery.",
        icon: "privacy",
      },
      {
        title: "Original Files Protected",
        body: "Outputs are new resized copies. Keep your masters offline before replacing production assets.",
        icon: "safe",
      },
    ],
  },
  workflows: {
    eyebrow: "COMMON WORKFLOWS",
    title: "Built for Real Production Teams",
    cards: [
      {
        title: "Ecommerce Products",
        body: "Resize product images for consistent catalog layouts across PDPs and listing grids.",
      },
      {
        title: "Photography Galleries",
        body: "Prepare client galleries in a shared size before delivery or web publish.",
      },
      {
        title: "Blog Publishing",
        body: "Resize article images before uploading so posts stay visually consistent.",
      },
      {
        title: "Marketing Campaigns",
        body: "Create image sets for ads and social placements from one resize profile.",
      },
      {
        title: "Agency Projects",
        body: "Deliver standardized assets for multiple clients without redoing the same click path.",
      },
      {
        title: "Website Migration",
        body: "Prepare hundreds of existing images for a redesigned site with matching display boxes.",
      },
    ],
  },
  performance: {
    title: "Why Batch Resizing Saves Time",
    paragraphs: [
      "Manual resizing wastes time when every asset needs the same pixel constraint.",
      "Batch processing creates consistent image dimensions and keeps teams aligned on one profile.",
    ],
    points: [
      "Manual resizing wastes time on repetitive one-off edits",
      "Batch processing creates consistent image dimensions",
      "Teams can prepare hundreds of assets in one session",
      "ZIP downloads simplify delivery to clients and CMS tools",
    ],
    note: "The more images you process together, the more time you save compared to editing files individually.",
  },
  tips: {
    eyebrow: "BETTER BATCHES",
    title: "Best Practices",
    items: [
      "Upload similar image types together when a shared profile fits the whole set.",
      "Choose one resize profile for the batch before you start processing.",
      "Keep original files as masters before replacing production libraries.",
      "Preview sample output when you can, then run the full queue.",
      "Compress afterwards with Bulk Compress if weight still matters more than pixels.",
      "Organize downloaded ZIP folders by campaign, client or page section.",
    ],
  },
  faqHeading: "Frequently Asked Questions",
  faqs: [
    {
      q: "Can I bulk resize hundreds of images online?",
      a: "Guest sessions follow the file-count and daily operation limits shown above the uploader. Large catalogs may need multiple batches or an account with higher limits — the workflow itself is built for multi-file resize, not single-image clicks.",
    },
    {
      q: "Will every image in a Bulk Resize batch use the same settings?",
      a: "Yes. One resize mode and pixel value is applied to every accepted file in that batch so outputs stay consistent.",
    },
    {
      q: "Can I bulk resize JPG, PNG and WebP together?",
      a: "Yes. The bulk resizer accepts JPEG, PNG and WebP in the same selection. Unsupported types are rejected before upload.",
    },
    {
      q: "Is ZIP download included with Bulk Resize?",
      a: "Yes. After processing finishes, download successful outputs together as a ZIP, or download individual completed images.",
    },
    {
      q: "Are original images changed by Bulk Resize?",
      a: "No. The tool creates resized copies. Files on your device remain unchanged.",
    },
    {
      q: "Are Bulk Resize uploads private?",
      a: "Guest images use private temporary storage and are deleted automatically according to the retention policy shown in the workspace.",
    },
    {
      q: "What guest limits apply to Bulk Resize?",
      a: "Maximum files per batch, total batch bytes, per-file size and daily operations appear in the usage summary above the uploader. Hitting a limit gates the batch until you reduce the selection or sign in.",
    },
    {
      q: "What is the maximum number of files for Bulk Resize?",
      a: "The maximum file count is the guest bulk max shown in the limit summary. Extra files beyond that limit are not processed in the same batch.",
    },
    {
      q: "What is the maximum upload size for a Bulk Resize batch?",
      a: "Batches cannot exceed the guest total batch size or per-file size shown in the limit summary. Oversized selections are gated before processing.",
    },
    {
      q: "Can I cancel Bulk Resize processing after it starts?",
      a: "Once a batch is running, items already queued continue under guest processing rules. Clear the selection before starting if you need to change the set. Failed or skipped items are reported in the batch summary.",
    },
    {
      q: "Does Bulk Resize keep aspect ratio locked?",
      a: "Yes for the guest resize paths used here — width, height and fit-inside modes maintain aspect ratio and avoid upscaling by default.",
    },
    {
      q: "Can I bulk resize images for social media layouts?",
      a: "You can resize many images to a shared pixel constraint suitable for web and marketing layouts. Exact platform template packs are not invented on this page — set the pixels your destination requires.",
    },
  ],
  related: {
    eyebrow: "CONTINUE WITH BULK & RESIZE",
    title: "Related Tools",
    tools: [
      {
        href: "/bulk-compress",
        title: "Bulk Compress Images",
        body: "Lighten an entire batch after dimensions are correct.",
      },
      {
        href: "/bulk-convert",
        title: "Bulk Convert Images",
        body: "Convert many files to JPG, PNG or WebP in one queue.",
      },
      {href: "/resize-jpg", title: "Resize JPG", body: "Single-image JPG resize with marketing size guidance."},
      {href: "/resize-png", title: "Resize PNG", body: "Single-image PNG resize for graphics and UI."},
      {href: "/resize-webp", title: "Resize WebP", body: "Single-image WebP resize for modern delivery."},
      {href: "/compress-image", title: "Compress Images", body: "Reduce weight on a single image when batching is not needed."},
    ],
  },
  cta: {
    title: "Ready to Resize Another Batch?",
    body: "Upload another group of images or create a free account for larger batch limits and saved projects.",
    primaryLabel: "Resize More Images",
    secondaryLabel: "Create Free Account",
    secondaryHref: "/register",
  },
};

const ur: BulkResizeCopy = {
  metaTitle: "آن لائن بلک ری سائز امیجز مفت | SEO Images",
  metaDescription:
    "ایک ساتھ متعدد JPG، PNG اور WebP امیجز ری سائز کریں۔ آن لائن بیچ پروسیس کریں اور ری سائز شدہ فائلیں ایک ZIP میں ڈاؤن لوڈ کریں۔",
  h1: "آن لائن بلک ری سائز امیجز",
  breadcrumbParent: {href: "/bulk-image-tools", label: "Bulk Tools"},
  breadcrumbCurrent: "Bulk Resize Images",
  hero: {
    badge: "BULK IMAGE RESIZER",
    paragraph:
      "ہر فائل کے لیے وہی کام دہرائے بغیر ایک ساتھ متعدد امیجز ری سائز کریں۔ JPG، PNG یا WebP کی بیچ اپ لوڈ کریں، ایک ری سائز سیٹنگ چنیں اور سب ری سائز شدہ امیجز ایک ساتھ ڈاؤن لوڈ کریں۔",
    trust: ["بیچ پروسیسنگ", "ZIP ڈاؤن لوڈ", "محفوظ پروسیسنگ", "سافٹ ویئر درکار نہیں"],
    uploadCta: "متعدد امیجز اپ لوڈ کریں",
    learnMoreCta: "مزید جانیں",
    heroImageAlt:
      "بلک امیج ری سائز ڈیش بورڈ جہاں تھمب نیلز ری سائز انجن میں جاتی ہیں اور ZIP ڈاؤن لوڈ بنتی ہیں",
  },
  upload: {
    heading: "متعدد امیجز اپ لوڈ کریں",
    supporting: "متعدد JPG، PNG یا WebP گھسیٹیں یا ڈیوائس سے چنیں۔",
    chooseLabel: "امیجز چنیں",
    formatsHint: "JPG · PNG · WebP · مہمان بیچ فائل شمار اور سائز کی حدود اپ لوڈر کے اوپر دکھائی دیتی ہیں",
    statsImagesTemplate: "{count} امیجز منتخب",
    statsBytesTemplate: "{size} کل",
    statsReadyLabel: "پروسیسنگ کے لیے تیار",
  },
  batchFeatures: {
    eyebrow: "بیچ کے لیے بنایا گیا",
    title: "ایک سیٹنگ۔ ہر امیج۔ ایک ZIP۔",
    cards: [
      {
        title: "ایک ری سائز سیٹنگ",
        body: "ہر اپ لوڈ شدہ امیج پر ایک ری سائز پروفائل لگائیں تاکہ کیٹلاگ اور مہمات مستقل رہیں۔",
      },
      {
        title: "بیچ قطار",
        body: "ڈیسک ٹاپ ایڈیٹر میں ہر فائل کھولنے کے بجائے متعدد امیجز مؤثر طریقے سے پروسیس کریں۔",
      },
      {
        title: "ZIP ڈاؤن لوڈ",
        body: "بیچ مکمل ہونے پر تمام ری سائز شدہ فائلیں ایک ساتھ ڈاؤن لوڈ کریں۔",
      },
      {
        title: "اصل فائلیں محفوظ",
        body: "صرف ری سائز شدہ کاپیاں بنائیں — ڈیوائس پر اصل جوں کی توں رہتی ہیں۔",
      },
    ],
  },
  intro: {
    eyebrow: "گھنٹوں کا کام بچائیں",
    title: "ایک ورک فلو میں سینکڑوں امیجز ری سائز کریں",
    paragraphs: [
      "آن لائن اسٹورز، کلائنٹ پروجیکٹس یا مارکیٹنگ مہمات سنبھالتے وقت انفرادی ری سائز سست اور دہرائی والا ہو جاتا ہے۔",
      "یہ بلک ری سائزر متعدد امیجز اپ لوڈ کرنے، ایک ری سائز کنفیگریشن چننے اور ہر امیج کو خود بخود پروسیس کرنے دیتا ہے۔",
      "چاہے آپ ای کامرس پروڈکٹس، بلاگ امیجز یا ریسپانسیو ویب اثاثے تیار کر رہے ہوں، بیچ ری سائزنگ ورک فلو کو مستقل رکھنے میں مدد کرتی ہے۔",
    ],
    imageAlt: "درجنوں تھمب نیلز پر ایک ری سائز سیٹنگ، قطار کی پیشرفت اور مستقل آؤٹ پٹس",
  },
  workflow: {
    eyebrow: "چار واضح مراحل",
    title: "بلک ری سائز ورک فلو",
    steps: [
      {
        title: "امیجز اپ لوڈ کریں",
        body: "ورک اسپیس کے اوپر دکھائی گئی مہمان حدود کے اندر JPG، PNG یا WebP کی بیچ شامل کریں۔",
      },
      {
        title: "ری سائز سیٹنگز چنیں",
        body: "چوڑائی، اونچائی یا فٹ-ان سائیڈ موڈ چنیں اور پوری بیچ کے لیے ایک بار ٹارگٹ پکسل سیٹ کریں۔",
      },
      {
        title: "بیچ پروسیسنگ",
        body: "قطار شروع کریں اور ہر امیج کو نجی عارضی پروسیسنگ سے گزرتے دیکھیں۔",
      },
      {
        title: "ZIP ڈاؤن لوڈ کریں",
        body: "تمام کامیاب آؤٹ پٹس ایک ساتھ ڈاؤن لوڈ کریں، یا ضرورت ہو تو الگ فائلیں لیں۔",
      },
    ],
    imageAlt: "چار مرحلہ بلک ری سائز ورک فلو: اپ لوڈ، کنفیگر، بیچ پروسیس اور ZIP ڈاؤن لوڈ",
  },
  benefits: {
    eyebrow: "ٹیमें بلک ری سائز کیوں چنتی ہیں",
    title: "ڈیسک ٹاپ سافٹ ویئر کے بغیر پیشہ ورانہ رفتار",
    cards: [
      {
        title: "سینکڑوں امیجز ری سائز کریں",
        body: "فائل بہ فائل ایڈیٹ کی بجائے ایک سیشن میں بڑے کیٹلاگ اور مہم پیکس سنبھالیں۔",
        icon: "batch",
      },
      {
        title: "مستقل ابعاد",
        body: "ہر منتخب امیج پر وہی ری سائز پروفائل لگائیں تاکہ لے آؤٹس صاف رہیں۔",
        icon: "consistent",
      },
      {
        title: "بیچ پروسیسنگ",
        body: "براؤزر میں قطار لگائیں جبکہ مہمان حدود اور پیشرفت نظر آتی رہے۔",
        icon: "queue",
      },
      {
        title: "ZIP ڈاؤن لوڈز",
        body: "کلائنٹس، CMS اپ لوڈز یا QA کے لیے پورا ری سائز شدہ سیٹ ایک آرکائیو میں دیں۔",
        icon: "zip",
      },
      {
        title: "ریسپانسیو امیجز",
        body: "پروڈکٹ گرڈز، آرٹیکل چوڑائیوں اور مارکیٹنگ سیکشنز کے لیے اثاثے تیار کریں۔",
        icon: "responsive",
      },
      {
        title: "براؤزر پر مبنی",
        body: "تیز بیچ پاس کے لیے ڈیسک ٹاپ انسٹال نہیں — صفحہ کھولیں اور اپ لوڈ شروع کریں۔",
        icon: "browser",
      },
      {
        title: "نجی پروسیسنگ",
        body: "مہمان فائلیں عارضی نجی اسٹوریج استعمال کرتی ہیں اور عوامی گیلری میں نہیں جاتیں۔",
        icon: "privacy",
      },
      {
        title: "اصل فائلیں محفوظ",
        body: "آؤٹ پٹس نئی ری سائز شدہ کاپیاں ہیں۔ پروڈکشن بدلنے سے پہلے ماسٹرز آف لائن رکھیں۔",
        icon: "safe",
      },
    ],
  },
  workflows: {
    eyebrow: "عام ورک فلوز",
    title: "حقیقی پروڈکشن ٹیموں کے لیے",
    cards: [
      {
        title: "ای کامرس پروڈکٹس",
        body: "PDP اور لسٹنگ گرڈز میں مستقل کیٹلاگ لے آؤٹس کے لیے پروڈکٹ امیجز ری سائز کریں۔",
      },
      {
        title: "فوٹوگرافی گیلریز",
        body: "ڈیلیوری یا ویب شائع سے پہلے مشترکہ سائز میں کلائنٹ گیلریز تیار کریں۔",
      },
      {
        title: "بلاگ پبلشنگ",
        body: "پوسٹس بصری طور پر مستقل رہیں اس لیے اپ لوڈ سے پہلے آرٹیکل امیجز ری سائز کریں۔",
      },
      {
        title: "مارکیٹنگ مہمات",
        body: "ایک ری سائز پروفائل سے اشتہارات اور سوشل پلیسمنٹس کے امیج سیٹس بنائیں۔",
      },
      {
        title: "ایجنسی پروجیکٹس",
        body: "دہرائی ہوئی کلک پاتھ کے بغیر متعدد کلائنٹس کے لیے معیاری اثاثے دیں۔",
      },
      {
        title: "ویب سائٹ مائگریشن",
        body: "دوبارہ ڈیزائن شدہ سائٹ کے مماثل ڈسپلے باکسز کے لیے سینکڑوں موجودہ امیجز تیار کریں۔",
      },
    ],
  },
  performance: {
    title: "بیچ ری سائزنگ وقت کیوں بچاتی ہے",
    paragraphs: [
      "جب ہر اثاثے کو ایک ہی پکسل کنسٹرینٹ چاہیے تو دستی ری سائز وقت ضائع کرتا ہے۔",
      "بیچ پروسیسنگ مستقل ابعاد بناتی ہے اور ٹیموں کو ایک پروفائل پر متفق رکھتی ہے۔",
    ],
    points: [
      "دستی ری سائز دہرائی والی ایک ایک ایڈیٹ پر وقت ضائع کرتا ہے",
      "بیچ پروسیسنگ مستقل امیج ابعاد بناتی ہے",
      "ٹیمیں ایک سیشن میں سینکڑوں اثاثے تیار کر سکتی ہیں",
      "ZIP ڈاؤن لوڈز کلائنٹس اور CMS ٹولز تک ڈیلیوری آسان بناتے ہیں",
    ],
    note: "جتنی زیادہ امیجز آپ ایک ساتھ پروسیس کریں گے، انفرادی ایڈیٹنگ کے مقابلے میں اتنا ہی زیادہ وقت بچے گا۔",
  },
  tips: {
    eyebrow: "بہتر بیچز",
    title: "بہترین طریقے",
    items: [
      "جب مشترکہ پروفائل پورے سیٹ پر فٹ ہو تو مشابہ امیج اقسام ایک ساتھ اپ لوڈ کریں۔",
      "پروسیسنگ شروع کرنے سے پہلے بیچ کے لیے ایک ری سائز پروفائل چنیں۔",
      "پروڈکشن لائبریریز بدلنے سے پہلے اصل فائلیں بطور ماسٹر رکھیں۔",
      "جہاں ممکن ہو نمونہ آؤٹ پٹ دیکھیں، پھر پوری قطار چلائیں۔",
      "اگر وزن اب بھی پکسلز سے زیادہ اہم ہو تو بعد میں Bulk Compress استعمال کریں۔",
      "ڈاؤن لوڈ شدہ ZIP فولڈرز کو مہم، کلائنٹ یا صفحہ سیکشن کے مطابق منظم کریں۔",
    ],
  },
  faqHeading: "اکثر پوچھے گئے سوالات",
  faqs: [
    {
      q: "کیا آن لائن سینکڑوں امیجز بلک ری سائز ہو سکتی ہیں؟",
      a: "مہمان سیشنز اپ لوڈر کے اوپر دکھائی گئی فائل شمار اور روزانہ آپریشن حدود کی پیروی کرتی ہیں۔ بڑے کیٹلاگ کے لیے متعدد بیچز یا اعلیٰ حدود والا اکاؤنٹ درکار ہو سکتا ہے — خود ورک فلو ملٹی فائل ری سائز کے لیے بنا ہے، سنگل امیج کلکس کے لیے نہیں۔",
    },
    {
      q: "کیا Bulk Resize بیچ کی ہر امیج ایک سیٹنگ استعمال کرے گی؟",
      a: "ہاں۔ اس بیچ کی ہر قبول شدہ فائل پر ایک ہی ری سائز موڈ اور پکسل ویلیو لگتی ہے تاکہ آؤٹ پٹس مستقل رہیں۔",
    },
    {
      q: "کیا JPG، PNG اور WebP ایک ساتھ بلک ری سائز ہو سکتی ہیں؟",
      a: "ہاں۔ بلک ری سائزر ایک ہی انتخاب میں JPEG، PNG اور WebP قبول کرتا ہے۔ غیر سپورٹڈ اقسام اپ لوڈ سے پہلے مسترد ہوتی ہیں۔",
    },
    {
      q: "کیا Bulk Resize میں ZIP ڈاؤن لوڈ شامل ہے؟",
      a: "ہاں۔ پروسیسنگ مکمل ہونے پر کامیاب آؤٹ پٹس ایک ZIP میں ڈاؤن لوڈ کریں، یا مکمل شدہ امیجز الگ لیں۔",
    },
    {
      q: "کیا Bulk Resize اصل امیجز بدل دیتا ہے؟",
      a: "نہیں۔ ٹول ری سائز شدہ کاپیاں بناتا ہے۔ آپ کی ڈیوائس پر فائلیں جوں کی توں رہتی ہیں۔",
    },
    {
      q: "کیا Bulk Resize اپ لوڈز نجی ہیں؟",
      a: "مہمان امیجز نجی عارضی اسٹوریج استعمال کرتی ہیں اور ورک اسپیس میں دکھائی گئی برقرار رکھنے کی پالیسی کے مطابق خود بخود حذف ہو جاتی ہیں۔",
    },
    {
      q: "Bulk Resize پر کون سی مہمان حدود لاگو ہوتی ہیں؟",
      a: "فی بیچ زیادہ سے زیادہ فائلیں، کل بیچ بائٹس، فی فائل سائز اور روزانہ آپریشنز اپ لوڈر کے اوپر خلاصے میں دکھائی دیتی ہیں۔ حد لگنے پر انتخاب کم کریں یا سائن ان کریں۔",
    },
    {
      q: "Bulk Resize کی زیادہ سے زیادہ فائلوں کی تعداد کیا ہے؟",
      a: "زیادہ سے زیادہ فائل شمار حد خلاصے میں دکھائی گئی مہمان بلک حد ہے۔ اس سے زائد فائلیں اسی بیچ میں پروسیس نہیں ہوتیں۔",
    },
    {
      q: "Bulk Resize بیچ کی زیادہ سے زیادہ اپ لوڈ سائز کیا ہے؟",
      a: "بیچز حد خلاصے میں دکھائی گئی مہمان کل بیچ سائز یا فی فائل سائز سے زیادہ نہیں ہو سکتیں۔ بہت بڑے انتخاب پروسیسنگ سے پہلے روکے جاتے ہیں۔",
    },
    {
      q: "کیا شروع ہونے کے بعد Bulk Resize پروسیسنگ منسوخ ہو سکتی ہے؟",
      a: "بیچ چلنے کے بعد پہلے سے قطار میں موجود آئٹمز مہمان پروسیسنگ قواعد کے تحت جاری رہتے ہیں۔ سیٹ بدلنے کے لیے شروع سے پہلے انتخاب صاف کریں۔ ناکام یا چھوڑے گئے آئٹمز خلاصے میں رپورٹ ہوتے ہیں۔",
    },
    {
      q: "کیا Bulk Resize آسپیوٹ ریشو لاک رکھتا ہے؟",
      a: "ہاں — یہاں استعمال ہونے والے مہمان ری سائز راستوں میں چوڑائی، اونچائی اور فٹ-ان سائیڈ موڈز آسپیوٹ ریشو برقرار رکھتے ہیں اور ڈیفالٹ پر اپ اسکیل سے بچتے ہیں۔",
    },
    {
      q: "کیا سوشل میڈیا لے آؤٹس کے لیے بلک ری سائز ہو سکتا ہے؟",
      a: "آپ بہت سی امیجز کو ویب اور مارکیٹنگ لے آؤٹس کے لیے مشترکہ پکسل کنسٹرینٹ پر ری سائز کر سکتے ہیں۔ عین پلیٹ فارم ٹیمپلیٹ پیکس اس صفحے پر نہیں بنائے جاتے — وہ پکسلز سیٹ کریں جو منزل چاہتی ہے۔",
    },
  ],
  related: {
    eyebrow: "بلک اور ری سائز جاری رکھیں",
    title: "متعلقہ ٹولز",
    tools: [
      {
        href: "/bulk-compress",
        title: "Bulk Compress Images",
        body: "ابعاد درست ہونے کے بعد پوری بیچ ہلکی کریں۔",
      },
      {
        href: "/bulk-convert",
        title: "Bulk Convert Images",
        body: "ایک قطار میں بہت سی فائلیں JPG، PNG یا WebP میں تبدیل کریں۔",
      },
      {href: "/resize-jpg", title: "Resize JPG", body: "مارکیٹنگ سائز رہنمائی کے ساتھ سنگل امیج JPG ری سائز۔"},
      {href: "/resize-png", title: "Resize PNG", body: "گرافکس اور UI کے لیے سنگل امیج PNG ری سائز۔"},
      {href: "/resize-webp", title: "Resize WebP", body: "جدید ڈیلیوری کے لیے سنگل امیج WebP ری سائز۔"},
      {
        href: "/compress-image",
        title: "Compress Images",
        body: "جب بیچنگ درکار نہ ہو تو ایک امیج کا وزن کم کریں۔",
      },
    ],
  },
  cta: {
    title: "ایک اور بیچ ری سائز کریں؟",
    body: "امیجز کا ایک اور گروپ اپ لوڈ کریں یا بڑی بیچ حدود اور محفوظ پروجیکٹس کے لیے مفت اکاؤنٹ بنائیں۔",
    primaryLabel: "مزید امیجز ری سائز کریں",
    secondaryLabel: "مفت اکاؤنٹ بنائیں",
    secondaryHref: "/register",
  },
};

export function getBulkResizeCopy(locale: string): BulkResizeCopy {
  return locale === "ur" ? ur : en;
}

export type BulkResizeLocale = AppLocale;
