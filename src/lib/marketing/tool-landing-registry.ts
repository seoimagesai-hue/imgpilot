/**
 * Central SEO tool-landing registry (routes / operations / metadata shells).
 * Unique long-form body copy lives in tool-landing-content.ts — do not keyword-swap FAQ/intro templates here.
 * Pages reuse GuestToolWorkspace engines — no duplicate processors.
 */
export type LandingOperation = "compress" | "resize" | "crop" | "convert";

export type ImageFormat = "jpeg" | "png" | "webp" | "avif";

export type ToolLandingDefinition = {
  slug: string;
  /** When set, HTTP redirect to primary slug (jpg/jpeg strategy). */
  redirectTo?: string;
  operation: LandingOperation;
  sourceFormat?: Exclude<ImageFormat, "avif">;
  targetFormat?: ImageFormat;
  /** Crop: lock default aspect. */
  cropAspect?: "free" | "1:1" | "4:3" | "3:4" | "16:9" | "9:16";
  indexable: boolean;
  /** English defaults — i18n keys can overlay later. */
  title: string;
  description: string;
  h1: string;
  intro: string;
  related: string[];
  benefits: string[];
  howTo: string[];
  faqs: {q: string; a: string}[];
};

const FORMAT_MIME: Record<Exclude<ImageFormat, "avif">, string[]> = {
  jpeg: ["image/jpeg", "image/jpg"],
  png: ["image/png"],
  webp: ["image/webp"],
};

export function mimesForSourceFormat(format?: Exclude<ImageFormat, "avif">): string[] | undefined {
  if (!format) return undefined;
  return FORMAT_MIME[format];
}

function convertFaqs(from: string, to: string): {q: string; a: string}[] {
  return [
    {
      q: `Does converting ${from} to ${to} change my original file?`,
      a: "No. Guest processing writes a separate output. Your upload remains private and expires with the session.",
    },
    {
      q: "How long is the converted file stored?",
      a: "Guest files are deleted about one hour after the guest session starts. Downloads do not extend expiry.",
    },
    {
      q: "Can I convert multiple images?",
      a: "Use Bulk Image Tools for multiple files within guest or signed-in bulk limits.",
    },
  ];
}

function formatFaqs(action: string, format: string): {q: string; a: string}[] {
  return [
    {
      q: `Which ${format} files are accepted?`,
      a: `This page prioritizes ${format}. Other formats may be rejected here — use the generic ${action} tool for mixed formats.`,
    },
    {
      q: "Do I need an account?",
      a: "No. Guest tools work without login within free daily limits.",
    },
    {
      q: "Is processing private?",
      a: "Uploads go to private storage and temporary guest files expire after about one hour.",
    },
  ];
}

