/**
 * Parallel short copy for format SEO + bulk SEO landings.
 * Same ToolLandingShell sections as Compress mockup — no extra blocks.
 */
import {loadSeoShellFromCatalog} from "@/i18n/content/load-catalog";
import type {ToolLandingCopy} from "@/lib/marketing/tool-landing-copy";

const TRUST: ToolLandingCopy["trust"] = [
  "No account required",
  "Private & secure processing",
  "Auto delete within 1 hour",
];

function noteForFormat(formatLabel: string): string {
  return `Supported format: ${formatLabel} • Maximum file size: 10 MB. Your files are private and automatically deleted within one hour.`;
}

function noteForConvert(from: string, to: string): string {
  return `Supported: ${from} → ${to} • Maximum file size: 10 MB. Your files are private and automatically deleted within one hour.`;
}

const BULK_NOTE =
  "Supported formats: JPG, PNG, WebP • Guest batch limits apply. Your files are private and automatically deleted within one hour.";

function how(verb: string): ToolLandingCopy["howSteps"] {
  return [
    {title: "Upload Your Image"},
    {title: verb},
    {title: "Preview Result"},
    {title: "Download"},
  ];
}

function benefits(action: string): ToolLandingCopy["benefitCards"] {
  return [
    {
      title: "Your Privacy Matters",
      body: `Your images are processed privately for ${action} and deleted automatically within one hour.`,
      kind: "privacy",
    },
    {
      title: "Fast & Efficient",
      body: "Cloud-backed guest processing delivers results in seconds without installing software.",
      kind: "speed",
    },
  ];
}

function compressCopy(
  path: string,
  format: "JPG" | "PNG" | "WebP",
  metaTitle: string,
  metaDescription: string,
): ToolLandingCopy {
  return {
    path,
    metaTitle,
    metaDescription,
    breadcrumbCurrent: `Compress ${format} Online`,
    h1: `Compress ${format} Online`,
    subtitle: `Reduce ${format} file size without losing quality`,
    paragraph: `Compress ${format} images in seconds. Free online tool — no account required.`,
    trust: TRUST,
    workspaceNote: noteForFormat(format),
    featuresHeading: "Smaller Size, Same Great Quality",
    features: [
      {title: "Smart Compression", body: `Intelligent compression tuned for ${format} images.`, tone: "blue"},
      {title: "Up to 80% Smaller", body: "Dramatically reduce file size for faster uploads and page loads.", tone: "green"},
      {title: "Perfect for Web", body: "Optimize images for websites, blogs, and product pages.", tone: "purple"},
      {title: "Quality You Can Trust", body: "Preview before download so quality stays under your control.", tone: "orange"},
    ],
    howHeading: "How It Works",
    howSteps: how("Compress"),
    benefitCards: benefits("compression"),
    faqHeading: "Frequently Asked Questions",
    faqs: [
      {
        q: `How does ${format} compression work?`,
        a: `The tool re-encodes your ${format} with settings that reduce file size while keeping the result visually usable.`,
      },
      {q: "Is there a file size limit?", a: `Guest uploads support ${format} up to 10 MB.`},
      {
        q: "Will compressing reduce image quality?",
        a: "Stronger presets can soften fine detail. Choose a lighter preset when looks matter most, and always preview.",
      },
      {q: "Do I need an account?", a: "No. Guest compression works without signing in."},
      {
        q: "Are my images stored permanently?",
        a: "No. Guest uploads and results are deleted automatically within one hour.",
      },
    ],
  };
}

