/**
 * WebP → JPG landing — compatibility / interchange focus
 * (distinct from JPG→WebP performance / Core Web Vitals story).
 */
import type {AppLocale} from "@/i18n/routing";

export type WebpToJpgFaq = {q: string; a: string};

export type WebpToJpgCopy = {
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
  whyUse: {
    eyebrow: string;
    title: string;
    cards: {title: string; body: string}[];
  };
  benefits: {
    eyebrow: string;
    title: string;
    cards: {
      title: string;
      body: string;
      icon: "compat" | "fast" | "browser" | "privacy" | "safe" | "quality";
    }[];
  };
  howTo: {
    eyebrow: string;
    title: string;
    steps: {title: string; body: string}[];
    imageAlt: string;
  };
  comparison: {
    eyebrow: string;
    title: string;
    intro: string;
    columns: [string, string, string];
    rows: {label: string; webp: string; jpg: string}[];
    explanation: string;
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
  faqs: WebpToJpgFaq[];
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

const en: WebpToJpgCopy = {
  metaTitle: "Convert WebP to JPG Online Free | SEO Images",
  metaDescription:
    "Convert WebP images to JPG online for maximum compatibility. Secure browser-based conversion with instant download and no software required.",
  h1: "Convert WebP to JPG Online",
  breadcrumbParent: {href: "/convert-image", label: "Convert Image"},
  breadcrumbCurrent: "WebP to JPG",
  hero: {
    badge: "WEBP TO JPG CONVERTER",
    paragraph:
      "Convert WebP images into JPG format directly in your browser. Make your images compatible with older software, websites, document editors and devices while keeping excellent image quality.",
    trust: [
      "Universal Compatibility",
      "Fast Conversion",
      "Private Processing",
      "No Software Required",
    ],
    uploadCta: "Upload WebP",
    heroImageAlt: "Browser interface converting a WebP image into a JPG download",
  },
  guestBar: {
    title: "Guest usage",
    deletionTitle: "Automatic deletion",
    countdownLabel: "Temporary files delete automatically in",
  },
  upload: {
    heading: "Upload a WebP Image",
    supporting: "Drag and drop a WebP image, paste it from your clipboard or browse your computer.",
    chooseLabel: "Choose WebP",
    formatsHint: "WebP · Maximum file size follows guest limits shown above",
    features: [
      {title: "Instant Conversion", body: "Turn WebP into JPG with the shared convert engine."},
      {title: "Private Processing", body: "Uploads stay in temporary private storage."},
      {title: "Automatic File Deletion", body: "Guest files are removed after the retention countdown."},
      {title: "High Quality JPG", body: "Download a JPG ready for editors, email and older apps."},
    ],
  },
  intro: {
    eyebrow: "BETTER COMPATIBILITY",
    title: "Why Convert WebP to JPG?",
    paragraphs: [
      "Although WebP is widely supported by modern browsers, some applications, document editors, CMS platforms and older software still work better with JPG images.",
      "Converting WebP to JPG creates a universally supported image format that's easier to share, upload and edit across different devices and applications.",
      "The original WebP image remains unchanged on your device. This page is about interchange — not replacing WebP delivery on sites that already support it.",
    ],
    imageAlt: "WebP converting to JPG with compatibility icons for email, documents and software",
  },
  whyUse: {
    eyebrow: "WHY USE JPG",
    title: "When JPG Still Wins",
    cards: [
      {
        title: "Better Software Compatibility",
        body: "Desktop editors, chat apps and printers often accept JPG long before WebP.",
      },
      {
        title: "Universal Browser Support",
        body: "JPG remains the safe fallback when you cannot assume modern decode support.",
      },
      {
        title: "Easy Image Sharing",
        body: "Attachments and message apps rarely reject a standard JPG upload.",
      },
      {
        title: "Works in Most Editors",
        body: "Word, PowerPoint and many design tools open JPG without extra plugins.",
      },
    ],
  },
  benefits: {
    eyebrow: "WHY CONVERT HERE",
    title: "Compatibility Without Installing Software",
    cards: [
      {
        title: "Universal Compatibility",
        body: "Works almost everywhere partners still expect a classic JPG file.",
        icon: "compat",
      },
      {
        title: "Fast Browser Conversion",
        body: "Run WebP→JPG in the browser UI with the shared guest convert engine.",
        icon: "fast",
      },
      {
        title: "No Installation",
        body: "No Photoshop export or desktop converter required for a single file.",
        icon: "browser",
      },
      {
        title: "Private Processing",
        body: "Files remain temporary and are not published to a public gallery.",
        icon: "privacy",
      },
      {
        title: "Original File Protected",
        body: "Download a new JPG. Your original WebP stays unchanged.",
        icon: "safe",
      },
      {
        title: "High Quality Output",
        body: "Quality presets help balance clarity and weight for documents and sharing.",
        icon: "quality",
      },
    ],
  },
  howTo: {
    eyebrow: "THREE SIMPLE STEPS",
    title: "How to Convert WebP to JPG",
    steps: [
      {
        title: "Upload WebP",
        body: "Choose a WebP from your device, drag it into the upload area or paste it from your clipboard.",
      },
      {
        title: "Convert",
        body: "Confirm JPG as the target and run conversion with the shared guest convert engine.",
      },
      {
        title: "Download JPG",
        body: "Preview the result and download the new JPG while keeping the original WebP safe.",
      },
    ],
    imageAlt: "Three steps for uploading WebP, converting to JPG and downloading the result",
  },
  comparison: {
    eyebrow: "WEBP VS JPG",
    title: "How WebP and JPG Compare",
    intro: "Use this as a practical guide for compatibility decisions — not a promise that every file gets smaller or larger after conversion.",
    columns: ["Compare", "WebP", "JPG"],
    rows: [
      {
        label: "Browser support",
        webp: "Strong on modern browsers",
        jpg: "Nearly universal",
      },
      {
        label: "Software compatibility",
        webp: "Mixed outside modern browsers",
        jpg: "Widely accepted in editors and apps",
      },
      {
        label: "Transparency",
        webp: "Can store an alpha channel",
        jpg: "No alpha — opaque pixels only",
      },
      {
        label: "Compression",
        webp: "Often lighter for web delivery",
        jpg: "Mature lossy photographic encode",
      },
      {
        label: "Editing support",
        webp: "Depends on the tool",
        jpg: "Default in most legacy software",
      },
      {
        label: "File size",
        webp: "Often smaller on websites",
        jpg: "May grow after conversion; compress if needed",
      },
    ],
    explanation:
      "Choose JPG when interchange and older software matter. Keep WebP for modern websites where browsers and CDNs already serve it well. Transparency never survives a JPG download.",
  },
  useCases: {
    eyebrow: "COMMON USE CASES",
    title: "Where WebP to JPG Helps Most",
    cards: [
      {
        title: "Email Attachments",
        body: "Send photos that older mail clients and ESPs open without WebP support.",
      },
      {
        title: "Microsoft Office Documents",
        body: "Insert images into Word, PowerPoint or Excel with a familiar JPG format.",
      },
      {
        title: "WordPress Uploads",
        body: "Unblock CMS workflows or plugins that still prefer JPG media libraries.",
      },
      {
        title: "Older Editing Software",
        body: "Open screenshots and exports in editors that do not decode WebP yet.",
      },
    ],
  },
  tips: {
    eyebrow: "BETTER RESULTS",
    title: "Conversion Tips",
    items: [
      "Keep the original WebP as a separate master when quality matters later.",
      "Resize after conversion if the layout box is smaller than the pixel canvas.",
      "Compress JPG afterward when email or CMS size limits still block the file.",
      "Preview before downloading, especially for photos with fine detail or text.",
      "Use JPG when sharing into apps, printers or partners that reject WebP.",
      "Use WebP for websites when visitors’ browsers already support modern formats.",
    ],
  },
  faqHeading: "Frequently Asked Questions",
  faqs: [
    {
      q: "Why convert WebP to JPG?",
      a: "Use JPG when chat apps, documents, CMS uploads or older software still reject WebP even though modern browsers can display it.",
    },
    {
      q: "Will WebP to JPG change image quality?",
      a: "Conversion re-encodes pixels with lossy JPG settings, so results depend on the source and quality preset. Preview before you replace a master.",
    },
    {
      q: "Does JPG keep transparency from WebP?",
      a: "No. JPG cannot store an alpha channel. Transparent areas become opaque during conversion.",
    },
    {
      q: "Can I convert several WebP files on this page?",
      a: "This landing is built for single-image conversion. For multiple files, use Bulk Image Tools.",
    },
    {
      q: "Does converting overwrite my original WebP?",
      a: "No. A new JPG is created for download. The WebP on your device remains unchanged.",
    },
    {
      q: "Are WebP to JPG uploads kept private?",
      a: "Guest images use private temporary storage and are deleted automatically according to the retention countdown on the page.",
    },
    {
      q: "What are the guest limits for WebP to JPG?",
      a: "Free guest operations and maximum file size appear in the usage bar above the uploader. Higher limits may require an account.",
    },
    {
      q: "What is the maximum upload size for WebP to JPG?",
      a: "The maximum size matches the guest upload limit shown in the usage bar. Oversized files are rejected before conversion starts.",
    },
    {
      q: "How do JPG and WebP differ for sharing and editing?",
      a: "WebP is often better for modern websites. JPG remains the safer interchange format for email, Office docs and older editors.",
    },
    {
      q: "When should I keep the WebP file instead?",
      a: "Keep WebP when you control a modern website or CDN that already serves WebP to visitors — convert only when a partner needs JPG.",
    },
  ],
  related: {
    eyebrow: "CONTINUE EDITING",
    title: "Related Image Tools",
    tools: [
      {href: "/jpg-to-webp", title: "JPG to WebP", body: "Create a modern WebP version for faster websites."},
      {href: "/png-to-jpg", title: "PNG to JPG", body: "Flatten PNG graphics into a compatible JPG."},
      {href: "/compress-jpg", title: "Compress JPG", body: "Reduce JPG weight after conversion."},
      {href: "/resize-jpg", title: "Resize JPG", body: "Change width and height for layouts and docs."},
      {href: "/crop-jpg", title: "Crop JPG", body: "Frame the subject before you share the file."},
      {href: "/bulk-image-tools", title: "Bulk Convert Images", body: "Process several images in one guest workflow."},
    ],
  },
  cta: {
    title: "Need Another JPG?",
    body: "Convert another WebP image or create a free account for additional image tools and higher usage limits.",
    primaryLabel: "Convert Another Image",
    secondaryLabel: "Create Free Account",
    secondaryHref: "/register",
  },
};

const ur: WebpToJpgCopy = {
  metaTitle: "آن لائن WebP کو JPG میں تبدیل کریں مفت | SEO Images",
  metaDescription:
    "زیادہ سے زیادہ مطابقت کے لیے WebP تصاویر آن لائن JPG میں تبدیل کریں۔ محفوظ براؤزر پر مبنی کنورژن، فوری ڈاؤن لوڈ، بغیر سافٹ ویئر۔",
  h1: "آن لائن WebP کو JPG میں تبدیل کریں",
  breadcrumbParent: {href: "/convert-image", label: "تصویر تبدیل کریں"},
  breadcrumbCurrent: "WebP to JPG",
  hero: {
    badge: "WEBP TO JPG CONVERTER",
    paragraph:
      "اپنے براؤزر میں ہی WebP تصاویر کو JPG فارمیٹ میں تبدیل کریں۔ پرانے سافٹ ویئر، ویب سائٹس، دستاویز ایڈیٹرز اور ڈیوائسز کے ساتھ مطابقت رکھیں اور بہترین امیج کوالٹی برقرار رکھیں۔",
    trust: ["عالمگیر مطابقت", "تیز کنورژن", "نجی پروسیسنگ", "سافٹ ویئر کی ضرورت نہیں"],
    uploadCta: "WebP اپ لوڈ کریں",
    heroImageAlt: "براؤزر انٹرفیس میں WebP کو JPG ڈاؤن لوڈ میں تبدیل کرتے ہوئے",
  },
  guestBar: {
    title: "مہمان استعمال",
    deletionTitle: "خودکار حذف",
    countdownLabel: "عارضی فائلیں خود بخود حذف ہوں گی",
  },
  upload: {
    heading: "WebP تصویر اپ لوڈ کریں",
    supporting: "WebP گھسیٹیں، کلپ بورڈ سے چسپاں کریں یا کمپیوٹر سے چنیں۔",
    chooseLabel: "WebP چنیں",
    formatsHint: "WebP · زیادہ سے زیادہ فائل سائز اوپر دکھائی گئی مہمان حد کے مطابق",
    features: [
      {title: "فوری کنورژن", body: "شیئرڈ کنورٹ انجن سے WebP کو JPG بنائیں۔"},
      {title: "نجی پروسیسنگ", body: "اپ لوڈز عارضی نجی اسٹوریج میں رہتی ہیں۔"},
      {title: "خودکار فائل حذف", body: "برقرار رکھنے کی مدت کے بعد مہمان فائلیں ہٹ جاتی ہیں۔"},
      {title: "اعلیٰ معیار JPG", body: "ایڈیٹرز، ای میل اور پرانی ایپس کے لیے تیار JPG۔"},
    ],
  },
  intro: {
    eyebrow: "بہتر مطابقت",
    title: "WebP کو JPG میں کیوں تبدیل کریں؟",
    paragraphs: [
      "اگرچہ جدید براؤزرز WebP کو وسیع پیمانے پر سپورٹ کرتے ہیں، کچھ ایپلیکیشنز، دستاویز ایڈیٹرز، CMS پلیٹ فارمز اور پرانا سافٹ ویئر اب بھی JPG کے ساتھ بہتر کام کرتے ہیں۔",
      "WebP کو JPG میں بدلنے سے ایک عالمگیری طور پر سپورٹڈ فارمیٹ ملتا ہے جو شیئر، اپ لوڈ اور ایڈٹ کرنا مختلف ڈیوائسز اور ایپس پر آسان ہوتا ہے۔",
      "اصل WebP ڈیوائس پر جوں کی توں رہتی ہے۔ یہ صفحہ interchange کے لیے ہے — جہاں سائٹ پہلے ہی WebP دے سکتی ہو وہاں اسے بدلنا مقصد نہیں۔",
    ],
    imageAlt: "WebP سے JPG کنورژن کے ساتھ ای میل، دستاویزات اور سافٹ ویئر کی مطابقت آئیکنز",
  },
  whyUse: {
    eyebrow: "JPG کیوں",
    title: "JPG اب بھی کہاں جیتتا ہے",
    cards: [
      {
        title: "بہتر سافٹ ویئر مطابقت",
        body: "ڈیسکٹاپ ایڈیٹرز، چیٹ ایپس اور پرنٹرز اکثر WebP سے پہلے JPG قبول کرتے ہیں۔",
      },
      {
        title: "عالمگیر براؤزر سپورٹ",
        body: "جب جدید ڈیکوڈ یقینی نہ ہو تو JPG محفوظ فال بیک رہتا ہے۔",
      },
      {
        title: "آسان امیج شیئرنگ",
        body: "اٹیچمنٹس اور میسج ایپس شاذ و نادر ہی معیاری JPG مسترد کرتی ہیں۔",
      },
      {
        title: "زیادہ تر ایڈیٹرز میں کام کرتا ہے",
        body: "Word، PowerPoint اور بہت سے ڈیزائن ٹولز بغیر پلگ ان JPG کھولتے ہیں۔",
      },
    ],
  },
  benefits: {
    eyebrow: "یہاں کیوں تبدیل کریں",
    title: "بغیر انسٹالیشن مطابقت",
    cards: [
      {
        title: "عالمگیر مطابقت",
        body: "تقریباً ہر جگہ جہاں پارٹنرز اب بھی کلاسیک JPG چاہتے ہیں۔",
        icon: "compat",
      },
      {
        title: "تیز براؤزر کنورژن",
        body: "شیئرڈ مہمان کنورٹ انجن سے براؤزر میں WebP→JPG چلائیں۔",
        icon: "fast",
      },
      {
        title: "بغیر انسٹالیشن",
        body: "ایک فائل کے لیے Photoshop ایکسپورٹ یا ڈیسکٹاپ کنورٹر درکار نہیں۔",
        icon: "browser",
      },
      {
        title: "نجی پروسیسنگ",
        body: "فائلیں عارضی رہتی ہیں اور عوامی گیلری میں نہیں جاتیں۔",
        icon: "privacy",
      },
      {
        title: "اصل فائل محفوظ",
        body: "نئی JPG ڈاؤن لوڈ کریں۔ اصل WebP جوں کی توں رہتی ہے۔",
        icon: "safe",
      },
      {
        title: "اعلیٰ معیار آؤٹ پٹ",
        body: "دستاویزات اور شیئرنگ کے لیے وضاحت اور وزن کا توازن۔",
        icon: "quality",
      },
    ],
  },
  howTo: {
    eyebrow: "تین آسان مراحل",
    title: "WebP کو JPG میں کیسے تبدیل کریں",
    steps: [
      {
        title: "WebP اپ لوڈ کریں",
        body: "ڈیوائس سے WebP چنیں، اپ لوڈ ایریا میں گھسیٹیں، یا کلپ بورڈ سے چسپاں کریں۔",
      },
      {
        title: "تبدیل کریں",
        body: "ٹارگٹ JPG تصدیق کریں اور شیئرڈ مہمان کنورٹ انجن چلائیں۔",
      },
      {
        title: "JPG ڈاؤن لوڈ کریں",
        body: "نتیجہ دیکھیں اور اصل WebP محفوظ رکھتے ہوئے نئی JPG ڈاؤن لوڈ کریں۔",
      },
    ],
    imageAlt: "WebP اپ لوڈ، JPG کنورژن اور ڈاؤن لوڈ کے تین مراحل",
  },
  comparison: {
    eyebrow: "WebP بمقابلہ JPG",
    title: "WebP اور JPG کا موازنہ",
    intro: "یہ جدول مطابقت کے فیصلوں کے لیے عملی رہنمائی ہے — ہر فائل چھوٹی یا بڑی ہونے کا وعدہ نہیں۔",
    columns: ["موازنہ", "WebP", "JPG"],
    rows: [
      {
        label: "براؤزر سپورٹ",
        webp: "جدید براؤزرز پر مضبوط",
        jpg: "تقریباً عالمگیر",
      },
      {
        label: "سافٹ ویئر مطابقت",
        webp: "جدید براؤزرز کے باہر مخلوط",
        jpg: "ایڈیٹرز اور ایپس میں وسیع قبولیت",
      },
      {
        label: "شفافیت",
        webp: "الفا چینل رکھ سکتا ہے",
        jpg: "الفا نہیں — صرف غیر شفاف",
      },
      {
        label: "کمپریشن",
        webp: "ویب ڈیلیوری کے لیے اکثر ہلکا",
        jpg: "پختہ لاسی فوٹوگرافک انکوڈ",
      },
      {
        label: "ایڈیٹنگ سپورٹ",
        webp: "ٹول پر منحصر",
        jpg: "زیادہ تر پرانے سافٹ ویئر میں ڈیفالٹ",
      },
      {
        label: "فائل سائز",
        webp: "ویب سائٹس پر اکثر چھوٹا",
        jpg: "کنورژن بعد بڑھ سکتا ہے؛ ضرورت ہو تو کمپریس کریں",
      },
    ],
    explanation:
      "جب interchange اور پرانا سافٹ ویئر اہم ہو تو JPG چنیں۔ جدید ویب سائٹس کے لیے WebP رکھیں جہاں براؤزر اور CDN پہلے ہی ٹھیک دیتے ہوں۔ JPG ڈاؤن لوڈ میں شفافیت کبھی نہیں رہتی۔",
  },
  useCases: {
    eyebrow: "عام استعمالات",
    title: "WebP to JPG سب سے زیادہ کہاں مدد کرتا ہے",
    cards: [
      {
        title: "ای میل اٹیچمنٹس",
        body: "ایسی فوٹوز بھیجیں جو پرانے میل کلائنٹس اور ESPs بغیر WebP سپورٹ کھول لیں۔",
      },
      {
        title: "مائیکروسافٹ آفس دستاویزات",
        body: "Word، PowerPoint یا Excel میں مانوس JPG فارمیٹ سے تصاویر لگائیں۔",
      },
      {
        title: "ورڈپریس اپ لوڈز",
        body: "CMS ورک فلو یا پلگ ان ان بلاک کریں جو اب بھی JPG میڈیا لائبریری چاہتے ہیں۔",
      },
      {
        title: "پرانا ایڈیٹنگ سافٹ ویئر",
        body: "ایسے ایڈیٹرز میں اسکرین شاٹس کھولیں جو ابھی WebP ڈیکوڈ نہیں کرتے۔",
      },
    ],
  },
  tips: {
    eyebrow: "بہتر نتائج",
    title: "کنورژن کے مشورے",
    items: [
      "جب بعد میں کوالٹی اہم ہو تو اصل WebP الگ ماسٹر کے طور پر رکھیں۔",
      "اگر لے آؤٹ باکس چھوٹا ہو تو کنورژن کے بعد ری سائز کریں۔",
      "اگر ای میل یا CMS سائز حد اب بھی روکے تو بعد میں Compress JPG استعمال کریں۔",
      "ڈاؤن لوڈ سے پہلے دیکھیں، خاص طور پر باریک تفصیل یا ٹیکسٹ والی فوٹوز۔",
      "جب ایپس، پرنٹرز یا پارٹنرز WebP مسترد کریں تو JPG استعمال کریں۔",
      "ویب سائٹس کے لیے WebP رکھیں جہاں وزٹرز کے براؤزر جدید فارمیٹ سپورٹ کریں۔",
    ],
  },
  faqHeading: "عمومی سوالات",
  faqs: [
    {
      q: "WebP کو JPG میں کیوں تبدیل کریں؟",
      a: "جب چیٹ ایپس، دستاویزات، CMS اپ لوڈز یا پرانا سافٹ ویئر WebP مسترد کرے حالانکہ جدید براؤزرز دکھا سکتے ہوں تو JPG استعمال کریں۔",
    },
    {
      q: "کیا WebP to JPG سے امیج کوالٹی بدلتی ہے؟",
      a: "کنورژن لاسی JPG سیٹنگز سے پکسلز دوبارہ اینکوڈ کرتا ہے، اس لیے نتیجہ ماخذ اور کوالٹی پری سیٹ پر منحصر ہے۔ ماسٹر بدلنے سے پہلے دیکھیں۔",
    },
    {
      q: "کیا JPG میں WebP کی شفافیت رہتی ہے؟",
      a: "نہیں۔ JPG الفا چینل نہیں رکھتا۔ شفاف حصے کنورژن کے دوران غیر شفاف ہو جاتے ہیں۔",
    },
    {
      q: "کیا اس صفحے پر کئی WebP فائلیں تبدیل ہو سکتی ہیں؟",
      a: "یہ لینڈنگ سنگل امیج کنورژن کے لیے ہے۔ کئی فائلوں کے لیے Bulk Image Tools استعمال کریں۔",
    },
    {
      q: "کیا کنورژن میری اصل WebP کو اوور رائٹ کرتا ہے؟",
      a: "نہیں۔ ڈاؤن لوڈ کے لیے نئی JPG بنتی ہے۔ ڈیوائس پر WebP جوں کی توں رہتی ہے۔",
    },
    {
      q: "کیا WebP to JPG اپ لوڈز نجی رہتے ہیں؟",
      a: "مہمان تصاویر نجی عارضی اسٹوریج استعمال کرتی ہیں اور صفحے پر دکھائی گئی برقرار رکھنے کی مدت کے مطابق خودبخود حذف ہوتی ہیں۔",
    },
    {
      q: "WebP to JPG کی مہمان حدود کیا ہیں؟",
      a: "مفت مہمان آپریشنز اور زیادہ سے زیادہ فائل سائز اپ لوڈر کے اوپر استعمال بار میں نظر آتی ہیں۔ اعلیٰ حدود کے لیے اکاؤنٹ درکار ہو سکتا ہے۔",
    },
    {
      q: "WebP to JPG کی زیادہ سے زیادہ اپ لوڈ سائز کیا ہے؟",
      a: "زیادہ سے زیادہ سائز استعمال بار میں دکھائی گئی مہمان اپ لوڈ حد کے برابر ہے۔ بڑی فائلیں کنورژن سے پہلے مسترد ہوتی ہیں۔",
    },
    {
      q: "شیئرنگ اور ایڈیٹنگ کے لیے JPG اور WebP میں کیا فرق ہے؟",
      a: "جدید ویب سائٹس کے لیے WebP اکثر بہتر ہے۔ ای میل، آفس دستاویزات اور پرانے ایڈیٹرز کے لیے JPG محفوظ تر interchange فارمیٹ رہتا ہے۔",
    },
    {
      q: "WebP فائل کب رکھنی چاہیے؟",
      a: "جب آپ جدید ویب سائٹ یا CDN کنٹرول کریں جو وزٹرز کو پہلے ہی WebP دے رہا ہو — صرف تب تبدیل کریں جب پارٹنر کو JPG چاہیے۔",
    },
  ],
  related: {
    eyebrow: "مزید ایڈیٹنگ",
    title: "متعلقہ امیج ٹولز",
    tools: [
      {href: "/jpg-to-webp", title: "JPG to WebP", body: "تیز ویب سائٹس کے لیے جدید WebP ورژن بنائیں۔"},
      {href: "/png-to-jpg", title: "PNG to JPG", body: "PNG گرافکس کو مطابقت پذیر JPG میں فلیٹ کریں۔"},
      {href: "/compress-jpg", title: "Compress JPG", body: "کنورژن کے بعد JPG وزن کم کریں۔"},
      {href: "/resize-jpg", title: "Resize JPG", body: "لے آؤٹ اور دستاویزات کے لیے ابعاد بدلیں۔"},
      {href: "/crop-jpg", title: "Crop JPG", body: "شیئر کرنے سے پہلے سبجیکٹ فریم کریں۔"},
      {href: "/bulk-image-tools", title: "Bulk Convert Images", body: "ایک مہمان ورک فلو میں کئی تصاویر پروسیس کریں۔"},
    ],
  },
  cta: {
    title: "ایک اور JPG درکار ہے؟",
    body: "ایک اور WebP تبدیل کریں یا اضافی امیج ٹولز اور اعلیٰ استعمال کی حدود کے لیے مفت اکاؤنٹ بنائیں۔",
    primaryLabel: "ایک اور تصویر تبدیل کریں",
    secondaryLabel: "مفت اکاؤنٹ بنائیں",
    secondaryHref: "/register",
  },
};

export function getWebpToJpgCopy(locale: string): WebpToJpgCopy {
  return locale === "ur" ? ur : en;
}

export function webpToJpgSeoCompat() {
  const c = en;
  return {
    intro: [
      c.hero.paragraph,
      "Guest sessions stay private on temporary storage, and the download is a new JPG rather than an overwrite of your original WebP.",
      "This landing focuses on compatibility with email, documents and older software — not website performance modernization.",
    ].join(" "),
    why: [
      c.intro.paragraphs[0],
      c.intro.paragraphs[1],
      "Unlike JPG to WebP, the story here is interchange: WhatsApp-style sharing, Office uploads, CMS modules and editors that still reject WebP.",
      c.benefits.cards[0]!.body,
      c.comparison.explanation,
    ].join(" "),
    benefits: c.benefits.cards.map((card) => ({title: card.title, body: card.body})),
    howTo: [
      "Upload a WebP image",
      "Confirm JPG as the target format",
      "Convert with the guest engine",
      "Download the JPG file",
    ] as [string, string, string, string],
    technicalTitle: c.comparison.title,
    technical: [
      ...c.comparison.rows.map((row) => `${row.label}: WebP — ${row.webp}; JPG — ${row.jpg}.`),
      c.comparison.explanation,
      "Transparency cannot survive JPG output. Prefer Compress JPG when attachment limits remain after conversion.",
    ].join(" "),
    faqs: c.faqs,
    ctaLabel: c.cta.primaryLabel,
  };
}

export type WebpToJpgLocale = AppLocale;
