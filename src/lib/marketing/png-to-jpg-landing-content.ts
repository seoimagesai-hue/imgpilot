/**
 * PNG → JPG landing — transparency flatten / universal compatibility focus
 * (distinct from WebP↔JPG and PNG→WebP preserve-alpha stories).
 */
import type {AppLocale} from "@/i18n/routing";

export type PngToJpgFaq = {q: string; a: string};

export type PngToJpgCopy = {
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
    rows: {label: string; png: string; jpg: string}[];
    explanation: string;
  };
  benefits: {
    eyebrow: string;
    title: string;
    cards: {
      title: string;
      body: string;
      icon: "compat" | "size" | "docs" | "share" | "privacy" | "safe";
    }[];
  };
  howTo: {
    eyebrow: string;
    title: string;
    steps: {title: string; body: string}[];
    imageAlt: string;
  };
  transparency: {
    title: string;
    paragraphs: string[];
    noteTitle: string;
    noteBody: string;
    noteLinkLabel: string;
    noteLinkHref: "/png-to-webp";
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
  faqs: PngToJpgFaq[];
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

const en: PngToJpgCopy = {
  metaTitle: "Convert PNG to JPG Online Free | SEO Images",
  metaDescription:
    "Convert PNG images to JPG online for smaller file sizes and universal compatibility. Secure browser-based conversion with instant download.",
  h1: "Convert PNG to JPG Online",
  breadcrumbParent: {href: "/convert-image", label: "Convert Image"},
  breadcrumbCurrent: "PNG to JPG",
  hero: {
    badge: "PNG TO JPG CONVERTER",
    paragraph:
      "Convert PNG images into JPG format directly in your browser. Create smaller, widely compatible images for websites, documents, presentations and online sharing without installing any software.",
    trust: ["Fast Conversion", "Smaller Files", "Private Processing", "No Software Required"],
    uploadCta: "Upload PNG",
    heroImageAlt: "Browser interface converting a transparent PNG into a JPG with a solid background",
  },
  guestBar: {
    title: "Guest usage",
    deletionTitle: "Automatic deletion",
    countdownLabel: "Temporary files delete automatically in",
  },
  upload: {
    heading: "Upload a PNG Image",
    supporting: "Drag and drop your PNG image, paste it from the clipboard or browse your device.",
    chooseLabel: "Choose PNG",
    formatsHint: "PNG · Maximum file size follows guest limits shown above",
    features: [
      {title: "Fast Conversion", body: "Turn PNG into JPG with the shared convert engine."},
      {title: "Smaller JPG Output", body: "Often lighter than PNG when transparency is not required."},
      {title: "Automatic File Deletion", body: "Guest files are removed after the retention countdown."},
      {title: "Private Processing", body: "Uploads stay in temporary private storage."},
    ],
  },
  intro: {
    eyebrow: "UNIVERSAL IMAGE FORMAT",
    title: "Why Convert PNG to JPG?",
    paragraphs: [
      "PNG images are excellent for graphics and transparent backgrounds, but they are often much larger than JPG files. JPG is widely supported across websites, office software, document editors and online platforms, making it a practical choice when transparency is not required.",
      "This converter creates a new JPG while keeping your original PNG unchanged on your device.",
      "If you need to keep transparency, do not use JPG — keep the PNG or convert to WebP instead.",
    ],
    imageAlt: "Transparent PNG logo before conversion and JPG with white background after conversion",
  },
  comparison: {
    eyebrow: "PNG VS JPG",
    title: "How PNG and JPG Compare",
    intro: "Choose based on whether you need transparency and how the file will be shared — not every PNG should become a JPG.",
    columns: ["Compare", "PNG", "JPG"],
    rows: [
      {label: "Compression style", png: "Lossless (typically)", jpg: "Lossy photographic encode"},
      {label: "Transparency", png: "Supports alpha channels", jpg: "No transparency"},
      {label: "Typical file size", png: "Often larger", jpg: "Often smaller for photos"},
      {label: "Best for logos / UI", png: "Strong when edges stay sharp", jpg: "Can soften fine text"},
      {label: "Best for photos", png: "Works, but often heavy", jpg: "Strong everyday choice"},
      {label: "Compatibility", png: "Very broad", jpg: "Nearly universal interchange"},
    ],
    explanation:
      "Use JPG for photos, documents and platforms that reject oversized PNG uploads. Keep PNG when logos, icons or UI need a transparent background.",
  },
  benefits: {
    eyebrow: "WHY CONVERT",
    title: "JPG When Transparency Is Optional",
    cards: [
      {
        title: "Universal Compatibility",
        body: "JPG opens almost everywhere partners, printers and older tools still expect it.",
        icon: "compat",
      },
      {
        title: "Smaller File Size",
        body: "Photographic PNGs often shrink after a careful JPG convert.",
        icon: "size",
      },
      {
        title: "Perfect for Documents",
        body: "Insert images into Office files and PDFs without dragging heavy PNG weight.",
        icon: "docs",
      },
      {
        title: "Easy Sharing",
        body: "Email, chat apps and CMS uploads rarely reject a standard JPG.",
        icon: "share",
      },
      {
        title: "Private Processing",
        body: "Files remain temporary and are not published to a public gallery.",
        icon: "privacy",
      },
      {
        title: "Original Protected",
        body: "Download a new JPG. Your original PNG stays unchanged.",
        icon: "safe",
      },
    ],
  },
  howTo: {
    eyebrow: "THREE SIMPLE STEPS",
    title: "How to Convert PNG to JPG",
    steps: [
      {
        title: "Upload PNG",
        body: "Choose a PNG from your device, drag it into the upload area or paste it from your clipboard.",
      },
      {
        title: "Convert",
        body: "Confirm JPG as the target. If the PNG has transparency, pick a flatten background such as white or black.",
      },
      {
        title: "Download JPG",
        body: "Preview the opaque result and download the new JPG while keeping the original PNG safe.",
      },
    ],
    imageAlt: "Three steps for uploading PNG, converting to JPG and downloading the result",
  },
  transparency: {
    title: "What Happens to Transparent Backgrounds?",
    paragraphs: [
      "When a PNG image contains transparent areas, JPG cannot preserve transparency because the format does not support alpha channels.",
      "Those transparent areas are replaced with a solid background color during conversion — usually white, unless you select another available background option such as black.",
      "Preview the flattened result before you publish brand logos or UI assets that relied on see-through pixels.",
    ],
    noteTitle: "Need transparency?",
    noteBody: "Keep your PNG or convert it to WebP instead — WebP can retain transparency for modern websites.",
    noteLinkLabel: "PNG to WebP",
    noteLinkHref: "/png-to-webp",
  },
  useCases: {
    eyebrow: "COMMON USE CASES",
    title: "Where PNG to JPG Helps Most",
    cards: [
      {
        title: "Office Documents",
        body: "Drop lighter JPGs into Word, PowerPoint and slide decks without oversized PNG payloads.",
      },
      {
        title: "Website Uploads",
        body: "Meet CMS size limits for photos when the page does not need a transparent cutout.",
      },
      {
        title: "Email Attachments",
        body: "Share photos that mail clients open reliably without huge PNG attachments.",
      },
      {
        title: "Product Images",
        body: "Publish catalogue photos that look natural as JPG once backgrounds are solid.",
      },
    ],
  },
  tips: {
    eyebrow: "BETTER RESULTS",
    title: "Conversion Tips",
    items: [
      "Use JPG when transparency is unnecessary for the destination.",
      "Keep PNG for logos and icons that still need a transparent background.",
      "Resize before conversion if the layout box is much smaller than the file.",
      "Compress after conversion when email or CMS limits still block the JPG.",
      "Preview the background color after flattening transparent areas.",
      "Keep the original PNG as a separate master for future edits.",
    ],
  },
  faqHeading: "Frequently Asked Questions",
  faqs: [
    {
      q: "Why convert PNG to JPG?",
      a: "Use JPG when you need a smaller, widely compatible photo or document image and you do not need a transparent background.",
    },
    {
      q: "Does JPG support transparency from PNG?",
      a: "No. JPG cannot store an alpha channel, so transparent areas become opaque during conversion.",
    },
    {
      q: "What happens to transparent areas in PNG to JPG?",
      a: "Transparent pixels are filled with a solid background — commonly white, or black if you select that option — then encoded as JPG.",
    },
    {
      q: "Will converting PNG to JPG make the file smaller?",
      a: "Often yes for photographic content, but exact savings depend on the image and quality preset. Preview and compare.",
    },
    {
      q: "Can I convert transparent logos with PNG to JPG?",
      a: "You can, but the logo will sit on a solid background. If you need transparency, keep PNG or use PNG to WebP.",
    },
    {
      q: "Will converting overwrite my original PNG?",
      a: "No. A new JPG is created for download. The PNG on your device remains unchanged.",
    },
    {
      q: "Are PNG to JPG uploads private?",
      a: "Guest images use private temporary storage and are deleted automatically according to the retention countdown on the page.",
    },
    {
      q: "What are the guest limits for PNG to JPG?",
      a: "Free guest operations and maximum file size appear in the usage bar above the uploader. Higher limits may require an account.",
    },
    {
      q: "What is the maximum upload size for PNG to JPG?",
      a: "The maximum size matches the guest upload limit shown in the usage bar. Oversized files are rejected before conversion starts.",
    },
    {
      q: "What is the difference between PNG and JPG for websites?",
      a: "PNG suits graphics and transparency. JPG suits everyday photos and interchange when you do not need alpha and want broader compatibility.",
    },
  ],
  related: {
    eyebrow: "CONTINUE EDITING",
    title: "Related Image Tools",
    tools: [
      {href: "/png-to-webp", title: "PNG to WebP", body: "Keep transparency in a modern web format."},
      {href: "/resize-png", title: "Resize PNG", body: "Change PNG dimensions before or after conversion."},
      {href: "/compress-png", title: "Compress PNG", body: "Reduce PNG size when you must stay on PNG."},
      {href: "/jpg-to-webp", title: "JPG to WebP", body: "Create a modern WebP from photographic JPG masters."},
      {href: "/webp-to-jpg", title: "WebP to JPG", body: "Convert WebP back to JPG for older software."},
      {href: "/bulk-image-tools", title: "Bulk Convert Images", body: "Process several images in one guest workflow."},
    ],
  },
  cta: {
    title: "Ready to Convert Another PNG?",
    body: "Upload another PNG or create a free account to unlock more image tools and higher usage limits.",
    primaryLabel: "Convert Another Image",
    secondaryLabel: "Create Free Account",
    secondaryHref: "/register",
  },
};

const ur: PngToJpgCopy = {
  metaTitle: "آن لائن PNG کو JPG میں تبدیل کریں مفت | SEO Images",
  metaDescription:
    "چھوٹی فائل سائز اور عالمگیر مطابقت کے لیے PNG تصاویر آن لائن JPG میں تبدیل کریں۔ محفوظ براؤزر پر مبنی کنورژن اور فوری ڈاؤن لوڈ۔",
  h1: "آن لائن PNG کو JPG میں تبدیل کریں",
  breadcrumbParent: {href: "/convert-image", label: "تصویر تبدیل کریں"},
  breadcrumbCurrent: "PNG to JPG",
  hero: {
    badge: "PNG TO JPG CONVERTER",
    paragraph:
      "اپنے براؤزر میں ہی PNG تصاویر کو JPG فارمیٹ میں تبدیل کریں۔ ویب سائٹس، دستاویزات، پریزنٹیشنز اور آن لائن شیئرنگ کے لیے چھوٹی، وسیع مطابقت والی تصاویر بنائیں بغیر سافٹ ویئر انسٹال کیے۔",
    trust: ["تیز کنورژن", "چھوٹی فائلیں", "نجی پروسیسنگ", "سافٹ ویئر کی ضرورت نہیں"],
    uploadCta: "PNG اپ لوڈ کریں",
    heroImageAlt: "براؤزر میں شفاف PNG کو ٹھوس پس منظر والے JPG میں تبدیل کرتے ہوئے",
  },
  guestBar: {
    title: "مہمان استعمال",
    deletionTitle: "خودکار حذف",
    countdownLabel: "عارضی فائلیں خود بخود حذف ہوں گی",
  },
  upload: {
    heading: "PNG تصویر اپ لوڈ کریں",
    supporting: "PNG گھسیٹیں، کلپ بورڈ سے چسپاں کریں یا ڈیوائس سے چنیں۔",
    chooseLabel: "PNG چنیں",
    formatsHint: "PNG · زیادہ سے زیادہ فائل سائز اوپر دکھائی گئی مہمان حد کے مطابق",
    features: [
      {title: "تیز کنورژن", body: "شیئرڈ کنورٹ انجن سے PNG کو JPG بنائیں۔"},
      {title: "چھوٹا JPG آؤٹ پٹ", body: "جب شفافیت درکار نہ ہو تو اکثر PNG سے ہلکا۔"},
      {title: "خودکار فائل حذف", body: "برقرار رکھنے کی مدت کے بعد مہمان فائلیں ہٹ جاتی ہیں۔"},
      {title: "نجی پروسیسنگ", body: "اپ لوڈز عارضی نجی اسٹوریج میں رہتی ہیں۔"},
    ],
  },
  intro: {
    eyebrow: "عالمگیر امیج فارمیٹ",
    title: "PNG کو JPG میں کیوں تبدیل کریں؟",
    paragraphs: [
      "PNG گرافکس اور شفاف پس منظر کے لیے بہترین ہے، مگر اکثر JPG سے بہت بڑی ہوتی ہے۔ JPG ویب سائٹس، آفس سافٹ ویئر، دستاویز ایڈیٹرز اور آن لائن پلیٹ فارمز پر وسیع سپورٹ رکھتا ہے — جب شفافیت درکار نہ ہو تو عملی انتخاب۔",
      "یہ کنورٹر نئی JPG بناتا ہے جبکہ آپ کی اصل PNG ڈیوائس پر جوں کی توں رہتی ہے۔",
      "اگر شفافیت چاہیے تو JPG استعمال نہ کریں — PNG رکھیں یا WebP میں تبدیل کریں۔",
    ],
    imageAlt: "کنورژن سے پہلے شفاف PNG لوگو اور بعد میں سفید پس منظر والا JPG",
  },
  comparison: {
    eyebrow: "PNG بمقابلہ JPG",
    title: "PNG اور JPG کا موازنہ",
    intro: "فیصلہ اس بات پر کریں کہ شفافیت درکار ہے یا نہیں اور فائل کہاں شیئر ہوگی — ہر PNG کو JPG نہیں بنانا چاہیے۔",
    columns: ["موازنہ", "PNG", "JPG"],
    rows: [
      {label: "کمپریشن انداز", png: "عمومی طور پر لاسلیس", jpg: "لاسی فوٹوگرافک انکوڈ"},
      {label: "شفافیت", png: "الفا چینل سپورٹ", jpg: "شفافیت نہیں"},
      {label: "عام فائل سائز", png: "اکثر بڑا", jpg: "فوٹوز کے لیے اکثر چھوٹا"},
      {label: "لوگو / UI کے لیے", png: "کنارے تیز رہنے پر مضبوط", jpg: "باریک ٹیکسٹ نرم ہو سکتا ہے"},
      {label: "فوٹوز کے لیے", png: "چلتا ہے مگر اکثر بھاری", jpg: "روزانہ کا مضبوط انتخاب"},
      {label: "مطابقت", png: "بہت وسیع", jpg: "تقریباً عالمگیر interchange"},
    ],
    explanation:
      "فوٹوز، دستاویزات اور ان پلیٹ فارمز کے لیے JPG استعمال کریں جو بڑے PNG اپ لوڈ مسترد کریں۔ لوگو، آئیکنز یا UI کے لیے PNG رکھیں جنہیں شفاف پس منظر چاہیے۔",
  },
  benefits: {
    eyebrow: "تبدیلی کیوں",
    title: "جب شفافیت اختیاری ہو تو JPG",
    cards: [
      {
        title: "عالمگیر مطابقت",
        body: "پارٹنرز، پرنٹرز اور پرانے ٹولز جہاں JPG ہی چاہتے ہوں تقریباً ہر جگہ کھلتا ہے۔",
        icon: "compat",
      },
      {
        title: "چھوٹا فائل سائز",
        body: "فوٹوگرافک PNG احتیاط سے JPG بننے کے بعد اکثر سکڑتی ہے۔",
        icon: "size",
      },
      {
        title: "دستاویزات کے لیے موزوں",
        body: "آفس فائلوں اور PDFs میں بھاری PNG وزن کے بغیر تصاویر لگائیں۔",
        icon: "docs",
      },
      {
        title: "آسان شیئرنگ",
        body: "ای میل، چیٹ ایپس اور CMS اپ لوڈز شاذ و نادر ہی معیاری JPG مسترد کرتے ہیں۔",
        icon: "share",
      },
      {
        title: "نجی پروسیسنگ",
        body: "فائلیں عارضی رہتی ہیں اور عوامی گیلری میں نہیں جاتیں۔",
        icon: "privacy",
      },
      {
        title: "اصل محفوظ",
        body: "نئی JPG ڈاؤن لوڈ کریں۔ اصل PNG جوں کی توں رہتی ہے۔",
        icon: "safe",
      },
    ],
  },
  howTo: {
    eyebrow: "تین آسان مراحل",
    title: "PNG کو JPG میں کیسے تبدیل کریں",
    steps: [
      {
        title: "PNG اپ لوڈ کریں",
        body: "ڈیوائس سے PNG چنیں، اپ لوڈ ایریا میں گھسیٹیں، یا کلپ بورڈ سے چسپاں کریں۔",
      },
      {
        title: "تبدیل کریں",
        body: "ٹارگٹ JPG تصدیق کریں۔ اگر PNG میں شفافیت ہو تو سفید یا سیاہ فلیٹن پس منظر چنیں۔",
      },
      {
        title: "JPG ڈاؤن لوڈ کریں",
        body: "غیر شفاف نتیجہ دیکھیں اور اصل PNG محفوظ رکھتے ہوئے نئی JPG ڈاؤن لوڈ کریں۔",
      },
    ],
    imageAlt: "PNG اپ لوڈ، JPG کنورژن اور ڈاؤن لوڈ کے تین مراحل",
  },
  transparency: {
    title: "شفاف پس منظر کا کیا ہوتا ہے؟",
    paragraphs: [
      "جب PNG میں شفاف حصے ہوں، JPG شفافیت محفوظ نہیں رکھ سکتا کیونکہ فارمیٹ الفا چینل سپورٹ نہیں کرتا۔",
      "وہ شفاف حصے کنورژن کے دوران ٹھوس پس منظر رنگ سے بھر جاتے ہیں — عام طور پر سفید، جب تک آپ کالے جیسے دوسرے دستیاب آپشن کا انتخاب نہ کریں۔",
      "برینڈ لوگو یا UI اثاثے شائع کرنے سے پہلے فلیٹن نتیجہ کا پیش نظارہ دیکھیں جو شفاف پکسلز پر انحصار کرتے تھے۔",
    ],
    noteTitle: "شفافیت درکار ہے؟",
    noteBody: "اپنی PNG رکھیں یا اسے WebP میں تبدیل کریں — WebP جدید ویب سائٹس کے لیے شفافیت رکھ سکتا ہے۔",
    noteLinkLabel: "PNG to WebP",
    noteLinkHref: "/png-to-webp",
  },
  useCases: {
    eyebrow: "عام استعمالات",
    title: "PNG to JPG سب سے زیادہ کہاں مدد کرتا ہے",
    cards: [
      {
        title: "آفس دستاویزات",
        body: "Word، PowerPoint اور سلائیڈز میں ہلکی JPG لگائیں بغیر بڑی PNG کے۔",
      },
      {
        title: "ویب سائٹ اپ لوڈز",
        body: "فوٹوز پر CMS سائز حدود پوری کریں جب صفحے کو شفاف کٹ آؤٹ نہ چاہیے۔",
      },
      {
        title: "ای میل اٹیچمنٹس",
        body: "ایسی فوٹوز شیئر کریں جو میل کلائنٹس بڑی PNG کے بغیر کھول لیں۔",
      },
      {
        title: "پروڈکٹ امیجز",
        body: "کیٹلاگ فوٹوز شائع کریں جو ٹھوس پس منظر کے بعد قدرتی JPG لگیں۔",
      },
    ],
  },
  tips: {
    eyebrow: "بہتر نتائج",
    title: "کنورژن کے مشورے",
    items: [
      "جب منزل کے لیے شفافیت غیر ضروری ہو تو JPG استعمال کریں۔",
      "لوگو اور آئیکنز کے لیے PNG رکھیں جنہیں اب بھی شفاف پس منظر چاہیے۔",
      "اگر لے آؤٹ باکس بہت چھوٹا ہو تو کنورژن سے پہلے ری سائز کریں۔",
      "اگر ای میل یا CMS حد اب بھی روکے تو کنورژن کے بعد کمپریس کریں۔",
      "شفاف حصے فلیٹن ہونے کے بعد پس منظر رنگ کا پیش نظارہ دیکھیں۔",
      "اصل PNG مستقبل کی ایڈٹنگ کے لیے الگ ماسٹر رکھیں۔",
    ],
  },
  faqHeading: "عمومی سوالات",
  faqs: [
    {
      q: "PNG کو JPG میں کیوں تبدیل کریں؟",
      a: "جب چھوٹی، وسیع مطابقت والی فوٹو یا دستاویز امیج چاہیے اور شفاف پس منظر درکار نہ ہو تو JPG استعمال کریں۔",
    },
    {
      q: "کیا JPG میں PNG کی شفافیت سپورٹ ہوتی ہے؟",
      a: "نہیں۔ JPG الفا چینل نہیں رکھتا، اس لیے شفاف حصے کنورژن کے دوران غیر شفاف ہو جاتے ہیں۔",
    },
    {
      q: "PNG to JPG میں شفاف حصوں کا کیا ہوتا ہے؟",
      a: "شفاف پکسلز ٹھوس پس منظر سے بھرے جاتے ہیں — عام طور پر سفید، یا اگر آپ منتخب کریں تو کالا — پھر JPG کے طور پر اینکوڈ ہوتے ہیں۔",
    },
    {
      q: "کیا PNG کو JPG بنانے سے فائل چھوٹی ہو گی؟",
      a: "فوٹوگرافک مواد کے لیے اکثر ہاں، مگر بچت تصویر اور کوالٹی پری سیٹ پر منحصر ہے۔ موازنہ کر کے دیکھیں۔",
    },
    {
      q: "کیا شفاف لوگو PNG to JPG سے تبدیل ہو سکتے ہیں؟",
      a: "ہاں، مگر لوگو ٹھوس پس منظر پر بیٹھے گا۔ اگر شفافیت چاہیے تو PNG رکھیں یا PNG to WebP استعمال کریں۔",
    },
    {
      q: "کیا کنورژن میری اصل PNG کو اوور رائٹ کرتا ہے؟",
      a: "نہیں۔ ڈاؤن لوڈ کے لیے نئی JPG بنتی ہے۔ ڈیوائس پر PNG جوں کی توں رہتی ہے۔",
    },
    {
      q: "کیا PNG to JPG اپ لوڈز نجی ہیں؟",
      a: "مہمان تصاویر نجی عارضی اسٹوریج استعمال کرتی ہیں اور صفحے پر دکھائی گئی برقرار رکھنے کی مدت کے مطابق خودبخود حذف ہوتی ہیں۔",
    },
    {
      q: "PNG to JPG کی مہمان حدود کیا ہیں؟",
      a: "مفت مہمان آپریشنز اور زیادہ سے زیادہ فائل سائز اپ لوڈر کے اوپر استعمال بار میں نظر آتی ہیں۔ اعلیٰ حدود کے لیے اکاؤنٹ درکار ہو سکتا ہے۔",
    },
    {
      q: "PNG to JPG کی زیادہ سے زیادہ اپ لوڈ سائز کیا ہے؟",
      a: "زیادہ سے زیادہ سائز استعمال بار میں دکھائی گئی مہمان اپ لوڈ حد کے برابر ہے۔ بڑی فائلیں کنورژن سے پہلے مسترد ہوتی ہیں۔",
    },
    {
      q: "ویب سائٹس کے لیے PNG اور JPG میں کیا فرق ہے؟",
      a: "PNG گرافکس اور شفافیت کے لیے موزوں ہے۔ JPG روزمرہ فوٹوز اور interchange کے لیے جب الفا نہ چاہیے اور وسیع مطابقت چاہیے۔",
    },
  ],
  related: {
    eyebrow: "مزید ایڈیٹنگ",
    title: "متعلقہ امیج ٹولز",
    tools: [
      {href: "/png-to-webp", title: "PNG to WebP", body: "جدید ویب فارمیٹ میں شفافیت رکھیں۔"},
      {href: "/resize-png", title: "Resize PNG", body: "کنورژن سے پہلے یا بعد PNG ابعاد بدلیں۔"},
      {href: "/compress-png", title: "Compress PNG", body: "جب PNG پر رہنا ہو تو سائز کم کریں۔"},
      {href: "/jpg-to-webp", title: "JPG to WebP", body: "فوٹوگرافک JPG سے جدید WebP بنائیں۔"},
      {href: "/webp-to-jpg", title: "WebP to JPG", body: "پرانی سافٹ ویئر کے لیے WebP واپس JPG کریں۔"},
      {href: "/bulk-image-tools", title: "Bulk Convert Images", body: "ایک مہمان ورک فلو میں کئی تصاویر پروسیس کریں۔"},
    ],
  },
  cta: {
    title: "ایک اور PNG تبدیل کریں؟",
    body: "ایک اور PNG اپ لوڈ کریں یا مزید امیج ٹولز اور اعلیٰ استعمال کی حدود کے لیے مفت اکاؤنٹ بنائیں۔",
    primaryLabel: "ایک اور تصویر تبدیل کریں",
    secondaryLabel: "مفت اکاؤنٹ بنائیں",
    secondaryHref: "/register",
  },
};

export function getPngToJpgCopy(locale: string): PngToJpgCopy {
  return locale === "ur" ? ur : en;
}

export function pngToJpgSeoCompat() {
  const c = en;
  return {
    intro: [
      c.hero.paragraph,
      "Guest sessions stay private on temporary storage, and the download is a new JPG rather than an overwrite of your original PNG.",
      "This landing focuses on flattening transparent PNG graphics into a universally compatible JPG when alpha is no longer needed.",
    ].join(" "),
    why: [
      c.intro.paragraphs[0],
      c.intro.paragraphs[1],
      "Unlike WebP to JPG (interchange of modern photos) or PNG to WebP (keep transparency), PNG to JPG is about opaque documents, CMS uploads and lighter sharing when logos no longer need cutouts.",
      c.transparency.paragraphs[0],
      c.benefits.cards[0]!.body,
    ].join(" "),
    benefits: c.benefits.cards.map((card) => ({title: card.title, body: card.body})),
    howTo: [
      "Upload a PNG image",
      "Confirm JPG and choose a flatten background if needed",
      "Convert with the guest engine",
      "Download the JPG file",
    ] as [string, string, string, string],
    technicalTitle: c.transparency.title,
    technical: [
      ...c.transparency.paragraphs,
      c.comparison.explanation,
      "Guest convert may offer white or black jpeg backgrounds when alpha is detected. Preview brand assets after flattening.",
    ].join(" "),
    faqs: c.faqs,
    ctaLabel: c.cta.primaryLabel,
  };
}

export type PngToJpgLocale = AppLocale;
