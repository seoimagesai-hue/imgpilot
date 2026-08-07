import {localizedCopy} from "@/lib/marketing/localized-copy";
/**
 * Crop JPG landing — composition / social crop focus (distinct from resize & compress).
 */
import type {AppLocale} from "@/i18n/routing";

export type CropJpgFaq = {q: string; a: string};

export type CropJpgCopy = {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  breadcrumbParent: {href: "/crop-image"; label: string};
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
      icon: "crop" | "ratio" | "social" | "browser" | "privacy" | "safe";
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
  faqs: CropJpgFaq[];
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

const en: CropJpgCopy = {
  metaTitle: "Crop JPG Images Online Free | Img Pilot",
  metaDescription:
    "Crop JPG images online using precise crop controls and popular aspect ratios. Download your cropped image securely in seconds.",
  h1: "Crop JPG Images Online",
  breadcrumbParent: {href: "/crop-image", label: "Crop Image"},
  hero: {
    badge: "JPG IMAGE CROPPER",
    paragraph:
      "Crop JPG images online in seconds. Remove unwanted areas, improve composition and prepare photos for websites, social media and print without installing any software.",
    trust: [
      "Free Guest Usage",
      "No Installation",
      "Secure Processing",
      "Original Image Safe",
    ],
    uploadCta: "Upload JPG Image",
    heroImageAlt: "JPG crop editor showing crop handles around a landscape photograph",
  },
  guestBar: {
    title: "Guest usage",
    deletionTitle: "Automatic deletion",
    countdownLabel: "Temporary files delete automatically in",
  },
  upload: {
    heading: "Upload a JPG Image",
    supporting: "Drag and drop a JPG image, paste it from your clipboard or browse your device.",
    chooseLabel: "Choose JPG",
    formatsHint: "JPG · Maximum file size follows guest limits shown above",
    features: [
      {title: "Precise Crop Selection", body: "Drag the crop box to frame exactly what you want to keep."},
      {title: "Preset Aspect Ratios", body: "Lock common ratios such as 1:1, 16:9 and 9:16."},
      {title: "Private Processing", body: "Uploads stay in temporary private storage."},
      {title: "Automatic File Deletion", body: "Guest files are removed after the retention countdown."},
    ],
  },
  intro: {
    eyebrow: "ONLINE JPG CROPPING",
    title: "Crop Photos Without Editing the Original",
    paragraphs: [
      "Cropping allows you to remove unnecessary areas from an image while improving focus and composition. Whether you're preparing product images, profile photos or website graphics, cropping helps present only the most important part of the picture.",
      "This tool creates a newly cropped JPG while leaving the original image unchanged on your device.",
      "Cropping changes which pixels remain. It does not replace resize for target dimensions or compress for smaller file weight.",
    ],
    imageAlt: "Before and after crop comparison showing crop handles and the cropped photograph",
  },
  ratios: {
    eyebrow: "POPULAR CROP RATIOS",
    title: "Choose a Ratio Before You Download",
    intro:
      "After upload, use these aspect-ratio options in the crop editor. Free crop stays unlocked for custom framing.",
    cards: [
      {id: "free", title: "Free Crop", ratio: "Free", hint: "Drag any shape"},
      {id: "1:1", title: "1:1 Square", ratio: "1:1", hint: "Profiles and thumbs"},
      {id: "3:4", title: "3:4 Portrait", ratio: "3:4", hint: "Tall product frames"},
      {id: "16:9", title: "16:9 Landscape", ratio: "16:9", hint: "Banners and video stills"},
      {id: "9:16", title: "9:16 Story", ratio: "9:16", hint: "Vertical stories"},
      {id: "4:3", title: "4:3 Classic", ratio: "4:3", hint: "Camera-style frames"},
      {id: "custom", title: "Custom", ratio: "Free", hint: "Unlock and refine"},
    ],
  },
  benefits: {
    eyebrow: "WHY CROP JPG",
    title: "Tighter Framing for Photos That Matter",
    cards: [
      {
        title: "Precise Cropping",
        body: "Drag handles for exact selection so the subject stays centred and clean.",
        icon: "crop",
      },
      {
        title: "Popular Ratios",
        body: "Use common aspect ratios instantly for profiles, banners and stories.",
        icon: "ratio",
      },
      {
        title: "Social Media Ready",
        body: "Prepare images for platforms by framing the right portion of the photo first.",
        icon: "social",
      },
      {
        title: "No Installation",
        body: "Works in any modern browser on desktop, tablet or mobile.",
        icon: "browser",
      },
      {
        title: "Private Processing",
        body: "Files remain temporary and are not published to a public gallery.",
        icon: "privacy",
      },
      {
        title: "Original Protected",
        body: "Download a new cropped image. The original file on your device stays unchanged.",
        icon: "safe",
      },
    ],
  },
  howTo: {
    eyebrow: "THREE SIMPLE STEPS",
    title: "How to Crop a JPG Image",
    steps: [
      {
        title: "Upload Image",
        body: "Choose a JPG from your device, drag it into the upload area or paste it from your clipboard.",
      },
      {
        title: "Select Crop Area",
        body: "Drag the crop box, pick an aspect ratio and preview the composition before you process.",
      },
      {
        title: "Download Cropped JPG",
        body: "Process the crop and download a new JPG while keeping your original photo safe.",
      },
    ],
    imageAlt: "Three steps for uploading, cropping and downloading a JPG image",
  },
  guide: {
    title: "How Image Cropping Works",
    paragraphs: [
      "Cropping removes the pixels outside a selected rectangle. Resize changes width and height of what remains. Compress reduces file weight without changing the framed area.",
      "Aspect ratio is the relationship between crop width and height. Locking a ratio such as 1:1 or 16:9 helps match common layout slots.",
      "Composition guides matter: keep important subjects away from the edge, straighten horizons when needed, and use the rule of thirds for balanced framing.",
    ],
    points: [
      "Crop vs resize — crop removes areas; resize changes dimensions",
      "Aspect ratio — choose free or a fixed ratio for the destination",
      "Composition — place the subject where the eye naturally rests",
      "Rule of thirds — avoid always centering every subject",
      "Quality — start from the best original JPG you have",
      "Social media — frame first, then resize or compress if the platform needs it",
    ],
  },
  useCases: {
    eyebrow: "COMMON USE CASES",
    title: "When JPG Cropping Helps Most",
    cards: [
      {
        title: "Profile Pictures",
        body: "Frame faces cleanly for square avatars without leaving empty background.",
      },
      {
        title: "Product Photos",
        body: "Remove clutter around products so catalogue images look intentional.",
      },
      {
        title: "Website Banners",
        body: "Keep the hero subject inside landscape frames before you resize for the layout.",
      },
      {
        title: "Blog Images",
        body: "Tighten article photos so thumbnails and covers show the right focal point.",
      },
    ],
  },
  tips: {
    eyebrow: "BETTER RESULTS",
    title: "Cropping Tips",
    items: [
      "Leave enough margin around important objects so nothing feels clipped.",
      "Use the rule of thirds for a more natural composition.",
      "Keep horizons level in landscapes and architecture photos.",
      "Choose the correct aspect ratio before you download.",
      "Preview the crop at a glance before processing.",
      "Keep the original image as a separate master file.",
    ],
  },
  faqHeading: "Frequently Asked Questions",
  faqs: [
    {
      q: "Can cropping reduce JPG file size?",
      a: "It can, because fewer pixels remain. For deliberate file-size reduction after framing, use Compress JPG.",
    },
    {
      q: "Does cropping reduce image quality?",
      a: "Cropping removes areas outside the box. The kept region may be re-encoded as JPG, so start from a high-quality original and preview before publishing.",
    },
    {
      q: "Can I crop to exact dimensions?",
      a: "This tool focuses on crop framing and aspect ratios. For exact width and height after you frame the subject, continue to Resize JPG.",
    },
    {
      q: "Can I crop for Instagram?",
      a: "Yes. Use square 1:1 for many profile and grid uses, or 9:16 for story-style framing. Free crop remains available for custom layouts.",
    },
    {
      q: "Will my original image change?",
      a: "No. A new cropped JPG is created for download. The original file on your device remains unchanged.",
    },
    {
      q: "Are JPG uploads private?",
      a: "Guest images use private temporary storage and are deleted automatically according to the retention countdown on the page.",
    },
    {
      q: "Can I crop on mobile?",
      a: "Yes. The crop workspace is browser-based and works on modern mobile browsers with touch-friendly controls.",
    },
    {
      q: "What are the guest limits for cropping?",
      a: "Free guest operations and maximum file size appear in the usage bar above the uploader. Higher limits may require an account.",
    },
    {
      q: "Which formats can I upload on this page?",
      a: "This landing prioritises JPG uploads. The processed result downloads as a JPG according to the crop tool output.",
    },
    {
      q: "What is the difference between crop and resize?",
      a: "Crop removes unwanted parts of the photo. Resize changes the pixel width and height of an image that is already framed.",
    },
  ],
  related: {
    eyebrow: "CONTINUE EDITING",
    title: "Related Image Tools",
    tools: [
      {href: "/resize-jpg", title: "Resize JPG", body: "Change the width and height after cropping."},
      {href: "/compress-jpg", title: "Compress JPG", body: "Reduce file size after the frame looks right."},
      {href: "/jpg-to-webp", title: "Convert JPG to WebP", body: "Create a modern WebP version for websites."},
      {href: "/resize-png", title: "Resize PNG", body: "Resize transparent logos and UI graphics."},
      {href: "/crop-png", title: "Crop PNG", body: "Crop PNG screenshots and graphics."},
      {href: "/bulk-image-tools", title: "Bulk Image Tools", body: "Process several images in one workflow."},
    ],
  },
  cta: {
    title: "Ready to Crop Another Image?",
    body: "Upload another JPG or create a free account for additional image tools and saved projects.",
    primaryLabel: "Crop Another Image",
    secondaryLabel: "Create Free Account",
    secondaryHref: "/register",
  },
};

const ur: CropJpgCopy = {
  metaTitle: "آن لائن JPG تصاویر کراپ کریں مفت | Img Pilot",
  metaDescription:
    "درست کراپ کنٹرولز اور مقبول آسپیکٹ ریشوز کے ساتھ آن لائن JPG کراپ کریں۔ سیکنڈز میں محفوظ طریقے سے کراپ شدہ تصویر ڈاؤن لوڈ کریں۔",
  h1: "آن لائن JPG تصاویر کراپ کریں",
  breadcrumbParent: {href: "/crop-image", label: "تصویر کراپ کریں"},
  hero: {
    badge: "JPG امیج کراپر",
    paragraph:
      "سیکنڈز میں آن لائن JPG کراپ کریں۔ غیر ضروری حصے ہٹائیں، کمپوزیشن بہتر بنائیں، اور بغیر سافٹ ویئر لگائے ویب سائٹس، سوشل میڈیا اور پرنٹ کے لیے تصاویر تیار کریں۔",
    trust: [
      "مفت مہمان استعمال",
      "انسٹالیشن نہیں",
      "محفوظ پروسیسنگ",
      "اصل تصویر محفوظ",
    ],
    uploadCta: "JPG تصویر اپ لوڈ کریں",
    heroImageAlt: "لینڈسکیپ فوٹو پر کراپ ہینڈلز دکھاتا JPG کراپ ایڈیٹر",
  },
  guestBar: {
    title: "مہمان استعمال",
    deletionTitle: "خودکار حذف",
    countdownLabel: "عارضی فائلیں خودبخود حذف ہونے میں باقی:",
  },
  upload: {
    heading: "JPG تصویر اپ لوڈ کریں",
    supporting: "JPG گھسیٹ کر چھوڑیں، کلپ بورڈ سے چسپاں کریں، یا ڈیوائس سے منتخب کریں۔",
    chooseLabel: "JPG منتخب کریں",
    formatsHint: "JPG · زیادہ سے زیادہ فائل سائز اوپر دکھائی گئی مہمان حدود کے مطابق",
    features: [
      {title: "درست کراپ انتخاب", body: "کراپ باکس گھسیٹ کر بالکل وہ حصہ فریم کریں جو رکھنا ہے۔"},
      {title: "پری سیٹ آسپیکٹ ریشو", body: "1:1، 16:9 اور 9:16 جیسے عام تناسب لاک کریں۔"},
      {title: "نجی پروسیسنگ", body: "اپ لوڈز عارضی نجی اسٹوریج میں رہتی ہیں۔"},
      {title: "خودکار حذف", body: "مہمان فائلیں برقرار رکھنے کی مدت کے بعد ہٹا دی جاتی ہیں۔"},
    ],
  },
  intro: {
    eyebrow: "آن لائن JPG کراپنگ",
    title: "اصل فائل بدلے بغیر فوٹوز کراپ کریں",
    paragraphs: [
      "کراپنگ تصویر سے غیر ضروری حصے ہٹا کر فوکس اور کمپوزیشن بہتر بناتی ہے۔ پروڈکٹ امیجز، پروفائل فوٹوز یا ویب گرافکس تیار کرتے وقت صرف اہم حصہ رکھنا مددگار ہوتا ہے۔",
      "یہ ٹول نئی کراپ شدہ JPG بناتا ہے جبکہ ڈیوائس پر اصل تصویر جوں کی توں رہتی ہے۔",
      "کراپ یہ بدلتا ہے کہ کون سے پکسلز رہیں۔ یہ ری سائز یا کمپریس کی جگہ نہیں لیتا۔",
    ],
    imageAlt: "کراپ ہینڈلز اور کراپ شدہ فوٹو دکھاتا پہلے اور بعد موازنہ",
  },
  ratios: {
    eyebrow: "مقبول کراپ ریشوز",
    title: "ڈاؤن لوڈ سے پہلے تناسب چنیں",
    intro: "اپ لوڈ کے بعد کراپ ایڈیٹر میں یہ آسپیکٹ ریشو آپشنز استعمال کریں۔ فری کراپ حسبِ ضرورت فریمنگ کے لیے کھلا رہتا ہے۔",
    cards: [
      {id: "free", title: "فری کراپ", ratio: "Free", hint: "کوئی بھی شکل"},
      {id: "1:1", title: "1:1 مربع", ratio: "1:1", hint: "پروفائل اور تھمب"},
      {id: "3:4", title: "3:4 پورٹریٹ", ratio: "3:4", hint: "لمبے پروڈکٹ فریمز"},
      {id: "16:9", title: "16:9 لینڈسکیپ", ratio: "16:9", hint: "بینرز اور ویڈیو سٹلز"},
      {id: "9:16", title: "9:16 سٹوری", ratio: "9:16", hint: "عمودی سٹوریز"},
      {id: "4:3", title: "4:3 کلاسک", ratio: "4:3", hint: "کیمرہ طرز کے فریمز"},
      {id: "custom", title: "حسبِ ضرورت", ratio: "Free", hint: "کھول کر درست کریں"},
    ],
  },
  benefits: {
    eyebrow: "JPG کیوں کراپ کریں",
    title: "اہم فوٹوز کے لیے بہتر فریمنگ",
    cards: [
      {
        title: "درست کراپنگ",
        body: "عین انتخاب کے لیے ہینڈلز گھسیٹیں تاکہ سبجیکٹ صاف اور مرکوز رہے۔",
        icon: "crop",
      },
      {
        title: "مقبول ریشوز",
        body: "پروفائلز، بینرز اور سٹوریز کے لیے عام آسپیکٹ ریشوز فوراً لگائیں۔",
        icon: "ratio",
      },
      {
        title: "سوشل میڈیا ریڈی",
        body: "پلیٹ فارمز کے لیے پہلے درست حصہ فریم کر کے تصویر تیار کریں۔",
        icon: "social",
      },
      {
        title: "بغیر انسٹالیشن",
        body: "ڈیسکٹاپ، ٹیبلیٹ یا موبائل کے جدید براؤزر میں چلتا ہے۔",
        icon: "browser",
      },
      {
        title: "نجی پروسیسنگ",
        body: "فائلیں عارضی رہتی ہیں اور عوامی گیلری میں نہیں جاتیں۔",
        icon: "privacy",
      },
      {
        title: "اصل محفوظ",
        body: "نئی کراپ شدہ تصویر ڈاؤن لوڈ کریں۔ اصل فائل جوں کی توں رہتی ہے۔",
        icon: "safe",
      },
    ],
  },
  howTo: {
    eyebrow: "تین آسان مراحل",
    title: "JPG تصویر کیسے کراپ کریں",
    steps: [
      {
        title: "تصویر اپ لوڈ کریں",
        body: "ڈیوائس سے JPG چنیں، اپ لوڈ ایریا میں گھسیٹیں، یا کلپ بورڈ سے چسپاں کریں۔",
      },
      {
        title: "کراپ ایریا منتخب کریں",
        body: "کراپ باکس گھسیٹیں، آسپیکٹ ریشو چنیں اور پروسیس سے پہلے کمپوزیشن دیکھیں۔",
      },
      {
        title: "کراپ شدہ JPG ڈاؤن لوڈ کریں",
        body: "کراپ پروسیس کریں اور اصل فوٹو محفوظ رکھتے ہوئے نئی JPG ڈاؤن لوڈ کریں۔",
      },
    ],
    imageAlt: "JPG اپ لوڈ، کراپ اور ڈاؤن لوڈ کے تین مراحل",
  },
  guide: {
    title: "امیج کراپنگ کیسے کام کرتی ہے",
    paragraphs: [
      "کراپنگ منتخب مستطیل کے باہر پکسلز ہٹاتی ہے۔ ری سائز باقی تصویر کی چوڑائی اور اونچائی بدلتا ہے۔ کمپریس فریم تبدیل کیے بغیر فائل وزن کم کرتا ہے۔",
      "آسپیکٹ ریشو کراپ کی چوڑائی اور اونچائی کا تعلق ہے۔ 1:1 یا 16:9 لاک کرنا عام لے آؤٹ سلاٹس سے مماثلت میں مدد دیتا ہے۔",
      "کمپوزیشن اہم ہے: اہم سبجیکٹ کنارے سے دور رکھیں، افق سیدھا رکھیں، اور متوازن فریم کے لیے رول آف تھرڈز استعمال کریں۔",
    ],
    points: [
      "کراپ بمقابلہ ری سائز — کراپ حصے ہٹاتا ہے؛ ری سائز ابعاد بدلتا ہے",
      "آسپیکٹ ریشو — منزل کے لیے فری یا فکسڈ ریشو چنیں",
      "کمپوزیشن — سبجیکٹ وہاں رکھیں جہاں نظر قدرتی طور پر جائے",
      "رول آف تھرڈز — ہر سبجیکٹ ہمیشہ درمیان میں نہ رکھیں",
      "کوالٹی — بہترین اصل JPG سے شروع کریں",
      "سوشل میڈیا — پہلے فریم کریں، پھر ضرورت ہو تو ری سائز یا کمپریس کریں",
    ],
  },
  useCases: {
    eyebrow: "عام استعمالات",
    title: "JPG کراپنگ سب سے زیادہ کب مدد کرتی ہے",
    cards: [
      {
        title: "پروفائل تصاویر",
        body: "مربع اوتارز کے لیے چہرے صاف فریم کریں بغیر خالی پس منظر کے۔",
      },
      {
        title: "پروڈکٹ فوٹوز",
        body: "پروڈکٹ کے گرد بے ترتیبی ہٹائیں تاکہ کیٹلاگ تصاویر ارادی لگیں۔",
      },
      {
        title: "ویب سائٹ بینرز",
        body: "لینڈسکیپ فریمز میں ہیرو سبجیکٹ رکھیں، پھر لے آؤٹ کے لیے ری سائز کریں۔",
      },
      {
        title: "بلاگ امیجز",
        body: "مضمون کی فوٹوز تنگ کریں تاکہ تھمب نیلز اور کور درست فوکل پوائنٹ دکھائیں۔",
      },
    ],
  },
  tips: {
    eyebrow: "بہتر نتائج",
    title: "کراپنگ کے مشورے",
    items: [
      "اہم اشیاء کے گرد کافی مارجن چھوڑیں تاکہ کچھ کٹا ہوا نہ لگے۔",
      "قدرتی کمپوزیشن کے لیے رول آف تھرڈز استعمال کریں۔",
      "لینڈسکیپ اور آرکیٹیکچر فوٹوز میں افق سیدھا رکھیں۔",
      "ڈاؤن لوڈ سے پہلے درست آسپیکٹ ریشو چنیں۔",
      "پروسیس سے پہلے کراپ کا پیش نظارہ دیکھیں۔",
      "اصل تصویر الگ ماسٹر فائل کے طور پر رکھیں۔",
    ],
  },
  faqHeading: "عمومی سوالات",
  faqs: [
    {
      q: "کیا کراپنگ JPG فائل سائز کم کر سکتی ہے؟",
      a: "ہاں، کیونکہ کم پکسلز رہ جاتے ہیں۔ فریمنگ کے بعد جان بوجھ کر فائل سائز کم کرنے کے لیے Compress JPG استعمال کریں۔",
    },
    {
      q: "کیا کراپنگ سے امیج کوالٹی کم ہوتی ہے؟",
      a: "کراپ باکس کے باہر والے حصے ہٹاتے ہیں۔ باقی حصہ JPG کے طور پر دوبارہ اینکوڈ ہو سکتا ہے، اس لیے اعلیٰ اصل سے شروع کریں اور شائع کرنے سے پہلے دیکھیں۔",
    },
    {
      q: "کیا عین ابعاد پر کراپ ہو سکتا ہے؟",
      a: "یہ ٹول کراپ فریمنگ اور آسپیکٹ ریشوز پر مرکوز ہے۔ فریم کے بعد عین چوڑائی اور اونچائی کے لیے Resize JPG استعمال کریں۔",
    },
    {
      q: "کیا انسٹاگرام کے لیے کراپ ہو سکتا ہے؟",
      a: "ہاں۔ بہت سے پروفائل اور گرڈ استعمالات کے لیے 1:1، یا سٹوری طرز کے لیے 9:16۔ حسبِ ضرورت لے آؤٹ کے لیے فری کراپ بھی دستیاب ہے۔",
    },
    {
      q: "کیا میری اصل تصویر بدل جائے گی؟",
      a: "نہیں۔ ڈاؤن لوڈ کے لیے نئی کراپ شدہ JPG بنتی ہے۔ ڈیوائس پر اصل فائل جوں کی توں رہتی ہے۔",
    },
    {
      q: "کیا JPG اپ لوڈز نجی ہیں؟",
      a: "مہمان تصاویر نجی عارضی اسٹوریج استعمال کرتی ہیں اور صفحے پر دکھائی گئی برقرار رکھنے کی مدت کے مطابق خودبخود حذف ہوتی ہیں۔",
    },
    {
      q: "کیا موبائل پر کراپ ہو سکتا ہے؟",
      a: "ہاں۔ کراپ ورک اسپیس براؤزر پر مبنی ہے اور جدید موبائل براؤزرز پر ٹچ کنٹرولز کے ساتھ کام کرتا ہے۔",
    },
    {
      q: "کراپنگ کی مہمان حدود کیا ہیں؟",
      a: "مفت مہمان آپریشنز اور زیادہ سے زیادہ فائل سائز اپ لوڈر کے اوپر استعمال بار میں نظر آتی ہیں۔ اعلیٰ حدود کے لیے اکاؤنٹ درکار ہو سکتا ہے۔",
    },
    {
      q: "اس صفحے پر کون سے فارمیٹس اپ لوڈ ہو سکتے ہیں؟",
      a: "یہ لینڈنگ JPG اپ لوڈز کو ترجیح دیتی ہے۔ پروسیس شدہ نتیجہ کراپ ٹول آؤٹ پٹ کے مطابق JPG کے طور پر ڈاؤن لوڈ ہوتا ہے۔",
    },
    {
      q: "کراپ اور ری سائز میں فرق کیا ہے؟",
      a: "کراپ تصویر کے غیر ضروری حصے ہٹاتا ہے۔ ری سائز پہلے سے فریم شدہ تصویر کی پکسل چوڑائی اور اونچائی بدلتا ہے۔",
    },
  ],
  related: {
    eyebrow: "مزید ایڈیٹنگ",
    title: "متعلقہ امیج ٹولز",
    tools: [
      {href: "/resize-jpg", title: "Resize JPG", body: "کراپ کے بعد چوڑائی اور اونچائی بدلیں۔"},
      {href: "/compress-jpg", title: "Compress JPG", body: "فریم درست ہونے کے بعد فائل سائز کم کریں۔"},
      {href: "/jpg-to-webp", title: "Convert JPG to WebP", body: "ویب سائٹس کے لیے جدید WebP ورژن بنائیں۔"},
      {href: "/resize-png", title: "Resize PNG", body: "شفاف لوگو اور UI گرافکس کا سائز بدلیں۔"},
      {href: "/crop-png", title: "Crop PNG", body: "PNG اسکرین شاٹس اور گرافکس کراپ کریں۔"},
      {href: "/bulk-image-tools", title: "Bulk Image Tools", body: "ایک ورک فلو میں کئی تصاویر پروسیس کریں۔"},
    ],
  },
  cta: {
    title: "ایک اور تصویر کراپ کریں؟",
    body: "ایک اور JPG اپ لوڈ کریں یا اضافی امیج ٹولز اور محفوظ پروجیکٹس کے لیے مفت اکاؤنٹ بنائیں۔",
    primaryLabel: "ایک اور تصویر کراپ کریں",
    secondaryLabel: "مفت اکاؤنٹ بنائیں",
    secondaryHref: "/register",
  },
};

export function getCropJpgCopy(locale: string): CropJpgCopy {
  return localizedCopy(locale, {en, ur});
}

export function cropJpgSeoCompat() {
  const c = en;
  return {
    intro: [
      c.hero.paragraph,
      "Guest sessions stay private on temporary storage, and the download is a new JPG rather than an overwrite of your original photo.",
      "Use free crop or locked ratios such as 1:1, 16:9 and 9:16 before you resize or compress for delivery.",
    ].join(" "),
    why: [
      c.intro.paragraphs[0],
      c.intro.paragraphs[1],
      "Unlike Resize JPG or Compress JPG, this landing focuses on framing and composition — removing unwanted areas while keeping aspect-ratio controls for social and web layouts.",
      c.benefits.cards[0]!.body,
    ].join(" "),
    benefits: c.benefits.cards.map((card) => ({title: card.title, body: card.body})),
    howTo: [
      "Upload a JPG image",
      "Select the crop area or lock an aspect ratio",
      "Preview the composition",
      "Download the cropped JPG",
    ] as [string, string, string, string],
    technicalTitle: c.guide.title,
    technical: [...c.guide.paragraphs, ...c.guide.points.slice(0, 3)].join(" "),
    faqs: c.faqs,
    ctaLabel: c.cta.primaryLabel,
  };
}

export type CropJpgLocale = AppLocale;
