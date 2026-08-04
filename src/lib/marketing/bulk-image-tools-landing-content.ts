/**
 * Bulk Image Tools hub — compress, resize and convert batches; guest AI bulk OFF.
 */
import type {AppLocale} from "@/i18n/routing";

export type BulkImageToolsFaq = {q: string; a: string};

export type BulkImageToolsCopy = {
  metaTitle: string;
  metaDescription: string;
  h1: string;
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
    statsOutputTemplate: string;
  };
  tools: {
    eyebrow: string;
    title: string;
    intro: string;
    cards: {href: string; title: string; body: string; tool: "compress" | "resize" | "convert"}[];
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
      icon: "batch" | "compress" | "resize" | "convert" | "zip" | "privacy" | "browser" | "safe";
    }[];
  };
  howTo: {
    eyebrow: string;
    title: string;
    steps: {title: string; body: string}[];
    imageAlt: string;
  };
  limits: {
    eyebrow: string;
    title: string;
    items: string[];
    note: string;
  };
  tips: {
    eyebrow: string;
    title: string;
    items: string[];
  };
  faqHeading: string;
  faqs: BulkImageToolsFaq[];
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

const en: BulkImageToolsCopy = {
  metaTitle: "Bulk Image Tools Online Free | SEO Images",
  metaDescription:
    "Batch compress, resize and convert JPG, PNG and WebP images online. Guest bulk hub with ZIP download, honest file limits and no guest AI bulk processing.",
  h1: "Bulk Image Tools Online",
  breadcrumbCurrent: "Bulk Image Tools Online",
  hero: {
    badge: "BULK IMAGE TOOLS HUB",
    paragraph:
      "Compress, resize or convert multiple JPG, PNG and WebP images in one browser session. Pick a bulk tool, upload a batch within guest limits and download results together in a ZIP archive.",
    trust: ["Compress", "Resize", "Convert", "ZIP Download", "No Guest AI Bulk"],
    uploadCta: "Upload Multiple Images",
    learnMoreCta: "View Bulk Tools",
    heroImageAlt:
      "Bulk image tools hub with compress, resize and convert modes, batch queue and ZIP download",
  },
  upload: {
    heading: "Upload Multiple Images",
    supporting: "Drag and drop multiple JPG, PNG or WebP images or browse your device.",
    chooseLabel: "Choose Images",
    formatsHint: "JPG · PNG · WebP · Guest batch limits appear above the uploader",
    statsImagesTemplate: "{count} Images Ready",
    statsBytesTemplate: "{size} Total",
    statsReadyLabel: "Ready for Processing",
    statsOutputTemplate: "Output: {format}",
  },
  tools: {
    eyebrow: "THREE BULK MODES",
    title: "Choose a Bulk Tool",
    intro: "Switch modes in the workspace picker or open a dedicated landing for focused SEO content.",
    cards: [
      {href: "/bulk-compress", title: "Bulk Compress", body: "Apply one quality profile to every JPG, PNG or WebP file.", tool: "compress"},
      {href: "/bulk-resize", title: "Bulk Resize", body: "Set width, height or fit-inside dimensions across the whole batch.", tool: "resize"},
      {href: "/bulk-convert", title: "Bulk Convert", body: "Convert every file to JPEG, PNG or WebP in one queue.", tool: "convert"},
    ],
  },
  intro: {
    eyebrow: "BATCH IMAGE PROCESSING",
    title: "One Hub for Honest Guest Bulk Workflows",
    paragraphs: [
      "Marketing and ecommerce teams often need the same operation on dozens of files — smaller JPEGs for a catalog refresh, consistent widths for a blog migration or a uniform WebP delivery set. The bulk hub keeps those workflows in one place without pretending guest mode is unlimited.",
      "Guest bulk supports compress, resize and convert only. ZIP download is enabled; guest AI alt bulk is not. Limits such as five files and a 25 MB batch cap (shown live from the policy API above the workspace) keep processing predictable on shared infrastructure.",
      "Need a single image instead? Jump to the single-image compress, resize or convert tools linked below.",
    ],
  },
  benefits: {
    eyebrow: "WHY USE BULK TOOLS",
    title: "Batch Processing Without Surprise Claims",
    cards: [
      {title: "Three honest bulk modes", body: "Compress, resize and convert — the operations guest bulk actually exposes.", icon: "batch"},
      {title: "Bulk compress", body: "One quality slider applied to every accepted JPG, PNG or WebP upload.", icon: "compress"},
      {title: "Bulk resize", body: "Shared width, height or fit-inside settings for the entire queue.", icon: "resize"},
      {title: "Bulk convert", body: "Pick JPEG, PNG or WebP output once for the whole batch.", icon: "convert"},
      {title: "ZIP download", body: "Grab successful outputs together when the queue finishes.", icon: "zip"},
      {title: "Private temporary storage", body: "Batch files expire on the guest session countdown.", icon: "privacy"},
      {title: "Browser-based queue", body: "No desktop batch utilities required for quick fixes.", icon: "browser"},
      {title: "No guest AI bulk", body: "AI alt bulk stays off in guest mode — only compress, resize and convert run here.", icon: "safe"},
    ],
  },
  howTo: {
    eyebrow: "FOUR CLEAR STEPS",
    title: "How Bulk Image Tools Work",
    steps: [
      {title: "Pick a bulk tool", body: "Choose compress, resize or convert in the workspace picker — or arrive via ?tool=convert in the URL."},
      {title: "Upload a batch", body: "Add JPG, PNG or WebP files within the live guest file count and byte limits."},
      {title: "Set shared options", body: "Configure quality, dimensions or output format once for the entire queue."},
      {title: "Download ZIP", body: "Process the batch and download successful outputs together.",},
    ],
    imageAlt: "Bulk tools workflow: pick mode, upload batch, set options and download ZIP",
  },
  limits: {
    eyebrow: "GUEST LIMITS",
    title: "What Guest Bulk Actually Includes",
    items: [
      "Up to five files per guest batch by default — live policy may show authenticated elevation when signed in.",
      "Roughly 25 MB total batch size cap for guest uploads unless policy reports otherwise above the workspace.",
      "ZIP archives enabled for completed batches within guest max ZIP size.",
      "Sequential processing — one active guest bulk job at a time to respect shared job limits.",
      "Guest AI alt bulk is disabled — only compress, resize and convert appear in the picker.",
      "Crop, geotag, metadata viewer and metadata editor are not bulk guest tools.",
    ],
    note: "Exact numbers always come from the live policy bar above the uploader — never from marketing copy alone.",
  },
  tips: {
    eyebrow: "PRACTICAL TIPS",
    title: "Bulk Processing Tips",
    items: [
      "Open /bulk-image-tools?tool=convert to land directly in convert mode.",
      "Use dedicated /bulk-compress, /bulk-resize and /bulk-convert pages when you want focused guidance.",
      "Prepare filenames before upload — duplicate names get neutralized inside the ZIP.",
      "Large libraries need an account — guest batches stay intentionally small.",
      "Single urgent file? Use compress-image, resize-image or convert-image instead.",
      "Download the ZIP before the guest countdown expires.",
    ],
  },
  faqHeading: "Bulk Image Tools FAQ",
  faqs: [
    {q: "Which bulk tools are available to guests?", a: "Compress, resize and convert for JPG, PNG and WebP batches. Guest AI alt bulk, crop, geotag and metadata tools are not in the bulk picker."},
    {q: "How many files can I upload?", a: "Guest policy defaults to five files and about 25 MB per batch. The live limits above the workspace are authoritative."},
    {q: "Can I download everything at once?", a: "Yes. Completed batches offer a ZIP download when zipEnabled is true in guest policy."},
    {q: "Does bulk AI alt text run here?", a: "No. bulkAiGuestAllowed is false — marketing copy and the picker both omit guest AI bulk."},
    {q: "Can I deep-link to a specific bulk tool?", a: "Yes. Use /bulk-image-tools?tool=compress, ?tool=resize or ?tool=convert."},
    {q: "What formats are accepted?", a: "JPG, PNG and WebP still images within per-file and batch byte limits."},
    {q: "Are bulk uploads private?", a: "Yes. Temporary private storage with automatic deletion on the session countdown."},
    {q: "How is this different from dashboard bulk?", a: "This hub is guest/public bulk with short retention. Dashboard projects add persistence, higher limits and separate AI workflows."},
  ],
  related: {
    eyebrow: "RELATED TOOLS",
    title: "Single-Image and SEO Tools",
    tools: [
      {href: "/bulk-compress", title: "Bulk Compress", body: "Dedicated landing for batch compression workflows."},
      {href: "/bulk-resize", title: "Bulk Resize", body: "Dedicated landing for shared dimension presets."},
      {href: "/bulk-convert", title: "Bulk Convert", body: "Dedicated landing for uniform format conversion."},
      {href: "/compress-image", title: "Compress Image", body: "One-file compression when bulk is overkill."},
      {href: "/resize-image", title: "Resize Image", body: "Single-image dimensions without a batch queue."},
      {href: "/convert-image", title: "Convert Image", body: "One-image format conversion hub."},
    ],
  },
  cta: {
    title: "Ready to process a batch of images?",
    body: "Upload multiple files now or create a free account for higher batch limits and saved projects.",
    primaryLabel: "Upload Multiple Images",
    secondaryLabel: "Create Free Account",
    secondaryHref: "/register",
  },
};

