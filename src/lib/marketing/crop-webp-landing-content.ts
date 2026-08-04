/**
 * Crop WebP landing — modern web-optimized WebP crops
 * (distinct from Crop JPG photos and Crop PNG transparent graphics).
 */
import type {AppLocale} from "@/i18n/routing";

export type CropWebpFaq = {q: string; a: string};

export type CropWebpCopy = {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  breadcrumbParent: {href: "/crop-image"; label: string};
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
    imageAlt: string;
  };
  ratios: {
    eyebrow: string;
    title: string;
    intro: string;
    cards: {id: string; title: string; ratio: string; hint: string}[];
  };
  benefits: {
    eyebrow: string;
    title: string;
    cards: {
      title: string;
      body: string;
      icon: "crop" | "responsive" | "webp" | "privacy" | "safe" | "install";
    }[];
  };
  howTo: {
    eyebrow: string;
    title: string;
    steps: {title: string; body: string}[];
    imageAlt: string;
  };
  guide: {
    title: string;
    paragraphs: string[];
    points: string[];
    noteBefore: string;
    noteResizeLabel: string;
    noteResizeHref: "/resize-webp";
    noteMiddle: string;
    noteCompressLabel: string;
    noteCompressHref: "/compress-webp";
    noteAfter: string;
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
  faqs: CropWebpFaq[];
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

const en: CropWebpCopy = {
  metaTitle: "Crop WebP Images Online Free | SEO Images",
  metaDescription:
    "Crop WebP images online using precise crop controls and popular aspect ratios. Create web-ready images and download them securely in seconds.",
  h1: "Crop WebP Images Online",
  breadcrumbParent: {href: "/crop-image", label: "Crop Image"},
  breadcrumbCurrent: "Crop WebP Images Online",
  hero: {
    badge: "WEBP IMAGE CROPPER",
    paragraph:
      "Crop WebP images online to remove unwanted areas while maintaining excellent visual quality. Prepare modern web images for responsive websites, landing pages, blogs and ecommerce stores without installing software.",
    trust: [
      "Modern Web Format",
      "Precise Crop Tool",
      "Private Processing",
      "No Software Required",
    ],
    uploadCta: "Upload WebP",
    heroImageAlt:
      "Browser WebP crop editor with crop handles, aspect ratio controls and responsive website mockups",
  },
  guestBar: {
    title: "Guest usage",
    deletionTitle: "Automatic deletion",
    countdownLabel: "Temporary files delete automatically in",
  },
  upload: {
    heading: "Upload a WebP Image",
    supporting: "Drag and drop a WebP image, paste it from your clipboard or browse your device.",
    chooseLabel: "Choose WebP",
    formatsHint: "WebP · Maximum file size follows guest limits shown above",
    features: [
      {title: "Precise Crop Selection", body: "Drag handles to keep only the pixels you want to publish."},
      {title: "Aspect Ratio Presets", body: "Lock honest engine ratios for banners, stories and squares."},
      {title: "Private Processing", body: "Uploads stay in temporary private storage."},
      {title: "Automatic File Deletion", body: "Guest files are removed after the retention countdown."},
    ],
  },
  intro: {
    eyebrow: "MODERN IMAGE CROPPING",
    title: "Crop WebP Images for Faster, Cleaner Websites",
    paragraphs: [
      "Cropping WebP images helps remove unnecessary areas while keeping only the content visitors need to see. Smaller cropped canvases are easier to place in responsive layouts and can improve visual consistency across websites, blogs and online stores.",
      "This tool creates a new cropped WebP image while leaving the original file on your device unchanged.",
      "Unlike Crop JPG (photographic framing) or Crop PNG (transparent logos), this landing stays WebP-first so you can keep a modern delivery format through the crop step.",
    ],
    imageAlt:
      "WebP hero banner before cropping and after crop for a clean responsive website layout",
  },
  ratios: {
    eyebrow: "POPULAR CROP RATIOS",
    title: "Ratios Ready for Modern Web Layouts",
    intro:
      "After upload, use these aspect options in the crop editor. Cards labeled for social framing map to the closest supported engine ratios — 4:5 uses 3:4 and 3:2 uses 4:3.",
    cards: [
      {id: "free", title: "Free Crop", ratio: "Free", hint: "Trim any unused edge freely"},
      {id: "1:1", title: "1:1 Square", ratio: "1:1", hint: "Tiles, avatars and grid thumbs"},
      {id: "16:9", title: "16:9 Website Banner", ratio: "16:9", hint: "Hero bands and wide sections"},
      {id: "9:16", title: "9:16 Story", ratio: "9:16", hint: "Tall mobile and story frames"},
      {
        id: "social",
        title: "4:5 Social Post",
        ratio: "3:4",
        hint: "Closest supported engine preset to 4:5 framing",
      },
      {
        id: "standard",
        title: "3:2 Standard",
        ratio: "4:3",
        hint: "Closest supported engine preset to 3:2 framing",
      },
      {id: "custom", title: "Custom Ratio", ratio: "Free", hint: "Unlock and refine by hand"},
    ],
  },
  benefits: {
    eyebrow: "WHY CROP WEBP",
    title: "Web-Ready Crops Without Leaving the Browser",
    cards: [
      {
        title: "Precise Cropping",
        body: "Frame subjects tightly with shared crop handles and preview before you process.",
        icon: "crop",
      },
      {
        title: "Responsive Layouts",
        body: "Remove distracting margins so the remaining image fits cards, heroes and galleries more cleanly.",
        icon: "responsive",
      },
      {
        title: "Modern WebP Format",
        body: "Stay on WebP through cropping so you are not forced into a JPEG-first desktop round trip.",
        icon: "webp",
      },
      {
        title: "Private Processing",
        body: "Guest files use temporary private storage and are not published to a public gallery.",
        icon: "privacy",
      },
      {
        title: "Original File Protected",
        body: "Download a new cropped WebP. The original on your device stays unchanged.",
        icon: "safe",
      },
      {
        title: "No Installation Required",
        body: "Crop WebP assets in the browser — no desktop editor install for a quick publish pass.",
        icon: "install",
      },
    ],
  },
  howTo: {
    eyebrow: "THREE SIMPLE STEPS",
    title: "How to Crop a WebP Image",
    steps: [
      {
        title: "Upload WebP",
        body: "Choose a WebP from your device, drag it into the upload area or paste it from your clipboard.",
      },
      {
        title: "Select Crop Area",
        body: "Drag the crop box, optionally lock a ratio, and preview the frame before processing.",
      },
      {
        title: "Download Cropped WebP",
        body: "Process the image and download the newly cropped WebP.",
      },
    ],
    imageAlt: "Three steps for uploading WebP, selecting a crop and downloading the cropped WebP",
  },
  guide: {
    title: "Why Crop Images Before Publishing?",
    paragraphs: [
      "Web teams often publish oversized hero shots with distracting edges or unused sky that fight the layout. Cropping first clarifies composition for banners, thumbnails and product cards.",
      "Keeping the WebP container through crop preserves a modern delivery format and reduces accidental round trips through heavier intermediates.",
    ],
    points: [
      "Improve visual composition before visitors land on the page",
      "Remove unnecessary background and empty margins",
      "Create more consistent website layout blocks",
      "Prepare hero banners for marketing sections",
      "Create cleaner thumbnails for blogs and catalogs",
      "Optimize ecommerce galleries with tighter product framing",
    ],
    noteBefore:
      "Cropping changes the visible area of an image but does not automatically reduce dimensions. Use ",
    noteResizeLabel: "Resize WebP",
    noteResizeHref: "/resize-webp",
    noteMiddle: " or ",
    noteCompressLabel: "Compress WebP",
    noteCompressHref: "/compress-webp",
    noteAfter: " afterwards if you also need a smaller layout slot or lighter file.",
  },
  useCases: {
    eyebrow: "COMMON USE CASES",
    title: "Where Crop WebP Helps Most",
    cards: [
      {
        title: "Website Banners",
        body: "Frame hero bands so the subject sits cleanly inside desktop and mobile sections.",
      },
      {
        title: "Blog Thumbnails",
        body: "Trim article preview images so cards look consistent across listing grids.",
      },
      {
        title: "Product Images",
        body: "Tighten product shots for ecommerce galleries without leaving WebP.",
      },
      {
        title: "Landing Pages",
        body: "Crop campaign visuals for sections that need a focused subject and less clutter.",
      },
    ],
  },
  tips: {
    eyebrow: "BETTER RESULTS",
    title: "Cropping Tips",
    items: [
      "Keep the subject centered when the layout expects balanced framing.",
      "Use consistent aspect ratios across a website section or card grid.",
      "Preview how the crop will read in desktop and mobile layouts.",
      "Crop before resizing when possible so unused pixels are not scaled unnecessarily.",
      "Keep the original WebP as a master before replacing production assets.",
      "Test the final result on different screen sizes after you download.",
    ],
  },
  faqHeading: "Frequently Asked Questions",
  faqs: [
    {
      q: "Can I crop WebP images online with SEO Images?",
      a: "Yes. Upload a still WebP, set the crop region with the shared guest crop editor, process, and download a new cropped WebP.",
    },
    {
      q: "Will cropping a WebP reduce image quality?",
      a: "Cropping removes pixels outside the selected box; it does not add a separate compression pass by itself. Softness usually comes from later resize or heavy compress settings.",
    },
    {
      q: "Can I crop WebP for website banners?",
      a: "Yes. Lock 16:9 when you need a wide website banner frame, or use free crop for custom hero compositions.",
    },
    {
      q: "Can I crop WebP for social media framing?",
      a: "You can frame for social-style shapes using supported ratios. 9:16 is available for stories; cards labeled 4:5 map to the closest engine preset 3:4.",
    },
    {
      q: "Will Crop WebP change the original image?",
      a: "No. The tool creates a new cropped WebP download. The original file on your device stays unchanged.",
    },
    {
      q: "Are Crop WebP uploads private?",
      a: "Guest images use private temporary storage and are deleted automatically according to the retention countdown on the page.",
    },
    {
      q: "What are the guest limits for Crop WebP?",
      a: "Free guest operations and maximum file size appear in the usage bar above the uploader. Higher limits may require an account.",
    },
    {
      q: "What is the maximum upload size for Crop WebP?",
      a: "The maximum size matches the guest upload limit shown in the usage bar. Oversized files are rejected before cropping starts.",
    },
    {
      q: "What is the difference between cropping and resizing a WebP?",
      a: "Cropping changes which area remains. Resizing changes the pixel dimensions of the remaining image. Crop first for composition, then resize when a slot needs exact width and height.",
    },
    {
      q: "Should I compress a WebP after cropping?",
      a: "Often yes when the download is still heavier than your performance budget. Crop for composition first, then use Compress WebP — and Resize WebP if you also need smaller dimensions.",
    },
  ],
  related: {
    eyebrow: "CONTINUE EDITING",
    title: "Related Image Tools",
    tools: [
      {href: "/resize-webp", title: "Resize WebP", body: "Fit the cropped WebP to an exact layout box."},
      {href: "/compress-webp", title: "Compress WebP", body: "Reduce WebP weight after composition is locked."},
      {href: "/webp-to-jpg", title: "WebP to JPG", body: "Convert when a partner cannot open WebP."},
      {href: "/webp-to-png", title: "WebP to PNG", body: "Export compatibility PNG when editors need it."},
      {href: "/crop-jpg", title: "Crop JPG", body: "Crop photographic JPG images for composition."},
      {href: "/crop-png", title: "Crop PNG", body: "Crop transparent PNG logos and UI graphics."},
    ],
  },
  cta: {
    title: "Ready to Crop Another WebP?",
    body: "Upload another WebP image or create a free account to unlock more image editing tools and higher usage limits.",
    primaryLabel: "Crop Another Image",
    secondaryLabel: "Create Free Account",
    secondaryHref: "/register",
  },
};

const ur: CropWebpCopy = {
  metaTitle: "آن لائن WebP امیجز کراپ کریں مفت | SEO Images",
  metaDescription:
    "درست کراپ کنٹرولز اور مشہور آسپیوٹ ریشوز سے آن لائن WebP امیجز کراپ کریں۔ ویب کے لیے تیار تصاویر بنائیں اور سیکنڈوں میں محفوظ ڈاؤن لوڈ کریں۔",
  h1: "آن لائن WebP امیجز کراپ کریں",
  breadcrumbParent: {href: "/crop-image", label: "Crop Image"},
  breadcrumbCurrent: "Crop WebP Images Online",
  hero: {
    badge: "WEBP IMAGE CROPPER",
    paragraph:
      "بہترین بصری معیار برقرار رکھتے ہوئے غیر ضروری حصے ہٹانے کے لیے آن لائن WebP امیجز کراپ کریں۔ سافٹ ویئر انسٹال کیے بغیر ریسپانسیو ویب سائٹس، لینڈنگ پیجز، بلاگز اور ای کامرس اسٹورز کے لیے جدید ویب تصاویر تیار کریں۔",
    trust: ["جدید ویب فارمیٹ", "درست کراپ ٹول", "نجی پروسیسنگ", "سافٹ ویئر درکار نہیں"],
    uploadCta: "WebP اپ لوڈ کریں",
    heroImageAlt:
      "براؤزر WebP کراپ ایڈیٹر جس میں کراپ ہینڈلز، آسپیوٹ کنٹرولز اور ریسپانسیو ویب سائٹ مک اپس ہیں",
  },
  guestBar: {
    title: "مہمان استعمال",
    deletionTitle: "خودکار حذف",
    countdownLabel: "عارضی فائلیں خود بخود حذف ہوں گی",
  },
  upload: {
    heading: "WebP تصویر اپ لوڈ کریں",
    supporting: "WebP گھسیٹیں، کلپ بورڈ سے چسپاں کریں یا ڈیوائس سے چنیں۔",
    chooseLabel: "WebP چنیں",
    formatsHint: "WebP · زیادہ سے زیادہ فائل سائز اوپر دکھائی گئی مہمان حد کے مطابق",
    features: [
      {title: "درست کراپ انتخاب", body: "صرف وہ پکسلز رکھیں جو شائع کرنا چاہتے ہیں۔"},
      {title: "آسپیوٹ ریشو پری سیٹس", body: "بینرز، اسٹوریز اور اسکوائرز کے لیے ایماندار انجن ریشوز لاک کریں۔"},
      {title: "نجی پروسیسنگ", body: "اپ لوڈز عارضی نجی اسٹوریج میں رہتی ہیں۔"},
      {title: "خودکار فائل حذف", body: "برقرار رکھنے کی مدت کے بعد مہمان فائلیں ہٹ جاتی ہیں۔"},
    ],
  },
  intro: {
    eyebrow: "جدید امیج کراپنگ",
    title: "تیز اور صاف ویب سائٹس کے لیے WebP امیجز کراپ کریں",
    paragraphs: [
      "WebP کراپنگ غیر ضروری علاقے ہٹا کر صرف وہ مواد رکھتی ہے جو زائرین کو دکھانا ہو۔ چھوٹی کراپ شدہ کینوس ریسپانسیو لے آؤٹس میں آسان لگتی ہیں اور ویب سائٹس، بلاگز اور آن لائن اسٹورز میں بصری مستقل مزاجی بہتر کر سکتی ہیں۔",
      "یہ ٹول نئی کراپ شدہ WebP بناتا ہے جبکہ اصل فائل آپ کی ڈیوائس پر جوں کی توں رہتی ہے۔",
      "Crop JPG (فوٹو فریمنگ) یا Crop PNG (شفاف لوگو) کے برخلاف یہ لینڈنگ WebP-فرسٹ رہتی ہے تاکہ کراپ قدم پر جدید ڈیلیوری فارمیٹ برقرار رہے۔",
    ],
    imageAlt: "WebP ہیرو بینر کراپ سے پہلے اور صاف ریسپانسیو لے آؤٹ کے لیے کراپ کے بعد",
  },
  ratios: {
    eyebrow: "مشہور کراپ ریشوز",
    title: "جدید ویب لے آؤٹس کے لیے ریشوز",
    intro:
      "اپ لوڈ کے بعد کراپ ایڈیٹر میں یہ آسپیوٹ اختیارات استعمال کریں۔ سوشل فریمنگ والے کارڈز قریب ترین سپورٹڈ انجن ریشوز پر میپ ہوتے ہیں — 4:5 کے لیے 3:4 اور 3:2 کے لیے 4:3۔",
    cards: [
      {id: "free", title: "فری کراپ", ratio: "Free", hint: "کوئی بھی غیر استعمال شدہ کنارہ کاٹیں"},
      {id: "1:1", title: "1:1 اسکوائر", ratio: "1:1", hint: "ٹائلز، اوتار اور گرڈ تھمبز"},
      {id: "16:9", title: "16:9 ویب سائٹ بینر", ratio: "16:9", hint: "ہیرو بینڈز اور چوڑے سیکشنز"},
      {id: "9:16", title: "9:16 اسٹوری", ratio: "9:16", hint: "لمبے موبائل اور اسٹوری فریمز"},
      {
        id: "social",
        title: "4:5 سوشل پوسٹ",
        ratio: "3:4",
        hint: "4:5 فریمنگ کے قریب ترین سپورٹڈ انجن پری سیٹ",
      },
      {
        id: "standard",
        title: "3:2 اسٹینڈرڈ",
        ratio: "4:3",
        hint: "3:2 فریمنگ کے قریب ترین سپورٹڈ انجن پری سیٹ",
      },
      {id: "custom", title: "حسبِ ضرورت ریشو", ratio: "Free", hint: "ان لاک کر کے ہاتھ سے بہتر بنائیں"},
    ],
  },
  benefits: {
    eyebrow: "WebP کیوں کراپ کریں",
    title: "براؤزر چھوڑے بغیر ویب کے لیے تیار کراپس",
    cards: [
      {
        title: "درست کراپنگ",
        body: "مشترکہ کراپ ہینڈلز سے سبجیکٹ سخت فریم کریں اور پروسیس سے پہلے پیش منظر دیکھیں۔",
        icon: "crop",
      },
      {
        title: "ریسپانسیو لے آؤٹس",
        body: "غیر ضروری حاشیے ہٹائیں تاکہ باقی امیج کارڈز، ہیروز اور گیلریز میں صاف بیٹھے۔",
        icon: "responsive",
      },
      {
        title: "جدید WebP فارمیٹ",
        body: "کراپ کے دوران WebP پر رہیں تاکہ JPEG-فرسٹ ڈیسک ٹاپ راؤنڈ ٹرپ مجبور نہ ہو۔",
        icon: "webp",
      },
      {
        title: "نجی پروسیسنگ",
        body: "مہمان فائلیں عارضی نجی اسٹوریج استعمال کرتی ہیں اور عوامی گیلری میں نہیں جاتیں۔",
        icon: "privacy",
      },
      {
        title: "اصل فائل محفوظ",
        body: "نئی کراپ شدہ WebP ڈاؤن لوڈ کریں۔ اصل فائل ڈیوائس پر جوں کی توں رہتی ہے۔",
        icon: "safe",
      },
      {
        title: "انسٹالیشن درکار نہیں",
        body: "براؤزر میں WebP اثاثے کراپ کریں — تیز پبلش پاس کے لیے ڈیسک ٹاپ ایڈیٹر انسٹال نہ کریں۔",
        icon: "install",
      },
    ],
  },
  howTo: {
    eyebrow: "تین آسان مراحل",
    title: "WebP امیج کیسے کراپ کریں",
    steps: [
      {
        title: "WebP اپ لوڈ کریں",
        body: "ڈیوائس سے WebP چنیں، اپ لوڈ ایریا میں گھسیٹیں، یا کلپ بورڈ سے چسپاں کریں۔",
      },
      {
        title: "کراپ ایریا منتخب کریں",
        body: "کراپ باکس گھسیٹیں، اختیاری طور پر ریشو لاک کریں، اور پروسیس سے پہلے فریم دیکھیں۔",
      },
      {
        title: "کراپ شدہ WebP ڈاؤن لوڈ کریں",
        body: "امیج پروسیس کریں اور نئی کراپ شدہ WebP ڈاؤن لوڈ کریں۔",
      },
    ],
    imageAlt: "WebP اپ لوڈ، کراپ انتخاب اور کراپ شدہ WebP ڈاؤن لوڈ کے تین مراحل",
  },
  guide: {
    title: "شائع کرنے سے پہلے امیجز کیوں کراپ کریں؟",
    paragraphs: [
      "ویب ٹیموں اکثر ایسے ہیرو شاٹس شائع کرتی ہیں جن میں غیر ضروری کنارے یا خالی آسمان لے آؤٹ سے ٹکراتا ہے۔ پہلے کراپ کرنے سے بینرز، تھمب نیلز اور پروڈکٹ کارڈز کی کمپوزیشن واضح ہوتی ہے۔",
      "کراپ کے دوران WebP کنٹینر رکھنے سے جدید ڈیلیوری فارمیٹ برقرار رہتا ہے اور بھاری انٹرمیڈیئٹس کے اتفاقی راؤنڈ ٹرپس کم ہوتے ہیں۔",
    ],
    points: [
      "صفحہ پر آنے سے پہلے بصری کمپوزیشن بہتر بنائیں",
      "غیر ضروری پس منظر اور خالی حاشیے ہٹائیں",
      "ویب سائٹ لے آؤٹ بلاکس میں مستقل مزاجی بنائیں",
      "مارکیٹنگ سیکشنز کے لیے ہیرو بینرز تیار کریں",
      "بلاگز اور کیٹلاگز کے لیے صاف تھمب نیلز بنائیں",
      "سخت پروڈکٹ فریمنگ سے ای کامرس گیلریز بہتر کریں",
    ],
    noteBefore:
      "کراپنگ امیج کا دکھائی دینے والا حصہ بدلتی ہے مگر خود بخود ابعاد کم نہیں کرتی۔ اگر چھوٹا لے آؤٹ سلاٹ یا ہلکی فائل بھی چاہیے تو بعد میں ",
    noteResizeLabel: "Resize WebP",
    noteResizeHref: "/resize-webp",
    noteMiddle: " یا ",
    noteCompressLabel: "Compress WebP",
    noteCompressHref: "/compress-webp",
    noteAfter: " استعمال کریں۔",
  },
  useCases: {
    eyebrow: "عام استعمال کے کیسز",
    title: "Crop WebP کہاں سب سے زیادہ مدد کرتا ہے",
    cards: [
      {
        title: "ویب سائٹ بینرز",
        body: "ہیرو بینڈز فریم کریں تاکہ سبجیکٹ ڈیسک ٹاپ اور موبائل سیکشنز میں صاف بیٹھے۔",
      },
      {
        title: "بلاگ تھمب نیلز",
        body: "آرٹیکل پری ویو امیجز کاٹیں تاکہ کارڈز فہرست گرڈز میں مستقل نظر آئیں۔",
      },
      {
        title: "پروڈکٹ امیجز",
        body: "WebP چھوڑے بغیر ای کامرس گیلریز کے لیے پروڈکٹ شاٹس سخت کریں۔",
      },
      {
        title: "لینڈنگ پیجز",
        body: "ایسے سیکشنز کے لیے مہم ویژوئلز کراپ کریں جنہیں فوکسڈ سبجیکٹ اور کم افراتفری چاہیے۔",
      },
    ],
  },
  tips: {
    eyebrow: "بہتر نتائج",
    title: "کراپنگ تجاویز",
    items: [
      "جب لے آؤٹ متوازن فریمنگ چاہے تو سبجیکٹ کو مرکز کے قریب رکھیں۔",
      "ویب سائٹ سیکشن یا کارڈ گرڈ میں مستقل آسپیوٹ ریشوز استعمال کریں۔",
      "ڈیسک ٹاپ اور موبائل لے آؤٹس میں کراپ کیسا لگے گا پہلے دیکھیں۔",
      "جہاں ممکن ہو ری سائز سے پہلے کراپ کریں تاکہ غیر استعمال شدہ پکسلز اسکیل نہ ہوں۔",
      "پروڈکشن اثاثے بدلنے سے پہلے اصل WebP بطور ماسٹر رکھیں۔",
      "ڈاؤن لوڈ کے بعد مختلف اسکرین سائزز پر حتمی نتیجہ آزمائیں۔",
    ],
  },
  faqHeading: "اکثر پوچھے گئے سوالات",
  faqs: [
    {
      q: "کیا SEO Images سے آن لائن WebP امیجز کراپ ہو سکتی ہیں؟",
      a: "ہاں۔ اسٹل WebP اپ لوڈ کریں، مشترکہ مہمان کراپ ایڈیٹر سے کراپ ریجن سیٹ کریں، پروسیس کریں اور نئی کراپ شدہ WebP ڈاؤن لوڈ کریں۔",
    },
    {
      q: "کیا WebP کراپ سے امیج کوالٹی کم ہوتی ہے؟",
      a: "کراپنگ منتخب باکس سے باہر پکسلز ہٹاتی ہے؛ الگ کمپریشن پاس خود نہیں لگاتی۔ نرمی عام طور پر بعد کے ری سائز یا سخت کمپریس سے آتی ہے۔",
    },
    {
      q: "کیا ویب سائٹ بینرز کے لیے WebP کراپ ہو سکتی ہے؟",
      a: "ہاں۔ چوڑے ویب سائٹ بینر فریم کے لیے 16:9 لاک کریں، یا حسبِ ضرورت ہیرو کمپوزیشن کے لیے فری کراپ استعمال کریں۔",
    },
    {
      q: "کیا سوشل میڈیا فریمنگ کے لیے WebP کراپ ہو سکتی ہے؟",
      a: "سپورٹڈ ریشوز سے سوشل طرز کے شیپس فریم کر سکتے ہیں۔ اسٹوریز کے لیے 9:16 دستیاب ہے؛ 4:5 والے کارڈز قریب ترین انجن پری سیٹ 3:4 پر میپ ہوتے ہیں۔",
    },
    {
      q: "کیا Crop WebP اصل امیج بدل دیتا ہے؟",
      a: "نہیں۔ ٹول نئی کراپ شدہ WebP ڈاؤن لوڈ بناتا ہے۔ اصل فائل ڈیوائس پر جوں کی توں رہتی ہے۔",
    },
    {
      q: "کیا Crop WebP اپ لوڈز نجی ہیں؟",
      a: "مہمان امیجز نجی عارضی اسٹوریج استعمال کرتی ہیں اور صفحے پر موجود برقرار رکھنے کی گنتی کے مطابق خود بخود حذف ہو جاتی ہیں۔",
    },
    {
      q: "Crop WebP کی مہمان حدود کیا ہیں؟",
      a: "مفت مہمان آپریشنز اور زیادہ سے زیادہ فائل سائز اپ لوڈر کے اوپر استعمال کی بار میں دکھائی دیتی ہیں۔ اعلیٰ حدود کے لیے اکاؤنٹ درکار ہو سکتا ہے۔",
    },
    {
      q: "Crop WebP کی زیادہ سے زیادہ اپ لوڈ سائز کیا ہے؟",
      a: "زیادہ سے زیادہ سائز استعمال کی بار میں دکھائی گئی مہمان اپ لوڈ حد سے ملتی ہے۔ بہت بڑی فائلیں کراپ شروع ہونے سے پہلے مسترد ہوتی ہیں۔",
    },
    {
      q: "WebP کراپ اور ری سائز میں کیا فرق ہے؟",
      a: "کراپنگ بتاتی ہے کون سا علاقہ رہے۔ ری سائزنگ رہ جانے والی امیج کے پکسل ابعاد بدلتی ہے۔ کمپوزیشن کے لیے پہلے کراپ کریں، پھر جب سلاٹ کو عین چوڑائی/اونچائی چاہیے تو ری سائز کریں۔",
    },
    {
      q: "کیا کراپ کے بعد WebP کمپریس کرنی چاہیے؟",
      a: "اکثر ہاں جب ڈاؤن لوڈ اب بھی پرفارمنس بجٹ سے بھاری ہو۔ پہلے کمپوزیشن کے لیے کراپ کریں، پھر Compress WebP — اور اگر چھوٹی ابعاد بھی چاہیے تو Resize WebP۔",
    },
  ],
  related: {
    eyebrow: "مزید ایڈیٹنگ",
    title: "متعلقہ امیج ٹولز",
    tools: [
      {href: "/resize-webp", title: "Resize WebP", body: "کراپ شدہ WebP کو عین لے آؤٹ باکس پر فٹ کریں۔"},
      {href: "/compress-webp", title: "Compress WebP", body: "کمپوزیشن لاک کے بعد WebP وزن کم کریں۔"},
      {href: "/webp-to-jpg", title: "WebP to JPG", body: "جب پارٹنر WebP نہ کھول سکے تو کنورٹ کریں۔"},
      {href: "/webp-to-png", title: "WebP to PNG", body: "جب ایڈیٹرز کو چاہیے تو مطابقت PNG ایکسپورٹ کریں۔"},
      {href: "/crop-jpg", title: "Crop JPG", body: "کمپوزیشن کے لیے فوٹوگرافک JPG کراپ کریں۔"},
      {href: "/crop-png", title: "Crop PNG", body: "شفاف PNG لوگو اور UI گرافکس کراپ کریں۔"},
    ],
  },
  cta: {
    title: "ایک اور WebP کراپ کریں؟",
    body: "ایک اور WebP اپ لوڈ کریں یا مزید امیج ایڈیٹنگ ٹولز اور اعلیٰ استعمال کی حدود کے لیے مفت اکاؤنٹ بنائیں۔",
    primaryLabel: "ایک اور تصویر کراپ کریں",
    secondaryLabel: "مفت اکاؤنٹ بنائیں",
    secondaryHref: "/register",
  },
};

export function getCropWebpCopy(locale: string): CropWebpCopy {
  return locale === "ur" ? ur : en;
}

export function cropWebpSeoCompat() {
  const c = en;
  return {
    intro: [
      c.hero.paragraph,
      "Guest sessions stay private on temporary storage, and the download is a new cropped WebP rather than an overwrite of your original.",
      "This landing focuses on modern web-optimized WebP crops — not JPG photo framing or PNG transparency trimming.",
    ].join(" "),
    why: [
      c.intro.paragraphs[0],
      c.guide.paragraphs[0],
      "Unlike Crop JPG (photographic composition) and Crop PNG (transparent logos/icons), Crop WebP keeps a modern delivery format through the framing step.",
      c.benefits.cards[2]!.body,
      "Cropping changes visible area; follow with Resize WebP or Compress WebP when dimensions or weight still need work.",
    ].join(" "),
    benefits: c.benefits.cards.map((card) => ({title: card.title, body: card.body})),
    howTo: [
      "Upload a WebP image",
      "Select the crop area",
      "Crop with the guest engine",
      "Download the cropped WebP",
    ] as [string, string, string, string],
    technicalTitle: c.guide.title,
    technical: [
      ...c.guide.paragraphs,
      ...c.guide.points.slice(0, 4),
      "Cropping does not automatically reduce dimensions — use Resize WebP or Compress WebP afterward when needed.",
    ].join(" "),
    faqs: c.faqs,
    ctaLabel: c.cta.primaryLabel,
  };
}

export type CropWebpLocale = AppLocale;
