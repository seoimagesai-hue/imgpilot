/**
 * Image Compressor master hub — pillar page for "image compressor" keywords.
 * Distinct from Compress JPG/PNG/WebP landings and Bulk Compress.
 */
import type {AppLocale} from "@/i18n/routing";

export type CompressImageFaq = {q: string; a: string};

export type CompressImageCopy = {
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
  types: {
    eyebrow: string;
    title: string;
    intro: string;
    cards: {title: string; body: string; intent: string}[];
  };
  popular: {
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
  formats: {
    title: string;
    intro: string;
    caption: string;
    columns: string[];
    rows: {format: string; cells: string[]}[];
  };
  benefits: {
    eyebrow: string;
    title: string;
    cards: {
      title: string;
      body: string;
      icon:
        | "smaller"
        | "speed"
        | "seo"
        | "bandwidth"
        | "upload"
        | "privacy"
        | "browser"
        | "safe";
    }[];
  };
  performance: {
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
  faqs: CompressImageFaq[];
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

const en: CompressImageCopy = {
  metaTitle: "Image Compressor Online Free | SEO Images",
  metaDescription:
    "Compress JPG, PNG and WebP images online using a secure browser-based image compressor. Reduce image file sizes for websites, email and social media.",
  h1: "Compress Images Online",
  breadcrumbCurrent: "Compress Images Online",
  hero: {
    badge: "ONLINE IMAGE COMPRESSOR",
    paragraph:
      "Reduce the file size of JPG, PNG and WebP images without installing software. Upload an image, optimize it in your browser and download a smaller file ready for websites, emails and social media.",
    trust: ["JPG", "PNG", "WebP", "Browser Based", "Secure Processing"],
    uploadCta: "Compress Images",
    learnMoreCta: "Learn More",
    heroImageAlt:
      "Browser image compressor with JPG, PNG and WebP files entering an optimization engine and leaving as smaller downloads",
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
      {title: "Same-format optimize", body: "Compress JPG, PNG or WebP without forced format switching."},
      {title: "Quality controls", body: "Pick Maximum Quality, Balanced or Maximum Compression intent."},
      {title: "Private processing", body: "Files stay in temporary private storage."},
      {title: "Automatic cleanup", body: "Guest outputs expire with the session countdown."},
    ],
  },
  types: {
    eyebrow: "COMPRESSION TYPES",
    title: "How Compression Choices Map to Real Controls",
    intro:
      "This hub uses the shared guest compress engine. Lossy and lossless describe encoding behavior; Balanced and Maximum Compression map to the quality intents you can select in the tool.",
    cards: [
      {
        title: "Lossy Compression",
        body: "Reduce file size by discarding some detail — typical for photographic JPG and WebP when a small quality trade is acceptable.",
        intent: "Common for photos",
      },
      {
        title: "Lossless Compression",
        body: "Shrink encoded weight without intentionally removing visible detail — more common in PNG-oriented passes that keep crisp graphics.",
        intent: "Graphics-friendly",
      },
      {
        title: "Balanced Compression",
        body: "The recommended website default — solid size wins while keeping most everyday images looking natural.",
        intent: "Maps to Balanced",
      },
      {
        title: "Maximum Compression",
        body: "Chase the smallest file when bandwidth and storage matter more than fine texture. Always preview before publishing.",
        intent: "Maps to Maximum Compression",
      },
    ],
  },
  popular: {
    eyebrow: "POPULAR COMPRESSION TOOLS",
    title: "Jump to a Format-Specific Compressor",
    intro: "Need guidance tailored to one container? These pages use the same compress engine as this hub.",
    cards: [
      {
        href: "/compress-jpg",
        title: "Compress JPG",
        body: "Optimize photographic JPG files for web, email and social delivery.",
      },
      {
        href: "/compress-png",
        title: "Compress PNG",
        body: "Reduce PNG weight for logos, UI and graphics without switching formats.",
      },
      {
        href: "/compress-webp",
        title: "Compress WebP",
        body: "Tighten already-modern WebP assets for performance budgets.",
      },
      {
        href: "/bulk-compress",
        title: "Bulk Compress Images",
        body: "Optimize many files in one queue and download a ZIP.",
      },
    ],
  },
  intro: {
    eyebrow: "IMAGE OPTIMIZATION",
    title: "Why Compress Images?",
    paragraphs: [
      "Uncompressed or lightly exported images are one of the easiest ways to make a page feel slow. A single hero photo that looks fine on a designer’s laptop can cost megabytes after it is uploaded untouched. Compressing keeps the same visual job — a product shot, a banner, a blog thumbnail — while shipping fewer bytes to every visitor.",
      "Website speed is not a vanity metric. Shoppers abandon sluggish product pages, readers bounce before the article loads, and marketing landing pages waste paid traffic when media dominates the network. Smaller images shorten the time until meaningful content appears, especially on mobile networks that still throttle or stutter.",
      "Core Web Vitals reward that discipline. Metrics that watch loading and visual stability improve when large media stops competing with text and interaction. Compression is not a substitute for correct dimensions, but it removes weight that never needed to leave the origin server in the first place.",
      "Bandwidth and storage matter on both sides of a CDN. Every unnecessary megabyte multiplies across page views, campaigns and regions. Compressing before publish lowers origin transfer, CDN bills and the amount of data a user burns on a monthly mobile plan. The same math applies to cloud buckets that quietly grow as teams archive full-resolution exports by habit.",
      "Email attachments and messaging portals still reject oversized files. Compressing a photo before you attach it avoids bounced messages and broken approval chains. Social platforms also re-encode uploads; starting from a lighter master reduces surprise smearing when an ad creative is resized again downstream.",
      "Mobile browsing intensifies every choice. Small screens still download large assets unless you intervene. Compressed images reach the viewport sooner, keep scroll smoother and reduce heat and battery drain caused by decoding overweight bitmaps. That user experience quietly feeds SEO: search systems observe which pages satisfy visitors and which feel unfinished.",
      "SEO also benefits indirectly through engagement. Pages that load reliably earn longer sessions and clearer crawl signals. Compressing imagery is one of the few content changes teams can make repeatedly without redesigning a template — especially when the same quality intent is reused across a catalog.",
      "CDN delivery finishes the story. Optimized files cache cleaner, propagate faster and leave more room for script and font budgets. When your library mixes JPG photographs, PNG graphics and WebP delivery assets, a format-aware compressor keeps each container honest instead of forcing every file through the same blunt setting. SEO Images keeps that work in the browser: upload once, choose a quality intent, download a smaller copy and leave the original on your device untouched.",
    ],
  },
  howItWorks: {
    title: "How Image Compression Works",
    paragraphs: [
      "Digital images store color samples, sometimes alpha, and often leftover metadata. Compression rewrites that payload so the file occupies fewer bytes while still painting something your eyes accept as the same picture.",
      "Quality controls decide how aggressive that rewrite is. Higher settings preserve more texture; lower settings chase size. Guest compress keeps the same format (JPG stays JPG, PNG stays PNG, WebP stays WebP) so you are optimizing delivery weight rather than silently converting containers.",
    ],
    points: [
      "Image data is re-encoded with a quality intent you can preview",
      "Lossy paths trade some detail for smaller photographic files",
      "Lossless-leaning PNG passes focus on encoded weight for graphics",
      "Metadata may be reduced or summarized depending on the path — keep masters when EXIF matters",
      "Compression ratios vary by content — busy photos shrink differently than flat UI",
      "Before/after previews help you stop before the visual cost is too high",
    ],
    imageAlt:
      "Infographic showing an original image becoming a smaller optimized file with quality controls and reduction indicators",
  },
  formats: {
    title: "Supported Formats",
    intro:
      "Same-format compression means the output stays JPG, PNG or WebP. Pick the tool that matches the file you already have.",
    caption: "How JPG, PNG and WebP typically behave under compression",
    columns: [
      "Format",
      "Compression type",
      "Transparency",
      "Typical file size",
      "Website usage",
      "Photography",
      "Graphics",
      "Compatibility",
    ],
    rows: [
      {
        format: "JPG",
        cells: [
          "JPG",
          "Mostly lossy",
          "No alpha",
          "Often compact for photos",
          "Heroes & catalogs",
          "Excellent",
          "Poor for logos",
          "Nearly universal",
        ],
      },
      {
        format: "PNG",
        cells: [
          "PNG",
          "Lossless-leaning",
          "Yes",
          "Can stay large for photos",
          "UI & overlays",
          "Usually overkill",
          "Excellent",
          "Excellent",
        ],
      },
      {
        format: "WebP",
        cells: [
          "WebP",
          "Modern lossy/lossless",
          "Yes (when used)",
          "Often smallest",
          "Performance pages",
          "Strong",
          "Strong with alpha",
          "Modern browsers",
        ],
      },
    ],
  },
  benefits: {
    eyebrow: "WHY TEAMS COMPRESS",
    title: "Smaller Files with Production Controls",
    cards: [
      {
        title: "Smaller Files",
        body: "Cut unnecessary bytes so libraries, emails and CDN caches stay lean.",
        icon: "smaller",
      },
      {
        title: "Faster Websites",
        body: "Lighter media helps pages become usable sooner on real networks.",
        icon: "speed",
      },
      {
        title: "Better SEO",
        body: "Improved loading and engagement signals support healthier search outcomes.",
        icon: "seo",
      },
      {
        title: "Lower Bandwidth",
        body: "Serve less data per view across campaigns, locales and devices.",
        icon: "bandwidth",
      },
      {
        title: "Faster Uploads",
        body: "Smaller masters and outputs move through CMS and DAM tools more quickly.",
        icon: "upload",
      },
      {
        title: "Private Processing",
        body: "Guest files use temporary private storage with automatic cleanup.",
        icon: "privacy",
      },
      {
        title: "Browser Based",
        body: "Optimize without installing desktop suites on every contributor laptop.",
        icon: "browser",
      },
      {
        title: "Original Protected",
        body: "Downloads are new compressed copies. Keep masters offline for safety.",
        icon: "safe",
      },
    ],
  },
  performance: {
    title: "Choosing the Right Compression Level",
    paragraphs: [
      "Start with how the image will be judged. Photography and brand detail need higher quality. Catalog grids and thumbnails can often take a stronger pass. The guest compressor exposes quality intents so you do not invent anonymous magic numbers.",
    ],
    levels: [
      {
        title: "Maximum Quality",
        body: "Best for photography, hero frames and any asset where fine texture matters more than the last kilobyte.",
      },
      {
        title: "Balanced",
        body: "Best for websites, blogs and everyday publishing when you want a reliable size win without a harsh look.",
      },
      {
        title: "Maximum Compression",
        body: "Best when file size is the priority — previews, drafts and bandwidth-constrained delivery. Spot-check carefully.",
      },
    ],
    note: "Images should always be previewed before replacing production assets.",
  },
  tips: {
    eyebrow: "BETTER RESULTS",
    title: "Best Practices",
    items: [
      "Compress before uploading to a CMS when the destination re-encodes blindly.",
      "Resize large images first when dimensions exceed the layout — then compress.",
      "Keep original files as masters before replacing production libraries.",
      "Preview optimized versions on desktop and mobile when brand polish matters.",
      "Use WebP when your stack supports modern delivery and smaller pages.",
      "Test page speed after publishing so compression choices prove themselves in production.",
    ],
  },
  faqHeading: "Frequently Asked Questions",
  faqs: [
    {
      q: "What is image compression?",
      a: "Image compression rewrites a file so it uses fewer bytes while still displaying a usable picture. SEO Images keeps the same format unless you choose a dedicated convert tool.",
    },
    {
      q: "What is the difference between lossy and lossless compression?",
      a: "Lossy compression removes some detail to shrink photos. Lossless or lossless-leaning paths try to keep visible pixels intact while packing data more efficiently — common for PNG graphics.",
    },
    {
      q: "Does compression always reduce image quality?",
      a: "Stronger settings can soften texture or introduce artifacts. Balanced intents often look fine for web use, but you should preview before replacing a live asset.",
    },
    {
      q: "Which format compresses best?",
      a: "It depends on content. WebP often wins for modern web delivery, JPG remains excellent for photographs, and PNG is better judged by whether you need transparency than raw size alone.",
    },
    {
      q: "Can PNG images be compressed online?",
      a: "Yes. Use Compress PNG or this hub with a PNG upload. PNG passes keep the PNG container instead of silently converting to JPG.",
    },
    {
      q: "Can WebP images be compressed online?",
      a: "Yes. Compress WebP or this hub can tighten already-modern WebP files for stricter performance budgets.",
    },
    {
      q: "Can JPG images be compressed online?",
      a: "Yes. Compress JPG is the dedicated path for photographic JPG optimization, and this hub accepts JPG as well.",
    },
    {
      q: "What are the guest limits for the image compressor?",
      a: "Daily operations and maximum upload size appear in the usage bar above the uploader. Higher limits may require an account.",
    },
    {
      q: "Are image compressor uploads private?",
      a: "Guest files use temporary private storage and are deleted automatically according to the retention countdown on the page.",
    },
    {
      q: "What is the maximum upload size for Compress Images?",
      a: "The maximum size matches the guest upload limit shown in the usage bar. Oversized files are rejected before processing starts.",
    },
    {
      q: "Can I compress many images in one batch?",
      a: "Yes. Use Bulk Compress Images when you need a shared quality profile across a queue and a ZIP download.",
    },
    {
      q: "Does compressing images improve website speed?",
      a: "Usually yes when media was overweight. Pair compression with Resize Images when pixel dimensions are larger than the layout needs.",
    },
    {
      q: "Is image compression good for SEO?",
      a: "Faster pages and healthier Core Web Vitals support better user signals. Compression is one practical step inside a broader performance plan.",
    },
    {
      q: "Can I compress images for email attachments?",
      a: "Yes. Smaller JPG, PNG or WebP files are less likely to hit mailbox limits. Preview quality first if the attachment is customer-facing.",
    },
    {
      q: "Are original images changed by Compress Images?",
      a: "No. The tool creates a new compressed download. The original file on your device stays unchanged.",
    },
  ],
  related: {
    eyebrow: "RELATED CATEGORIES",
    title: "Continue Optimizing After Compression",
    tools: [
      {href: "/convert-image", title: "Image Converter", body: "Change containers when WebP, JPG or PNG is the better delivery format."},
      {href: "/resize-image", title: "Image Resizer", body: "Set dimensions before or after you compress."},
      {href: "/crop-image", title: "Crop Images", body: "Frame subjects so you are not compressing unused pixels."},
      {href: "/bulk-compress", title: "Bulk Compress", body: "Optimize entire libraries in one queue."},
      {href: "/compress-jpg", title: "Compress JPG", body: "Photographic JPG optimization with dedicated guidance."},
      {href: "/compress-png", title: "Compress PNG", body: "PNG graphics compression without forced flattening."},
      {href: "/compress-webp", title: "Compress WebP", body: "Further lighten modern WebP assets."},
    ],
  },
  cta: {
    title: "Ready to Compress Your Images?",
    body: "Upload an image now or create a free account for larger limits, project history and advanced image optimization tools.",
    primaryLabel: "Compress Images",
    secondaryLabel: "Create Free Account",
    secondaryHref: "/register",
  },
};

const ur: CompressImageCopy = {
  metaTitle: "آن لائن امیج کمپریسر مفت | SEO Images",
  metaDescription:
    "محفوظ براؤزر پر مبنی امیج کمپریسر سے JPG، PNG اور WebP امیجز آن لائن کمپریس کریں۔ ویب سائٹس، ای میل اور سوشل میڈیا کے لیے فائل سائز کم کریں۔",
  h1: "آن لائن امیجز کمپریس کریں",
  breadcrumbCurrent: "آن لائن امیجز کمپریس کریں",
  hero: {
    badge: "ONLINE IMAGE COMPRESSOR",
    paragraph:
      "سافٹ ویئر انسٹال کیے بغیر JPG، PNG اور WebP امیجز کا فائل سائز کم کریں۔ امیج اپ لوڈ کریں، براؤزر میں آپٹیمائز کریں اور ویب سائٹس، ای میلز اور سوشل میڈیا کے لیے تیار چھوٹی فائل ڈاؤن لوڈ کریں۔",
    trust: ["JPG", "PNG", "WebP", "براؤزر پر مبنی", "محفوظ پروسیسنگ"],
    uploadCta: "امیجز کمپریس کریں",
    learnMoreCta: "مزید جانیں",
    heroImageAlt:
      "براؤزر امیج کمپریسر جہاں JPG، PNG اور WebP فائلیں آپٹیمائزیشن انجن میں داخل ہو کر چھوٹے ڈاؤن لوڈز بنتی ہیں",
  },
  guestBar: {
    title: "مہمان استعمال",
    deletionTitle: "خودکار حذف",
    countdownLabel: "عارضی فائلیں خودبخود حذف ہوں گی",
  },
  upload: {
    heading: "اپنی امیجز اپ لوڈ کریں",
    supporting: "JPG، PNG یا WebP امیجز گھسیٹ کر چھوڑیں یا اپنی ڈیوائس سے براؤز کریں۔",
    chooseLabel: "امیج چنیں",
    formatsHint: "JPG · PNG · WebP · زیادہ سے زیادہ فائل سائز اوپر دکھائی گئی مہمان حدود کے مطابق ہے",
    features: [
      {title: "اسی فارمیٹ میں آپٹیمائز", body: "JPG، PNG یا WebP کو زبردستی فارمیٹ تبدیلی کے بغیر کمپریس کریں۔"},
      {title: "کوالٹی کنٹرولز", body: "Maximum Quality، Balanced یا Maximum Compression ارادہ منتخب کریں۔"},
      {title: "نجی پروسیسنگ", body: "فائلیں عارضی نجی اسٹوریج میں رہتی ہیں۔"},
      {title: "خودکار صفائی", body: "مہمان آؤٹ پٹس سیشن کاؤنٹ ڈاؤن کے ساتھ ختم ہوتے ہیں۔"},
    ],
  },
  types: {
    eyebrow: "کمپریشن کی اقسام",
    title: "کمپریشن کے انتخاب حقیقی کنٹرولز سے کیسے ملتے ہیں",
    intro:
      "یہ hub مشترکہ مہمان کمپریس انجن استعمال کرتا ہے۔ Lossy اور lossless انکوڈنگ رویے بیان کرتے ہیں؛ Balanced اور Maximum Compression ان کوالٹی ارادوں سے ملتے ہیں جو آپ ٹول میں منتخب کر سکتے ہیں۔",
    cards: [
      {
        title: "Lossy Compression",
        body: "کچھ تفصیل ہٹا کر فائل سائز کم کریں — فوٹوگرافک JPG اور WebP کے لیے عام جب معیاری معیار پر معمولی سودا قابلِ قبول ہو۔",
        intent: "فوٹوز کے لیے عام",
      },
      {
        title: "Lossless Compression",
        body: "ظاہری تفصیل جان بوجھ کر ہٹائے بغیر انکوڈڈ وزن کم کریں — PNG پر مبنی پاسز میں زیادہ عام جو تیز گرافکس رکھتے ہیں۔",
        intent: "گرافکس کے لیے موزوں",
      },
      {
        title: "Balanced Compression",
        body: "تجویز کردہ ویب ڈیفالٹ — اچھی سائز کمی کے ساتھ زیادہ تر روزمرہ امیجز قدرتی لگتی ہیں۔",
        intent: "Balanced سے ملتا ہے",
      },
      {
        title: "Maximum Compression",
        body: "جب بینڈوتھ اور اسٹوریج بجائے باریک بناوٹ زیادہ اہم ہوں تو سب سے چھوٹی فائل کا پیچھا کریں۔ شائع کرنے سے پہلے ہمیشہ پیش نظارہ کریں۔",
        intent: "Maximum Compression سے ملتا ہے",
      },
    ],
  },
  popular: {
    eyebrow: "مشہور کمپریشن ٹولز",
    title: "فارمیٹ مخصوص کمپریسر پر جائیں",
    intro: "ایک کنٹینر کے لیے مخصوص رہنمائی چاہیے؟ یہ صفحات اسی کمپریس انجن کو استعمال کرتے ہیں جو اس hub پر ہے۔",
    cards: [
      {
        href: "/compress-jpg",
        title: "Compress JPG",
        body: "ویب، ای میل اور سوشل ڈیلیوری کے لیے فوٹوگرافک JPG فائلیں آپٹیمائز کریں۔",
      },
      {
        href: "/compress-png",
        title: "Compress PNG",
        body: "لوگوز، UI اور گرافکس کے لیے فارمیٹ تبدیل کیے بغیر PNG وزن کم کریں۔",
      },
      {
        href: "/compress-webp",
        title: "Compress WebP",
        body: "پہلے سے جدید WebP اثاثے سخت performance بجٹس کے لیے ہلکے کریں۔",
      },
      {
        href: "/bulk-compress",
        title: "Bulk Compress Images",
        body: "ایک قطار میں بہت سی فائلیں آپٹیمائز کریں اور ZIP ڈاؤن لوڈ کریں۔",
      },
    ],
  },
  intro: {
    eyebrow: "امیج آپٹیمائزیشن",
    title: "امیجز کیوں کمپریس کریں؟",
    paragraphs: [
      "غیر کمپریس یا ہلکی ایکسپورٹ شدہ امیجز صفحہ سست محسوس کرنے کا آسان ترین طریقہ ہے۔ ڈیزائنر کے لیپ ٹاپ پر ٹھیک لگنے والی ایک ہیرو فوٹو، بغیر چھواۓ اپ لوڈ ہونے کے میگا بائٹس لے سکتی ہے۔ کمپریشن بصری کام وہی رکھتی ہے — پروڈکٹ شاٹ، بینر، بلاگ تھمب نیل — مگر ہر زائر کو کم bytes بھیجتی ہے۔",
      "ویب سائٹ کی رفتار صرف شوآف میٹرک نہیں۔ خریدار سست پروڈکٹ صفحات چھوڑ دیتے ہیں، قارئین مضمون لوڈ ہونے سے پہلے چلے جاتے ہیں، اور مارکیٹنگ لینڈنگ پیجز جب media نیٹ ورک پر حاوی ہو تو ادا شدہ ٹریفک ضائع کرتی ہیں۔ چھوٹی امیجز معنی خیز مواد ظاہر ہونے کا وقت کم کرتی ہیں، خاص طور پر موبائل نیٹ ورکس پر جو اب بھی throttle یا رک رک کر چلتے ہیں۔",
      "Core Web Vitals اس نظم و ضبط کا انعام دیتے ہیں۔ لوڈنگ اور بصری استحکام دیکھنے والے میٹرکس بہتر ہوتے ہیں جب بڑی media متن اور تعامل سے مقابلہ بند کر دے۔ کمپریشن صحیح ابعاد کا متبادل نہیں، مگر وہ وزن ہٹاتی ہے جو اصل سرور سے پہلے ہی نہیں جانا چاہیے تھا۔",
      "بینڈوتھ اور اسٹوریج CDN کے دونوں طرف اہم ہیں۔ ہر غیر ضروری میگا بائٹ page views، مہمات اور علاقوں میں ضرب کھاتا ہے۔ شائع سے پہلے کمپریس کرنے سے origin transfer، CDN بل اور موبائل پلان پر صارف کا ڈیٹا کم ہوتا ہے۔ یہی حساب cloud buckets پر بھی لاگو ہے جو عادتاً full-resolution exports سے خاموشی سے بڑھتے ہیں۔",
      "ای میل اٹیچمنٹس اور messaging portals اب بھی بڑی فائلیں مسترد کرتے ہیں۔ منسلک کرنے سے پہلے فото کمپریس کرنے سے bounced messages اور ٹوٹی منظوری کی زنجیریں بچتی ہیں۔ سوشل پلیٹ فارمز اپ لوڈز دوبارہ encode کرتے ہیں؛ ہلکے master سے شروع کرنے پر جب ad creative دوبارہ resize ہو تو حیران کن smearing کم ہوتی ہے۔",
      "موبائل براؤزنگ ہر انتخاب کو شدید کرتا ہے۔ چھوٹی اسکرینیں بھی بڑے اثاثے ڈاؤن لوڈ کرتی ہیں جب تک آپ مداخلت نہ کریں۔ کمپریس شدہ امیجز viewport تک جلدی پہنچتی ہیں، scroll ہموار رکھتی ہیں اور overweight bitmaps decode کرنے سے گرمی اور بیٹری drain کم کرتی ہیں۔ یہ user experience خاموشی سے SEO کو فائدہ دیتی ہے: سرچ سسٹمز دیکھتے ہیں کون سے صفحات زائرین کو مطمئن کرتے ہیں اور کون نامکمل لگتے ہیں۔",
      "SEO بالواسطہ engagement سے بھی فائدہ اٹھاتا ہے۔ جو صفحات قابلِ اعتماد لوڈ ہوتے ہیں انہیں لمبے sessions اور واضح crawl signals ملتے ہیں۔ imagery کمپریس کرنا ان چند content تبدیلیوں میں سے ہے جو ٹیمیں ٹیمپلیٹ دوبارہ ڈیزائن کیے بغیر بار بار کر سکتی ہیں — خاص طور پر جب ایک ہی کوالٹی ارادہ پورے کیٹلاگ میں دہرایا جائے۔",
      "CDN ڈیلیوری کہانی مکمل کرتی ہے۔ آپٹیمائزڈ فائلیں صاف cache ہوتی ہیں، تیزی سے پھیلتی ہیں اور script و font بجٹ کے لیے زیادہ جگہ چھوڑتی ہیں۔ جب آپ کی لائبریری JPG فوٹوز، PNG گرافکس اور WebP ڈیلیوری اثاثے ملاتی ہے، تو فارمیٹ-aware کمپریسر ہر کنٹینر کو ایماندار رکھتا ہے بجائے ہر فائل کو ایک ہی کُند سیٹنگ سے گزارنے کے۔ SEO Images یہ کام براؤزر میں رکھتا ہے: ایک بار اپ لوڈ، کوالٹی ارادہ چنیں، چھوٹی کاپی ڈاؤن لوڈ کریں اور اصل ڈیوائس پر جوں کی توں رہنے دیں۔",
    ],
  },
  howItWorks: {
    title: "امیج کمپریشن کیسے کام کرتی ہے",
    paragraphs: [
      "ڈیجیٹل امیجز رنگ کے نمونے، بعض اوقات alpha، اور اکثر باقی metadata ذخیرہ کرتی ہیں۔ کمپریشن اس payload کو دوبارہ لکھتی ہے تاکہ فائل کم bytes لے مگر پھر بھی وہی تصویر paint ہو جو آنکھیں قبول کریں۔",
      "کوالٹی کنٹرولز بتاتے ہیں یہ دوبارہ لکھنا کتنا aggressive ہے۔ اعلیٰ سیٹنگز زیادہ texture رکھتی ہیں؛ کم سیٹنگز سائز کا پیچھا کرتی ہیں۔ مہمان کمپریس وہی فارمیٹ رکھتا ہے (JPG JPG، PNG PNG، WebP WebP) تاکہ آپ ڈیلیوری وزن آپٹیمائز کریں، خاموشی سے کنٹینرز تبدیل نہ کریں۔",
    ],
    points: [
      "امیج ڈیٹا آپ کے preview والے کوالٹی ارادے سے دوبارہ encode ہوتا ہے",
      "Lossy راستے فوٹوگرافک فائلیں چھوٹی کرنے کے لیے کچھ تفصیل کا سودا کرتے ہیں",
      "Lossless-leaning PNG پاسز گرافکس کے لیے انکوڈڈ وزن پر فوکس کرتے ہیں",
      "راستے کے مطابق metadata کم یا خلاصہ ہو سکتی ہے — جب EXIF اہم ہو masters رکھیں",
      "کمپریشن تناسب مواد پر منحصر ہے — مصروف فوٹوز فلیٹ UI سے مختلف سکڑتی ہیں",
      "پیش/بعد previews بصری قیمت بہت بڑھنے سے پہلے رکنے میں مدد دیتے ہیں",
    ],
    imageAlt:
      "انفوگرافک جس میں اصل امیج کوالٹی کنٹرولز اور کمی کے اشاروں کے ساتھ چھوٹی آپٹیمائزڈ فائل بنتی ہے",
  },
  formats: {
    title: "سپورٹڈ فارمیٹس",
    intro:
      "Same-format کمپریشن کا مطلب آؤٹ پٹ JPG، PNG یا WebP ہی رہتا ہے۔ وہ ٹول چنیں جو آپ کی موجودہ فائل سے ملے۔",
    caption: "JPG، PNG اور WebP کمپریشن کے تحت عام طور پر کیسے رویہ کرتے ہیں",
    columns: [
      "فارمیٹ",
      "کمپریشن کی قسم",
      "شفافیت",
      "عام فائل سائز",
      "ویب سائٹ استعمال",
      "فوٹوگرافی",
      "گرافکس",
      "مطابقت",
    ],
    rows: [
      {
        format: "JPG",
        cells: [
          "JPG",
          "زیادہ تر lossy",
          "Alpha نہیں",
          "فوٹوز کے لیے اکثر compact",
          "Heroes اور کیٹلاگ",
          "بہترین",
          "لوگوز کے لیے کم",
          "تقریباً عالمی",
        ],
      },
      {
        format: "PNG",
        cells: [
          "PNG",
          "Lossless-leaning",
          "ہاں",
          "فوٹوز کے لیے بڑی رہ سکتی ہے",
          "UI اور overlays",
          "عام طور پر overkill",
          "بہترین",
          "بہترین",
        ],
      },
      {
        format: "WebP",
        cells: [
          "WebP",
          "جدید lossy/lossless",
          "ہاں (جب استعمال ہو)",
          "اکثر سب سے چھوٹی",
          "Performance صفحات",
          "مضبوط",
          "Alpha کے ساتھ مضبوط",
          "جدید براؤزرز",
        ],
      },
    ],
  },
  benefits: {
    eyebrow: "ٹیمیں کیوں کمپریس کرتی ہیں",
    title: "پروڈکشن کنٹرولز کے ساتھ چھوٹی فائلیں",
    cards: [
      {
        title: "چھوٹی فائلیں",
        body: "غیر ضروری bytes کاٹیں تاکہ لائبریریز، ای میلز اور CDN caches ہلکی رہیں۔",
        icon: "smaller",
      },
      {
        title: "تیز ویب سائٹس",
        body: "ہلکی media حقیقی نیٹ ورکس پر صفحات جلد usable بنانے میں مدد دیتی ہے۔",
        icon: "speed",
      },
      {
        title: "بہتر SEO",
        body: "بہتر لوڈنگ اور engagement signals صحت مند search نتائج میں مدد کرتے ہیں۔",
        icon: "seo",
      },
      {
        title: "کم بینڈوتھ",
        body: "مہمات، locales اور devices میں فی view کم ڈیٹا serve کریں۔",
        icon: "bandwidth",
      },
      {
        title: "تیز اپ لوڈز",
        body: "چھوٹے masters اور outputs CMS اور DAM ٹولز سے تیزی سے گزرتے ہیں۔",
        icon: "upload",
      },
      {
        title: "نجی پروسیسنگ",
        body: "مہمان فائلیں خودکار صفائی کے ساتھ عارضی نجی اسٹوریج استعمال کرتی ہیں۔",
        icon: "privacy",
      },
      {
        title: "براؤزر پر مبنی",
        body: "ہر contributor laptop پر desktop suites انسٹال کیے بغیر آپٹیمائز کریں۔",
        icon: "browser",
      },
      {
        title: "اصل محفوظ",
        body: "ڈاؤن لوڈ نئی کمپریس شدہ کاپیاں ہیں۔ محفوظگی کے لیے masters آف لائن رکھیں۔",
        icon: "safe",
      },
    ],
  },
  performance: {
    title: "صحیح کمپریشن لیول کا انتخاب",
    paragraphs: [
      "سوچیں امیج کا judge کیسے ہوگا۔ فوٹوگرافی اور brand detail کو اعلیٰ کوالٹی چاہیے۔ کیٹلاگ grids اور thumbnails اکثر مضبوط pass برداشت کر سکتے ہیں۔ مہمان کمپریسر کوالٹی ارادے دکھاتا ہے تاکہ آپ گمنام magic numbers نہ بنائیں۔",
    ],
    levels: [
      {
        title: "Maximum Quality",
        body: "فوٹوگرافی، hero frames اور ہر اثاثے کے لیے بہترین جہاں fine texture آخری kilobyte سے زیادہ اہم ہو۔",
      },
      {
        title: "Balanced",
        body: "ویب سائٹس، blogs اور روزمرہ publishing کے لیے بہترین جب قابلِ اعتماد سائز جیت بغیر سخت look چاہیے۔",
      },
      {
        title: "Maximum Compression",
        body: "جب فائل سائز ترجیح ہو — previews، drafts اور بینڈوتھ محدود ڈیلیوری۔ احتیاط سے spot-check کریں۔",
      },
    ],
    note: "پروڈکشن اثاثے بدلنے سے پہلے امیجز کا ہمیشہ preview کریں۔",
  },
  tips: {
    eyebrow: "بہتر نتائج",
    title: "بہترین طریقے",
    items: [
      "جب منزل اندھے دماغ سے re-encode کرے تو CMS میں اپ لوڈ سے پہلے کمپریس کریں۔",
      "جب ابعاد layout سے بڑے ہوں پہلے بڑی امیجز resize کریں — پھر کمپریس کریں۔",
      "پروڈکشن لائبریری بدلنے سے پہلے اصل فائلیں masters کے طور پر رکھیں۔",
      "جب brand polish اہم ہو desktop اور mobile دونوں پر optimized versions preview کریں۔",
      "جب stack جدید ڈیلیوری سپورٹ کرے اور صفحات چھوٹے چاہئیں WebP استعمال کریں۔",
      "شائع کے بعد page speed آزمائیں تاکہ کمپریشن کے انتخاب production میں ثابت ہوں۔",
    ],
  },
  faqHeading: "عمومی سوالات",
  faqs: [
    {
      q: "امیج کمپریشن کیا ہے؟",
      a: "امیج کمپریشن فائل دوبارہ لکھتی ہے تاکہ کم bytes استعمال ہوں مگر قابلِ استعمال تصویر دکھے۔ SEO Images وہی فارمیٹ رکھتا ہے جب تک آپ مخصوص convert ٹول نہ چنیں۔",
    },
    {
      q: "Lossy اور lossless کمپریشن میں کیا فرق ہے؟",
      a: "Lossy کمپریشن فوٹوز چھوٹے کرنے کے لیے کچھ تفصیل ہٹاتی ہے۔ Lossless یا lossless-leaning راستے ظاہر pixels برقرار رکھنے کی کوشش کرتے ہیں — PNG گرافکس کے لیے عام۔",
    },
    {
      q: "کیا کمپریشن ہمیشہ امیج کوالٹی کم کرتی ہے؟",
      a: "مضبوط سیٹنگز texture نرم کر سکتی ہیں یا artifacts لا سکتی ہیں۔ Balanced ارادے اکثر web use کے لیے ٹھیک لگتے ہیں، مگر live asset بدلنے سے پہلے preview کریں۔",
    },
    {
      q: "کون سا فارمیٹ بہترین کمپریس کرتا ہے؟",
      a: "مواد پر منحصر ہے۔ WebP جدید web ڈیلیوری میں اکثر جیتتا ہے، JPG فوٹوز کے لیے بہترین رہتا ہے، اور PNG کو صرف سائز سے نہیں transparency کی ضرورت سے judge کریں۔",
    },
    {
      q: "کیا PNG امیجز آن لائن کمپریس ہو سکتی ہیں؟",
      a: "ہاں۔ Compress PNG یا اس hub میں PNG اپ لوڈ کریں۔ PNG پاسز PNG کنٹینر رکھتے ہیں، خاموشی سے JPG میں تبدیل نہیں کرتے۔",
    },
    {
      q: "کیا WebP امیجز آن لائن کمپریس ہو سکتی ہیں؟",
      a: "ہاں۔ Compress WebP یا یہ hub پہلے سے جدید WebP فائلیں سخت performance بجٹس کے لیے مزید ہلکا کر سکتا ہے۔",
    },
    {
      q: "کیا JPG امیجز آن لائن کمپریس ہو سکتی ہیں؟",
      a: "ہاں۔ Compress JPG فوٹوگرافک JPG آپٹیمائزیشن کا مخصوص راستہ ہے، اور یہ hub JPG بھی قبول کرتا ہے۔",
    },
    {
      q: "امیج کمپریسر کے مہمان limits کیا ہیں؟",
      a: "روزانہ operations اور زیادہ سے زیادہ اپ لوڈ سائز usage bar میں دکھائی جاتی ہے۔ زیادہ limits کے لیے account درکار ہو سکتا ہے۔",
    },
    {
      q: "کیا امیج کمپریسر اپ لوڈز نجی ہیں؟",
      a: "مہمان فائلیں عارضی نجی اسٹوریج استعمال کرتی ہیں اور صفحے پر retention countdown کے مطابق خودبخود حذف ہو جاتی ہیں۔",
    },
    {
      q: "Compress Images کے لیے زیادہ سے زیادہ اپ لوڈ سائز کیا ہے؟",
      a: "زیادہ سے زیادہ سائز usage bar میں دکھائی گئی مہمان اپ لوڈ limit سے ملتی ہے۔ بڑی فائلیں پروسیسنگ شروع ہونے سے پہلے مسترد ہو جاتی ہیں۔",
    },
    {
      q: "کیا میں ایک بیچ میں بہت سی امیجز کمپریس کر سکتا/سکتی ہوں؟",
      a: "ہاں۔ جب shared quality profile اور ZIP ڈاؤنلوڈ چاہیے تو Bulk Compress Images استعمال کریں۔",
    },
    {
      q: "کیا امیجز کمپریس کرنے سے ویب سائٹ تیز ہوتی ہے؟",
      a: "عام طور پر ہاں جب media overweight تھی۔ جب pixel dimensions layout سے بڑے ہوں Resize Images کے ساتھ جوڑیں۔",
    },
    {
      q: "کیا امیج کمپریشن SEO کے لیے اچھا ہے؟",
      a: "تیز صفحات اور صحت مند Core Web Vitals بہتر user signals میں مدد کرتے ہیں۔ کمپریشن وسیع performance منصوبے میں ایک عملی قدم ہے۔",
    },
    {
      q: "کیا میں ای میل اٹیچمنٹس کے لیے امیجز کمپریس کر سکتا/سکتی ہوں؟",
      a: "ہاں۔ چھوٹی JPG، PNG یا WebP فائلیں mailbox limits سے ٹکرانے کا امکان کم کرتی ہیں۔ اگر اٹیچمنٹ customer-facing ہے پہلے کوالٹی preview کریں۔",
    },
    {
      q: "کیا Compress Images اصل امیجز بدلتی ہے؟",
      a: "نہیں۔ ٹول نئی کمپریس شدہ ڈاؤن لوڈ بناتا ہے۔ آپ کی ڈیوائس پر اصل فائل جوں کی توں رہتی ہے۔",
    },
  ],
  related: {
    eyebrow: "متعلقہ زمرے",
    title: "کمپریشن کے بعد آپٹیمائزیشن جاری رکھیں",
    tools: [
      {href: "/convert-image", title: "Image Converter", body: "جب WebP، JPG یا PNG بہتر ڈیلیوری فارمیٹ ہو containers تبدیل کریں۔"},
      {href: "/resize-image", title: "Image Resizer", body: "کمپریس سے پہلے یا بعد ابعاد سیٹ کریں۔"},
      {href: "/crop-image", title: "Crop Images", body: "subjects کو frame کریں تاکہ غیر استعمال pixels کمپریس نہ ہوں۔"},
      {href: "/bulk-compress", title: "Bulk Compress", body: "پوری لائبریری ایک قطار میں آپٹیمائز کریں۔"},
      {href: "/compress-jpg", title: "Compress JPG", body: "مخصوص رہنمائی کے ساتھ فوٹوگرافک JPG آپٹیمائزیشن۔"},
      {href: "/compress-png", title: "Compress PNG", body: "زبردasti flattening کے بغیر PNG گرافکس کمپریشن۔"},
      {href: "/compress-webp", title: "Compress WebP", body: "جدید WebP اثاثے مزید ہلکے کریں۔"},
    ],
  },
  cta: {
    title: "اپنی امیجز کمپریس کرنے کے لیے تیار ہیں؟",
    body: "ابھی امیج اپ لوڈ کریں یا بڑی limits، پروجیکٹ history اور جدید امیج آپٹیمائزیشن ٹولز کے لیے مفت اکاؤنٹ بنائیں۔",
    primaryLabel: "امیجز کمپریس کریں",
    secondaryLabel: "مفت اکاؤنٹ بنائیں",
    secondaryHref: "/register",
  },
};

export function getCompressImageCopy(locale: string): CompressImageCopy {
  return locale === "ur" ? ur : en;
}

export type CompressImageLocale = AppLocale;