function resizeCopy(
  path: string,
  format: "JPG" | "PNG" | "WebP",
  metaTitle: string,
  metaDescription: string,
): ToolLandingCopy {
  return {
    path,
    metaTitle,
    metaDescription,
    breadcrumbCurrent: `Resize ${format} Online`,
    h1: `Resize ${format} Online`,
    subtitle: `Change ${format} dimensions for web and social`,
    paragraph: `Resize ${format} images in seconds. Free online tool — no account required.`,
    trust: TRUST,
    workspaceNote: noteForFormat(format),
    featuresHeading: "Precise Control, Clean Results",
    features: [
      {title: "Exact Dimensions", body: "Enter width and height that match your layout needs.", tone: "blue"},
      {title: "Fit Inside", body: "Scale images into a box while preserving aspect ratio.", tone: "green"},
      {title: "No Unwanted Upscale", body: "Guardrails help avoid stretching small sources.", tone: "purple"},
      {title: "Web Ready", body: `Prepare consistent ${format} sizes for pages and grids.`, tone: "orange"},
    ],
    howHeading: "How It Works",
    howSteps: how("Resize"),
    benefitCards: benefits("resizing"),
    faqHeading: "Frequently Asked Questions",
    faqs: [
      {q: "Can I keep the aspect ratio?", a: "Yes. Use fit-inside or linked dimensions so images scale cleanly."},
      {q: "Is there a file size limit?", a: `Guest uploads support ${format} up to 10 MB.`},
      {q: "Will resizing enlarge my image?", a: "By default, workflows avoid unwanted enlargement."},
      {q: "Do I need an account?", a: "No. Resize as a guest. Files expire within one hour."},
      {q: "Are my images stored permanently?", a: "No. Guest uploads and results expire within one hour."},
    ],
  };
}

function cropCopy(
  path: string,
  format: "JPG" | "PNG" | "WebP",
  metaTitle: string,
  metaDescription: string,
): ToolLandingCopy {
  return {
    path,
    metaTitle,
    metaDescription,
    breadcrumbCurrent: `Crop ${format} Online`,
    h1: `Crop ${format} Online`,
    subtitle: `Keep only the part of your ${format} that matters`,
    paragraph: `Crop ${format} images in seconds. Free online tool — no account required.`,
    trust: TRUST,
    workspaceNote: noteForFormat(format),
    featuresHeading: "Crop With Confidence",
    features: [
      {title: "Free Crop", body: "Select any area of the image and keep exactly that region.", tone: "blue"},
      {title: "Fixed Ratios", body: "Use common aspect ratios for consistent layouts.", tone: "green"},
      {title: "Orientation Safe", body: "Crop math respects oriented dimensions after upload.", tone: "purple"},
      {title: "Same Format Out", body: `Download a cropped ${format} result.`, tone: "orange"},
    ],
    howHeading: "How It Works",
    howSteps: how("Crop"),
    benefitCards: benefits("cropping"),
    faqHeading: "Frequently Asked Questions",
    faqs: [
      {q: "Can I crop to a square?", a: "Yes. Choose a 1:1 ratio or draw a free crop."},
      {q: "Is there a file size limit?", a: `Guest uploads support ${format} up to 10 MB.`},
      {q: "Is the original overwritten?", a: "No. Processing creates a new cropped result."},
      {q: "Do I need an account?", a: "No. Crop as a guest. Files expire within one hour."},
      {q: "Are my images stored permanently?", a: "No. Guest uploads and results expire within one hour."},
    ],
  };
}

function convertCopy(
  path: string,
  from: string,
  to: string,
  metaTitle: string,
  metaDescription: string,
  extraFaq?: ToolLandingCopy["faqs"][number],
): ToolLandingCopy {
  const faqs: ToolLandingCopy["faqs"] = [
    {
      q: `Does converting ${from} to ${to} change my original?`,
      a: "No. Guest processing writes a separate output. Your upload stays private and expires with the session.",
    },
    {q: "Is there a file size limit?", a: `Guest uploads support ${from} up to 10 MB.`},
    {q: "Do I need an account?", a: "No. Convert as a guest. Files expire within one hour."},
    extraFaq ?? {
      q: "Is conversion lossless?",
      a: "It depends on the source and target formats. Lossy formats may reduce quality for smaller size.",
    },
    {q: "Are my images stored permanently?", a: "No. Guest uploads and results expire within one hour."},
  ];

  return {
    path,
    metaTitle,
    metaDescription,
    breadcrumbCurrent: `${from} to ${to} Converter`,
    h1: `Convert ${from} to ${to} Online`,
    subtitle: `Switch from ${from} to ${to} without desktop software`,
    paragraph: `Convert ${from} images to ${to} in seconds. Free online tool — no account required.`,
    trust: TRUST,
    workspaceNote: noteForConvert(from, to),
    featuresHeading: "Format Changes Made Simple",
    features: [
      {title: "Clear Target", body: `Output is saved as ${to} with verified results.`, tone: "blue"},
      {title: "Fast Guest Tool", body: "Upload, convert, and download in one private session.", tone: "green"},
      {title: "Web Friendly", body: "Use the format that fits your site or workflow.", tone: "purple"},
      {title: "Honest Output", body: "Know the resulting type and size before download.", tone: "orange"},
    ],
    howHeading: "How It Works",
    howSteps: how("Convert"),
    benefitCards: benefits("conversion"),
    faqHeading: "Frequently Asked Questions",
    faqs,
  };
}

