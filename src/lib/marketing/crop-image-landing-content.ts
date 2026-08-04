/**
 * Crop Images master hub — pillar page for "crop images online" keywords.
 * Distinct from Crop JPG/PNG/WebP landings.
 * Ratios match guest engine only: free, 1:1, 4:3, 3:4, 16:9, 9:16.
 */
import type {AppLocale} from "@/i18n/routing";

export type CropImageFaq = {q: string; a: string};

export type CropImageCopy = {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  breadcrumbCurrent: string;
  hero: {
    badge: string;
    paragraph: string;
    trust: string[];
    uploadCta: string;
    viewRatiosCta: string;
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
  ratios: {
    eyebrow: string;
    title: string;
    intro: string;
    cards: {id: string; title: string; ratio: string; body: string}[];
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
  composition: {
    title: string;
    paragraphs: string[];
    points: {title: string; body: string}[];
    note: string;
  };
  benefits: {
    eyebrow: string;
    title: string;
    cards: {
      title: string;
      body: string;
      icon:
        | "precise"
        | "ratios"
        | "composition"
        | "social"
        | "browser"
        | "privacy"
        | "safe"
        | "formats";
    }[];
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
  faqs: CropImageFaq[];
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

const en: CropImageCopy = {
  metaTitle: "Crop Images Online Free | SEO Images",
  metaDescription:
    "Crop JPG, PNG and WebP images online using precise crop controls and popular aspect ratios. Browser-based image cropping with secure processing.",
  h1: "Crop Images Online",
  breadcrumbCurrent: "Crop Images Online",
  hero: {
    badge: "ONLINE IMAGE CROPPER",
    paragraph:
      "Crop JPG, PNG and WebP images directly in your browser. Remove unwanted areas, improve image composition and prepare photos for websites, social media and print without installing software.",
    trust: ["JPG", "PNG", "WebP", "Browser Based", "Private Processing"],
    uploadCta: "Crop Images",
    viewRatiosCta: "Popular Crop Sizes",
    heroImageAlt:
      "Browser image crop editor with JPG, PNG and WebP files, crop handles, rule-of-thirds grid and aspect ratio controls",
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
    formatsHint: "JPG · PNG · WebP · Maximum file size follows guest limits shown above",
    features: [
      {title: "Interactive crop box", body: "Drag handles to frame the exact region you want to keep."},
      {title: "Honest aspect ratios", body: "Free, 1:1, 4:3, 3:4, 16:9 and 9:16 — the ratios the cropper actually supports."},
      {title: "Same-format output", body: "JPG stays JPG, PNG stays PNG, WebP stays WebP."},
      {title: "Private processing", body: "Files stay in temporary private storage with automatic cleanup."},
    ],
  },
  ratios: {
    eyebrow: "POPULAR CROP RATIOS",
    title: "Aspect Ratios Available in the Crop Tool",
    intro:
      "These cards match the guest crop engine. Free Crop lets you frame freely; locked ratios keep platform-friendly proportions while you move the crop box.",
    cards: [
      {
        id: "free",
        title: "Free Crop",
        ratio: "Free",
        body: "Draw any rectangle when the subject does not fit a fixed template.",
      },
      {
        id: "1:1",
        title: "1:1 Square",
        ratio: "1:1",
        body: "Profile tiles, product grids and square social posts.",
      },
      {
        id: "4:3",
        title: "4:3 Standard",
        ratio: "4:3",
        body: "Classic camera framing for blogs, decks and general layouts.",
      },
      {
        id: "3:4",
        title: "3:4 Portrait",
        ratio: "3:4",
        body: "Tall product shots and portrait social slots that need more height.",
      },
      {
        id: "16:9",
        title: "16:9 Banner",
        ratio: "16:9",
        body: "Website heroes, video stills and wide marketing banners.",
      },
      {
        id: "9:16",
        title: "9:16 Story",
        ratio: "9:16",
        body: "Vertical stories, reels covers and phone-first creatives.",
      },
    ],
  },
  tools: {
    eyebrow: "CROP TOOL CATEGORIES",
    title: "Jump to a Format-Specific Cropper",
    intro: "Need guidance for one container? These pages use the same crop engine as this hub.",
    cards: [
      {
        href: "/crop-jpg",
        title: "Crop JPG",
        body: "Frame photographic JPG files for web, ads and social layouts.",
      },
      {
        href: "/crop-png",
        title: "Crop PNG",
        body: "Crop PNG graphics while keeping transparency when the source has alpha.",
      },
      {
        href: "/crop-webp",
        title: "Crop WebP",
        body: "Trim modern WebP assets for heroes, cards and responsive slots.",
      },
    ],
  },
  intro: {
    eyebrow: "ONLINE IMAGE CROPPING",
    title: "Crop Images for Better Composition",
    paragraphs: [
      "A strong photograph can still fail on a page if the wrong edges stay in frame. Cropping is the fastest way to decide what a viewer should notice first — the product, the face, the headline area — without rebuilding the shot in a studio.",
      "Photography benefits when you remove clutter after the shutter clicks. Busy backgrounds, stray elbows and empty sky compete with the subject. A tighter crop restores balance and often saves images you would otherwise discard.",
      "Website banners rarely need the full width of a camera master. Cropping to 16:9 or a free frame that matches your hero template keeps text overlays readable and stops logos from colliding with faces or packaging.",
      "Social media is a forest of hard boxes. Square posts, portrait feeds and vertical stories punish careless framing. Cropping before upload keeps the subject inside the safe area instead of trusting each platform’s auto-crop to guess correctly.",
      "Product images sell clarity. Isolation crops remove table edges and warehouse clutter so merchandise sits cleanly in ecommerce grids. Consistent aspect ratios across a catalog also make comparison shopping pages feel intentional rather than patched together.",
      "Marketing and blog teams reuse the same masters across emails, landing pages and articles. Cropping creates channel-specific derivatives while the original shoot stays untouched. That habit protects campaign assets and reduces last-minute layout fights.",
      "Print and presentations punish messy borders too. Slides need breathing room around charts and people; posters need a focal point that survives viewing distance. Cropping sets that focus before export so design tools are not dragging invisible pixels.",
      "SEO Images keeps the workflow browser-based: upload JPG, PNG or WebP, drag the crop box, lock a supported aspect ratio when needed, preview the composition and download a new file. Resize or compress afterwards if the delivery box or file weight still needs work.",
    ],
  },
  howItWorks: {
    title: "How Image Cropping Works",
    paragraphs: [
      "Cropping keeps a rectangular region of an image and discards the rest. The crop box you drag in the editor is converted into trusted coordinates on the server so the output matches what you framed — not an approximate browser guess.",
      "Aspect ratio locks constrain that box to proportions such as 1:1 or 16:9. Composition cues like a rule-of-thirds grid help you place subjects, but the geometry that matters is still the selected region.",
    ],
    points: [
      "The crop box defines which pixels stay in the download",
      "Aspect ratios keep framing consistent for templates and platforms",
      "Composition decisions remove distractions instead of shrinking the whole canvas",
      "Rule-of-thirds style guidance helps place focus points, while Free Crop stays unconstrained",
      "Crop vs resize: crop changes visible content; resize changes width and height of the whole image",
      "Crop vs compress: crop reframes; compress reduces file weight at the same composition",
    ],
    imageAlt:
      "Infographic showing an original landscape photo with crop handles and a rule-of-thirds grid becoming a clean cropped result",
  },
  composition: {
    title: "Create Better Image Composition",
    paragraphs: [
      "Composition is the reason cropping feels like editing, not just cutting. Small moves of the box can straighten a product, center a speaker or give a landscape room to breathe.",
    ],
    points: [
      {
        title: "Leading lines",
        body: "Use roads, shelves and edges that guide the eye into the subject after you trim noisy corners.",
      },
      {
        title: "Rule of thirds",
        body: "Place eyes, logos or horizon lines near intersections instead of dead center when the frame allows.",
      },
      {
        title: "Center alignment",
        body: "Symmetry still wins for product packs, icons and formal portraits — crop evenly when balance is the goal.",
      },
      {
        title: "Negative space",
        body: "Leave calm empty areas for headlines and UI overlays on website banners.",
      },
      {
        title: "Focus point",
        body: "Decide one primary subject and crop away anything that competes with it.",
      },
      {
        title: "Social media framing",
        body: "Keep faces and product labels inside safe zones before you post to square or story formats.",
      },
      {
        title: "Product photography",
        body: "Trim tables and props until the SKU fills the commercial frame cleanly.",
      },
      {
        title: "Landscape photography",
        body: "Protect horizons and key landmarks while cutting empty sky or pavement that weakens the scene.",
      },
    ],
    note: "Cropping changes the visible part of an image but does not automatically reduce its dimensions or file size.",
  },
  benefits: {
    eyebrow: "WHY TEAMS CROP",
    title: "Framing Built for Real Delivery",
    cards: [
      {
        title: "Precise Cropping",
        body: "Interactive handles let you keep exactly the region that matters.",
        icon: "precise",
      },
      {
        title: "Popular Ratios",
        body: "Free, square, standard, portrait, banner and story ratios match the tool.",
        icon: "ratios",
      },
      {
        title: "Better Composition",
        body: "Remove distractions and guide attention without reshooting.",
        icon: "composition",
      },
      {
        title: "Social Media Ready",
        body: "Prepare square posts, vertical stories and wide banners before upload.",
        icon: "social",
      },
      {
        title: "Browser Based",
        body: "Crop without installing desktop editors on every contributor laptop.",
        icon: "browser",
      },
      {
        title: "Private Processing",
        body: "Guest files use temporary private storage with automatic cleanup.",
        icon: "privacy",
      },
      {
        title: "Original Protected",
        body: "Downloads are new cropped copies. Keep masters offline for safety.",
        icon: "safe",
      },
      {
        title: "Multiple Formats",
        body: "JPG, PNG and WebP share the same secure guest crop path.",
        icon: "formats",
      },
    ],
  },
  useCases: {
    eyebrow: "COMMON USE CASES",
    title: "Where Cropping Shows Up Every Day",
    cards: [
      {
        title: "Profile Photos",
        body: "Square crops keep faces centered for avatars and team pages.",
      },
      {
        title: "Product Images",
        body: "Trim clutter so merchandise reads clearly in ecommerce grids.",
      },
      {
        title: "Website Banners",
        body: "Frame 16:9 or free heroes that leave room for headlines.",
      },
      {
        title: "Blog Graphics",
        body: "Cut featured images to match article templates and card previews.",
      },
      {
        title: "Marketing Creatives",
        body: "Prepare campaign stills for ads, emails and landing sections.",
      },
      {
        title: "Presentation Slides",
        body: "Remove edges that crowd logos, charts and speaker portraits.",
      },
    ],
  },
  tips: {
    eyebrow: "BETTER RESULTS",
    title: "Best Practices",
    items: [
      "Remove distractions that pull attention away from the subject.",
      "Keep important subjects fully visible inside platform safe areas.",
      "Use consistent aspect ratios across a catalog or campaign series.",
      "Preview the crop before downloading when brand framing matters.",
      "Keep original images as masters before replacing production libraries.",
      "Resize or compress afterwards if the layout box or file weight still needs work.",
    ],
  },
  faqHeading: "Frequently Asked Questions",
  faqs: [
    {
      q: "How do I crop an image online?",
      a: "Upload a JPG, PNG or WebP file on this page, drag the crop box, optionally lock a supported aspect ratio, run crop, preview the result and download the new file.",
    },
    {
      q: "What is the difference between crop and resize?",
      a: "Crop changes which part of the image is visible. Resize changes width and height of the whole image. Use Image Resizer when you need new dimensions without reframing content.",
    },
    {
      q: "What is the difference between crop and compress?",
      a: "Crop reframes composition. Compress reduces file size. Many workflows crop first, then resize or compress for delivery.",
    },
    {
      q: "Can I crop without losing quality?",
      a: "Cropping removes pixels outside the box but does not intentionally re-encode for smaller files. Extremely tiny crops may look soft when scaled up later, so keep enough resolution for the destination.",
    },
    {
      q: "What is the best crop ratio?",
      a: "It depends on the destination. Use 1:1 for squares, 16:9 for banners, 9:16 for stories, 3:4 for tall portraits and Free Crop when no template applies.",
    },
    {
      q: "What crop ratio should I use for Instagram?",
      a: "Square posts often start at 1:1. Vertical creative can use 9:16 for stories. Always check the current Instagram placement before publishing.",
    },
    {
      q: "What crop ratio should I use for Facebook?",
      a: "Feed and link creatives vary by placement. Wide 16:9 framing is a common starting point for banners; square 1:1 suits many profile and catalog tiles.",
    },
    {
      q: "Can I crop website banners?",
      a: "Yes. 16:9 Banner is a practical starting point, or use Free Crop to match a custom theme ratio, then resize if the pixel box still needs tuning.",
    },
    {
      q: "Does cropping PNG keep transparency?",
      a: "When the source PNG has alpha, Crop PNG and this hub keep the PNG container so transparent areas outside opaque content can remain in the result.",
    },
    {
      q: "Which formats does Crop Images support?",
      a: "JPG, PNG and WebP. Format-specific pages add deeper guidance for each container.",
    },
    {
      q: "What are the guest limits for the image cropper?",
      a: "Daily operations and maximum upload size appear in the usage bar above the uploader. Higher limits may require an account.",
    },
    {
      q: "Are crop tool uploads private?",
      a: "Guest files use temporary private storage and are deleted automatically according to the retention countdown on the page.",
    },
    {
      q: "What is the maximum upload size for Crop Images?",
      a: "The maximum size matches the guest upload limit shown in the usage bar. Oversized files are rejected before processing starts.",
    },
    {
      q: "Does Crop Images work on mobile?",
      a: "Yes. The cropper is browser-based with touch-friendly handles. Larger screens make fine framing easier when precision matters.",
    },
    {
      q: "Are original images changed by Crop Images?",
      a: "No. The tool creates a new cropped download. The original file on your device stays unchanged.",
    },
  ],
  related: {
    eyebrow: "RELATED CATEGORIES",
    title: "Continue After Cropping",
    tools: [
      {href: "/convert-image", title: "Image Converter", body: "Change containers when WebP, JPG or PNG is the better delivery format."},
      {href: "/compress-image", title: "Image Compressor", body: "Reduce file weight after composition is locked."},
      {href: "/resize-image", title: "Image Resizer", body: "Set final dimensions after you finish framing."},
      {href: "/crop-jpg", title: "Crop JPG", body: "Photographic JPG cropping with dedicated guidance."},
      {href: "/crop-png", title: "Crop PNG", body: "PNG graphics cropping with transparency in mind."},
      {href: "/crop-webp", title: "Crop WebP", body: "Modern WebP framing for performance pages."},
    ],
  },
  cta: {
    title: "Ready to Crop Your Images?",
    body: "Upload an image now or create a free account to unlock higher limits, saved projects and additional editing tools.",
    primaryLabel: "Crop Images",
    secondaryLabel: "Create Free Account",
    secondaryHref: "/register",
  },
};

const ur: CropImageCopy = {
  metaTitle: "آن لائن امیجز کراپ کریں مفت | SEO Images",
  metaDescription:
    "درست کراپ کنٹرولز اور مقبول آسپیکٹ ریشو کے ساتھ JPG، PNG اور WebP امیجز آن لائن کراپ کریں۔ محفوظ پروسیسنگ والا براؤزر پر مبنی امیج کراپ۔",
  h1: "آن لائن امیجز کراپ کریں",
  breadcrumbCurrent: "آن لائن امیجز کراپ کریں",
  hero: {
    badge: "ONLINE IMAGE CROPPER",
    paragraph:
      "براؤزر میں ہی JPG، PNG اور WebP امیجز کراپ کریں۔ غیر مطلوبہ حصے ہٹائیں، کمپوزیشن بہتر بنائیں اور سافٹ ویئر انسٹال کیے بغیر ویب سائٹس، سوشل میڈیا اور پرنٹ کے لیے تصاویر تیار کریں۔",
    trust: ["JPG", "PNG", "WebP", "براؤزر پر مبنی", "نجی پروسیسنگ"],
    uploadCta: "امیجز کراپ کریں",
    viewRatiosCta: "مقبول کراپ سائز",
    heroImageAlt:
      "براؤزر امیج کراپ ایڈیٹر جس میں JPG، PNG، WebP، کراپ ہینڈلز، رول آف تھرڈز گرڈ اور آسپیکٹ ریشو کنٹرولز دکھائے گئے ہیں",
  },
  guestBar: {
    title: "گیسٹ استعمال",
    deletionTitle: "خودکار حذف",
    countdownLabel: "عارضی فائلیں خودکار طور پر حذف ہوں گی",
  },
  upload: {
    heading: "اپنی امیج اپلوڈ کریں",
    supporting: "JPG، PNG یا WebP ڈریگ اینڈ ڈراپ کریں یا ڈیوائس سے منتخب کریں۔",
    chooseLabel: "امیج منتخب کریں",
    formatsHint: "JPG · PNG · WebP · زیادہ سے زیادہ سائز اوپر دکھائے گئے گیسٹ حدود کے مطابق",
    features: [
      {title: "انٹرایکٹو کراپ باکس", body: "ہینڈلز گھسیٹ کر بالکل وہی علاقہ رکھیں جو آپ چاہتے ہیں۔"},
      {title: "ایماندار آسپیکٹ ریشو", body: "Free، 1:1، 4:3، 3:4، 16:9 اور 9:16 — جو کراپر واقعی سپورٹ کرتا ہے۔"},
      {title: "وہی فارمیٹ", body: "JPG، PNG یا WebP آؤٹ پٹ پر وہی کنٹینر رہتا ہے۔"},
      {title: "نجی پروسیسنگ", body: "فائلیں عارضی نجی اسٹوریج اور خودکار صفائی کے ساتھ۔"},
    ],
  },
  ratios: {
    eyebrow: "مقبول کراپ ریشوز",
    title: "کراپ ٹول میں دستیاب آسپیکٹ ریشو",
    intro:
      "یہ کارڈز گیسٹ کراپ انجن سے مماثل ہیں۔ Free Crop آزاد فریم دیتا ہے؛ لاک ریشو پلیٹ فارم دوست تناسب رکھتے ہیں جب آپ باکس منتقل کرتے ہیں۔",
    cards: [
      {
        id: "free",
        title: "Free Crop",
        ratio: "Free",
        body: "جب موضوع مقررہ سانچے میں نہ بیٹھے تو کوئی بھی مستطیل بنائیں۔",
      },
      {
        id: "1:1",
        title: "1:1 مربع",
        ratio: "1:1",
        body: "پروفائل ٹائلز، پروڈکٹ گرڈز اور مربع سوشل پوسٹس۔",
      },
      {
        id: "4:3",
        title: "4:3 معیاری",
        ratio: "4:3",
        body: "بلاگز، ڈیکس اور عام لے آؤٹس کے لیے کلاسیک کیمرہ فریم۔",
      },
      {
        id: "3:4",
        title: "3:4 پورٹریٹ",
        ratio: "3:4",
        body: "لمبی پروڈکٹ شاٹس اور پورٹریٹ سوشل سلاٹس۔",
      },
      {
        id: "16:9",
        title: "16:9 بینر",
        ratio: "16:9",
        body: "ویب سائٹ ہیرو، ویڈیو اسٹلز اور چوڑے مارکیٹنگ بینرز۔",
      },
      {
        id: "9:16",
        title: "9:16 اسٹوری",
        ratio: "9:16",
        body: "عمودی اسٹوریز، ریلز کورز اور فون فرسٹ کریٹیوز۔",
      },
    ],
  },
  tools: {
    eyebrow: "کراپ ٹول زمرے",
    title: "فارمیٹ مخصوص کراپر پر جائیں",
    intro: "ایک کنٹینر کی رہنمائی چاہیے؟ یہ صفحات اسی کراپ انجن کو استعمال کرتے ہیں۔",
    cards: [
      {
        href: "/crop-jpg",
        title: "JPG کراپ کریں",
        body: "عکسی JPG فائلوں کو ویب، اشتہارات اور سوشل لے آؤٹ کے لیے فریم کریں۔",
      },
      {
        href: "/crop-png",
        title: "PNG کراپ کریں",
        body: "جب سورس میں الفا ہو تو شفافیت برقرار رکھتے ہوئے PNG کراپ کریں۔",
      },
      {
        href: "/crop-webp",
        title: "WebP کراپ کریں",
        body: "جدید WebP اثاثے ہیروز، کارڈز اور ریسپانسو سلاٹس کے لیے تراشیں۔",
      },
    ],
  },
  intro: {
    eyebrow: "آن لائن امیج کراپنگ",
    title: "بہتر کمپوزیشن کے لیے امیجز کراپ کریں",
    paragraphs: [
      "ایک مضبوط تصویر بھی صفحے پر ناکام ہو سکتی ہے اگر غلط کنارے فریم میں رہ جائیں۔ کراپنگ سب سے تیز طریقہ ہے فیصلہ کرنے کا کہ دیکھنے والا پہلے کیا دیکھے — پروڈکٹ، چہرہ، ہیڈ لائن ایریا — بغیر اسٹوڈیو میں شاٹ دوبارہ بنائے۔",
      "فوٹوگرافی اس وقت فائدہ اٹھاتی ہے جب آپ شٹر کے بعد بے ترتیبی ہٹا دیں۔ مصروف پس منظر، اضافی ہاتھ اور خالی آسمان موضوع سے مقابلہ کرتے ہیں۔ سخت کراپ توازن واپس لاتا ہے اور اکثر وہ تصاویر بچا لیتا ہے جنہیں آپ ورنہ رد کر دیتے۔",
      "ویب سائٹ بینرز کو اکثر کیمرے کے مکمل ماسٹر کی ضرورت نہیں ہوتی۔ 16:9 یا اپنے ہیرو سانچے سے ملنے والے آزاد فریم پر کراپ متن کو پڑھنے کے قابل رکھتا ہے اور لوگو کو چہروں یا پیکجنگ سے ٹکرانے سے روکتا ہے۔",
      "سوشل میڈیا سخت باکسز کا جنگل ہے۔ مربع پوسٹس، پورٹریٹ فیڈز اور عمودی اسٹوریز لاپرواہ فریمنگ کو سزا دیتی ہیں۔ اپلوڈ سے پہلے کراپ موضوع کو محفوظ علاقے میں رکھتا ہے بجائے اس کے کہ ہر پلیٹ فارم کا آٹو کراپ اندازہ لگائے۔",
      "پروڈکٹ امیجز وضاحت بیچتی ہیں۔ آئسولیشن کراپ میز کے کنارے اور گودام کی بے ترتیبی ہٹا کر سامان کو ای کامرس گرڈز میں صاف بٹھاتا ہے۔ کیٹلاگ بھر میں یکساں آسپیکٹ ریشو صفحات کو پیچے ہوئے کے بجائے ارادی لگاتے ہیں۔",
      "مارکیٹنگ اور بلاگ ٹیمیں ایک ہی ماسٹرز کو ای میل، لینڈنگ پیجز اور مضامین میں دوبارہ استعمال کرتی ہیں۔ کراپنگ چینل مخصوص کاپیاں بناتی ہے جبکہ اصل شوٹ محفوظ رہتا ہے۔ یہ عادت مہم کے اثاثوں کی حفاظت کرتی ہے۔",
      "پرنٹ اور پریزنٹیشنز گندے بارڈرز کو بھی سزا دیتے ہیں۔ سلائیڈز کو چارٹس اور لوگوں کے ارد گرد سانس لینے کی جگہ چاہیے؛ پوسٹرز کو ایسا فوکس چاہیے جو فاصلے پر بھی بچے۔ کراپنگ ایکسپورٹ سے پہلے وہ فوکس طے کرتی ہے۔",
      "SEO Images اس ورک فلو کو براؤزر میں رکھتا ہے: JPG، PNG یا WebP اپلوڈ کریں، کراپ باکس گھسیٹیں، ضرورت ہو تو معاون آسپیکٹ ریشو لاک کریں، کمپوزیشن دیکھیں اور نئی فائل ڈاؤن لوڈ کریں۔ اگر ڈیلیوری باکس یا فائل وزن اب بھی درکار ہو تو بعد میں ری سائز یا کمپریس کریں۔",
    ],
  },
  howItWorks: {
    title: "امیج کراپنگ کیسے کام کرتی ہے",
    paragraphs: [
      "کراپنگ امیج کے مستطیل علاقے کو رکھتی ہے اور باقی ترک کر دیتی ہے۔ ایڈیٹر میں گھسیٹا گیا کراپ باکس سرور پر قابلِ اعتماد نقاط میں بدلتا ہے تاکہ آؤٹ پٹ وہی فریم ہو جو آپ نے بنایا۔",
      "آسپیکٹ ریشو لاک باکس کو 1:1 یا 16:9 جیسے تناسب تک محدود رکھتے ہیں۔ رول آف تھرڈز جیسی کمپوزیشن رہنمائی موضوع رکھنے میں مدد دیتی ہے، مگر اصل ہندسہ منتخب علاقہ ہی ہے۔",
    ],
    points: [
      "کراپ باکس طے کرتا ہے کہ ڈاؤن لوڈ میں کون سے پکسل رہیں",
      "آسپیکٹ ریشو سانچوں اور پلیٹ فارمز کے لیے فریمنگ یکساں رکھتے ہیں",
      "کمپوزیشن فیصلے پورے کینوس سکیڑنے کے بجائے خلفشار ہٹاتے ہیں",
      "رول آف تھرڈز فوکس پوائنٹس رکھنے میں مدد دیتا ہے، جبکہ Free Crop آزاد رہتا ہے",
      "کراپ بمقابلہ ری سائز: کراپ نظر آنے والا مواد بدلتا ہے؛ ری سائز پوری امیج کی چوڑائی و اونچائی",
      "کراپ بمقابلہ کمپریس: کراپ فریم بدلتا ہے؛ کمپریس اسی کمپوزیشن پر فائل کا وزن کم کرتا ہے",
    ],
    imageAlt:
      "انفوگرافک جس میں اصل لینڈ سکیپ تصویر کراپ ہینڈلز اور رول آف تھرڈز گرڈ کے ساتھ صاف کراپ شدہ نتیجے میں بدلتی ہے",
  },
  composition: {
    title: "بہتر امیج کمپوزیشن بنائیں",
    paragraphs: [
      "کمپوزیشن وہ وجہ ہے جس سے کراپنگ کٹنگ نہیں بلکہ ایڈیٹنگ لگتی ہے۔ باکس کی چھوٹی حرکت پروڈکٹ سیدھا کر سکتی ہے، اسپیکر مرکز میں لا سکتی ہے یا لینڈ سکیپ کو سانس لینے کی جگہ دے سکتی ہے۔",
    ],
    points: [
      {
        title: "لیڈنگ لائنز",
        body: "سڑکیں، شیلفیں اور کنارے استعمال کریں جو شور والے کونوں کے بعد آنکھ موضوع تک لے جائیں۔",
      },
      {
        title: "رول آف تھرڈز",
        body: "جب فریم اجازت دے تو آنکھیں، لوگو یا افق کو بیچ کے بجائے تقاطع کے قریب رکھیں۔",
      },
      {
        title: "سینٹر الائنمنٹ",
        body: "پروڈکٹ پیکس، آئیکنز اور رسمی پورٹریٹس کے لیے توازن اہم ہو تو یکساں کراپ کریں۔",
      },
      {
        title: "نیگیٹو اسپیس",
        body: "ویب سائٹ بینرز پر ہیڈ لائنز اور UI اوورلیز کے لیے پرسکون خالی جگہ چھوڑیں۔",
      },
      {
        title: "فوکس پوائنٹ",
        body: "ایک بنیادی موضوع طے کریں اور جو اس سے مقابلہ کرے اسے کاٹ دیں۔",
      },
      {
        title: "سوشل میڈیا فریمنگ",
        body: "مربع یا اسٹوری فارمیٹس پر پوسٹ سے پہلے چہرے اور لیبل محفوظ زون میں رکھیں۔",
      },
      {
        title: "پروڈکٹ فوٹوگرافی",
        body: "میزیں اور پراپس تراشیں یہاں تک کہ SKU تجارتی فریم صاف بھرے۔",
      },
      {
        title: "لینڈ سکیپ فوٹوگرافی",
        body: "افق اور اہم نشان محفوظ رکھیں جب خالی آسمان یا فرش منظر کمزور کرے۔",
      },
    ],
    note: "کراپنگ امیج کا نظر آنے والا حصہ بدلتی ہے مگر خود بخود ابعاد یا فائل سائز کم نہیں کرتی۔",
  },
  benefits: {
    eyebrow: "ٹیمیں کیوں کراپ کرتی ہیں",
    title: "اصل ڈیلیوری کے لیے فریمنگ",
    cards: [
      {
        title: "درست کراپنگ",
        body: "انٹرایکٹو ہینڈلز صرف وہی علاقہ رکھنے دیتے ہیں جو اہم ہے۔",
        icon: "precise",
      },
      {
        title: "مقبول ریشوز",
        body: "Free، مربع، معیاری، پورٹریٹ، بینر اور اسٹوری ریشو ٹول سے مماثل ہیں۔",
        icon: "ratios",
      },
      {
        title: "بہتر کمپوزیشن",
        body: "دوبارہ شوٹ کیے بغیر خلفشار ہٹائیں اور توجہ رہنمائی کریں۔",
        icon: "composition",
      },
      {
        title: "سوشل میڈیا کے لیے تیار",
        body: "اپلوڈ سے پہلے مربع پوسٹس، عمودی اسٹوریز اور چوڑے بینرز تیار کریں۔",
        icon: "social",
      },
      {
        title: "براؤزر پر مبنی",
        body: "ہر لیپ ٹاپ پر ڈیسک ٹاپ ایڈیٹرز انسٹال کیے بغیر کراپ کریں۔",
        icon: "browser",
      },
      {
        title: "نجی پروسیسنگ",
        body: "گیسٹ فائلیں عارضی نجی اسٹوریج اور خودکار صفائی استعمال کرتی ہیں۔",
        icon: "privacy",
      },
      {
        title: "اصل محفوظ",
        body: "ڈاؤن لوڈز نئی کراپ کاپیاں ہیں۔ ماسٹرز آف لائن محفوظ رکھیں۔",
        icon: "safe",
      },
      {
        title: "متعدد فارمیٹس",
        body: "JPG، PNG اور WebP ایک ہی محفوظ گیسٹ کراپ راستے سے گزرتے ہیں۔",
        icon: "formats",
      },
    ],
  },
  useCases: {
    eyebrow: "عام استعمالات",
    title: "کراپنگ کہاں روزانہ نظر آتی ہے",
    cards: [
      {
        title: "پروفائل فوٹوز",
        body: "مربع کراپ اوتارز اور ٹیم پیجز کے لیے چہرے مرکز میں رکھتے ہیں۔",
      },
      {
        title: "پروڈکٹ امیجز",
        body: "بے ترتیبی تراشیں تاکہ سامان ای کامرس گرڈز میں صاف پڑھے۔",
      },
      {
        title: "ویب سائٹ بینرز",
        body: "16:9 یا آزاد ہیروز فریم کریں جن میں ہیڈ لائنز کی جگہ ہو۔",
      },
      {
        title: "بلاگ گرافکس",
        body: "فیچرڈ امیجز آرٹیکل سانچوں اور کارڈ پری ویوز سے ملیں۔",
      },
      {
        title: "مارکیٹنگ کریٹیوز",
        body: "اشتہارات، ای میلز اور لینڈنگ سیکشنز کے لیے مہم کے اسٹلز تیار کریں۔",
      },
      {
        title: "پریزنٹیشن سلائیڈز",
        body: "لوگو، چارٹس اور اسپیکر پورٹریٹس کو گھیرنے والے کنارے ہٹائیں۔",
      },
    ],
  },
  tips: {
    eyebrow: "بہتر نتائج",
    title: "بہترین طریقے",
    items: [
      "وہ خلفشار ہٹائیں جو موضوع سے توجہ چھینیں۔",
      "اہم موضوعات پلیٹ فارم محفوظ علاقوں میں مکمل نظر آئیں۔",
      "کیٹلاگ یا مہم سیریز میں یکساں آسپیکٹ ریشو استعمال کریں۔",
      "جب برانڈ فریمنگ اہم ہو تو ڈاؤن لوڈ سے پہلے کراپ دیکھیں۔",
      "پروڈکشن لائبریری بدلنے سے پہلے اصل امیجز ماسٹر رکھیں۔",
      "اگر لے آؤٹ باکس یا فائل وزن اب بھی درکار ہو تو بعد میں ری سائز یا کمپریس کریں۔",
    ],
  },
  faqHeading: "عمومی سوالات",
  faqs: [
    {
      q: "میں امیج آن لائن کیسے کراپ کروں؟",
      a: "اس صفحے پر JPG، PNG یا WebP اپلوڈ کریں، کراپ باکس گھسیٹیں، اختیاری طور پر معاون آسپیکٹ ریشو لاک کریں، کراپ چلائیں، نتیجہ دیکھیں اور نئی فائل ڈاؤن لوڈ کریں۔",
    },
    {
      q: "کراپ اور ری سائز میں کیا فرق ہے؟",
      a: "کراپ بدل دیتا ہے کہ امیج کا کون سا حصہ نظر آئے۔ ری سائز پوری امیج کی چوڑائی اور اونچائی بدلتا ہے۔ جب بغیر مواد دوبارہ فریم کیے نئے ابعاد چاہییں تو Image Resizer استعمال کریں۔",
    },
    {
      q: "کراپ اور کمپریس میں کیا فرق ہے؟",
      a: "کراپ کمپوزیشن دوبارہ فریم کرتا ہے۔ کمپریس فائل سائز کم کرتا ہے۔ بہت سے ورک فلو پہلے کراپ پھر ری سائز یا کمپریس کرتے ہیں۔",
    },
    {
      q: "کیا میں معیار کھونے بغیر کراپ کر سکتا ہوں؟",
      a: "کراپنگ باکس کے باہر پکسل ہٹاتی ہے مگر فائل چھوٹی کرنے کے لیے ارادتاً دوبارہ اینکوڈ نہیں کرتی۔ بہت چھوٹے کراپ بعد میں بڑے کرنے پر نرم لگ سکتے ہیں، اس لیے منزل کے لیے کافی ریزولوشن رکھیں۔",
    },
    {
      q: "بہترین کراپ ریشو کیا ہے؟",
      a: "منزل پر منحصر ہے۔ مربع کے لیے 1:1، بینرز کے لیے 16:9، اسٹوریز کے لیے 9:16، لمبے پورٹریٹس کے لیے 3:4 اور جب کوئی سانچہ نہ ہو تو Free Crop۔",
    },
    {
      q: "انسٹاگرام کے لیے کون سا کراپ ریشو؟",
      a: "مربع پوسٹس اکثر 1:1 سے شروع ہوتے ہیں۔ عمودی کریٹیو اسٹوریز کے لیے 9:16 استعمال کر سکتا ہے۔ اشاعت سے پہلے موجودہ انسٹاگرام پلیسمنٹ چیک کریں۔",
    },
    {
      q: "فیس بک کے لیے کون سا کراپ ریشو؟",
      a: "فیڈ اور لنک کریٹیو پلیسمنٹ کے لحاظ سے بدلتے ہیں۔ چوڑے 16:9 بینرز کا عام نقطۂ آغاز ہے؛ بہت سے پروفائل اور کیٹلاگ ٹائلز کے لیے 1:1 موزوں ہے۔",
    },
    {
      q: "کیا میں ویب سائٹ بینرز کراپ کر سکتا ہوں؟",
      a: "ہاں۔ 16:9 Banner عملی نقطۂ آغاز ہے، یا اپنے تھیم سے ملنے کے لیے Free Crop استعمال کریں، پھر اگر پکسل باکس اب بھی درکار ہو تو ری سائز کریں۔",
    },
    {
      q: "کیا PNG کراپ شفافیت رکھتا ہے؟",
      a: "جب سورس PNG میں الفا ہو تو Crop PNG اور یہ حب PNG کنٹینر رکھتے ہیں تاکہ شفاف علاقے نتیجے میں رہ سکیں۔",
    },
    {
      q: "Crop Images کون سے فارمیٹس سپورٹ کرتا ہے؟",
      a: "JPG، PNG اور WebP۔ فارمیٹ مخصوص صفحات ہر کنٹینر کی گہری رہنمائی دیتے ہیں۔",
    },
    {
      q: "امیج کراپر کی گیسٹ حدود کیا ہیں؟",
      a: "روزانہ آپریشنز اور زیادہ سے زیادہ اپلوڈ سائز اپلوڈر کے اوپر استعمال کی پٹی میں دکھائی دیتے ہیں۔ زیادہ حدود کے لیے اکاؤنٹ درکار ہو سکتا ہے۔",
    },
    {
      q: "کیا کراپ ٹول اپلوڈز نجی ہیں؟",
      a: "گیسٹ فائلیں عارضی نجی اسٹوریج استعمال کرتی ہیں اور صفحے پر دکھائے گئے برقرار رکھنے کے کاؤنٹ ڈاؤن کے مطابق خودکار حذف ہوتی ہیں۔",
    },
    {
      q: "Crop Images کے لیے زیادہ سے زیادہ اپلوڈ سائز کیا ہے؟",
      a: "زیادہ سے زیادہ سائز استعمال کی پٹی میں دکھائے گئے گیسٹ اپلوڈ حد کے مطابق ہے۔ بہت بڑی فائلیں پروسیسنگ سے پہلے مسترد ہوتی ہیں۔",
    },
    {
      q: "کیا Crop Images موبائل پر کام کرتا ہے؟",
      a: "ہاں۔ کراپر براؤزر پر مبنی ہے اور ٹچ فرینڈلی ہینڈلز رکھتا ہے۔ جب درستگی اہم ہو تو بڑی اسکرینز فائن فریمنگ آسان بناتی ہیں۔",
    },
    {
      q: "کیا Crop Images اصل امیج بدلتا ہے؟",
      a: "نہیں۔ ٹول نیا کراپ ڈاؤن لوڈ بناتا ہے۔ آپ کی ڈیوائس پر اصل فائل ویسی ہی رہتی ہے۔",
    },
  ],
  related: {
    eyebrow: "متعلقہ زمرے",
    title: "کراپ کے بعد جاری رکھیں",
    tools: [
      {href: "/convert-image", title: "امیج کنورٹر", body: "جب WebP، JPG یا PNG بہتر ڈیلیوری فارمیٹ ہو تو کنٹینر بدلیں۔"},
      {href: "/compress-image", title: "امیج کمپریسر", body: "کمپوزیشن لاک ہونے کے بعد فائل کا وزن کم کریں۔"},
      {href: "/resize-image", title: "امیج ری سائزر", body: "فریمنگ مکمل ہونے کے بعد حتمی ابعاد طے کریں۔"},
      {href: "/crop-jpg", title: "JPG کراپ", body: "عکسی JPG کراپنگ مخصوص رہنمائی کے ساتھ۔"},
      {href: "/crop-png", title: "PNG کراپ", body: "شفافیت ذہن میں رکھتے ہوئے PNG گرافکس۔"},
      {href: "/crop-webp", title: "WebP کراپ", body: "کارکردگی صفحات کے لیے جدید WebP فریمنگ۔"},
    ],
  },
  cta: {
    title: "اپنی امیجز کراپ کرنے کے لیے تیار؟",
    body: "ابھی امیج اپلوڈ کریں یا زیادہ حدود، محفوظ پروجیکٹس اور اضافی ایڈیٹنگ ٹولز کے لیے مفت اکاؤنٹ بنائیں۔",
    primaryLabel: "امیجز کراپ کریں",
    secondaryLabel: "مفت اکاؤنٹ بنائیں",
    secondaryHref: "/register",
  },
};

export function getCropImageCopy(locale: string): CropImageCopy {
  return locale === "ur" ? ur : en;
}

export function isCropImageLocale(locale: string): locale is AppLocale {
  return locale === "en" || locale === "ur";
}
