import {localizedCopy} from "@/lib/marketing/localized-copy";
/**
 * PNG → WebP landing — preserve transparency + web performance
 * (distinct from PNG→JPG flatten and JPG→WebP photographic migration).
 */
import type {AppLocale} from "@/i18n/routing";

export type PngToWebpFaq = {q: string; a: string};

export type PngToWebpCopy = {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  breadcrumbParent: {href: "/convert-image"; label: string};
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
  comparison: {
    eyebrow: string;
    title: string;
    intro: string;
    columns: [string, string, string];
    rows: {label: string; png: string; webp: string}[];
    explanation: string;
  };
  benefits: {
    eyebrow: string;
    title: string;
    cards: {
      title: string;
      body: string;
      icon: "alpha" | "size" | "speed" | "browser" | "privacy" | "safe";
    }[];
  };
  howTo: {
    eyebrow: string;
    title: string;
    steps: {title: string; body: string}[];
    imageAlt: string;
  };
  whyWeb: {
    title: string;
    paragraphs: string[];
    points: string[];
    note: string;
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
  faqs: PngToWebpFaq[];
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

const en: PngToWebpCopy = {
  metaTitle: "Convert PNG to WebP Online Free | Img Pilot",
  metaDescription:
    "Convert PNG images to WebP online while preserving transparency. Create smaller web-ready images for faster websites with secure browser-based conversion.",
  h1: "Convert PNG to WebP Online",
  breadcrumbParent: {href: "/convert-image", label: "Convert Image"},
  breadcrumbCurrent: "PNG to WebP",
  hero: {
    badge: "PNG TO WEBP CONVERTER",
    paragraph:
      "Convert PNG images into modern WebP format while preserving transparency. Create significantly smaller image files that load faster on websites without sacrificing visual quality.",
    trust: [
      "Transparency Preserved",
      "Smaller Files",
      "Faster Websites",
      "No Software Required",
    ],
    uploadCta: "Upload PNG",
    heroImageAlt: "Browser interface converting a transparent PNG logo into a transparent WebP image",
  },
  guestBar: {
    title: "Guest usage",
    deletionTitle: "Automatic deletion",
    countdownLabel: "Temporary files delete automatically in",
  },
  upload: {
    heading: "Upload a PNG Image",
    supporting: "Drag and drop a PNG image, paste it from your clipboard or browse your computer.",
    chooseLabel: "Choose PNG",
    formatsHint: "PNG · Maximum file size follows guest limits shown above",
    features: [
      {title: "Transparency Supported", body: "WebP can keep alpha so logos and UI do not need a solid box."},
      {title: "Smaller WebP Output", body: "Often much lighter than PNG for web delivery."},
      {title: "Private Processing", body: "Uploads stay in temporary private storage."},
      {title: "Automatic File Deletion", body: "Guest files are removed after the retention countdown."},
    ],
  },
  intro: {
    eyebrow: "MODERN WEB IMAGE FORMAT",
    title: "Why Convert PNG to WebP?",
    paragraphs: [
      "PNG files provide excellent image quality and support transparent backgrounds, but they can become unnecessarily large for websites.",
      "WebP combines high image quality with efficient compression while supporting transparency, making it an ideal format for modern websites, landing pages and web applications.",
      "This converter creates a new WebP image while preserving your original PNG on your device. Unlike PNG to JPG, this path is chosen when you still need see-through pixels.",
    ],
    imageAlt: "Transparent PNG logo converting into a smaller transparent WebP with equal visual quality",
  },
  comparison: {
    eyebrow: "PNG VS WEBP",
    title: "How PNG and WebP Compare",
    intro: "Use PNG while editing. Ship WebP on the public site when browsers and CDNs already support modern formats.",
    columns: ["Compare", "PNG", "WebP"],
    rows: [
      {label: "Compression", png: "Lossless / large by default", webp: "Modern compression for the web"},
      {label: "Transparency", png: "Full alpha support", webp: "Transparency supported"},
      {label: "Typical file size", png: "Often large on websites", webp: "Often much smaller"},
      {label: "Website speed", png: "Can slow LCP when oversized", webp: "Helps faster page loads"},
      {label: "Editing workflows", png: "Best master for design tools", webp: "Usually a delivery derivative"},
      {label: "Browser support", png: "Nearly universal", webp: "Excellent on modern browsers"},
    ],
    explanation:
      "Keep PNG masters in Figma or Photoshop exports. Convert to WebP for production pages where transparency still matters and bytes count.",
  },
  benefits: {
    eyebrow: "WHY CONVERT",
    title: "Smaller Transparent Images for the Web",
    cards: [
      {
        title: "Transparency Preserved",
        body: "Keep see-through backgrounds for logos, icons and UI overlays.",
        icon: "alpha",
      },
      {
        title: "Much Smaller Files",
        body: "WebP often cuts transfer size versus PNG graphics of similar look.",
        icon: "size",
      },
      {
        title: "Faster Websites",
        body: "Lighter assets help pages paint sooner on mobile networks.",
        icon: "speed",
      },
      {
        title: "Modern Browser Support",
        body: "Still WebP works across current desktop and mobile browsers.",
        icon: "browser",
      },
      {
        title: "Private Processing",
        body: "Files remain temporary and are not published to a public gallery.",
        icon: "privacy",
      },
      {
        title: "Original Protected",
        body: "Download a new WebP. Your original PNG stays unchanged.",
        icon: "safe",
      },
    ],
  },
  howTo: {
    eyebrow: "THREE SIMPLE STEPS",
    title: "How to Convert PNG to WebP",
    steps: [
      {
        title: "Upload PNG",
        body: "Choose a PNG from your device, drag it into the upload area or paste it from your clipboard.",
      },
      {
        title: "Convert",
        body: "Confirm WebP as the target and run conversion with the shared guest convert engine.",
      },
      {
        title: "Download WebP",
        body: "Preview transparency on light and dark backgrounds, then download the new WebP.",
      },
    ],
    imageAlt: "Three steps for uploading PNG, converting to WebP and downloading the result",
  },
  whyWeb: {
    title: "Build Faster Websites Without Losing Transparency",
    paragraphs: [
      "Marketing sites and product UIs often ship PNG logos and illustrations that dominate LCP. WebP keeps the cutout while reducing the bytes visitors download.",
      "After conversion, verify real pages on mobile hardware — file size alone is not a Core Web Vitals score.",
    ],
    points: [
      "Better Core Web Vitals potential when images dominate LCP",
      "Lower bandwidth usage for transparent marketing graphics",
      "Faster mobile loading on cellular networks",
      "Improved page speed without flattening logos to JPG",
      "Supports transparent graphics that JPG cannot keep",
      "Better SEO performance signals when pages feel snappy",
    ],
    note: "Many modern websites now automatically serve WebP images because they improve loading performance while preserving image quality.",
  },
  useCases: {
    eyebrow: "COMMON USE CASES",
    title: "Where PNG to WebP Helps Most",
    cards: [
      {
        title: "Website Logos",
        body: "Ship crisp transparent marks that load lighter in headers and footers.",
      },
      {
        title: "Landing Pages",
        body: "Keep campaign illustrations sharp without overweight PNG heroes.",
      },
      {
        title: "UI Graphics",
        body: "Deliver product UI captures and overlays that still need alpha.",
      },
      {
        title: "Icons & Illustrations",
        body: "Publish icon sets and marketing art that stay cut out of backgrounds.",
      },
    ],
  },
  tips: {
    eyebrow: "BETTER RESULTS",
    title: "Conversion Tips",
    items: [
      "Keep transparency when logos and UI still need a cutout.",
      "Use WebP for websites where modern browsers are the default audience.",
      "Resize before conversion if the layout box is much smaller than the file.",
      "Keep the original PNG as an editable master in your design repo.",
      "Test image quality after conversion, especially thin text and strokes.",
      "Use PNG only when ongoing editing or print workflows still require it.",
    ],
  },
  faqHeading: "Frequently Asked Questions",
  faqs: [
    {
      q: "Why convert PNG to WebP?",
      a: "Use WebP when you want smaller web delivery for graphics while still keeping transparency that JPG would destroy.",
    },
    {
      q: "Does WebP preserve PNG transparency?",
      a: "Yes for supported still-image alpha paths. Always preview logos and overlays on light and dark backgrounds before publishing.",
    },
    {
      q: "Will PNG to WebP make the file smaller?",
      a: "Often substantially for screenshots and illustrations, but exact savings depend on content and quality presets.",
    },
    {
      q: "Is WebP a good choice for website logos?",
      a: "Yes on modern sites. Keep a PNG master for design work and serve WebP to visitors when your stack supports it.",
    },
    {
      q: "Will PNG to WebP decrease image quality?",
      a: "Conversion can be lossy depending on presets. Preview text edges and soft gradients before replacing production assets.",
    },
    {
      q: "Can I convert transparent PNG logos to WebP?",
      a: "Yes — this landing is built for that workflow. Prefer PNG to JPG only when you intentionally want a solid background.",
    },
    {
      q: "Are PNG to WebP uploads private?",
      a: "Guest images use private temporary storage and are deleted automatically according to the retention countdown on the page.",
    },
    {
      q: "What are the guest limits for PNG to WebP?",
      a: "Free guest operations and maximum file size appear in the usage bar above the uploader. Higher limits may require an account.",
    },
    {
      q: "What is the maximum upload size for PNG to WebP?",
      a: "The maximum size matches the guest upload limit shown in the usage bar. Oversized files are rejected before conversion starts.",
    },
    {
      q: "What is the difference between PNG and WebP for graphics?",
      a: "PNG is a durable editing master. WebP is usually a lighter delivery format that can still keep transparency for modern browsers.",
    },
  ],
  related: {
    eyebrow: "CONTINUE EDITING",
    title: "Related Image Tools",
    tools: [
      {href: "/webp-to-png", title: "WebP to PNG", body: "Return to PNG when editors need a lossless master."},
      {href: "/png-to-jpg", title: "PNG to JPG", body: "Flatten transparency when partners need classic JPG."},
      {href: "/compress-png", title: "Compress PNG", body: "Reduce PNG weight when you must stay on PNG."},
      {href: "/resize-png", title: "Resize PNG", body: "Fix dimensions before converting for the layout."},
      {href: "/jpg-to-webp", title: "JPG to WebP", body: "Convert photographic JPG masters for modern sites."},
      {href: "/bulk-image-tools", title: "Bulk Convert Images", body: "Process several images in one guest workflow."},
    ],
  },
  cta: {
    title: "Ready to Convert Another PNG?",
    body: "Upload another PNG or create a free account for additional image tools and higher usage limits.",
    primaryLabel: "Convert Another Image",
    secondaryLabel: "Create Free Account",
    secondaryHref: "/register",
  },
};

const ur: PngToWebpCopy = {
  metaTitle: "آن لائن PNG کو WebP میں تبدیل کریں مفت | Img Pilot",
  metaDescription:
    "شفافیت برقرار رکھتے ہوئے PNG تصاویر آن لائن WebP میں تبدیل کریں۔ تیز ویب سائٹس کے لیے چھوٹی ویب ریڈی امیجز، محفوظ براؤزر پر مبنی کنورژن۔",
  h1: "آن لائن PNG کو WebP میں تبدیل کریں",
  breadcrumbParent: {href: "/convert-image", label: "تصویر تبدیل کریں"},
  breadcrumbCurrent: "PNG to WebP",
  hero: {
    badge: "PNG TO WEBP CONVERTER",
    paragraph:
      "شفافیت برقرار رکھتے ہوئے PNG تصاویر کو جدید WebP فارمیٹ میں تبدیل کریں۔ بصری معیار قربان کیے بغیر ایسی چھوٹی فائلیں بنائیں جو ویب سائٹس پر تیز لوڈ ہوں۔",
    trust: ["شفافیت محفوظ", "چھوٹی فائلیں", "تیز ویب سائٹس", "سافٹ ویئر کی ضرورت نہیں"],
    uploadCta: "PNG اپ لوڈ کریں",
    heroImageAlt: "براؤزر میں شفاف PNG لوگو کو شفاف WebP میں تبدیل کرتے ہوئے",
  },
  guestBar: {
    title: "مہمان استعمال",
    deletionTitle: "خودکار حذف",
    countdownLabel: "عارضی فائلیں خود بخود حذف ہوں گی",
  },
  upload: {
    heading: "PNG تصویر اپ لوڈ کریں",
    supporting: "PNG گھسیٹیں، کلپ بورڈ سے چسپاں کریں یا کمپیوٹر سے چنیں۔",
    chooseLabel: "PNG چنیں",
    formatsHint: "PNG · زیادہ سے زیادہ فائل سائز اوپر دکھائی گئی مہمان حد کے مطابق",
    features: [
      {title: "شفافیت سپورٹڈ", body: "WebP الفا رکھ سکتا ہے تاکہ لوگو اور UI کو ٹھوس خانہ نہ چاہیے۔"},
      {title: "چھوٹا WebP آؤٹ پٹ", body: "ویب ڈیلیوری کے لیے اکثر PNG سے کافی ہلکا۔"},
      {title: "نجی پروسیسنگ", body: "اپ لوڈز عارضی نجی اسٹوریج میں رہتی ہیں۔"},
      {title: "خودکار فائل حذف", body: "برقرار رکھنے کی مدت کے بعد مہمان فائلیں ہٹ جاتی ہیں۔"},
    ],
  },
  intro: {
    eyebrow: "جدید ویب امیج فارمیٹ",
    title: "PNG کو WebP میں کیوں تبدیل کریں؟",
    paragraphs: [
      "PNG بہترین معیار اور شفاف پس منظر دیتی ہے، مگر ویب سائٹس کے لیے اکثر غیر ضروری بڑی ہو جاتی ہے۔",
      "WebP اعلیٰ معیار کو مؤثر کمپریشن کے ساتھ ملاتا ہے اور شفافیت سپورٹ کرتا ہے — جدید ویب سائٹس، لینڈنگ پیجز اور ویب ایپس کے لیے مثالی۔",
      "یہ کنورٹر نئی WebP بناتا ہے جبکہ اصل PNG ڈیوائس پر محفوظ رہتی ہے۔ PNG to JPG کے برعکس، یہ راستہ تب چنیں جب شفاف پکسلز درکار ہوں۔",
    ],
    imageAlt: "شفاف PNG لوگو کو چھوٹی شفاف WebP میں تبدیل کرتے ہوئے، ملتا جلتا معیار",
  },
  comparison: {
    eyebrow: "PNG بمقابلہ WebP",
    title: "PNG اور WebP کا موازنہ",
    intro: "ایڈٹنگ کے دوران PNG استعمال کریں۔ عوامی سائٹ پر WebP بھیجیں جہاں براؤزر اور CDN جدید فارمیٹ سپورٹ کریں۔",
    columns: ["موازنہ", "PNG", "WebP"],
    rows: [
      {label: "کمپریشن", png: "لاسلیس / ڈیفالٹ بڑا", webp: "ویب کے لیے جدید کمپریشن"},
      {label: "شفافیت", png: "مکمل الفا سپورٹ", webp: "شفافیت سپورٹڈ"},
      {label: "عام فائل سائز", png: "ویب پر اکثر بڑا", webp: "اکثر بہت چھوٹا"},
      {label: "ویب سائٹ رفتار", png: "بڑے ہونے پر LCP سست", webp: "تیز صفحہ لوڈ میں مدد"},
      {label: "ایڈیٹنگ ورک فلو", png: "ڈیزائن ٹولز کے لیے بہترین ماسٹر", webp: "عمومی طور پر ڈیلیوری مشتق"},
      {label: "براؤزر سپورٹ", png: "تقریباً عالمگیر", webp: "جدید براؤزرز پر بہترین"},
    ],
    explanation:
      "Figma یا Photoshop میں PNG ماسٹرز رکھیں۔ پروڈکشن صفحات کے لیے WebP بنائیں جہاں شفافیت اہم ہو اور بائٹس گنتے ہوں۔",
  },
  benefits: {
    eyebrow: "تبدیلی کیوں",
    title: "ویب کے لیے چھوٹی شفاف امیجز",
    cards: [
      {
        title: "شفافیت محفوظ",
        body: "لوگو، آئیکنز اور UI اوورلیز کے لیے شفاف پس منظر رکھیں۔",
        icon: "alpha",
      },
      {
        title: "بہت چھوٹی فائلیں",
        body: "ملتے جلتے نظر والی PNG گرافکس کے مقابلے WebP اکثر ٹرانسفر کم کرتا ہے۔",
        icon: "size",
      },
      {
        title: "تیز ویب سائٹس",
        body: "ہلکے اثاثے موبائل نیٹ ورکس پر صفحات جلد دکھانے میں مدد دیتے ہیں۔",
        icon: "speed",
      },
      {
        title: "جدید براؤزر سپورٹ",
        body: "اسٹل WebP موجودہ ڈیسکٹاپ اور موبائل براؤزرز پر چلتا ہے۔",
        icon: "browser",
      },
      {
        title: "نجی پروسیسنگ",
        body: "فائلیں عارضی رہتی ہیں اور عوامی گیلری میں نہیں جاتیں۔",
        icon: "privacy",
      },
      {
        title: "اصل محفوظ",
        body: "نئی WebP ڈاؤن لوڈ کریں۔ اصل PNG جوں کی توں رہتی ہے۔",
        icon: "safe",
      },
    ],
  },
  howTo: {
    eyebrow: "تین آسان مراحل",
    title: "PNG کو WebP میں کیسے تبدیل کریں",
    steps: [
      {
        title: "PNG اپ لوڈ کریں",
        body: "ڈیوائس سے PNG چنیں، اپ لوڈ ایریا میں گھسیٹیں، یا کلپ بورڈ سے چسپاں کریں۔",
      },
      {
        title: "تبدیل کریں",
        body: "ٹارگٹ WebP تصدیق کریں اور شیئرڈ مہمان کنورٹ انجن چلائیں۔",
      },
      {
        title: "WebP ڈاؤن لوڈ کریں",
        body: "ہلکے اور گہرے پس منظر پر شفافیت دیکھیں، پھر نئی WebP ڈاؤن لوڈ کریں۔",
      },
    ],
    imageAlt: "PNG اپ لوڈ، WebP کنورژن اور ڈاؤن لوڈ کے تین مراحل",
  },
  whyWeb: {
    title: "شفافیت کھائے بغیر تیز ویب سائٹس بنائیں",
    paragraphs: [
      "مارکیٹنگ سائٹس اور پروڈکٹ UI اکثر PNG لوگو بھیجتی ہیں جو LCP پر غالب ہو جاتے ہیں۔ WebP کٹ آؤٹ رکھتا ہے اور وزٹرز کم بائٹس ڈاؤن لوڈ کرتے ہیں۔",
      "کنورژن کے بعد حقیقی صفحات موبائل ہارڈویئر پر چیک کریں — صرف فائل سائز Core Web Vitals سکور نہیں۔",
    ],
    points: [
      "بہتر Core Web Vitals امکانات جب امیجز LCP پر غالب ہوں",
      "شفاف مارکیٹنگ گرافکس کے لیے کم بینڈوتھ",
      "سیلولر نیٹ ورکس پر تیز موبائل لوڈنگ",
      "لوگو کو JPG پر فلیٹن کیے بغیر بہتر صفحہ رفتار",
      "شفاف گرافکس سپورٹ جو JPG نہیں رکھ سکتا",
      "صفحات تیز محسوس ہونے پر بہتر SEO سگنلز",
    ],
    note: "بہت سی جدید ویب سائٹس اب خودبخود WebP پیش کرتی ہیں کیونکہ لوڈنگ بہتر ہوتی ہے اور معیار برقرار رہتا ہے۔",
  },
  useCases: {
    eyebrow: "عام استعمالات",
    title: "PNG to WebP سب سے زیادہ کہاں مدد کرتا ہے",
    cards: [
      {
        title: "ویب سائٹ لوگو",
        body: "ہیڈر اور فوٹر میں ہلکی شفاف نشانیاں بھیجیں جو تیز لوڈ ہوں۔",
      },
      {
        title: "لینڈنگ پیجز",
        body: "مہمات کی الیسٹریشنز تیز رکھیں بغیر بھاری PNG ہیرو کے۔",
      },
      {
        title: "UI گرافکس",
        body: "پروڈکٹ UI کیپچرز اور اوورلیز دیں جنہیں اب بھی الفا چاہیے۔",
      },
      {
        title: "آئیکنز اور الیسٹریشنز",
        body: "آئیکن سیٹس اور مارکیٹنگ آرٹ شائع کریں جو پس منظر سے الگ رہیں۔",
      },
    ],
  },
  tips: {
    eyebrow: "بہتر نتائج",
    title: "کنورژن کے مشورے",
    items: [
      "جب لوگو اور UI کو کٹ آؤٹ چاہیے تو شفافیت رکھیں۔",
      "ویب سائٹس کے لیے WebP استعمال کریں جہاں جدید براؤزر ڈیفالٹ ہوں۔",
      "اگر لے آؤٹ باکس بہت چھوٹا ہو تو کنورژن سے پہلے ری سائز کریں۔",
      "ڈیزائن ریپو میں اصل PNG کو ایڈیٹ ایبل ماسٹر رکھیں۔",
      "کنورژن کے بعد معیار ٹیسٹ کریں، خاص طور پر باریک ٹیکسٹ اور اسٹروکس۔",
      "صرف تب PNG رکھیں جب جاری ایڈٹنگ یا پرنٹ ورک فلو اب بھی درکار ہو۔",
    ],
  },
  faqHeading: "عمومی سوالات",
  faqs: [
    {
      q: "PNG کو WebP میں کیوں تبدیل کریں؟",
      a: "جب گرافکس کے لیے چھوٹی ویب ڈیلیوری چاہیے اور شفافیت برقرار رکھنی ہو جو JPG تباہ کر دے، تو WebP استعمال کریں۔",
    },
    {
      q: "کیا WebP PNG کی شفافیت محفوظ رکھتا ہے؟",
      a: "سپورٹڈ اسٹل امیج الفا راستوں پر ہاں۔ شائع کرنے سے پہلے لوگو اور اوورلیز ہلکے و گہرے پس منظر پر دیکھیں۔",
    },
    {
      q: "کیا PNG to WebP سے فائل چھوٹی ہو گی؟",
      a: "اسکرین شاٹس اور الیسٹریشنز پر اکثر نمایاں طور پر، مگر بچت مواد اور کوالٹی پری سیٹ پر منحصر ہے۔",
    },
    {
      q: "کیا ویب سائٹ لوگو کے لیے WebP اچھا ہے؟",
      a: "جدید سائٹس پر ہاں۔ ڈیزائن کام کے لیے PNG ماسٹر رکھیں اور جب اسٹیک سپورٹ کرے تو وزٹرز کو WebP دیں۔",
    },
    {
      q: "کیا PNG to WebP سے کوالٹی کم ہوتی ہے؟",
      a: "پری سیٹس کے مطابق کنورژن لاسی ہو سکتا ہے۔ پروڈکشن اثاثے بدلنے سے پہلے ٹیکسٹ کنارے اور نرم گریڈینٹس دیکھیں۔",
    },
    {
      q: "کیا شفاف PNG لوگو WebP میں تبدیل ہو سکتے ہیں؟",
      a: "ہاں — یہ لینڈنگ اسی ورک فلو کے لیے ہے۔ PNG to JPG صرف تب چنیں جب جان بوجھ کر ٹھوس پس منظر چاہیے۔",
    },
    {
      q: "کیا PNG to WebP اپ لوڈز نجی ہیں؟",
      a: "مہمان تصاویر نجی عارضی اسٹوریج استعمال کرتی ہیں اور صفحے پر دکھائی گئی برقرار رکھنے کی مدت کے مطابق خودبخود حذف ہوتی ہیں۔",
    },
    {
      q: "PNG to WebP کی مہمان حدود کیا ہیں؟",
      a: "مفت مہمان آپریشنز اور زیادہ سے زیادہ فائل سائز اپ لوڈر کے اوپر استعمال بار میں نظر آتی ہیں۔ اعلیٰ حدود کے لیے اکاؤنٹ درکار ہو سکتا ہے۔",
    },
    {
      q: "PNG to WebP کی زیادہ سے زیادہ اپ لوڈ سائز کیا ہے؟",
      a: "زیادہ سے زیادہ سائز استعمال بار میں دکھائی گئی مہمان اپ لوڈ حد کے برابر ہے۔ بڑی فائلیں کنورژن سے پہلے مسترد ہوتی ہیں۔",
    },
    {
      q: "گرافکس کے لیے PNG اور WebP میں کیا فرق ہے؟",
      a: "PNG پائیدار ایڈیٹنگ ماسٹر ہے۔ WebP عام طور پر ہلکا ڈیلیوری فارمیٹ ہے جو جدید براؤزرز کے لیے شفافیت بھی رکھ سکتا ہے۔",
    },
  ],
  related: {
    eyebrow: "مزید ایڈیٹنگ",
    title: "متعلقہ امیج ٹولز",
    tools: [
      {href: "/webp-to-png", title: "WebP to PNG", body: "جب ایڈیٹرز کو لاسلیس ماسٹر چاہیے تو PNG پر واپس آئیں۔"},
      {href: "/png-to-jpg", title: "PNG to JPG", body: "جب پارٹنرز کلاسیک JPG چاہیں تو شفافیت فلیٹن کریں۔"},
      {href: "/compress-png", title: "Compress PNG", body: "جب PNG پر رہنا ہو تو وزن کم کریں۔"},
      {href: "/resize-png", title: "Resize PNG", body: "لے آؤٹ کے لیے کنورٹ سے پہلے ابعاد درست کریں۔"},
      {href: "/jpg-to-webp", title: "JPG to WebP", body: "فوٹوگرافک JPG ماسٹرز جدید سائٹس کے لیے بدلیں۔"},
      {href: "/bulk-image-tools", title: "Bulk Convert Images", body: "ایک مہمان ورک فلو میں کئی تصاویر پروسیس کریں۔"},
    ],
  },
  cta: {
    title: "ایک اور PNG تبدیل کریں؟",
    body: "ایک اور PNG اپ لوڈ کریں یا اضافی امیج ٹولز اور اعلیٰ استعمال کی حدود کے لیے مفت اکاؤنٹ بنائیں۔",
    primaryLabel: "ایک اور تصویر تبدیل کریں",
    secondaryLabel: "مفت اکاؤنٹ بنائیں",
    secondaryHref: "/register",
  },
};

export function getPngToWebpCopy(locale: string): PngToWebpCopy {
  return localizedCopy(locale, {en, ur});
}

export function pngToWebpSeoCompat() {
  const c = en;
  return {
    intro: [
      c.hero.paragraph,
      "Guest sessions stay private on temporary storage, and the download is a new WebP rather than an overwrite of your original PNG.",
      "This landing focuses on preserving transparency while cutting web weight — not flattening alpha the way PNG to JPG does.",
    ].join(" "),
    why: [
      c.intro.paragraphs[0],
      c.intro.paragraphs[1],
      "Unlike JPG to WebP (photos without alpha) or PNG to JPG (opaque interchange), PNG to WebP is for logos, UI graphics and illustrations that must stay cut out.",
      c.benefits.cards[0]!.body,
      c.whyWeb.note,
    ].join(" "),
    benefits: c.benefits.cards.map((card) => ({title: card.title, body: card.body})),
    howTo: [
      "Upload a PNG image",
      "Confirm WebP as the target format",
      "Convert with the guest engine",
      "Download the WebP file",
    ] as [string, string, string, string],
    technicalTitle: c.whyWeb.title,
    technical: [...c.whyWeb.paragraphs, ...c.whyWeb.points.slice(0, 4), c.comparison.explanation].join(" "),
    faqs: c.faqs,
    ctaLabel: c.cta.primaryLabel,
  };
}

export type PngToWebpLocale = AppLocale;