function bulkCopy(
  path: string,
  verb: "Compress" | "Resize" | "Convert",
  metaTitle: string,
  metaDescription: string,
): ToolLandingCopy {
  return {
    path,
    metaTitle,
    metaDescription,
    breadcrumbCurrent: `Bulk ${verb} Images`,
    h1: `Bulk ${verb} Images Online`,
    subtitle: `${verb} a short batch without repeating every step`,
    paragraph: `${verb} multiple JPG, PNG or WebP files in one batch. Free guest limits apply.`,
    trust: TRUST,
    workspaceNote: BULK_NOTE,
    featuresHeading: "Batch Speed With Clear Limits",
    features: [
      {title: "Shared Settings", body: `Apply one ${verb.toLowerCase()} choice across the batch.`, tone: "blue"},
      {title: "Per-file Status", body: "See which images succeeded and which need attention.", tone: "green"},
      {title: "ZIP Download", body: "Collect successful outputs when the batch is ready.", tone: "purple"},
      {title: "Guest Caps", body: "Batch size and total bytes follow free guest policy.", tone: "orange"},
    ],
    howHeading: "How It Works",
    howSteps: [
      {title: "Upload a Batch"},
      {title: verb},
      {title: "Process Files"},
      {title: "Download"},
    ],
    benefitCards: benefits(`bulk ${verb.toLowerCase()}`),
    faqHeading: "Frequently Asked Questions",
    faqs: [
      {q: "How many files can I upload?", a: "Guest bulk jobs enforce a maximum file count and total batch size."},
      {q: "Is there a file size limit?", a: "Each file follows the guest max size, and the batch has a total bytes cap."},
      {q: "Do I need an account?", a: "Guests can run limited bulk jobs. Files expire within one hour."},
      {q: "What if one file fails?", a: "Successful outputs remain downloadable; failed items show an error status."},
      {q: "Are my images stored permanently?", a: "No. Guest uploads and results expire within one hour."},
    ],
  };
}

