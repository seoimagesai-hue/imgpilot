import {localizedCopy} from "@/lib/marketing/localized-copy";
/**
 * Image Resizer master hub — pillar page for "image resizer" keywords.
 * Distinct from Resize JPG/PNG/WebP landings and Bulk Resize.
 */
import {isAppLocale, type AppLocale} from "@/i18n/routing";

export type ResizeImageFaq = {q: string; a: string};

export type ResizeImageCopy = {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  breadcrumbCurrent: string;
  hero: {
    badge: string;
    paragraph: string;
    trust: string[];
    uploadCta: string;
    viewSizesCta: string;
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
  presets: {
    eyebrow: string;
    title: string;
    intro: string;
    cards: {
      id: string;
      title: string;
      width?: number;
      height?: number;
      custom?: boolean;
    }[];
  };
  tools: {
    eyebrow: string;
    title: string;
    intro: string;
    cards: {href: string; title: string; body: string}[];
  };
  intro: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
  };
  howItWorks: {
    title: string;
    paragraphs: string[];
    points: string[];
    imageAlt: string;
  };
  guide: {
    title: string;
    intro: string;
    caption: string;
    columns: string[];
    rows: {platform: string; cells: string[]}[];
  };
  benefits: {
    eyebrow: string;
    title: string;
    cards: {
      title: string;
      body: string;
      icon:
        | "dimensions"
        | "responsive"
        | "social"
        | "browser"
        | "privacy"
        | "safe"
        | "lock"
        | "formats";
    }[];
  };
  responsive: {
    title: string;
    paragraphs: string[];
    levels: {title: string; body: string}[];
    note: string;
  };
  tips: {
    eyebrow: string;
    title: string;
    items: string[];
  };
  faqHeading: string;
  faqs: ResizeImageFaq[];
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

/** Popular sizes wired into the real guest resize options panel. */
export const RESIZE_IMAGE_POPULAR_SIZES = [
  {id: "instagram-post", label: "Instagram Post", width: 1080, height: 1080},
  {id: "instagram-portrait", label: "Instagram Portrait", width: 1080, height: 1350},
  {id: "facebook-post", label: "Facebook Post", width: 1200, height: 630},
  {id: "youtube-thumbnail", label: "YouTube Thumbnail", width: 1280, height: 720},
  {id: "website-hero", label: "Website Hero", width: 1920, height: 1080},
  {id: "blog-image", label: "Blog Image", width: 1200, height: 800},
  {id: "mobile-banner", label: "Mobile Banner", width: 1080, height: 1920},
] as const;

const en: ResizeImageCopy = {
  metaTitle: "Image Resizer Online Free | Img Pilot",
  metaDescription:
    "Resize JPG, PNG and WebP images online. Change image dimensions for websites, social media and mobile devices using a secure browser-based image resizer.",
  h1: "Resize Images Online",
  breadcrumbCurrent: "Resize Images Online",
  hero: {
    badge: "ONLINE IMAGE RESIZER",
    paragraph:
      "Resize JPG, PNG and WebP images directly in your browser. Change image dimensions for websites, social media, ecommerce stores, presentations and mobile devices without installing software.",
    trust: ["JPG", "PNG", "WebP", "Browser Based", "Secure Processing"],
    uploadCta: "Resize Images",
    viewSizesCta: "View Supported Sizes",
    heroImageAlt:
      "Browser image resizer with JPG, PNG and WebP files, width and height controls, aspect ratio lock and download button",
  },
  guestBar: {
    title: "Guest usage",
    deletionTitle: "Automatic deletion",
    countdownLabel: "Temporary files delete automatically in",
  },
  upload: {
    heading: "Upload Your Images",
    supporting: "Drag and drop JPG, PNG or WebP images or browse your device.",
    chooseLabel: "Choose Image",
    formatsHint: "JPG · PNG · WebP · Maximum file size follows guest limits shown above",
    features: [
      {title: "Same-format resize", body: "Keep JPG, PNG or WebP while changing dimensions."},
      {title: "Popular sizes", body: "Apply Instagram, website, YouTube and other boxes in one click."},
      {title: "Aspect ratio lock", body: "Maintain proportions whenever you need natural scaling."},
      {title: "Private processing", body: "Files stay in temporary private storage with automatic cleanup."},
    ],
  },
  presets: {
    eyebrow: "POPULAR RESIZE PRESETS",
    title: "Start From Dimensions Teams Use Daily",
    intro:
      "These cards match sizes available in the guest resizer below. Custom Size opens the workspace so you can enter your own width and height.",
    cards: [
      {id: "instagram-post", title: "Instagram Post", width: 1080, height: 1080},
      {id: "instagram-portrait", title: "Instagram Portrait", width: 1080, height: 1350},
      {id: "facebook-post", title: "Facebook Post", width: 1200, height: 630},
      {id: "youtube-thumbnail", title: "YouTube Thumbnail", width: 1280, height: 720},
      {id: "website-hero", title: "Website Hero", width: 1920, height: 1080},
      {id: "blog-image", title: "Blog Image", width: 1200, height: 800},
      {id: "mobile-banner", title: "Mobile Banner", width: 1080, height: 1920},
      {id: "custom", title: "Custom Size", custom: true},
    ],
  },
  tools: {
    eyebrow: "INDIVIDUAL RESIZE TOOLS",
    title: "Jump to a Format-Specific Resizer",
    intro: "Need guidance for one container? These pages use the same resize engine as this hub.",
    cards: [
      {
        href: "/resize-jpg",
        title: "Resize JPG",
        body: "Change photographic JPG dimensions for web, ads and social layouts.",
      },
      {
        href: "/resize-png",
        title: "Resize PNG",
        body: "Scale PNG graphics while preserving transparency when the source has alpha.",
      },
      {
        href: "/resize-webp",
        title: "Resize WebP",
        body: "Prepare modern WebP assets for heroes, cards and responsive slots.",
      },
      {
        href: "/bulk-resize",
        title: "Bulk Resize Images",
        body: "Apply one size profile across many files and download a ZIP.",
      },
    ],
  },
  intro: {
    eyebrow: "IMAGE DIMENSIONS",
    title: "Why Resize Images?",
    paragraphs: [
      "Most images leave a camera or design tool far larger than any website, email template or social slot needs. Shipping those full-resolution pixels forces browsers to download and decode work that never fits the layout. Resizing first sets honest width and height so every page view pays only for useful detail.",
      "Website optimization starts with matching dimensions to the template. A blog content column rarely needs a 4000-pixel photograph. Heroes can stay wide, but product grids, avatars and cards usually look sharper when prepared at the display size instead of being crushed by CSS alone.",
      "Social media rewards platform-aware crops of attention and hard pixel boxes. An Instagram feed tile, a Facebook link preview and a YouTube thumbnail each expect different proportions. Resizing to those targets before upload reduces awkward platform recompression and keeps text in the frame readable.",
      "Responsive layouts multiply the problem. Desktop, tablet and mobile viewports share one site but not one ideal bitmap. When you publish correctly sized variants — or at least stop sending desktop heroes to phones — pages feel quieter and bandwidth budgets open up for fonts and scripts.",
      "Photography and marketing libraries benefit from intentional masters. Keep the original capture, then export a resized derivative for the CMS. That habit protects creative work while giving content teams files that fit WordPress blocks, Shopify galleries and landing-page builders without guesswork.",
      "Email clients punish oversized attachments and slow-loading HTML images. Ecommerce grids compound small mistakes across dozens of SKUs. Page speed tools still flag weighty media even when the visual box on screen is tiny. Storage and CDN bills quietly track every unnecessary megapixel you leave in production.",
      "Content publishing is faster when the right size already exists. Designers, SEOs and store operators stop fighting auto-crop surprises when assets arrive pre-sized for the channel. Compression remains important, but resizing removes pixels you should never compress in the first place.",
      "Img Pilot keeps that workflow browser-based: upload JPG, PNG or WebP, pick a popular size or enter custom dimensions, lock aspect ratio when you need natural scaling, preview the result and download a new file while the original on your device stays untouched.",
    ],
  },
  howItWorks: {
    title: "Understanding Image Dimensions",
    paragraphs: [
      "Digital images are grids of pixels. Width and height describe how many samples span each axis. Changing those numbers changes how much space the picture occupies on screen and how much data the file typically needs to store.",
      "Aspect ratio is the relationship between width and height. Locking it keeps subjects looking natural while you scale. Cropping removes edges to force a new frame; resizing scales the whole canvas. They solve different problems and this hub focuses on resizing.",
    ],
    points: [
      "Pixels define resolution — more pixels can mean more detail and more download weight",
      "Width and height set the output box you request in the resizer",
      "Aspect ratio lock preserves proportions when you adjust one edge",
      "Scaling fits imagery into social, website and email slots",
      "Cropping reframes; resizing changes size without selecting a new subject area",
      "Quality holds best when you reduce oversize sources instead of inventing detail by upscaling",
    ],
    imageAlt:
      "Infographic showing one original image resized into desktop, tablet and mobile versions with width and height controls",
  },
  guide: {
    title: "Resize Guide for Common Platforms",
    intro:
      "Use these recommended sizes as practical starting points. Always confirm your current template or ad spec before publishing.",
    caption: "Recommended dimensions and aspect ratios for common platforms",
    columns: ["Platform", "Recommended size", "Aspect ratio", "Common use"],
    rows: [
      {
        platform: "Instagram",
        cells: ["Instagram", "1080 × 1080", "1:1", "Feed posts and product tiles"],
      },
      {
        platform: "Facebook",
        cells: ["Facebook", "1200 × 630", "≈1.91:1", "Link previews and shared posts"],
      },
      {
        platform: "LinkedIn",
        cells: ["LinkedIn", "1200 × 627", "≈1.91:1", "Article cards and company updates"],
      },
      {
        platform: "Pinterest",
        cells: ["Pinterest", "1000 × 1500", "2:3", "Tall pins and product inspiration"],
      },
      {
        platform: "YouTube",
        cells: ["YouTube", "1280 × 720", "16:9", "Thumbnails and channel art bases"],
      },
      {
        platform: "Website Hero",
        cells: ["Website Hero", "1920 × 1080", "16:9", "Landing banners and homepage heroes"],
      },
      {
        platform: "Blog",
        cells: ["Blog", "1200 × 800", "3:2", "Featured images and in-article media"],
      },
      {
        platform: "Email",
        cells: ["Email", "600 × 400", "3:2", "Newsletter heroes inside typical width"],
      },
    ],
  },
  benefits: {
    eyebrow: "WHY TEAMS RESIZE",
    title: "Dimensions Built for Real Delivery",
    cards: [
      {
        title: "Perfect Dimensions",
        body: "Match templates, CMS blocks and ad units instead of stretching CSS around oversized files.",
        icon: "dimensions",
      },
      {
        title: "Responsive Images",
        body: "Prepare desktop, tablet and mobile-friendly sizes so smaller screens download less.",
        icon: "responsive",
      },
      {
        title: "Social Media Ready",
        body: "Start from popular Instagram, Facebook and YouTube boxes used every day.",
        icon: "social",
      },
      {
        title: "Browser Based",
        body: "Resize without installing desktop editors on every contributor laptop.",
        icon: "browser",
      },
      {
        title: "Private Processing",
        body: "Guest files use temporary private storage with automatic cleanup.",
        icon: "privacy",
      },
      {
        title: "Original Protected",
        body: "Downloads are new resized copies. Keep masters offline for safety.",
        icon: "safe",
      },
      {
        title: "Aspect Ratio Lock",
        body: "Preserve natural proportions while you tighten width or height.",
        icon: "lock",
      },
      {
        title: "Multiple Formats",
        body: "JPG, PNG and WebP all run through the same secure guest resize path.",
        icon: "formats",
      },
    ],
  },
  responsive: {
    title: "Create Better Responsive Images",
    paragraphs: [
      "Responsive design is not only fluid CSS. Images still carry fixed pixels. When a phone downloads a desktop-sized banner, performance suffers even if the layout looks fine. Plan sizes for the contexts you actually ship.",
    ],
    levels: [
      {
        title: "Desktop",
        body: "Heroes and wide content rails can use larger widths such as 1920×1080 when the layout truly fills the viewport.",
      },
      {
        title: "Tablet",
        body: "Medium widths keep visual polish without carrying full desktop pixel budgets into mid-size screens.",
      },
      {
        title: "Mobile",
        body: "Portrait banners and card images should drop extra width early — phones rarely need multi-megapixel backgrounds.",
      },
      {
        title: "Retina Displays",
        body: "Serving roughly 1.5–2× the CSS box can look crisp, but doubling forever stops helping and only costs bandwidth.",
      },
      {
        title: "Bandwidth & SEO",
        body: "Correct dimensions improve load time and Core Web Vitals signals that reward pages users can actually use.",
      },
    ],
    note: "Using correctly sized images improves loading speed and avoids downloading unnecessary pixels on smaller devices.",
  },
  tips: {
    eyebrow: "BETTER RESULTS",
    title: "Best Practices",
    items: [
      "Keep aspect ratio locked unless you intentionally want nonuniform scaling.",
      "Resize oversized images before compressing so you are not encoding unused pixels.",
      "Use platform dimensions when publishing to social and ad networks.",
      "Keep original files as masters before replacing production libraries.",
      "Test resized assets on multiple devices when brand framing matters.",
      "Create responsive image versions for major breakpoints instead of one giant export.",
    ],
  },
  faqHeading: "Frequently Asked Questions",
  faqs: [
    {
      q: "How do I resize an image online?",
      a: "Upload a JPG, PNG or WebP file on this page, choose a popular size or enter custom dimensions, run resize, preview the result and download the new file.",
    },
    {
      q: "Will resizing reduce image quality?",
      a: "Reducing oversized images usually looks clean for web use. Extreme upscaling cannot invent real detail, and harsh downscales can soften fine texture — preview before replacing a live asset.",
    },
    {
      q: "What is the difference between resize and crop?",
      a: "Resize changes width and height of the whole image. Crop selects a region and discards the outside. Use Crop Images when framing matters more than simple scaling.",
    },
    {
      q: "What is the difference between resize and compress?",
      a: "Resize changes pixel dimensions. Compress reduces file weight at the same or similar dimensions. Many workflows resize first, then compress.",
    },
    {
      q: "Can I enlarge images with this resizer?",
      a: "You can request larger dimensions, but guest resize may prevent upscaling depending on settings. Enlargement cannot restore missing camera detail.",
    },
    {
      q: "What does aspect ratio mean?",
      a: "Aspect ratio is the relationship between width and height, such as 1:1 or 16:9. Locking it keeps proportions natural while you change size.",
    },
    {
      q: "What are the best dimensions for website images?",
      a: "Match the layout box. Common starting points include 1920×1080 heroes and 1200×800 blog images, then shrink further for cards and mobile slots.",
    },
    {
      q: "Does Image Resizer support social media sizes?",
      a: "Yes. Popular presets include Instagram, Facebook and YouTube boxes that feed the same guest resize controls.",
    },
    {
      q: "Can I resize images for websites and landing pages?",
      a: "Yes. Use Website Hero, Blog Image or custom dimensions that match your theme, then compress if the file is still heavy.",
    },
    {
      q: "What are the guest limits for the image resizer?",
      a: "Daily operations and maximum upload size appear in the usage bar above the uploader. Higher limits may require an account.",
    },
    {
      q: "Are image resizer uploads private?",
      a: "Guest files use temporary private storage and are deleted automatically according to the retention countdown on the page.",
    },
    {
      q: "What is the maximum upload size for Resize Images?",
      a: "The maximum size matches the guest upload limit shown in the usage bar. Oversized files are rejected before processing starts.",
    },
    {
      q: "Can I resize JPG, PNG and WebP files?",
      a: "Yes. This hub accepts those formats and keeps the same container on output. Format-specific pages add deeper guidance for each type.",
    },
    {
      q: "Can I prepare mobile-friendly image sizes?",
      a: "Yes. Use Mobile Banner or custom portrait dimensions, then test on a phone viewport before publishing.",
    },
    {
      q: "Are original images changed by Resize Images?",
      a: "No. The tool creates a new resized download. The original file on your device stays unchanged.",
    },
  ],
  related: {
    eyebrow: "RELATED CATEGORIES",
    title: "Continue After Resizing",
    tools: [
      {href: "/convert-image", title: "Image Converter", body: "Change containers when WebP, JPG or PNG is the better delivery format."},
      {href: "/compress-image", title: "Image Compressor", body: "Reduce file weight after dimensions are correct."},
      {href: "/crop-image", title: "Crop Images", body: "Reframe subjects when scaling alone is not enough."},
      {href: "/bulk-resize", title: "Bulk Resize", body: "Apply one size profile across an entire queue."},
      {href: "/resize-jpg", title: "Resize JPG", body: "Photographic JPG sizing with dedicated guidance."},
      {href: "/resize-png", title: "Resize PNG", body: "PNG graphics resizing with transparency in mind."},
      {href: "/resize-webp", title: "Resize WebP", body: "Modern WebP sizing for performance pages."},
    ],
  },
  cta: {
    title: "Ready to Resize Your Images?",
    body: "Upload an image now or create a free account to unlock higher limits, saved projects and advanced image editing tools.",
    primaryLabel: "Resize Images",
    secondaryLabel: "Create Free Account",
    secondaryHref: "/register",
  },
};

const ur: ResizeImageCopy = {
  metaTitle: "آن لائن امیج ری سائزر مفت | Img Pilot",
  metaDescription:
    "JPG، PNG اور WebP امیجز آن لائن ری سائز کریں۔ ویب سائٹس، سوشل میڈیا اور موبائل کے لیے محفوظ براؤزر پر مبنی امیج ری سائزر سے ابعاد تبدیل کریں۔",
  h1: "آن لائن امیجز ری سائز کریں",
  breadcrumbCurrent: "آن لائن امیجز ری سائز کریں",
  hero: {
    badge: "ONLINE IMAGE RESIZER",
    paragraph:
      "براؤزر میں ہی JPG، PNG اور WebP امیجز ری سائز کریں۔ ویب سائٹس، سوشل میڈیا، ای کامرس، پریزنٹیشنز اور موبائل کے لیے سافٹ ویئر انسٹال کیے بغیر ابعاد تبدیل کریں۔",
    trust: ["JPG", "PNG", "WebP", "براؤزر پر مبنی", "محفوظ پروسیسنگ"],
    uploadCta: "امیجز ری سائز کریں",
    viewSizesCta: "معاون سائز دیکھیں",
    heroImageAlt:
      "براؤزر امیج ری سائزر جس میں JPG، PNG، WebP، چوڑائی و اونچائی کنٹرولز، آسپیکٹ ریشو لاک اور ڈاؤن لوڈ بٹن دکھائے گئے ہیں",
  },
  guestBar: {
    title: "گیسٹ استعمال",
    deletionTitle: "خودکار حذف",
    countdownLabel: "عارضی فائلیں خودکار طور پر حذف ہوں گی",
  },
  upload: {
    heading: "اپنی امیجز اپلوڈ کریں",
    supporting: "JPG، PNG یا WebP ڈریگ اینڈ ڈراپ کریں یا ڈیوائس سے منتخب کریں۔",
    chooseLabel: "امیج منتخب کریں",
    formatsHint: "JPG · PNG · WebP · زیادہ سے زیادہ سائز اوپر دکھائے گئے گیسٹ حدود کے مطابق",
    features: [
      {title: "وہی فارمیٹ", body: "ابعاد بدلیں مگر JPG، PNG یا WebP برقرار رکھیں۔"},
      {title: "مقبول سائز", body: "انسٹاگرام، ویب سائٹ، یوٹیوب اور دیگر باکس ایک کلک میں لگائیں۔"},
      {title: "آسپیکٹ ریشو لاک", body: "قدرتی تناسب برقرار رکھتے ہوئے اسکیل کریں۔"},
      {title: "نجی پروسیسنگ", body: "فائلیں عارضی نجی اسٹوریج اور خودکار صفائی کے ساتھ۔"},
    ],
  },
  presets: {
    eyebrow: "مقبول ری سائز پری سیٹس",
    title: "روزمرہ استعمال کے ابعاد سے شروع کریں",
    intro:
      "یہ کارڈز نیچے گیسٹ ری سائزر میں دستیاب سائز سے مماثل ہیں۔ حسبِ ضرورت سائز ورک اسپیس کھولتا ہے تاکہ آپ اپنی چوڑائی اور اونچائی درج کریں۔",
    cards: [
      {id: "instagram-post", title: "Instagram Post", width: 1080, height: 1080},
      {id: "instagram-portrait", title: "Instagram Portrait", width: 1080, height: 1350},
      {id: "facebook-post", title: "Facebook Post", width: 1200, height: 630},
      {id: "youtube-thumbnail", title: "YouTube Thumbnail", width: 1280, height: 720},
      {id: "website-hero", title: "Website Hero", width: 1920, height: 1080},
      {id: "blog-image", title: "Blog Image", width: 1200, height: 800},
      {id: "mobile-banner", title: "Mobile Banner", width: 1080, height: 1920},
      {id: "custom", title: "حسبِ ضرورت سائز", custom: true},
    ],
  },
  tools: {
    eyebrow: "انفرادی ری سائز ٹولز",
    title: "فارمیٹ مخصوص ری سائزر پر جائیں",
    intro: "ایک کنٹینر کی رہنمائی چاہیے؟ یہ صفحات اسی ری سائز انجن کو استعمال کرتے ہیں۔",
    cards: [
      {
        href: "/resize-jpg",
        title: "JPG ری سائز کریں",
        body: "عکسی JPG کے ابعاد ویب، اشتہارات اور سوشل لے آؤٹ کے لیے بدلیں۔",
      },
      {
        href: "/resize-png",
        title: "PNG ری سائز کریں",
        body: "جب سورس میں الفا ہو تو شفافیت برقرار رکھتے ہوئے PNG اسکیل کریں۔",
      },
      {
        href: "/resize-webp",
        title: "WebP ری سائز کریں",
        body: "جدید WebP اثاثے ہیروز، کارڈز اور ریسپانسو سلاٹس کے لیے تیار کریں۔",
      },
      {
        href: "/bulk-resize",
        title: "بلک ری سائز امیجز",
        body: "بہت سی فائلوں پر ایک سائز پروفائل لگائیں اور ZIP ڈاؤن لوڈ کریں۔",
      },
    ],
  },
  intro: {
    eyebrow: "امیج کے ابعاد",
    title: "امیجز کیوں ری سائز کریں؟",
    paragraphs: [
      "زیادہ تر امیجز کیمرے یا ڈیزائن ٹول سے اتنی بڑی نکلتی ہیں جتنی کسی ویب سائٹ، ای میل سانچے یا سوشل سلاٹ کو درکار نہیں ہوتیں۔ مکمل ریزولوشن پکسلز بھیجنا براؤزر کو ایسا کام ڈاؤن لوڈ اور ڈیکوڈ کرنے پر مجبور کرتا ہے جو لے آؤٹ میں فٹ ہی نہیں ہوتا۔ پہلے ری سائز کرنا ایماندار چوڑائی اور اونچائی طے کرتا ہے تاکہ ہر صفحہ صرف مفید تفصیل کی قیمت ادا کرے۔",
      "ویب سائٹ کی بہتری سانچے سے ابعاد ملانے سے شروع ہوتی ہے۔ بلاگ کے مواد والے کالم کو اکثر چار ہزار پکسل کی تصویر کی ضرورت نہیں ہوتی۔ ہیرو چوڑا رہ سکتا ہے، مگر پروڈکٹ گرڈز، اوتار اور کارڈز اس وقت زیادہ تیز اور صاف دکھتے ہیں جب وہ ڈسپلے سائز پر تیار ہوں بجائے اس کے کہ صرف CSS انہیں دبائے۔",
      "سوشل میڈیا پلیٹ فارم کے حساب سے فریم اور سخت پکسل باکس چاہتا ہے۔ انسٹاگرام فیڈ، فیس بک لنک پری ویو اور یوٹیوب تھمب نیل مختلف تناسب رکھتے ہیں۔ اپلوڈ سے پہلے ان اہداف پر ری سائز کرنے سے عجیب دوبارہ کمپریشن کم ہوتی ہے اور فریم میں متن پڑھنے کے قابل رہتا ہے۔",
      "ریسپانسو لے آؤٹس مسئلہ کو بڑھاتے ہیں۔ ڈیسک ٹاپ، ٹیبلیٹ اور موبائل ایک ہی سائٹ شیئر کرتے ہیں مگر ایک ہی مثالی بٹ میپ نہیں۔ جب آپ درست سائز والے ورژن شائع کرتے ہیں — یا کم از کم فونز کو ڈیسک ٹاپ ہیرو بھیجنا بند کرتے ہیں — صفحے پرسکون لگتے ہیں اور بینڈوڈتھ بجٹ فونٹس اور اسکرپٹس کے لیے کھلتے ہیں۔",
      "فوٹوگرافی اور مارکیٹنگ لائبریریاں ارادی ماسٹرز سے فائدہ اٹھاتی ہیں۔ اصل کیپچر رکھیں، پھر CMS کے لیے ری سائز شدہ کاپی نکالیں۔ یہ عادت تخلیقی کام کی حفاظت کرتی ہے اور مواد کی ٹیم کو ایسے فائل دیتی ہے جو WordPress بلاکس، Shopify گیلریز اور لینڈنگ پیج بلڈرز میں بغیر اندازے کے فٹ ہو جائیں۔",
      "ای میل کلائنٹس بڑے اٹیچمنٹس اور سست لوڈ ہونے والی HTML امیجز کو سزا دیتے ہیں۔ ای کامرس گرڈز درجنوں SKUs پر چھوٹی غلطیوں کو بڑھاتے ہیں۔ پیج اسپیڈ ٹولز تب بھی بھاری میڈیا فلگ کرتے ہیں جب اسکرین پر بصری باکس چھوٹا ہو۔ اسٹوریج اور CDN بل خاموشی سے ہر غیر ضروری میگا پکسل کا حساب رکھتے ہیں۔",
      "مواد کی اشاعت اس وقت تیز ہوتی ہے جب صحیح سائز پہلے سے موجود ہو۔ ڈیزائنرز، SEO اور اسٹور آپریٹرز آٹو کراپ کے حیرت انگیز نتائج سے کم لڑتے ہیں جب اثاثے چینل کے لیے پہلے سے سائز کیے ہوں۔ کمپریشن اہم رہتی ہے، مگر ری سائز وہ پکسل ہٹاتا ہے جنہیں کبھی کمپریس نہیں کرنا چاہیے تھا۔",
      "Img Pilot اس ورک فلو کو براؤزر میں رکھتا ہے: JPG، PNG یا WebP اپلوڈ کریں، مقبول سائز منتخب کریں یا حسبِ ضرورت ابعاد درج کریں، ضرورت ہو تو آسپیکٹ ریشو لاک رکھیں، نتیجہ دیکھیں اور نئی فائل ڈاؤن لوڈ کریں جبکہ آپ کی ڈیوائس پر اصل فائل ویسی ہی رہتی ہے۔",
    ],
  },
  howItWorks: {
    title: "امیج کے ابعاد کو سمجھیں",
    paragraphs: [
      "ڈیجیٹل امیجز پکسلز کے گرڈ ہوتی ہیں۔ چوڑائی اور اونچائی بتاتی ہیں کہ ہر محور پر کتنے نمونے ہیں۔ ان اعداد کو بدلنے سے تصویر اسکرین پر کتنی جگہ گھیرتی ہے اور فائل عام طور پر کتنا ڈیٹا رکھتی ہے تبدیل ہوتا ہے۔",
      "آسپیکٹ ریشو چوڑائی اور اونچائی کا تناسب ہے۔ اسے لاک رکھنے سے موضوع قدرتی لگتا رہتا ہے جب آپ اسکیل کرتے ہیں۔ کراپ کنارے کاٹ کر نیا فریم بناتا ہے؛ ری سائز پورا کینوس اسکیل کرتا ہے۔ دونوں مختلف مسائل حل کرتے ہیں اور یہ حب ری سائز پر مرکوز ہے۔",
    ],
    points: [
      "پکسلز ریزولوشن طے کرتے ہیں — زیادہ پکسلز زیادہ تفصیل اور زیادہ ڈاؤن لوڈ وزن دے سکتے ہیں",
      "چوڑائی اور اونچائی وہ آؤٹ پٹ باکس طے کرتی ہیں جو آپ ری سائزر میں مانگتے ہیں",
      "آسپیکٹ ریشو لاک تناسب برقرار رکھتا ہے جب آپ ایک کنارہ بدلتے ہیں",
      "اسکیلنگ امیجری کو سوشل، ویب سائٹ اور ای میل سلاٹس میں فٹ کرتی ہے",
      "کراپ فریم بدلتا ہے؛ ری سائز سائز بدلتا ہے بغیر نئے موضوع کی چونٹی کے",
      "معیار اس وقت بہتر رہتا ہے جب بڑے سورس کم کریں بجائے اپ اسکیل سے تفصیل گھڑنے کے",
    ],
    imageAlt:
      "انفوگرافک جس میں ایک اصل امیج ڈیسک ٹاپ، ٹیبلیٹ اور موبائل ورژنز میں ری سائز ہوتی ہے اور چوڑائی و اونچائی کنٹرولز دکھائے گئے ہیں",
  },
  guide: {
    title: "عام پلیٹ فارمز کے لیے ری سائز گائیڈ",
    intro:
      "ان تجویز کردہ سائز کو عملی نقطۂ آغاز سمجھیں۔ اشاعت سے پہلے ہمیشہ اپنا موجودہ سانچہ یا اشتہاری تخصیص چیک کریں۔",
    caption: "عام پلیٹ فارمز کے لیے تجویز کردہ ابعاد اور آسپیکٹ ریشو",
    columns: ["پلیٹ فارم", "تجویز کردہ سائز", "آسپیکٹ ریشو", "عام استعمال"],
    rows: [
      {
        platform: "Instagram",
        cells: ["Instagram", "1080 × 1080", "1:1", "فیڈ پوسٹس اور پروڈکٹ ٹائلز"],
      },
      {
        platform: "Facebook",
        cells: ["Facebook", "1200 × 630", "≈1.91:1", "لنک پری ویوز اور شیئرڈ پوسٹس"],
      },
      {
        platform: "LinkedIn",
        cells: ["LinkedIn", "1200 × 627", "≈1.91:1", "آرٹیکل کارڈز اور کمپنی اپڈیٹس"],
      },
      {
        platform: "Pinterest",
        cells: ["Pinterest", "1000 × 1500", "2:3", "لمبے پنز اور پروڈکٹ انسپریشن"],
      },
      {
        platform: "YouTube",
        cells: ["YouTube", "1280 × 720", "16:9", "تھمب نیلز اور چینل آرٹ کی بنیاد"],
      },
      {
        platform: "Website Hero",
        cells: ["Website Hero", "1920 × 1080", "16:9", "لینڈنگ بینرز اور ہوم پیج ہیرو"],
      },
      {
        platform: "Blog",
        cells: ["Blog", "1200 × 800", "3:2", "فیچرڈ امیجز اور آرٹیکل میڈیا"],
      },
      {
        platform: "Email",
        cells: ["Email", "600 × 400", "3:2", "عام چوڑائی والے نیوز لیٹر ہیرو"],
      },
    ],
  },
  benefits: {
    eyebrow: "ٹیمیں کیوں ری سائز کرتی ہیں",
    title: "اصل ڈیلیوری کے لیے ابعاد",
    cards: [
      {
        title: "درست ابعاد",
        body: "سانچوں، CMS بلاکس اور اشتہاری یونٹس سے ملیں بجائے CSS کو بڑی فائلوں کے ارد گرد کھینچنے کے۔",
        icon: "dimensions",
      },
      {
        title: "ریسپانسو امیجز",
        body: "ڈیسک ٹاپ، ٹیبلیٹ اور موبائل دوست سائز تیار کریں تاکہ چھوٹی اسکرینز کم ڈاؤن لوڈ کریں۔",
        icon: "responsive",
      },
      {
        title: "سوشل میڈیا کے لیے تیار",
        body: "روزمرہ استعمال ہونے والے انسٹاگرام، فیس بک اور یوٹیوب باکسز سے شروع کریں۔",
        icon: "social",
      },
      {
        title: "براؤزر پر مبنی",
        body: "ہر لیپ ٹاپ پر ڈیسک ٹاپ ایڈیٹرز انسٹال کیے بغیر ری سائز کریں۔",
        icon: "browser",
      },
      {
        title: "نجی پروسیسنگ",
        body: "گیسٹ فائلیں عارضی نجی اسٹوریج اور خودکار صفائی استعمال کرتی ہیں۔",
        icon: "privacy",
      },
      {
        title: "اصل محفوظ",
        body: "ڈاؤن لوڈز نئی ری سائز کاپیاں ہیں۔ ماسٹرز آف لائن محفوظ رکھیں۔",
        icon: "safe",
      },
      {
        title: "آسپیکٹ ریشو لاک",
        body: "چوڑائی یا اونچائی سخت کرتے ہوئے قدرتی تناسب برقرار رکھیں۔",
        icon: "lock",
      },
      {
        title: "متعدد فارمیٹس",
        body: "JPG، PNG اور WebP ایک ہی محفوظ گیسٹ ری سائز راستے سے گزرتے ہیں۔",
        icon: "formats",
      },
    ],
  },
  responsive: {
    title: "بہتر ریسپانسو امیجز بنائیں",
    paragraphs: [
      "ریسپانسو ڈیزائن صرف سیال CSS نہیں۔ امیجز پھر بھی مقررہ پکسلز رکھتی ہیں۔ جب فون ڈیسک ٹاپ سائز کا بینر ڈاؤن لوڈ کرے تو کارکردگی متاثر ہوتی ہے چاہے لے آؤٹ ٹھیک دکھے۔ ان سیاقوں کے لیے سائز منصوبہ بنائیں جو آپ واقعی بھیجتے ہیں۔",
    ],
    levels: [
      {
        title: "ڈیسک ٹاپ",
        body: "ہیرو اور چوڑے مواد اس وقت بڑی چوڑائی جیسے 1920×1080 استعمال کر سکتے ہیں جب لے آؤٹ واقعی ویوپورٹ بھرے۔",
      },
      {
        title: "ٹیبلیٹ",
        body: "درمیانی چوڑائیاں بصری معیار رکھتی ہیں بغیر مکمل ڈیسک ٹاپ پکسل بجٹ درمیانی اسکرینز میں لانے کے۔",
      },
      {
        title: "موبائل",
        body: "پورٹریٹ بینرز اور کارڈ امیجز کو اضافی چوڑائی جلد کم کرنی چاہیے — فونز کو اکثر ملٹی میگا پکسل پس منظر کی ضرورت نہیں۔",
      },
      {
        title: "ریٹینا ڈسپلے",
        body: "تقریباً 1.5–2× CSS باکس تیز لگ سکتا ہے، مگر ہمیشہ دوگنا کرنا مدد بند کر دیتا ہے اور صرف بینڈوڈتھ خرچ کرتا ہے۔",
      },
      {
        title: "بینڈوڈتھ اور SEO",
        body: "درست ابعاد لوڈ وقت اور Core Web Vitals بہتر بناتے ہیں جو ان صفحات کو انعام دیتے ہیں جو استعمال کنندگان واقعی استعمال کر سکیں۔",
      },
    ],
    note: "صحیح سائز کی امیجز لوڈنگ کی رفتار بہتر بناتی ہیں اور چھوٹی ڈیوائسز پر غیر ضروری پکسلز ڈاؤن لوڈ ہونے سے بچاتی ہیں۔",
  },
  tips: {
    eyebrow: "بہتر نتائج",
    title: "بہترین طریقے",
    items: [
      "آسپیکٹ ریشو لاک رکھیں جب تک آپ ارادتاً غیر یکساں اسکیلنگ نہ چاہیں۔",
      "بڑی امیجز کو کمپریس کرنے سے پہلے ری سائز کریں تاکہ غیر استعمال شدہ پکسلز اینکوڈ نہ ہوں۔",
      "سوشل اور اشتہاری نیٹ ورکس پر اشاعت کے وقت پلیٹ فارم ابعاد استعمال کریں۔",
      "پروڈکشن لائبریری بدلنے سے پہلے اصل فائلیں ماسٹر کے طور پر رکھیں۔",
      "جب برانڈ فریمنگ اہم ہو تو متعدد ڈیوائسز پر ری سائز اثاثے آزمائیں۔",
      "ایک دیو ہیکل ایکسپورٹ کی بجائے اہم بریک پوائنٹس کے لیے ریسپانسو ورژن بنائیں۔",
    ],
  },
  faqHeading: "عمومی سوالات",
  faqs: [
    {
      q: "میں امیج آن لائن کیسے ری سائز کروں؟",
      a: "اس صفحے پر JPG، PNG یا WebP اپلوڈ کریں، مقبول سائز منتخب کریں یا حسبِ ضرورت ابعاد درج کریں، ری سائز چلائیں، نتیجہ دیکھیں اور نئی فائل ڈاؤن لوڈ کریں۔",
    },
    {
      q: "کیا ری سائز کرنے سے معیار کم ہوگا؟",
      a: "بڑی امیجز کم کرنا ویب استعمال کے لیے عموماً صاف لگتا ہے۔ شدید اپ اسکیلنگ حقیقی تفصیل نہیں بنا سکتی، اور سخت ڈاؤن اسکیل نرمی لا سکتا ہے — لائیو اثاثہ بدلنے سے پہلے پیش نظارہ کریں۔",
    },
    {
      q: "ری سائز اور کراپ میں کیا فرق ہے؟",
      a: "ری سائز پوری امیج کی چوڑائی اور اونچائی بدلتا ہے۔ کراپ ایک علاقہ منتخب کر کے باہر کا حصہ ہٹا دیتا ہے۔ جب صرف اسکیلنگ کافی نہ ہو تو Crop Images استعمال کریں۔",
    },
    {
      q: "ری سائز اور کمپریس میں کیا فرق ہے؟",
      a: "ری سائز پکسل ابعاد بدلتا ہے۔ کمپریس فائل کا وزن کم کرتا ہے تقریباً اسی ابعاد پر۔ بہت سے ورک فلو پہلے ری سائز پھر کمپریس کرتے ہیں۔",
    },
    {
      q: "کیا میں امیجز بڑا کر سکتا ہوں؟",
      a: "آپ بڑے ابعاد مانگ سکتے ہیں، مگر گیسٹ ری سائز سیٹنگز کے مطابق اپ اسکیلنگ روک سکتا ہے۔ بڑا کرنا کیمرے کی گم شدہ تفصیل واپس نہیں لاتا۔",
    },
    {
      q: "آسپیکٹ ریشو کیا ہے؟",
      a: "آسپیکٹ ریشو چوڑائی اور اونچائی کا تناسب ہے، جیسے 1:1 یا 16:9۔ اسے لاک رکھنے سے سائز بدلتے ہوئے تناسب قدرتی رہتا ہے۔",
    },
    {
      q: "ویب سائٹ امیجز کے بہترین ابعاد کیا ہیں؟",
      a: "لے آؤٹ باکس سے ملیں۔ عام نقطۂ آغاز 1920×1080 ہیرو اور 1200×800 بلاگ امیجز ہیں، پھر کارڈز اور موبائل سلاٹس کے لیے مزید چھوٹا کریں۔",
    },
    {
      q: "کیا امیج ری سائزر سوشل میڈیا سائز سپورٹ کرتا ہے؟",
      a: "ہاں۔ مقبول پری سیٹس میں انسٹاگرام، فیس بک اور یوٹیوب باکسز شامل ہیں جو اسی گیسٹ ری سائز کنٹرولز کو فیڈ کرتے ہیں۔",
    },
    {
      q: "کیا میں ویب سائٹ اور لینڈنگ پیج کے لیے ری سائز کر سکتا ہوں؟",
      a: "ہاں۔ Website Hero، Blog Image یا اپنے تھیم سے ملنے والے حسبِ ضرورت ابعاد استعمال کریں، پھر اگر فائل اب بھی بھاری ہو تو کمپریس کریں۔",
    },
    {
      q: "امیج ری سائزر کی گیسٹ حدود کیا ہیں؟",
      a: "روزانہ آپریشنز اور زیادہ سے زیادہ اپلوڈ سائز اپلوڈر کے اوپر استعمال کی پٹی میں دکھائی دیتے ہیں۔ زیادہ حدود کے لیے اکاؤنٹ درکار ہو سکتا ہے۔",
    },
    {
      q: "کیا ری سائزر اپلوڈز نجی ہیں؟",
      a: "گیسٹ فائلیں عارضی نجی اسٹوریج استعمال کرتی ہیں اور صفحے پر دکھائے گئے برقرار رکھنے کے کاؤنٹ ڈاؤن کے مطابق خودکار حذف ہوتی ہیں۔",
    },
    {
      q: "Resize Images کے لیے زیادہ سے زیادہ اپلوڈ سائز کیا ہے؟",
      a: "زیادہ سے زیادہ سائز استعمال کی پٹی میں دکھائے گئے گیسٹ اپلوڈ حد کے مطابق ہے۔ بہت بڑی فائلیں پروسیسنگ سے پہلے مسترد ہوتی ہیں۔",
    },
    {
      q: "کیا میں JPG، PNG اور WebP ری سائز کر سکتا ہوں؟",
      a: "ہاں۔ یہ حب ان فارمیٹس کو قبول کرتا ہے اور آؤٹ پٹ پر وہی کنٹینر رکھتا ہے۔ فارمیٹ مخصوص صفحات ہر قسم کی گہری رہنمائی دیتے ہیں۔",
    },
    {
      q: "کیا میں موبائل دوست سائز تیار کر سکتا ہوں؟",
      a: "ہاں۔ Mobile Banner یا حسبِ ضرورت پورٹریٹ ابعاد استعمال کریں، پھر اشاعت سے پہلے فون ویوپورٹ پر آزمائیں۔",
    },
    {
      q: "کیا Resize Images اصل امیج بدلتا ہے؟",
      a: "نہیں۔ ٹول نیا ری سائز ڈاؤن لوڈ بناتا ہے۔ آپ کی ڈیوائس پر اصل فائل ویسی ہی رہتی ہے۔",
    },
  ],
  related: {
    eyebrow: "متعلقہ زمرے",
    title: "ری سائز کے بعد جاری رکھیں",
    tools: [
      {href: "/convert-image", title: "امیج کنورٹر", body: "جب WebP، JPG یا PNG بہتر ڈیلیوری فارمیٹ ہو تو کنٹینر بدلیں۔"},
      {href: "/compress-image", title: "امیج کمپریسر", body: "ابعاد درست ہونے کے بعد فائل کا وزن کم کریں۔"},
      {href: "/crop-image", title: "امیجز کراپ کریں", body: "جب صرف اسکیلنگ کافی نہ ہو تو موضوع کو دوبارہ فریم کریں۔"},
      {href: "/bulk-resize", title: "بلک ری سائز", body: "پورے قطار پر ایک سائز پروفائل لگائیں۔"},
      {href: "/resize-jpg", title: "JPG ری سائز", body: "عکسی JPG سائزنگ مخصوص رہنمائی کے ساتھ۔"},
      {href: "/resize-png", title: "PNG ری سائز", body: "شفافیت ذہن میں رکھتے ہوئے PNG گرافکس۔"},
      {href: "/resize-webp", title: "WebP ری سائز", body: "کارکردگی صفحات کے لیے جدید WebP سائزنگ۔"},
    ],
  },
  cta: {
    title: "اپنی امیجز ری سائز کرنے کے لیے تیار؟",
    body: "ابھی امیج اپلوڈ کریں یا زیادہ حدود، محفوظ پروجیکٹس اور جدید امیج ایڈیٹنگ ٹولز کے لیے مفت اکاؤنٹ بنائیں۔",
    primaryLabel: "امیجز ری سائز کریں",
    secondaryLabel: "مفت اکاؤنٹ بنائیں",
    secondaryHref: "/register",
  },
};

export function getResizeImageCopy(locale: string): ResizeImageCopy {
  return localizedCopy(locale, {en, ur});
}

export function isResizeImageLocale(locale: string): locale is AppLocale {
  return isAppLocale(locale);
}
