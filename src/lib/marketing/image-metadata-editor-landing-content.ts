/**
 * Image Metadata Editor hub — draft, validate and export sidecars; no embedded EXIF write.
 */
import type {AppLocale} from "@/i18n/routing";

export type ImageMetadataEditorFaq = {q: string; a: string};

export type ImageMetadataEditorCopy = {
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
      icon: "draft" | "validate" | "export" | "html" | "rename" | "privacy" | "browser" | "safe";
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
  faqs: ImageMetadataEditorFaq[];
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

const en: ImageMetadataEditorCopy = {
  metaTitle: "Image Metadata Editor Online Free | SEO Images",
  metaDescription:
    "Draft alt text, titles and SEO metadata for JPG, PNG and WebP images. Validate field lengths and export TXT, JSON, CSV or HTML snippets — no embedded EXIF write in guest mode.",
  h1: "Image Metadata Editor Online",
  breadcrumbCurrent: "Image Metadata Editor Online",
  hero: {
    badge: "SEO METADATA EDITOR",
    paragraph:
      "Draft alt text, titles, captions and keyword lists for JPG, PNG and WebP images in your browser. Validate SEO-friendly lengths, export sidecar files and download a renamed copy — without writing EXIF back into the image.",
    trust: ["JPG", "PNG", "WebP", "Sidecar Export", "No EXIF Write"],
    uploadCta: "Edit Metadata",
    heroImageAlt:
      "Browser metadata editor with alt text fields, validation checklist and export buttons for TXT, JSON and HTML snippets",
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
    formatsHint: "JPG · PNG · WebP · Draft and export sidecars — embedded EXIF/IPTC write is not supported here",
    features: [
      {title: "SEO field draft", body: "Alt text, title, caption, descriptions, filename and keywords with length guidance."},
      {title: "Validation checklist", body: "See recommendations and blocking issues before you export or rename."},
      {title: "Sidecar exports", body: "Download TXT, JSON, CSV or HTML figure snippets separate from the image bytes."},
      {title: "Renamed download", body: "Optional filename-only copy — does not embed metadata into EXIF."},
    ],
  },
  intro: {
    eyebrow: "DRAFT SEO METADATA",
    title: "Prepare Alt Text and SEO Fields Without Rewriting EXIF",
    paragraphs: [
      "Publishing teams need more than pixels — they need alt text, titles, captions and keyword lists that fit CMS fields and accessibility guidelines. The guest Metadata Editor lets you draft those values against a real uploaded image, run validation, and export portable sidecar files your workflow can ingest.",
      "This engine does not write EXIF or IPTC tags into the image container. Exports are sidecar TXT, JSON, CSV and HTML snippets, plus an optional renamed download that changes the filename only. For reading existing camera EXIF, use the Metadata Viewer; for JPEG GPS embeds, use Geotag Images.",
      "AI import appears only when a completed guest AI alt job exists on the same upload in your session — there is no standalone live AI generation on this landing.",
    ],
  },
  benefits: {
    eyebrow: "WHY USE THIS EDITOR",
    title: "Honest Metadata Drafting for Web Teams",
    cards: [
      {title: "Structured SEO draft", body: "Alt, title, caption, short and long descriptions with field max lengths enforced in UI.", icon: "draft"},
      {title: "Live validation", body: "Checklist highlights recommendations and blocking issues before export.", icon: "validate"},
      {title: "Sidecar exports", body: "TXT, JSON and CSV files you can attach to DAM or CMS imports.", icon: "export"},
      {title: "HTML snippets", body: "Copy figure and img markup with escaped attributes for quick paste into templates.", icon: "html"},
      {title: "Renamed download", body: "Download a copy with a sanitized filename — not an EXIF metadata embed.", icon: "rename"},
      {title: "Private temporary storage", body: "Uploads stay in short-lived guest storage with automatic deletion.", icon: "privacy"},
      {title: "Browser workflow", body: "Draft metadata without desktop IPTC utilities.", icon: "browser"},
      {title: "No hidden EXIF write", body: "Guest mode stays honest — metadata exports are separate from image bytes.", icon: "safe"},
    ],
  },
  howTo: {
    eyebrow: "FOUR CLEAR STEPS",
    title: "How to Draft and Export Image Metadata",
    steps: [
      {title: "Upload image", body: "Choose JPG, PNG or WebP within guest limits. Optionally import from a prior AI alt job on the same upload."},
      {title: "Draft fields", body: "Fill alt text, title, caption, descriptions, filename and keywords. Mark decorative images when appropriate."},
      {title: "Review validation", body: "Fix blocking issues and note recommendations before exporting."},
      {title: "Export or rename", body: "Download sidecar TXT/JSON/CSV/HTML or a renamed image copy — no EXIF embed occurs."},
    ],
    imageAlt: "Four-step metadata editor: upload, draft fields, validate and export sidecar files",
  },
  useCases: {
    eyebrow: "COMMON USE CASES",
    title: "When Teams Draft Metadata in the Browser",
    cards: [
      {title: "CMS handoff", body: "Export JSON or CSV sidecars for content ops to import alongside image assets."},
      {title: "Accessibility prep", body: "Draft alt text with recommended length guidance before publish deadlines."},
      {title: "Agency review", body: "Share TXT summaries with clients without sending raw EXIF dumps."},
      {title: "Filename hygiene", body: "Download a renamed copy with a sanitized slug while keeping masters untouched."},
    ],
  },
  tips: {
    eyebrow: "PRACTICAL TIPS",
    title: "Metadata Editor Tips",
    items: [
      "Guest mode does not embed drafts into EXIF — plan on sidecar exports or CMS paste for delivery.",
      "AI import only loads results from an existing completed guest AI alt job on the same upload.",
      "Decorative images should use the decorative flag instead of placeholder alt spam.",
      "HTML snippet exports escape attributes — review before pasting into rich text editors.",
      "Renamed download changes filename only; open the Metadata Viewer if you need to inspect camera EXIF.",
      "Save exports before the guest countdown expires — drafts live in temporary session storage.",
    ],
  },
  faqHeading: "Metadata Editor FAQ",
  faqs: [
    {q: "Does this editor write EXIF or IPTC into my image?", a: "No. Guest metadata.edit prepares drafts and sidecar exports. It does not embed tags into JPG, PNG or WebP bytes."},
    {q: "What can I export?", a: "TXT, JSON, CSV and HTML snippet files, plus an optional renamed image download with a sanitized filename."},
    {q: "Which formats are supported?", a: "JPG, PNG and WebP uploads within guest limits shown above the workspace."},
    {q: "How does AI import work?", a: "If you already ran guest AI alt text on the same upload in this session, you can import that result into the draft. There is no standalone AI generation on this page."},
    {q: "What is renamed download?", a: "A copy of the image file with a sanitized filename based on your draft — not an EXIF metadata write."},
    {q: "Can I validate alt text length?", a: "Yes. The editor shows recommended and hard maximums with a validation checklist."},
    {q: "Are guest uploads private?", a: "Yes. Temporary private storage with automatic deletion on the countdown shown above the workspace."},
    {q: "How is this different from the Metadata Viewer?", a: "The viewer reads existing EXIF read-only. The editor drafts new SEO fields and exports sidecars without rewriting the source file."},
  ],
  related: {
    eyebrow: "RELATED TOOLS",
    title: "Complete Your Image SEO Workflow",
    tools: [
      {href: "/image-metadata", title: "Metadata Viewer", body: "Inspect existing EXIF, dimensions and GPS read-only."},
      {href: "/geotag-image", title: "Geotag Images", body: "Write GPS into JPEG when embedded location tags are required."},
      {href: "/compress-image", title: "Image Compressor", body: "Optimize file weight after metadata is drafted."},
      {href: "/convert-image", title: "Image Converter", body: "Switch delivery format once SEO fields are ready."},
      {href: "/resize-image", title: "Image Resizer", body: "Set publish dimensions alongside alt text prep."},
      {href: "/bulk-image-tools", title: "Bulk Image Tools", body: "Batch compress, resize or convert image libraries."},
    ],
  },
  cta: {
    title: "Ready to draft image SEO metadata?",
    body: "Upload an image now or create a free account for higher limits, saved projects and dashboard AI workflows.",
    primaryLabel: "Edit Metadata",
    secondaryLabel: "Create Free Account",
    secondaryHref: "/register",
  },
};

const ur: ImageMetadataEditorCopy = {
  metaTitle: "آن لائن Image Metadata Editor مفت | SEO Images",
  metaDescription:
    "JPG, PNG اور WebP کے لیے alt text، titles اور SEO metadata draft کریں۔ TXT, JSON, CSV یا HTML export — guest mode میں embedded EXIF write نہیں۔",
  h1: "آن لائن Image Metadata Editor",
  breadcrumbCurrent: "آن لائن Image Metadata Editor",
  hero: {
    badge: "SEO METADATA EDITOR",
    paragraph:
      "JPG, PNG اور WebP کے لیے alt text، titles، captions اور keywords براؤزر میں draft کریں۔ SEO lengths validate کریں، sidecar files export کریں — image میں EXIF write نہیں ہوتا۔",
    trust: ["JPG", "PNG", "WebP", "Sidecar Export", "No EXIF Write"],
    uploadCta: "میٹا ڈیٹا ایڈٹ کریں",
    heroImageAlt: "metadata editor alt text فیلڈز، validation checklist اور export buttons",
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
    formatsHint: "JPG · PNG · WebP · Draft و sidecar export — embedded EXIF/IPTC write سپورٹ نہیں",
    features: [
      {title: "SEO field draft", body: "Alt, title, caption, descriptions, filename, keywords — length guidance کے ساتھ۔"},
      {title: "Validation checklist", body: "export یا rename سے پہلے recommendations اور blocking issues۔"},
      {title: "Sidecar exports", body: "TXT, JSON, CSV, HTML — image bytes سے الگ۔"},
      {title: "Renamed download", body: "اختیاری filename-only copy — EXIF embed نہیں۔"},
    ],
  },
  intro: {
    eyebrow: "SEO METADATA DRAFT",
    title: "EXIF rewrite کے بغیر alt text اور SEO fields تیار کریں",
    paragraphs: [
      "شائع کرنے والی ٹیموں کو alt text، titles، captions اور keywords چاہیے جو CMS اور accessibility guidelines میں فٹ ہوں۔ Guest Metadata Editor real upload پر draft، validation اور portable sidecar export دیتا ہے۔",
      "یہ engine EXIF/IPTC image container میں نہیں لکھتا۔ Exports sidecar TXT, JSON, CSV, HTML ہیں، plus optional renamed download (صرف filename)۔ Existing camera EXIF کے لیے Metadata Viewer؛ JPEG GPS کے لیے Geotag Images۔",
      "AI import صرف تب ظاہر ہوتا ہے جب same upload پر session میں completed guest AI alt job موجود ہو — اس landing پر standalone live AI generation نہیں۔",
    ],
  },
  benefits: {
    eyebrow: "یہ editor کیوں",
    title: "ویب ٹیموں کے لیے ایماندار metadata drafting",
    cards: [
      {title: "Structured SEO draft", body: "Alt, title, caption, descriptions — UI max lengths enforce۔", icon: "draft"},
      {title: "Live validation", body: "checklist recommendations اور blocking issues highlight کرتی ہے۔", icon: "validate"},
      {title: "Sidecar exports", body: "TXT, JSON, CSV DAM/CMS import کے لیے۔", icon: "export"},
      {title: "HTML snippets", body: "figure/img markup escaped attributes کے ساتھ۔", icon: "html"},
      {title: "Renamed download", body: "sanitized filename — EXIF embed نہیں۔", icon: "rename"},
      {title: "نجی storage", body: "عارضی guest storage۔", icon: "privacy"},
      {title: "براؤزر workflow", body: "Desktop IPTC utilities کے بغیر۔", icon: "browser"},
      {title: "No EXIF write", body: "exports image bytes سے الگ رہتے ہیں۔", icon: "safe"},
    ],
  },
  howTo: {
    eyebrow: "چار واضح مراحل",
    title: "metadata draft اور export کیسے کریں",
    steps: [
      {title: "تصویر اپلوڈ", body: "guest limits میں JPG/PNG/WebP؛ optional AI alt import same upload سے۔"},
      {title: "fields draft", body: "alt, title, caption, descriptions, filename, keywords؛ decorative flag جب مناسب ہو۔"},
      {title: "validation", body: "blocking issues fix؛ recommendations نوٹ کریں۔"},
      {title: "export یا rename", body: "sidecar TXT/JSON/CSV/HTML یا renamed copy — EXIF embed نہیں۔"},
    ],
    imageAlt: "چار مرحلہ editor: upload, draft, validate, export",
  },
  useCases: {
    eyebrow: "عام استعمال",
    title: "براؤزر میں metadata draft کب",
    cards: [
      {title: "CMS handoff", body: "JSON/CSV sidecars content ops کے لیے۔"},
      {title: "Accessibility prep", body: "recommended alt length guidance۔"},
      {title: "Agency review", body: "TXT summaries clients کو — raw EXIF dumps نہیں۔"},
      {title: "Filename hygiene", body: "sanitized slug renamed download۔"},
    ],
  },
  tips: {
    eyebrow: "عملی تجاویز",
    title: "Metadata editor ٹپس",
    items: [
      "Guest mode drafts EXIF میں embed نہیں — sidecar یا CMS paste plan کریں۔",
      "AI import صرف existing completed guest AI alt job same upload پر۔",
      "Decorative images decorative flag استعمال کریں۔",
      "HTML snippets escaped — rich text editors میں paste سے پہلے review۔",
      "Renamed download صرف filename؛ camera EXIF کے لیے Metadata Viewer۔",
      "کاؤنٹ ڈاؤن سے پہلے exports save کریں۔",
    ],
  },
  faqHeading: "Metadata Editor FAQ",
  faqs: [
    {q: "کیا EXIF/IPTC image میں لکھتا ہے؟", a: "نہیں۔ drafts اور sidecar exports — JPG/PNG/WebP bytes میں embed نہیں۔"},
    {q: "کیا export؟", a: "TXT, JSON, CSV, HTML snippets، optional renamed download۔"},
    {q: "formats؟", a: "guest limits میں JPG, PNG, WebP۔"},
    {q: "AI import؟", a: "same upload پر prior completed guest AI alt job سے؛ standalone AI یہاں نہیں۔"},
    {q: "renamed download؟", a: "sanitized filename copy — EXIF write نہیں۔"},
    {q: "alt length validate؟", a: "ہاں — recommended اور hard max checklist۔"},
    {q: "گیسٹ نجی؟", a: "ہاں — عارضی storage، کاؤنٹ ڈاؤن پر حذف۔"},
    {q: "Viewer سے فرق؟", a: "Viewer read-only EXIF؛ Editor SEO fields draft + sidecars، source rewrite نہیں۔"},
  ],
  related: {
    eyebrow: "متعلقہ ٹولز",
    title: "Image SEO workflow مکمل کریں",
    tools: [
      {href: "/image-metadata", title: "Metadata Viewer", body: "EXIF, dimensions, GPS read-only۔"},
      {href: "/geotag-image", title: "Geotag Images", body: "JPEG میں embedded GPS۔"},
      {href: "/compress-image", title: "Image Compressor", body: "metadata draft کے بعد optimize۔"},
      {href: "/convert-image", title: "Image Converter", body: "delivery format switch۔"},
      {href: "/resize-image", title: "Image Resizer", body: "publish dimensions۔"},
      {href: "/bulk-image-tools", title: "Bulk Image Tools", body: "batch compress, resize, convert۔"},
    ],
  },
  cta: {
    title: "Image SEO metadata draft کے لیے تیار؟",
    body: "ابھی اپلوڈ کریں یا dashboard AI workflows کے لیے مفت اکاؤنٹ بنائیں۔",
    primaryLabel: "میٹا ڈیٹا ایڈٹ کریں",
    secondaryLabel: "مفت اکاؤنٹ بنائیں",
    secondaryHref: "/register",
  },
};

export function getImageMetadataEditorCopy(locale: string): ImageMetadataEditorCopy {
  return locale === "ur" ? ur : en;
}

export function isImageMetadataEditorLocale(locale: string): locale is AppLocale {
  return locale === "en" || locale === "ur";
}