export const TOOL_LANDING_REGISTRY: ToolLandingDefinition[] = [
  // --- Resize formats ---
  {
    slug: "resize-jpg",
    operation: "resize",
    sourceFormat: "jpeg",
    indexable: true,
    title: "Resize JPG Images Online Free | SEO Images",
    description:
      "Resize JPG images online by choosing custom dimensions or popular presets. Adjust width, height and quality, then download your resized JPG securely.",
    h1: "Resize JPG Images Online",
    intro:
      "Resize JPG images to the exact dimensions you need without installing any software. Upload a photo, choose a preset or enter a custom width and height, then download your resized JPG in seconds.",
    related: ["compress-jpg", "jpg-to-webp", "crop-jpg", "resize-png", "png-to-jpg", "bulk-image-tools"],
    benefits: [
      "Exact image dimensions with popular platform sizes",
      "Aspect ratio lock to prevent distortion",
      "Private temporary guest storage",
    ],
    howTo: ["Upload a JPG", "Choose method or preset", "Process", "Download the resized JPG"],
    faqs: formatFaqs("Resize", "JPG"),
  },
  {
    slug: "resize-jpeg",
    redirectTo: "resize-jpg",
    operation: "resize",
    sourceFormat: "jpeg",
    indexable: false,
    title: "Resize JPEG",
    description: "Redirects to Resize JPG.",
    h1: "Resize JPEG",
    intro: "",
    related: [],
    benefits: [],
    howTo: [],
    faqs: [],
  },
  {
    slug: "resize-png",
    operation: "resize",
    sourceFormat: "png",
    indexable: true,
    title: "Resize PNG Images Online Free | SEO Images",
    description:
      "Resize PNG images online while preserving transparency. Change image dimensions securely and download your resized PNG in seconds.",
    h1: "Resize PNG Images Online",
    intro:
      "Resize PNG images without losing transparency for logos, UI graphics, icons and screenshots.",
    related: ["compress-png", "png-to-jpg", "png-to-webp", "crop-png", "resize-jpg", "bulk-image-tools"],
    benefits: [
      "Transparency-preserving PNG resize",
      "Design presets for logos, icons and favicons",
      "Private temporary guest processing",
    ],
    howTo: ["Upload a PNG", "Set dimensions or preset", "Process", "Download"],
    faqs: formatFaqs("Resize", "PNG"),
  },
  {
    slug: "resize-webp",
    operation: "resize",
    sourceFormat: "webp",
    indexable: true,
    title: "Resize WebP Images Online Free | SEO Images",
    description:
      "Resize WebP images online for responsive websites, blogs and mobile devices. Change dimensions securely and download resized WebP images instantly.",
    h1: "Resize WebP Images Online",
    intro:
      "Resize WebP images for responsive layouts, mobile devices and modern websites while keeping WebP efficiency.",
    related: [
      "compress-webp",
      "webp-to-jpg",
      "webp-to-png",
      "resize-jpg",
      "resize-png",
      "bulk-image-tools",
    ],
    benefits: [
      "Responsive WebP dimension control",
      "Shared guest Resize pipeline",
      "Private temporary storage with automatic cleanup",
    ],
    howTo: ["Upload a WebP", "Choose size options", "Process", "Download"],
    faqs: formatFaqs("Resize", "WebP"),
  },

  // --- Compress formats ---
  {
    slug: "compress-jpg",
    operation: "compress",
    sourceFormat: "jpeg",
    indexable: true,
    title: "Compress JPG Images Online Free | SEO Images",
    description:
      "Compress JPG images online and reduce file size with adjustable quality controls. Preview the result and download a smaller optimized JPG securely.",
    h1: "Compress JPG Images Online",
    intro:
      "Reduce the file size of JPG images directly in your browser without installing complicated software.",
    related: ["resize-jpg", "jpg-to-webp", "crop-jpg", "jpg-to-png", "webp-to-jpg", "bulk-image-tools"],
    benefits: [
      "Adjustable JPG quality presets",
      "Private temporary guest processing",
      "Original image stays unchanged",
    ],
    howTo: ["Upload a JPG", "Pick a quality preset", "Compress", "Download"],
    faqs: formatFaqs("Compress", "JPG"),
  },
  {
    slug: "compress-jpeg",
    redirectTo: "compress-jpg",
    operation: "compress",
    sourceFormat: "jpeg",
    indexable: false,
    title: "Compress JPEG",
    description: "Redirects to Compress JPG.",
    h1: "Compress JPEG",
    intro: "",
    related: [],
    benefits: [],
    howTo: [],
    faqs: [],
  },
  {
    slug: "compress-png",
    operation: "compress",
    sourceFormat: "png",
    indexable: true,
    title: "Compress PNG Images Online Free | SEO Images",
    description:
      "Compress PNG images online while preserving transparency. Reduce PNG file size securely and download an optimized image in seconds.",
    h1: "Compress PNG Images Online",
    intro:
      "Reduce PNG image file size without sacrificing transparency or image clarity.",
    related: ["compress-jpg", "resize-png", "png-to-jpg", "png-to-webp", "crop-png", "bulk-image-tools"],
    benefits: [
      "Transparency-preserving PNG compression",
      "Built for logos, UI graphics and screenshots",
      "Private temporary guest processing",
    ],
    howTo: ["Upload a PNG", "Choose quality", "Compress", "Download"],
    faqs: formatFaqs("Compress", "PNG"),
  },
  {
    slug: "compress-webp",
    operation: "compress",
    sourceFormat: "webp",
    indexable: true,
    title: "Compress WebP Images Online Free | SEO Images",
    description:
      "Compress WebP images online to reduce file size while maintaining quality. Improve website speed with secure browser-based WebP optimization.",
    h1: "Compress WebP Images Online",
    intro:
      "Reduce already-exported WebP file size while keeping clear visual quality for websites, landing pages and mobile apps.",
    related: [
      "resize-webp",
      "webp-to-jpg",
      "webp-to-png",
      "compress-jpg",
      "compress-png",
      "bulk-image-tools",
    ],
    benefits: [
      "Further optimize modern WebP exports",
      "Shared guest Compress quality presets",
      "Private temporary storage with automatic cleanup",
    ],
    howTo: ["Upload a WebP", "Select quality", "Compress", "Download"],
    faqs: formatFaqs("Compress", "WebP"),
  },

  // --- Crop formats + square ---
  {
    slug: "crop-jpg",
    operation: "crop",
    sourceFormat: "jpeg",
    indexable: true,
    title: "Crop JPG Images Online Free | SEO Images",
    description:
      "Crop JPG images online using precise crop controls and popular aspect ratios. Download your cropped image securely in seconds.",
    h1: "Crop JPG Images Online",
    intro: "Remove unwanted areas, lock common aspect ratios and download a new JPG without changing the original.",
    related: ["resize-jpg", "compress-jpg", "jpg-to-webp", "resize-png", "crop-png", "bulk-image-tools"],
    benefits: [
      "Precise crop handles",
      "Popular aspect ratios",
      "Social-ready framing",
      "Private temporary storage",
      "Original image stays safe",
    ],
    howTo: ["Upload a JPG", "Select the crop area", "Preview composition", "Download the cropped JPG"],
    faqs: formatFaqs("Crop", "JPG"),
  },
  {
    slug: "crop-png",
    operation: "crop",
    sourceFormat: "png",
    indexable: true,
    title: "Crop PNG Images Online Free | SEO Images",
    description:
      "Crop PNG images online while preserving transparent backgrounds. Remove unwanted areas and download a precisely cropped PNG securely.",
    h1: "Crop PNG Images Online",
    intro:
      "Crop transparent PNG logos, icons and UI graphics while keeping alpha intact.",
    related: [
      "resize-png",
      "compress-png",
      "png-to-webp",
      "png-to-jpg",
      "crop-jpg",
      "bulk-image-tools",
    ],
    benefits: [
      "Transparency-preserving PNG crop",
      "Shared guest Crop engine and ratios",
      "Private temporary storage with automatic cleanup",
    ],
    howTo: ["Upload a PNG", "Set the crop region", "Process", "Download"],
    faqs: formatFaqs("Crop", "PNG"),
  },
  {
    slug: "crop-webp",
    operation: "crop",
    sourceFormat: "webp",
    indexable: true,
    title: "Crop WebP Images Online Free | SEO Images",
    description:
      "Crop WebP images online using precise crop controls and popular aspect ratios. Create web-ready images and download them securely in seconds.",
    h1: "Crop WebP Images Online",
    intro:
      "Crop modern WebP images for responsive websites, landing pages and ecommerce while keeping a web-optimized format.",
    related: [
      "resize-webp",
      "compress-webp",
      "webp-to-jpg",
      "webp-to-png",
      "crop-jpg",
      "crop-png",
    ],
    benefits: [
      "WebP-first crop for modern delivery",
      "Shared guest Crop engine and honest ratios",
      "Private temporary storage with automatic cleanup",
    ],
    howTo: ["Upload a WebP", "Select the crop area", "Process", "Download"],
    faqs: formatFaqs("Crop", "WebP"),
  },
  {
    slug: "crop-image-square",
    operation: "crop",
    cropAspect: "1:1",
    indexable: true,
    title: "Crop Image to Square — Free 1:1 Crop Tool",
    description: "Crop images to a square 1:1 aspect ratio with the shared crop engine.",
    h1: "Crop an image to square",
    intro: "Starts with a 1:1 aspect lock. You can still change the ratio in the editor if needed.",
    related: ["crop-jpg", "crop-png", "resize-image", "compress-image"],
    benefits: ["Defaults to 1:1", "Works with JPEG, PNG, and WebP", "Same privacy model as other guest tools"],
    howTo: ["Upload an image", "Adjust the square crop", "Process", "Download"],
    faqs: [
      {
        q: "Is Exact platform sizing for Instagram included?",
        a: "Not on this page. Dedicated social size pages are deferred until dated presets are approved.",
      },
      ...formatFaqs("Crop", "your image"),
    ],
  },

  // --- Convert pairs (supported matrix) ---
  ...createConvertLandings(),
];