const ur: BulkImageToolsCopy = {
  metaTitle: "آن لائن Bulk Image Tools مفت | SEO Images",
  metaDescription:
    "JPG, PNG اور WebP کی batch compress، resize اور convert آن لائن۔ ZIP download، ایماندار guest limits، guest AI bulk نہیں۔",
  h1: "آن لائن Bulk Image Tools",
  breadcrumbCurrent: "آن لائن Bulk Image Tools",
  hero: {
    badge: "BULK IMAGE TOOLS HUB",
    paragraph:
      "ایک browser session میں متعدد JPG, PNG اور WebP compress، resize یا convert کریں۔ bulk tool منتخب کریں، guest limits میں batch اپلوڈ کریں، ZIP میں results ڈاؤن لوڈ کریں۔",
    trust: ["Compress", "Resize", "Convert", "ZIP Download", "No Guest AI Bulk"],
    uploadCta: "متعدد تصاویر اپلوڈ کریں",
    learnMoreCta: "Bulk tools دیکھیں",
    heroImageAlt: "bulk hub compress, resize, convert modes، queue اور ZIP download",
  },
  upload: {
    heading: "متعدد تصاویر اپلوڈ کریں",
    supporting: "متعدد JPG, PNG یا WebP ڈریگ اینڈ ڈراپ کریں یا براؤز کریں۔",
    chooseLabel: "تصاویر منتخب کریں",
    formatsHint: "JPG · PNG · WebP · guest batch limits اپلوڈر کے اوپر",
    statsImagesTemplate: "{count} تصاویر تیار",
    statsBytesTemplate: "{size} کل",
    statsReadyLabel: "پروسیسنگ کے لیے تیار",
    statsOutputTemplate: "آؤٹ پut: {format}",
  },
  tools: {
    eyebrow: "تین bulk modes",
    title: "Bulk tool منتخب کریں",
    intro: "workspace picker میں switch کریں یا dedicated landing کھولیں۔",
    cards: [
      {href: "/bulk-compress", title: "Bulk Compress", body: "ہر JPG, PNG یا WebP پر ایک quality profile۔", tool: "compress"},
      {href: "/bulk-resize", title: "Bulk Resize", body: "پوری batch پر width, height یا fit-inside۔", tool: "resize"},
      {href: "/bulk-convert", title: "Bulk Convert", body: "ہر فائل JPEG, PNG یا WebP میں convert۔", tool: "convert"},
    ],
  },
  intro: {
    eyebrow: "BATCH PROCESSING",
    title: "ایماندار guest bulk workflows کے لیے ایک hub",
    paragraphs: [
      "مارکیٹنگ اور ecommerce ٹیموں کو اکثر درجنوں فائلوں پر ایک جیسا operation چاہیے۔ bulk hub ان workflows کو ایک جگہ رکھتا ہے بغیر unlimited دعوے کے۔",
      "Guest bulk صرف compress, resize, convert سپورٹ کرتا ہے۔ ZIP enabled؛ guest AI alt bulk نہیں۔ پانچ فائلیں اور ~25 MB batch cap (live policy) shared infrastructure predictable رکھتے ہیں۔",
      "سINGLE image؟ نیچے linked single-image tools استعمال کریں۔",
    ],
  },
  benefits: {
    eyebrow: "bulk tools کیوں",
    title: "Surprise claims کے بغیر batch processing",
    cards: [
      {title: "تین bulk modes", body: "compress, resize, convert — guest bulk واقعی expose کرتا ہے۔", icon: "batch"},
      {title: "Bulk compress", body: "ہر accepted upload پر ایک quality slider۔", icon: "compress"},
      {title: "Bulk resize", body: "shared width, height یا fit-inside۔", icon: "resize"},
      {title: "Bulk convert", body: "پوری batch کے لیے ایک output format۔", icon: "convert"},
      {title: "ZIP download", body: "queue مکمل پر outputs اکٹھے۔", icon: "zip"},
      {title: "نجی storage", body: "guest countdown پر expire۔", icon: "privacy"},
      {title: "براؤزر queue", body: "Desktop batch utilities کی ضرورت نہیں۔", icon: "browser"},
      {title: "No guest AI bulk", body: "AI alt bulk off — صرف compress, resize, convert۔", icon: "safe"},
    ],
  },
  howTo: {
    eyebrow: "چار مراحل",
    title: "Bulk image tools کیسے کام کرتے ہیں",
    steps: [
      {title: "bulk tool منتخب", body: "picker میں compress, resize یا convert — یا ?tool=convert URL۔"},
      {title: "batch اپلوڈ", body: "live guest file count اور byte limits میں JPG/PNG/WebP۔"},
      {title: "shared options", body: "quality, dimensions یا output format ایک بار پوری queue کے لیے۔"},
      {title: "ZIP download", body: "batch process کریں اور successful outputs اکٹھے ڈاؤن لوڈ۔"},
    ],
    imageAlt: "bulk workflow: mode, upload, options, ZIP",
  },
  limits: {
    eyebrow: "GUEST LIMITS",
    title: "Guest bulk واقعی کیا شامل کرتا ہے",
    items: [
      "default پانچ فائلیں per guest batch — signed in elevation live policy دکھا سکتی ہے۔",
      "~25 MB total batch cap جب تک policy اور نہ کہے۔",
      "ZIP archives completed batches کے لیے enabled۔",
      "Sequential processing — ایک active guest bulk job۔",
      "Guest AI alt bulk disabled — picker میں صرف compress, resize, convert۔",
      "Crop, geotag, metadata viewer/editor bulk guest tools نہیں۔",
    ],
    note: "درست numbers ہمیشہ workspace کے اوپر live policy bar سے — marketing copy alone سے نہیں۔",
  },
  tips: {
    eyebrow: "عملی تجاویز",
    title: "Bulk processing ٹپس",
    items: [
      "/bulk-image-tools?tool=convert سے convert mode۔",
      "focused guidance کے لیے /bulk-compress, /bulk-resize, /bulk-convert۔",
      "اپلوڈ سے پہلے filenames تیار — duplicates ZIP میں neutralize۔",
      "بڑی libraries account چاہتی ہیں — guest batches چھوٹے رہتے ہیں۔",
      "فوری single file؟ compress-image, resize-image, convert-image۔",
      "guest countdown سے پہلے ZIP download۔",
    ],
  },
  faqHeading: "Bulk Image Tools FAQ",
  faqs: [
    {q: "guests کے لیے کون سے bulk tools؟", a: "JPG, PNG, WebP compress, resize, convert۔ AI alt bulk, crop, geotag, metadata picker میں نہیں۔"},
    {q: "کتنی فائلیں؟", a: "default پانچ فائلیں ~25 MB batch — workspace کے اوپر live limits authoritative۔"},
    {q: "سب ایک ساتھ download؟", a: "ہاں — ZIP جب zipEnabled true۔"},
    {q: "bulk AI alt text؟", a: "نہیں — bulkAiGuestAllowed false۔"},
    {q: "specific tool deep-link؟", a: "ہاں — ?tool=compress, resize, convert۔"},
    {q: "formats؟", a: "JPG, PNG, WebP per-file اور batch byte limits میں۔"},
    {q: "bulk uploads نجی؟", a: "ہاں — عارضی storage، countdown پر حذف۔"},
    {q: "dashboard bulk سے فرق؟", a: "یہ hub guest/public bulk short retention؛ dashboard persistence اور higher limits۔"},
  ],
  related: {
    eyebrow: "متعلقہ ٹولز",
    title: "Single-image اور SEO tools",
    tools: [
      {href: "/bulk-compress", title: "Bulk Compress", body: "batch compression dedicated landing۔"},
      {href: "/bulk-resize", title: "Bulk Resize", body: "shared dimensions dedicated landing۔"},
      {href: "/bulk-convert", title: "Bulk Convert", body: "uniform conversion dedicated landing۔"},
      {href: "/compress-image", title: "Compress Image", body: "single-file compression۔"},
      {href: "/resize-image", title: "Resize Image", body: "بغیر batch queue۔"},
      {href: "/convert-image", title: "Convert Image", body: "single-image conversion hub۔"},
    ],
  },
  cta: {
    title: "تصاویر کی batch process کے لیے تیار؟",
    body: "ابھی متعدد فائلیں اپلوڈ کریں یا higher limits کے لیے مفت account۔",
    primaryLabel: "متعدد تصاویر اپلوڈ کریں",
    secondaryLabel: "مفت اکاؤنٹ بنائیں",
    secondaryHref: "/register",
  },
};

export function getBulkImageToolsCopy(locale: string): BulkImageToolsCopy {
  return locale === "ur" ? ur : en;
}

export function isBulkImageToolsLocale(locale: string): locale is AppLocale {
  return locale === "en" || locale === "ur";
}