export const SEO_TOOL_LANDING_COPY: Record<string, ToolLandingCopy> = {
  "/compress-jpg": compressCopy(
    "/compress-jpg",
    "JPG",
    "Compress JPG Images Online Free | Img Pilot",
    "Compress JPG images online without losing quality. Reduce JPG file size with private guest processing.",
  ),
  "/compress-png": compressCopy(
    "/compress-png",
    "PNG",
    "Compress PNG Images Online Free | Img Pilot",
    "Compress PNG images online without losing quality. Reduce PNG file size with private guest processing.",
  ),
  "/compress-webp": compressCopy(
    "/compress-webp",
    "WebP",
    "Compress WebP Images Online Free | Img Pilot",
    "Compress WebP images online without losing quality. Reduce WebP file size with private guest processing.",
  ),
  "/resize-jpg": resizeCopy(
    "/resize-jpg",
    "JPG",
    "Resize JPG Images Online Free | Img Pilot",
    "Resize JPG images online by width, height or fit-inside. Private guest tool with no account required.",
  ),
  "/resize-png": resizeCopy(
    "/resize-png",
    "PNG",
    "Resize PNG Images Online Free | Img Pilot",
    "Resize PNG images online by width, height or fit-inside. Private guest tool with no account required.",
  ),
  "/resize-webp": resizeCopy(
    "/resize-webp",
    "WebP",
    "Resize WebP Images Online Free | Img Pilot",
    "Resize WebP images online by width, height or fit-inside. Private guest tool with no account required.",
  ),
  "/crop-jpg": cropCopy(
    "/crop-jpg",
    "JPG",
    "Crop JPG Images Online Free | Img Pilot",
    "Crop JPG images online with free or fixed-ratio controls. Private guest processing, no account required.",
  ),
  "/crop-png": cropCopy(
    "/crop-png",
    "PNG",
    "Crop PNG Images Online Free | Img Pilot",
    "Crop PNG images online with free or fixed-ratio controls. Private guest processing, no account required.",
  ),
  "/crop-webp": cropCopy(
    "/crop-webp",
    "WebP",
    "Crop WebP Images Online Free | Img Pilot",
    "Crop WebP images online with free or fixed-ratio controls. Private guest processing, no account required.",
  ),
  "/jpg-to-webp": convertCopy(
    "/jpg-to-webp",
    "JPG",
    "WebP",
    "Convert JPG to WebP Online Free | Img Pilot",
    "Convert JPG images to WebP online for faster websites. Private guest conversion with verified outputs.",
  ),
  "/jpg-to-png": convertCopy(
    "/jpg-to-png",
    "JPG",
    "PNG",
    "Convert JPG to PNG Online Free | Img Pilot",
    "Convert JPG images to PNG online. Private guest conversion with verified outputs.",
  ),
  "/jpg-to-avif": convertCopy(
    "/jpg-to-avif",
    "JPG",
    "AVIF",
    "Convert JPG to AVIF Online Free | Img Pilot",
    "Convert JPG images to AVIF online when encoding is available. Private guest conversion.",
    {
      q: "Is AVIF always available?",
      a: "AVIF encoding is offered only when the server can encode and verify the result.",
    },
  ),
  "/png-to-jpg": convertCopy(
    "/png-to-jpg",
    "PNG",
    "JPG",
    "Convert PNG to JPG Online Free | Img Pilot",
    "Convert PNG images to JPG online. Private guest conversion with verified outputs.",
  ),
  "/png-to-webp": convertCopy(
    "/png-to-webp",
    "PNG",
    "WebP",
    "Convert PNG to WebP Online Free | Img Pilot",
    "Convert PNG images to WebP online for smaller web delivery. Private guest conversion.",
  ),
  "/png-to-avif": convertCopy(
    "/png-to-avif",
    "PNG",
    "AVIF",
    "Convert PNG to AVIF Online Free | Img Pilot",
    "Convert PNG images to AVIF online when encoding is available. Private guest conversion.",
    {
      q: "Is AVIF always available?",
      a: "AVIF encoding is offered only when the server can encode and verify the result.",
    },
  ),
  "/webp-to-jpg": convertCopy(
    "/webp-to-jpg",
    "WebP",
    "JPG",
    "Convert WebP to JPG Online Free | Img Pilot",
    "Convert WebP images to JPG online. Private guest conversion with verified outputs.",
  ),
  "/webp-to-png": convertCopy(
    "/webp-to-png",
    "WebP",
    "PNG",
    "Convert WebP to PNG Online Free | Img Pilot",
    "Convert WebP images to PNG online. Private guest conversion with verified outputs.",
  ),
  "/webp-to-avif": convertCopy(
    "/webp-to-avif",
    "WebP",
    "AVIF",
    "Convert WebP to AVIF Online Free | Img Pilot",
    "Convert WebP images to AVIF online when encoding is available. Private guest conversion.",
    {
      q: "Is AVIF always available?",
      a: "AVIF encoding is offered only when the server can encode and verify the result.",
    },
  ),
  "/bulk-compress": bulkCopy(
    "/bulk-compress",
    "Compress",
    "Bulk Compress Images Online Free | Img Pilot",
    "Compress multiple images online and download successful results together. Guest bulk limits apply.",
  ),
  "/bulk-resize": bulkCopy(
    "/bulk-resize",
    "Resize",
    "Bulk Resize Images Online Free | Img Pilot",
    "Resize multiple images online and download successful results together. Guest bulk limits apply.",
  ),
  "/bulk-convert": bulkCopy(
    "/bulk-convert",
    "Convert",
    "Bulk Convert Images Online Free | Img Pilot",
    "Convert multiple images online and download successful results together. Guest bulk limits apply.",
  ),
};

export function getSeoToolLandingCopy(path: string, locale = "en"): ToolLandingCopy {
  const localized = loadSeoShellFromCatalog(locale, path);
  if (localized) return localized;
  const copy = SEO_TOOL_LANDING_COPY[path];
  if (!copy) {
    throw new Error(`Missing SEO tool landing copy for ${path}`);
  }
  return copy;
}