function createConvertLandings(): ToolLandingDefinition[] {
  const pairs: {
    slug: string;
    redirectTo?: string;
    source: Exclude<ImageFormat, "avif">;
    target: ImageFormat;
    title: string;
    h1: string;
    intro: string;
    related: string[];
  }[] = [
    {
      slug: "jpg-to-png",
      source: "jpeg",
      target: "png",
      title: "JPG to PNG Converter — Free Online",
      h1: "Convert JPG to PNG",
      intro: "Create a PNG from a JPG using the shared Convert engine.",
      related: ["png-to-jpg", "jpg-to-webp", "compress-png", "resize-png"],
    },
    {
      slug: "jpeg-to-png",
      redirectTo: "jpg-to-png",
      source: "jpeg",
      target: "png",
      title: "JPEG to PNG",
      h1: "JPEG to PNG",
      intro: "",
      related: [],
    },
    {
      slug: "jpg-to-webp",
      source: "jpeg",
      target: "webp",
      title: "Convert JPG to WebP Online Free | SEO Images",
      h1: "Convert JPG to WebP Online",
      intro:
        "Convert JPG photos to WebP for faster websites, smaller delivery files and stronger Core Web Vitals when browsers support modern formats.",
      related: ["webp-to-jpg", "compress-jpg", "resize-jpg", "crop-jpg", "png-to-webp", "bulk-image-tools"],
    },
    {
      slug: "jpeg-to-webp",
      redirectTo: "jpg-to-webp",
      source: "jpeg",
      target: "webp",
      title: "JPEG to WebP",
      h1: "JPEG to WebP",
      intro: "",
      related: [],
    },
    {
      slug: "jpg-to-avif",
      source: "jpeg",
      target: "avif",
      title: "JPG to AVIF Converter — Free Online",
      h1: "Convert JPG to AVIF",
      intro: "AVIF encoding is offered only when this server’s encoder supports it. Otherwise the control stays blocked honestly.",
      related: ["jpg-to-webp", "png-to-avif", "compress-jpg", "convert-image"],
    },
    {
      slug: "jpeg-to-avif",
      redirectTo: "jpg-to-avif",
      source: "jpeg",
      target: "avif",
      title: "JPEG to AVIF",
      h1: "JPEG to AVIF",
      intro: "",
      related: [],
    },
    {
      slug: "png-to-jpg",
      source: "png",
      target: "jpeg",
      title: "Convert PNG to JPG Online Free | SEO Images",
      h1: "Convert PNG to JPG Online",
      intro:
        "Flatten transparent PNGs into universally compatible JPG files when alpha is no longer required.",
      related: ["png-to-webp", "resize-png", "compress-png", "jpg-to-webp", "webp-to-jpg", "bulk-image-tools"],
    },
    {
      slug: "png-to-webp",
      source: "png",
      target: "webp",
      title: "Convert PNG to WebP Online Free | SEO Images",
      h1: "Convert PNG to WebP Online",
      intro:
        "Convert PNG images to WebP online while preserving transparency. Create smaller web-ready images for faster websites with secure browser-based conversion.",
      related: [
        "webp-to-png",
        "png-to-jpg",
        "compress-png",
        "resize-png",
        "jpg-to-webp",
        "bulk-image-tools",
      ],
    },
    {
      slug: "png-to-avif",
      source: "png",
      target: "avif",
      title: "PNG to AVIF Converter — Free Online",
      h1: "Convert PNG to AVIF",
      intro: "Convert PNG to AVIF when encoder support is available on this deployment.",
      related: ["png-to-webp", "jpg-to-avif", "compress-png", "convert-image"],
    },
    {
      slug: "webp-to-jpg",
      source: "webp",
      target: "jpeg",
      title: "Convert WebP to JPG Online Free | SEO Images",
      h1: "Convert WebP to JPG Online",
      intro:
        "Convert WebP images to JPG for maximum compatibility with email, documents, CMS uploads and older software.",
      related: ["jpg-to-webp", "png-to-jpg", "compress-jpg", "resize-jpg", "crop-jpg", "bulk-image-tools"],
    },
    {
      slug: "webp-to-png",
      source: "webp",
      target: "png",
      title: "Convert WebP to PNG Online Free | SEO Images",
      h1: "Convert WebP to PNG Online",
      intro:
        "Convert WebP images to PNG online while preserving transparency and image quality for design and editing workflows.",
      related: [
        "png-to-webp",
        "png-to-jpg",
        "webp-to-jpg",
        "resize-png",
        "compress-png",
        "bulk-image-tools",
      ],
    },
    {
      slug: "webp-to-avif",
      source: "webp",
      target: "avif",
      title: "WebP to AVIF Converter — Free Online",
      h1: "Convert WebP to AVIF",
      intro: "Convert WebP to AVIF only when AVIF encode is supported here.",
      related: ["webp-to-jpg", "png-to-avif", "compress-webp", "convert-image"],
    },
  ];

  return pairs.map((p) => ({
    slug: p.slug,
    redirectTo: p.redirectTo,
    operation: "convert" as const,
    sourceFormat: p.source,
    targetFormat: p.target,
    indexable: !p.redirectTo,
    title: p.title,
    description: `${p.h1}. Private guest conversion with one-hour temporary retention.`,
    h1: p.h1,
    intro: p.intro,
    related: p.related,
    benefits: [
      "Uses the supported convert matrix only",
      "Same guest session and cleanup rules as Convert Image",
      "No invented unsupported pairs",
    ],
    howTo: ["Upload the source image", "Confirm the target format", "Convert", "Download"],
    faqs: convertFaqs(p.source.toUpperCase(), p.target.toUpperCase()),
  }));
}

