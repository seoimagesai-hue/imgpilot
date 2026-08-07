/**
 * Premium marketing copy for /resize-jpg only.
 * Guest processing stays on LandingToolWorkspace — this module is presentation + SEO text.
 */

export type ResizeJpgFaq = {q: string; a: string};

export const RESIZE_JPG_META = {
  title: "Resize JPG Images Online Free | Img Pilot",
  description:
    "Resize JPG images online by choosing custom dimensions or popular presets. Adjust width, height and quality, then download your resized JPG securely.",
  h1: "Resize JPG Images Online",
} as const;

export const RESIZE_JPG_LANDING = {
  breadcrumbParent: {href: "/resize-image" as const, label: "Resize Image"},
  hero: {
    badge: "JPG Resizer",
    description:
      "Resize JPG images to the exact dimensions you need without installing any software. Upload a photo, choose a preset or enter a custom width and height, then download your resized JPG in seconds. Your files are processed securely and automatically deleted after the temporary storage period.",
    trust: [
      "No software installation",
      "No account required for guest use",
      "Private temporary processing",
      "JPG, PNG and WebP supported",
    ],
    heroImage: {
      src: "/illustrations/resize-jpg-hero.webp",
      alt: "Illustration of a browser image editor with resize handles, width and height fields, and a download control",
      width: 1536,
      height: 1024,
    },
  },
  guestBar: {
    title: "Guest usage",
    body: "5 free image operations are available during each 24-hour period.",
    countdownLabel: "Temporary files delete automatically in:",
  },
  upload: {
    heading: "Upload a JPG image",
    supporting:
      "Drag and drop an image here, paste it from your clipboard, or select a file from your device.",
    chooseLabel: "Choose Image",
    formatsHint: "JPG, PNG and WebP supported · Maximum file size 10 MB",
    features: [
      {
        title: "Private processing",
        body: "Your file is not publicly accessible.",
      },
      {
        title: "Automatic deletion",
        body: "Temporary guest files are deleted automatically.",
      },
      {
        title: "No signup required",
        body: "Use the free guest allowance without creating an account.",
      },
    ],
  },
  intro: {
    eyebrow: "FAST AND PRIVATE IMAGE RESIZING",
    title: "Resize JPG Photos Without Losing Control of Quality",
    paragraphs: [
      "JPG is one of the most widely used image formats for websites, online stores, social media, email campaigns and digital documents. However, photos exported from cameras and smartphones are often much larger than the dimensions required for online use.",
      "This JPG resizer lets you reduce or change an image’s width and height while keeping control over its proportions and output quality. You can use a ready-made preset for common platforms or enter your own custom dimensions.",
      "The processed image is downloaded as a JPG file and your original file remains unchanged.",
    ],
    image: {
      src: "/illustrations/resize-jpg-compare.webp",
      alt: "Before and after comparison showing a large original photo next to a resized web-ready version",
      width: 1536,
      height: 1024,
    },
  },
  benefits: {
    eyebrow: "WHY USE THIS TOOL",
    title: "A Simple JPG Resizer for Everyday Image Tasks",
    intro:
      "Resize images for websites, online stores, social media posts and client projects without opening a complicated desktop editor.",
    cards: [
      {
        title: "Exact Image Dimensions",
        body: "Enter a specific width and height or select a ready-made preset for a common platform.",
        icon: "dimensions" as const,
      },
      {
        title: "Aspect Ratio Protection",
        body: "Keep the original proportions of your image to prevent unwanted stretching or distortion.",
        icon: "aspect" as const,
      },
      {
        title: "Quality Control",
        body: "Choose an appropriate JPG quality level to balance image clarity and download size.",
        icon: "quality" as const,
      },
      {
        title: "Private Temporary Storage",
        body: "Guest files are stored temporarily and are not added to a public image library.",
        icon: "privacy" as const,
      },
      {
        title: "No Installation Required",
        body: "Resize images directly from your browser on desktop, tablet or mobile.",
        icon: "browser" as const,
      },
      {
        title: "Original File Remains Safe",
        body: "The tool creates a new resized copy and does not modify the original image on your device.",
        icon: "safe" as const,
      },
    ],
  },
  howTo: {
    eyebrow: "THREE SIMPLE STEPS",
    title: "How to Resize a JPG Image",
    steps: [
      {
        title: "Upload Your Image",
        body: "Drag and drop a JPG, PNG or WebP file into the upload area or choose one from your device.",
      },
      {
        title: "Choose the New Size",
        body: "Select a preset or enter custom width and height values. Keep the aspect ratio locked to avoid distortion.",
      },
      {
        title: "Resize and Download",
        body: "Process the image, preview the result and download the newly resized JPG to your device.",
      },
    ],
    image: {
      src: "/illustrations/resize-jpg-steps.webp",
      alt: "Three-step workflow illustration: upload an image, set width and height, then download the resized file",
      width: 1536,
      height: 864,
    },
  },
  useCases: {
    eyebrow: "BUILT FOR REAL-WORLD TASKS",
    title: "Resize JPG Images for Any Platform",
    cards: [
      {
        title: "Website Images",
        body: "Prepare correctly sized hero images, blog graphics, thumbnails and product photos for your website.",
      },
      {
        title: "Social Media",
        body: "Resize images for Instagram, Facebook, LinkedIn, X, Pinterest and other platforms.",
      },
      {
        title: "Email Campaigns",
        body: "Create smaller, properly sized images for newsletters without forcing recipients to download oversized files.",
      },
      {
        title: "Online Stores",
        body: "Standardize product image dimensions to create cleaner category pages and more consistent product galleries.",
      },
    ],
  },
  dimensions: {
    title: "Understanding JPG Dimensions and Image Quality",
    paragraphs: [
      "Image dimensions describe the width and height of a picture in pixels. For example, an image measuring 1200 × 800 pixels is 1200 pixels wide and 800 pixels tall.",
      "Reducing image dimensions can make a file more suitable for websites, emails and online platforms. However, resizing an image does not guarantee a specific file size in KB or MB because file size is also affected by image detail, colour variation, metadata and the selected JPG quality level.",
      "For the best result, choose the dimensions required by your platform and use a quality setting that keeps the image clear without creating an unnecessarily large download.",
    ],
    noteTitle: "Need a specific file size?",
    noteBodyBefore: "Use the ",
    noteLinkLabel: "Compress JPG tool",
    noteLinkHref: "/compress-jpg" as const,
    noteBodyAfter: " after resizing when you need to reduce the final image size further.",
  },
  tips: {
    title: "Tips for Better JPG Resizing Results",
    items: [
      "Keep the aspect ratio locked unless you intentionally need a different shape.",
      "Avoid enlarging very small images because enlargement can make them look blurry.",
      "Start with the highest-quality original image available.",
      "Use the correct platform dimensions before uploading the image.",
      "Resize first and compress afterwards when both dimensions and file size need to be reduced.",
      "Preview important text, logos and faces before downloading the final image.",
    ],
  },
  faqs: [
    {
      q: "Does resizing a JPG reduce its file size?",
      a: "It often does, especially when the new image dimensions are smaller. However, the final file size also depends on the image content, metadata and selected JPG quality. Use the Compress JPG tool if you need additional file-size reduction.",
    },
    {
      q: "Can I resize a JPG to an exact width and height?",
      a: "Yes. Enter your preferred width and height in pixels. Keep the aspect ratio locked when you want to preserve the image’s original proportions.",
    },
    {
      q: "Will my original JPG image be overwritten?",
      a: "No. The tool creates a new resized image for download. Your original file remains unchanged on your device.",
    },
    {
      q: "Can I enlarge a small JPG image?",
      a: "Yes, but enlarging an image beyond its original dimensions may reduce sharpness and make pixels more visible. For the best quality, start with a larger original image.",
    },
    {
      q: "Can I resize images without creating an account?",
      a: "Yes. Guest users can use the available free operations without signing in. Account features may be required for higher limits, project history or additional tools.",
    },
    {
      q: "Are my uploaded images private?",
      a: "Guest images are processed through private temporary storage and are automatically deleted after the configured retention period. They are not published in a public gallery.",
    },
    {
      q: "Which image formats can I upload?",
      a: "You can upload JPG, PNG and WebP images. The downloaded result from this page is provided as a JPG file.",
    },
    {
      q: "Can I resize a JPG to a specific KB size?",
      a: "This tool controls image dimensions and JPG quality, but it cannot guarantee an exact KB result. Resize the image first, then use the Compress JPG tool when you need a smaller file size.",
    },
    {
      q: "Does the tool support HEIC images?",
      a: "HEIC is not currently supported on this page. Convert the HEIC image to JPG first, then upload the converted image for resizing.",
    },
    {
      q: "Does resizing remove image metadata?",
      a: "Some metadata may be removed or changed during image processing. Do not rely on the resized file to preserve all original camera or location metadata.",
    },
  ] satisfies ResizeJpgFaq[],
  related: {
    eyebrow: "CONTINUE EDITING",
    title: "Related Image Tools",
    tools: [
      {
        href: "/compress-jpg",
        title: "Compress JPG",
        body: "Reduce the file size of JPG images.",
      },
      {
        href: "/jpg-to-webp",
        title: "Convert JPG to WebP",
        body: "Create a modern WebP version for websites.",
      },
      {
        href: "/crop-jpg",
        title: "Crop JPG",
        body: "Remove unwanted areas from an image.",
      },
      {
        href: "/resize-png",
        title: "Resize PNG",
        body: "Change PNG image dimensions online.",
      },
      {
        href: "/png-to-jpg",
        title: "Convert PNG to JPG",
        body: "Convert transparent or standard PNG files to JPG.",
      },
      {
        href: "/bulk-image-tools",
        title: "Bulk Resize Images",
        body: "Resize multiple images in one workflow.",
      },
    ],
  },
  cta: {
    title: "Need to Resize More Images?",
    body: "Upload another image or create a free account to access additional image tools, saved projects and higher usage limits.",
    primaryLabel: "Resize Another Image",
    secondaryLabel: "Create Free Account",
    secondaryHref: "/register" as const,
  },
} as const;

/** Compact SEO body kept in sync for shared landing tests / sitemap models. */
export function resizeJpgSeoCompat() {
  return {
    intro: RESIZE_JPG_LANDING.hero.description,
    why: [
      RESIZE_JPG_LANDING.benefits.intro,
      RESIZE_JPG_LANDING.intro.paragraphs[0],
      RESIZE_JPG_LANDING.intro.paragraphs[1],
    ].join(" "),
    benefits: RESIZE_JPG_LANDING.benefits.cards.map((c) => ({
      title: c.title,
      body: c.body,
    })),
    howTo: [
      "Upload a JPG, PNG or WebP image",
      "Choose a popular size or custom width and height",
      "Keep aspect ratio locked unless you need a new shape",
      "Process and download the resized JPG",
    ] as [string, string, string, string],
    technicalTitle: RESIZE_JPG_LANDING.dimensions.title,
    technical: RESIZE_JPG_LANDING.dimensions.paragraphs.join(" "),
    faqs: [...RESIZE_JPG_LANDING.faqs],
    ctaLabel: RESIZE_JPG_LANDING.cta.primaryLabel,
  };
}