const BY_SLUG = new Map(TOOL_LANDING_REGISTRY.map((d) => [d.slug, d]));

export function getToolLanding(slug: string): ToolLandingDefinition | null {
  return BY_SLUG.get(slug) ?? null;
}

export function listIndexableToolLandings(): ToolLandingDefinition[] {
  return TOOL_LANDING_REGISTRY.filter((d) => d.indexable && !d.redirectTo);
}

export function listRenderableToolLandingSlugs(): string[] {
  return TOOL_LANDING_REGISTRY.filter((d) => !d.redirectTo).map((d) => d.slug);
}

export function listToolLandingRedirects(): {from: string; to: string}[] {
  return TOOL_LANDING_REGISTRY.filter((d) => d.redirectTo).map((d) => ({
    from: d.slug,
    to: d.redirectTo!,
  }));
}

/** Paths for sitemap (no locale). Includes generics + indexable landings. */
export const GENERIC_PUBLIC_TOOL_PATHS = [
  "/",
  "/compress-image",
  "/resize-image",
  "/crop-image",
  "/convert-image",
  "/geotag-image",
  "/image-metadata",
  "/ai-alt-text",
  "/image-metadata-editor",
  "/bulk-image-tools",
  "/bulk-resize",
  "/bulk-compress",
  "/bulk-convert",
  "/pricing",
  "/docs",
  "/privacy",
  "/terms",
  "/cookies",
  "/about",
  "/contact",
  "/search",
] as const;

export function listSitemapPaths(): string[] {
  const landingPaths = listIndexableToolLandings().map((d) => `/${d.slug}`);
  return [...GENERIC_PUBLIC_TOOL_PATHS, ...landingPaths];
}
