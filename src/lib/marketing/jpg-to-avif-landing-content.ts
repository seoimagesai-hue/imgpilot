import {localizedCopy} from "@/lib/marketing/localized-copy";
/**
 * JPG → AVIF landing — next-gen compression / honest encode gates
 * (distinct from jpg-to-webp and resize & compress landings).
 */
import type {AppLocale} from "@/i18n/routing";

export type JpgToAvifFaq = {q: string; a: string};

export type JpgToAvifCopy = {
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
    rows: {label: string; jpg: string; avif: string}[];
    explanation: string;
  };
  benefits: {
    eyebrow: string;
    title: string;
    cards: {
      title: string;
      body: string;
      icon: "size" | "speed" | "vitals" | "privacy" | "browser" | "safe";
    }[];
  };
  howTo: {
    eyebrow: string;
    title: string;
    steps: {title: string; body: string}[];
    imageAlt: string;
  };
  whyAvif: {
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
  faqs: JpgToAvifFaq[];
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

const en: JpgToAvifCopy = {
  metaTitle: "Convert JPG to AVIF Online Free | Img Pilot",
  metaDescription:
    "Convert JPG images to AVIF when this server supports AVIF encoding. Honest fail-closed conversion, private guest storage and WebP fallback guidance.",
  h1: "Convert JPG to AVIF Online",
  breadcrumbParent: {href: "/convert-image", label: "Convert Image"},
  breadcrumbCurrent: "JPG to AVIF",
  hero: {
    badge: "JPG TO AVIF CONVERTER",
    paragraph:
      "Convert JPG photos into AVIF when this deployment's encoder is available. Reduce transfer size for forward-looking sites — and if AVIF encode is blocked here, the tool fails closed instead of shipping a fake download. Keep JPG to WebP as your broadly supported modern fallback.",
    trust: ["Honest Encode Gates", "Smaller When Supported", "Private Processing", "No Fake Downloads"],
    uploadCta: "Upload JPG",
    heroImageAlt: "Browser interface converting a JPG image card into a smaller AVIF image card when encoding is available",
  },
  guestBar: {
    title: "Guest usage",
    deletionTitle: "Automatic deletion",
    countdownLabel: "Temporary files delete automatically in",
  },
  upload: {
    heading: "Upload a JPG Image",
    supporting: "Drag and drop a JPG image, paste from clipboard or browse your computer.",
    chooseLabel: "Choose JPG",
    formatsHint: "JPG · Maximum file size follows guest limits shown above · AVIF output only when encode is supported",
    features: [
      {title: "Honest AVIF Encode", body: "Conversion runs only when this server can produce a real AVIF file."},
      {title: "Fail-Closed Safety", body: "If the encoder is unavailable, no mislabeled stand-in download is offered."},
      {title: "Private Processing", body: "Uploads stay in temporary private storage for about one hour."},
      {title: "Automatic File Deletion", body: "Guest files expire after the retention countdown — downloads do not extend it."},
    ],
  },
  intro: {
    eyebrow: "NEXT-GEN IMAGE FORMAT",
    title: "Why Convert JPG to AVIF?",
    paragraphs: [
      "AVIF is a modern still-image format built on AV1 compression. On supported stacks it can deliver strong byte savings for photographic content — useful when you are deliberately testing next-generation delivery on compatible browsers and CDNs.",
      "This converter creates a new AVIF file while keeping your original JPG unchanged on your device. AVIF encode depends on server capabilities; when encode is unavailable here, use JPG to WebP rather than expecting a simulated AVIF.",
      "Format conversion is not a substitute for resizing oversized photos or cropping composition. Use those tools first when dimensions or framing still need work.",
    ],
    imageAlt: "JPG and AVIF comparison cards showing similar quality with a smaller AVIF file size when encoding succeeds",
  },
  comparison: {
    eyebrow: "JPG VS AVIF",
    title: "How JPG and AVIF Compare",
    intro: "Use this table as a practical guide for deliberate format experiments — not a promise of exact kilobyte savings or universal client support on every photo.",
    columns: ["Compare", "JPG", "AVIF"],
    rows: [
      {
        label: "Average file size",
        jpg: "Mature baseline for photographic delivery",
        avif: "Often smaller on supported encode/decode paths",
      },
      {
        label: "Compression",
        jpg: "Long-standing lossy photographic encoding",
        avif: "Modern AV1-based still-image encoding",
      },
      {
        label: "Transparency support",
        jpg: "No alpha channel",
        avif: "Format supports transparency; JPG sources start opaque",
      },
      {
        label: "Encode availability",
        jpg: "Universal read/write across tools",
        avif: "Requires runtime AVIF encoder support on the server",
      },
      {
        label: "Browser support",
        jpg: "Nearly universal",
        avif: "Strong on modern browsers — not every WebView or legacy client",
      },
      {
        label: "Website performance",
        jpg: "Reliable fallback delivery",
        avif: "Potential LCP wins where decode and CDN paths are proven",
      },
    ],
    explanation:
      "AVIF fits measured rollouts on product pages and marketing sites where you can A/B test against WebP. Keep JPG or WebP fallbacks for email clients, embedded WebViews and partners that still cannot decode AVIF.",
  },
  benefits: {
    eyebrow: "WHY CONVERT",
    title: "Next-Gen Delivery With Honest Limits",
    cards: [
      {
        title: "Smaller File Size",
        body: "AVIF can ship fewer bytes than a similar-looking JPG when encode succeeds and settings fit the asset.",
        icon: "size",
      },
      {
        title: "Improve Website Speed",
        body: "Lighter images help pages paint sooner on stacks that already serve AVIF safely.",
        icon: "speed",
      },
      {
        title: "Better Core Web Vitals",
        body: "Measured AVIF adoption may support LCP when images dominate the critical path.",
        icon: "vitals",
      },
      {
        title: "Private Processing",
        body: "Guest files remain temporary, private and expire in about one hour.",
        icon: "privacy",
      },
      {
        title: "No Installation",
        body: "Works in modern browsers; decode coverage is not universal across every WebView.",
        icon: "browser",
      },
      {
        title: "Original Image Protected",
        body: "Download a new AVIF when encode works. Your original JPG stays unchanged.",
        icon: "safe",
      },
    ],
  },
  howTo: {
    eyebrow: "THREE SIMPLE STEPS",
    title: "How to Convert JPG to AVIF",
    steps: [
      {
        title: "Upload JPG",
        body: "Choose a JPG from your device, drag it into the upload area or paste it from your clipboard.",
      },
      {
        title: "Confirm AVIF Availability",
        body: "The shared guest convert engine checks encoder support. If AVIF is blocked, conversion stops honestly — try JPG to WebP instead.",
      },
      {
        title: "Download AVIF",
        body: "When encode succeeds, preview the result and download the new AVIF while your original JPG remains safe.",
      },
    ],
    imageAlt: "Three steps for uploading a JPG, confirming AVIF encode availability and downloading the result",
  },
  whyAvif: {
    title: "Why Teams Evaluate AVIF After WebP",
    paragraphs: [
      "Performance programs sometimes test AVIF on hero images and catalogue grids where every kilobyte affects mobile LCP. Treat it as a deliberate experiment with measurement — not an overnight swap for every JPEG on the site.",
      "After conversion, verify real pages on target hardware and embedded WebViews. File size alone is not a Core Web Vitals score, and encode can be slower than WebP on large masters.",
    ],
    points: [
      "Strong compression potential — on compatible encode and decode paths",
      "Lighthouse score experiments — when images dominate LCP and fallbacks exist",
      "Reduced bandwidth — where CDN negotiation and caching are proven",
      "Improved SEO signals — only when page experience actually improves in the field",
      "Better user experience — on clients that decode AVIF reliably",
      "Mobile performance — lighter downloads where AVIF is already safe to serve",
    ],
    note: "Retain WebP or JPG as the default modern format until AVIF encode availability, visual QA and fallback coverage are verified in your environment.",
  },
  useCases: {
    eyebrow: "COMMON USE CASES",
    title: "Where JPG to AVIF Helps Most",
    cards: [
      {
        title: "Performance Experiments",
        body: "A/B test AVIF against WebP on high-traffic hero and gallery photos.",
      },
      {
        title: "CDN Rollouts",
        body: "Generate AVIF derivatives when your edge already negotiates format by Accept headers.",
      },
      {
        title: "Marketing Sites",
        body: "Shrink campaign imagery on stacks where decode coverage is measured, not assumed.",
      },
      {
        title: "Mobile Catalogues",
        body: "Evaluate byte savings on product grids while keeping WebP or JPG fallbacks live.",
      },
    ],
  },
  tips: {
    eyebrow: "BETTER RESULTS",
    title: "Conversion Tips",
    items: [
      "Start with a high-quality JPG master so re-encoding has detail to keep.",
      "If AVIF encode is unavailable here, use JPG to WebP for a broadly supported modern step.",
      "Resize before converting if the photo is far larger than the layout box.",
      "Visual-check text overlays, skin tones and product edges — aggressive settings can smear fine detail.",
      "Keep the original JPG and a WebP derivative as separate archive and fallback sources.",
      "Ship AVIF only where you can measure regressions quickly and roll back to WebP.",
    ],
  },
  faqHeading: "Frequently Asked Questions",
  faqs: [
    {
      q: "What is AVIF and why convert JPG to it?",
      a: "AVIF is a modern still-image format based on AV1 compression. Teams convert JPG to AVIF when they want to test next-generation byte savings on browsers and CDNs that already support it.",
    },
    {
      q: "What happens if the AVIF encoder is unavailable on this server?",
      a: "The tool fails closed. You will not receive a renamed JPG pretending to be AVIF. Use JPG to WebP or keep your original JPG instead.",
    },
    {
      q: "Does converting JPG to AVIF reduce image quality?",
      a: "Conversion re-encodes pixels, so results depend on content and quality presets. Preview before publishing and keep a high-quality original.",
    },
    {
      q: "Is AVIF supported in every browser and app?",
      a: "No. Modern desktop and mobile browsers often decode AVIF, but some embedded WebViews, legacy clients and email apps still cannot. Plan WebP or JPG fallbacks.",
    },
    {
      q: "Should I use AVIF or WebP for my website photos?",
      a: "WebP remains the safer broadly supported modern default. Use AVIF when encode works here and your delivery stack already serves it with proven fallbacks.",
    },
    {
      q: "Will my original JPG file be modified during conversion?",
      a: "No. When encode succeeds, a new AVIF is created for download. The JPG on your device remains unchanged.",
    },
    {
      q: "How long are guest JPG to AVIF uploads kept?",
      a: "Guest images use private temporary storage and expire about one hour after the session starts. Downloading does not extend that deadline.",
    },
    {
      q: "What are the free guest limits for JPG to AVIF conversion?",
      a: "Free guest operations and maximum file size appear in the usage bar above the uploader. Higher limits may require an account.",
    },
    {
      q: "Can I convert several JPG files to AVIF on this page at once?",
      a: "This landing is built for single-image conversion. For several files, use Bulk Image Tools when you need a multi-file workflow.",
    },
    {
      q: "Why might AVIF encoding take longer than WebP?",
      a: "AV1-based encoding can be more CPU-intensive than WebP on large photographic masters. Measure latency on your typical file sizes before batch automation.",
    },
  ],
  related: {
    eyebrow: "CONTINUE EDITING",
    title: "Related Image Tools",
    tools: [
      {href: "/jpg-to-webp", title: "JPG to WebP", body: "Recommended modern fallback when AVIF encode is blocked or still in evaluation."},
      {href: "/png-to-avif", title: "PNG to AVIF", body: "Convert graphics and screenshots to AVIF when encode is supported."},
      {href: "/compress-jpg", title: "Compress JPG", body: "Reduce JPG weight when you must stay on JPEG delivery."},
      {href: "/convert-image", title: "Convert Image", body: "Browse the full guest convert matrix with shared privacy and limits."},
      {href: "/webp-to-avif", title: "WebP to AVIF", body: "Step up from WebP when your stack is ready for AVIF experiments."},
      {href: "/bulk-image-tools", title: "Bulk Convert Images", body: "Process several images in one guest workflow."},
    ],
  },
  cta: {
    title: "Ready to Convert Another Image?",
    body: "Upload another JPG or create a free account to unlock more image tools and higher usage limits.",
    primaryLabel: "Convert Another Image",
    secondaryLabel: "Create Free Account",
    secondaryHref: "/register",
  },
};

const ur: JpgToAvifCopy = {
  metaTitle: "آن لائن JPG کو AVIF میں تبدیل کریں مفت | Img Pilot",
  metaDescription:
    "جب یہ سرور AVIF انکوڈنگ سپورٹ کرے تو JPG کو AVIF میں تبدیل کریں۔ ایماندار fail-closed کنورژن، نجی مہمان اسٹوریج اور WebP فال بیک رہنمائی۔",
  h1: "آن لائن JPG کو AVIF میں تبدیل کریں",
  breadcrumbParent: {href: "/convert-image", label: "تصویر تبدیل کریں"},
  breadcrumbCurrent: "JPG to AVIF",
  hero: {
    badge: "JPG TO AVIF CONVERTER",
    paragraph:
      "جب اس ڈپلائمنٹ کا انکوڈر دستیاب ہو تو JPG فوٹوز کو AVIF میں تبدیل کریں۔ آگے کی سائٹس کے لیے ٹرانسفر سائز کم کریں — اور اگر AVIF انکوڈ یہاں بلاک ہو تو ٹول fail closed رہتا ہے، جعلی ڈاؤن لوڈ نہیں بھیجتا۔ JPG to WebP کو وسیع سپورٹ والا جدید فال بیک رکھیں۔",
    trust: ["ایماندار انکوڈ گیٹس", "سپورٹ پر چھوٹا", "نجی پروسیسنگ", "جعلی ڈاؤن لوڈ نہیں"],
    uploadCta: "JPG اپ لوڈ کریں",
    heroImageAlt: "براؤزر انٹرفیس میں JPG کارڈ کو چھوٹے AVIF کارڈ میں تبدیل کرتے ہوئے جب انکوڈنگ دستیاب ہو",
  },
  guestBar: {
    title: "مہمان استعمال",
    deletionTitle: "خودکار حذف",
    countdownLabel: "عارضی فائلیں خود بخود حذف ہوں گی",
  },
  upload: {
    heading: "JPG تصویر اپ لوڈ کریں",
    supporting: "JPG گھسیٹیں، کلپ بورڈ سے چسپاں کریں یا کمپیوٹر سے چنیں۔",
    chooseLabel: "JPG چنیں",
    formatsHint: "JPG · زیادہ سے زیادہ فائل سائز اوپر دکھائی گئی مہمان حد کے مطابق · AVIF آؤٹ پٹ صرف جب انکوڈ سپورٹڈ ہو",
    features: [
      {title: "ایماندار AVIF انکوڈ", body: "کنورژن صرف تب چلتی ہے جب یہ سرور حقیقی AVIF فائل بنا سکے۔"},
      {title: "Fail-Closed حفاظت", body: "اگر انکوڈر دستیاب نہ ہو تو غلط لیبل والا متبادل ڈاؤن لوڈ نہیں دیا جاتا۔"},
      {title: "نجی پروسیسنگ", body: "اپ لوڈز تقریباً ایک گھنٹے کے لیے عارضی نجی اسٹوریج میں رہتی ہیں۔"},
      {title: "خودکار فائل حذف", body: "مہمان فائلیں برقرار رکھنے کی مدت کے بعد ختم — ڈاؤن لوڈ سے مدت نہیں بڑھتی۔"},
    ],
  },
  intro: {
    eyebrow: "اگلی نسل کا امیج فارمیٹ",
    title: "JPG کو AVIF میں کیوں تبدیل کریں؟",
    paragraphs: [
      "AVIF AV1 کمپریشن پر مبنی جدید اسٹل امیج فارمیٹ ہے۔ سپورٹڈ سٹیکس پر یہ فوٹوگرافک مواد کے لیے مضبوط بائٹ بچت دے سکتا ہے — جب آپ جان بوجھ کر مطابقت پذیر براؤزرز اور CDN پر اگلی نسل کی ڈیلیوری ٹیسٹ کر رہے ہوں۔",
      "یہ کنورٹر نئی AVIF فائل بناتا ہے جبکہ آپ کی اصل JPG ڈیوائس پر جوں کی توں رہتی ہے۔ AVIF انکوڈ سرور کی صلاحیت پر منحصر ہے؛ جب یہاں انکوڈ دستیاب نہ ہو تو JPG to WebP استعمال کریں، simulated AVIF کی توقع نہ رکھیں۔",
      "فارمیٹ کنورژن بڑے فوٹوز ری سائز کرنے یا کمپوزیشن کراپ کرنے کا متبادل نہیں۔ جب ابعاد یا فریم ابھی درست ہوں تو پہلے وہ ٹولز استعمال کریں۔",
    ],
    imageAlt: "JPG اور AVIF موازنہ کارڈز — ملتا جلتا معیار، چھوٹا AVIF سائز جب انکوڈنگ کامیاب ہو",
  },
  comparison: {
    eyebrow: "JPG بمقابلہ AVIF",
    title: "JPG اور AVIF کا موازنہ",
    intro: "یہ جدول جان بوجھ کر فارمیٹ تجربات کے لیے عملی رہنمائی ہے — ہر فوٹو پر عین کلوبائٹ بچت یا ہر کلائنٹ پر عالمگیر سپورٹ کا وعدہ نہیں۔",
    columns: ["موازنہ", "JPG", "AVIF"],
    rows: [
      {
        label: "اوسط فائل سائز",
        jpg: "فوٹوگرافک ڈیلیوری کے لیے پختہ بیس لائن",
        avif: "سپورٹڈ انکوڈ/ڈیکوڈ راستوں پر اکثر چھوٹا",
      },
      {
        label: "کمپریشن",
        jpg: "طویل لاسی فوٹوگرافک انکوڈنگ",
        avif: "جدید AV1 پر مبنی اسٹل انکوڈنگ",
      },
      {
        label: "شفافیت کی سپورٹ",
        jpg: "الفا چینل نہیں",
        avif: "فارمیٹ شفافیت سپورٹ کرتا ہے؛ JPG ماخذ opaque شروع ہوتا ہے",
      },
      {
        label: "انکوڈ دستیابی",
        jpg: "ٹولز میں تقریباً عالمگیر ریڈ/رائٹ",
        avif: "سرور پر runtime AVIF انکوڈر سپورٹ درکار",
      },
      {
        label: "براؤزر سپورٹ",
        jpg: "تقریباً عالمگیر",
        avif: "جدید براؤزرز پر مضبوط — ہر WebView یا پرانا کلائنٹ نہیں",
      },
      {
        label: "ویب سائٹ کارکردگی",
        jpg: "قابلِ اعتماد فال بیک ڈیلیوری",
        avif: "ممکنہ LCP فائدے جہاں ڈیکوڈ اور CDN ثابت ہوں",
      },
    ],
    explanation:
      "AVIF پروڈکٹ صفحات اور مارکیٹنگ سائٹس پر measured rollout کے لیے موزوں ہے جہاں WebP کے مقابلہ A/B ٹیسٹ ہو سکے۔ ای میل کلائنٹس، embedded WebViews اور ایسے پارٹنرز کے لیے JPG یا WebP فال بیک رکھیں جو AVIF ڈیکوڈ نہ کر سکیں۔",
  },
  benefits: {
    eyebrow: "تبدیلی کیوں",
    title: "اگلی نسل کی ڈیلیوری — ایماندار حدود کے ساتھ",
    cards: [
      {
        title: "چھوٹا فائل سائز",
        body: "جب انکوڈ کامیاب ہو اور سیٹنگز اثاثے کے مطابق ہوں تو AVIF ملتی جلتی JPG سے کم بائٹس بھیج سکتا ہے۔",
        icon: "size",
      },
      {
        title: "ویب سائٹ کی رفتار بہتر",
        body: "ہلکی تصاویر ان سٹیکس پر صفحات جلد دکھانے میں مدد دیتی ہیں جہاں AVIF پہلے سے محفوظ serve ہو رہا ہو۔",
        icon: "speed",
      },
      {
        title: "بہتر Core Web Vitals",
        body: "ماپا گیا AVIF اپناو critical path پر امیجز غالب ہوں تو LCP میں مدد کر سکتا ہے۔",
        icon: "vitals",
      },
      {
        title: "نجی پروسیسنگ",
        body: "مہمان فائلیں عارضی، نجی رہتی ہیں اور تقریباً ایک گھنٹے میں ختم ہو جاتی ہیں۔",
        icon: "privacy",
      },
      {
        title: "بغیر انسٹالیشن",
        body: "جدید براؤزرز میں چلتا ہے؛ ہر WebView میں ڈیکوڈ کوریج عالمگیر نہیں۔",
        icon: "browser",
      },
      {
        title: "اصل تصویر محفوظ",
        body: "جب انکوڈ کام کرے AVIF ڈاؤن لوڈ کریں۔ اصل JPG جوں کی توں رہتی ہے۔",
        icon: "safe",
      },
    ],
  },
  howTo: {
    eyebrow: "تین آسان مراحل",
    title: "JPG کو AVIF میں کیسے تبدیل کریں",
    steps: [
      {
        title: "JPG اپ لوڈ کریں",
        body: "ڈیوائس سے JPG چنیں، اپ لوڈ ایریا میں گھسیٹیں، یا کلپ بورڈ سے چسپاں کریں۔",
      },
      {
        title: "AVIF دستیابی تصدیق کریں",
        body: "شیئرڈ مہمان کنورٹ انجن انکوڈر سپورٹ چیک کرتا ہے۔ اگر AVIF بلاک ہو تو کنورژن ایمانداری سے رک جاتی ہے — JPG to WebP آزمائیں۔",
      },
      {
        title: "AVIF ڈاؤن لوڈ کریں",
        body: "جب انکوڈ کامیاب ہو، نتیجہ دیکھیں اور اصل JPG محفوظ رکھتے ہوئے نئی AVIF ڈاؤن لوڈ کریں۔",
      },
    ],
    imageAlt: "JPG اپ لوڈ، AVIF انکوڈ دستیابی تصدیق اور ڈاؤن لوڈ کے تین مراحل",
  },
  whyAvif: {
    title: "ٹیمیں WebP کے بعد AVIF کیوں جانچتی ہیں",
    paragraphs: [
      "پرفارمنس پروگرام کبھی ہیرو امیجز اور کیٹلاگ گرڈز پر AVIF ٹیسٹ کرتے ہیں جہاں ہر کلوبائٹ موبائل LCP کو متاثر کرتا ہے۔ اسے measured experiment سمجھیں — سائٹ کی ہر JPEG ایک رات میں بدلنے کا متبادل نہیں۔",
      "کنورژن کے بعد ہدف ہارڈویئر اور embedded WebViews پر حقیقی صفحات چیک کریں۔ صرف فائل سائز Core Web Vitals سکور نہیں، اور بڑے masters پر انکوڈ WebP سے سست ہو سکتا ہے۔",
    ],
    points: [
      "مضبوط کمپریشن امکان — مطابقت پذیر انکوڈ اور ڈیکوڈ راستوں پر",
      "Lighthouse تجربات — جب امیجز LCP پر غالب ہوں اور فال بیک موجود ہوں",
      "کم بینڈوتھ — جہاں CDN negotiation اور caching ثابت ہوں",
      "بہتر SEO سگنلز — صرف جب میدان میں صفحے کا تجربہ واقعی بہتر ہو",
      "بہتر صارف تجربہ — ایسے کلائنٹس پر جو AVIF قابلِ اعتماد ڈیکوڈ کریں",
      "موبائل کارکردگی — ہلکی ڈاؤن لوڈز جہاں AVIF serve کرنا پہلے سے محفوظ ہو",
    ],
    note: "WebP یا JPG کو ڈیفالٹ جدید فارمیٹ رکھیں جب تک AVIF انکوڈ دستیابی، بصری QA اور فال بیک کوریج آپ کے ماحول میں تصدیق نہ ہو جائے۔",
  },
  useCases: {
    eyebrow: "عام استعمالات",
    title: "JPG to AVIF سب سے زیادہ کہاں مدد کرتا ہے",
    cards: [
      {
        title: "پرفارمنس تجربات",
        body: "زیادہ وزٹر والی ہیرو اور گیلری فوٹوز پر AVIF کو WebP کے مقابلہ A/B ٹیسٹ کریں۔",
      },
      {
        title: "CDN رول آؤٹ",
        body: "AVIF derivatives بنائیں جب edge پہلے سے Accept headers سے فارمیٹ negotiate کرے۔",
      },
      {
        title: "مارکیٹنگ سائٹس",
        body: "ڈیکوڈ کوریج measured ہو، assumed نہ ہو — ایسے سٹیکس پر مہم کی imagery چھوٹی کریں۔",
      },
      {
        title: "موبائل کیٹلاگ",
        body: "پروڈکٹ گرڈز پر بائٹ بچت جانچیں جبکہ WebP یا JPG فال بیک live رہیں۔",
      },
    ],
  },
  tips: {
    eyebrow: "بہتر نتائج",
    title: "کنورژن کے مشورے",
    items: [
      "اعلیٰ معیار کی اصل JPG سے شروع کریں تاکہ ری انکوڈنگ میں تفصیل رہے۔",
      "اگر یہاں AVIF انکوڈ دستیاب نہ ہو تو JPG to WebP استعمال کریں — وسیع سپورٹ والا جدید قدم۔",
      "اگر فوٹو لے آؤٹ باکس سے بہت بڑی ہو تو کنورٹ سے پہلے ری سائز کریں۔",
      "ٹیکسٹ اوورلی، سکن ٹونز اور پروڈکٹ کنارے بصری چیک کریں — aggressive سیٹنگز تفصیل مٹا سکتی ہیں۔",
      "اصل JPG اور WebP derivative الگ آرکائیو اور فال بیک ماخذ کے طور پر رکھیں۔",
      "AVIF صرف وہیں ship کریں جہاں regressions جلد measure اور WebP پر rollback ہو سکے۔",
    ],
  },
  faqHeading: "عمومی سوالات",
  faqs: [
    {
      q: "AVIF کیا ہے اور JPG کو AVIF میں کیوں بدلیں؟",
      a: "AVIF AV1 کمپریشن پر مبنی جدید اسٹل امیج فارمیٹ ہے۔ ٹیمیں JPG کو AVIF میں بدلتی ہیں جب اگلی نسل کی بائٹ بچت ان براؤزرز اور CDN پر ٹیسٹ کرنی ہو جو پہلے سے سپورٹ کرتے ہیں۔",
    },
    {
      q: "اگر اس سرور پر AVIF انکوڈر دستیاب نہ ہو تو کیا ہوگا؟",
      a: "ٹول fail closed رہتا ہے۔ renamed JPG جعلی AVIF کے طور پر نہیں ملے گی۔ JPG to WebP استعمال کریں یا اصل JPG رکھیں۔",
    },
    {
      q: "کیا JPG کو AVIF میں بدلنے سے امیج کوالٹی کم ہوتی ہے؟",
      a: "کنورژن پکسلز دوبارہ اینکوڈ کرتا ہے، اس لیے نتیجہ مواد اور کوالٹی پری سیٹ پر منحصر ہے۔ شائع کرنے سے پہلے دیکھیں اور اعلیٰ اصل رکھیں۔",
    },
    {
      q: "کیا AVIF ہر براؤزر اور ایپ میں سپورٹڈ ہے؟",
      a: "نہیں۔ جدید ڈیسک ٹاپ اور موبائل براؤزرز اکثر AVIF ڈیکوڈ کرتے ہیں، مگر کچھ embedded WebViews، پرانے کلائنٹس اور ای میل ایپس اب بھی نہیں۔ WebP یا JPG فال بیک منصوبہ بنائیں۔",
    },
    {
      q: "ویب سائٹ فوٹوز کے لیے AVIF یا WebP — کون بہتر؟",
      a: "WebP وسیع سپورٹ والا محفوظ جدید ڈیفالٹ رہتا ہے۔ AVIF تب استعمال کریں جب یہاں انکوڈ کام کرے اور آپ کا ڈیلیوری سٹیک ثابت فال بیک کے ساتھ serve کرے۔",
    },
    {
      q: "کیا کنورژن کے دوران میری اصل JPG فائل بدل جائے گی؟",
      a: "نہیں۔ جب انکوڈ کامیاب ہو، ڈاؤن لوڈ کے لیے نئی AVIF بنتی ہے۔ ڈیوائس پر JPG جوں کی توں رہتی ہے۔",
    },
    {
      q: "مہمان JPG to AVIF اپ لوڈز کتنی دیر رکھے جاتے ہیں؟",
      a: "مہمان تصاویر نجی عارضی اسٹوریج استعمال کرتی ہیں اور سیشن شروع ہونے کے تقریباً ایک گھنٹے بعد ختم ہو جاتی ہیں۔ ڈاؤن لوڈ سے مدت نہیں بڑھتی۔",
    },
    {
      q: "JPG to AVIF کنورژن کی مفت مہمان حدود کیا ہیں؟",
      a: "مفت مہمان آپریشنز اور زیادہ سے زیادہ فائل سائز اپ لوڈر کے اوپر استعمال بار میں نظر آتی ہیں۔ اعلیٰ حدود کے لیے اکاؤنٹ درکار ہو سکتا ہے۔",
    },
    {
      q: "کیا اس صفحے پر کئی JPG ایک ساتھ AVIF میں بدل سکتی ہیں؟",
      a: "یہ لینڈنگ سنگل امیج کنورژن کے لیے ہے۔ کئی فائلوں کے لیے Bulk Image Tools استعمال کریں۔",
    },
    {
      q: "AVIF انکوڈنگ WebP سے زیادہ وقت کیوں لے سکتی ہے؟",
      a: "AV1 پر مبنی انکوڈنگ بڑے فوٹوگرافک masters پر WebP سے زیادہ CPU-intensive ہو سکتی ہے۔ batch automation سے پہلے اپنی عام فائل سائزز پر latency ماپیں۔",
    },
  ],
  related: {
    eyebrow: "مزید ایڈیٹنگ",
    title: "متعلقہ امیج ٹولز",
    tools: [
      {href: "/jpg-to-webp", title: "JPG to WebP", body: "تجویز کردہ جدید فال بیک جب AVIF انکوڈ بلاک ہو یا ابھی evaluation میں ہو۔"},
      {href: "/png-to-avif", title: "PNG to AVIF", body: "جب انکوڈ سپورٹڈ ہو گرافکس اور اسکرین شاٹس AVIF میں بدلیں۔"},
      {href: "/compress-jpg", title: "Compress JPG", body: "جب JPEG ڈیلیوری پر رہنا ہو JPG وزن کم کریں۔"},
      {href: "/convert-image", title: "Convert Image", body: "مشترکہ privacy اور limits کے ساتھ مکمل مہمان convert matrix دیکھیں۔"},
      {href: "/webp-to-avif", title: "WebP to AVIF", body: "جب سٹیک AVIF تجربات کے لیے تیار ہو WebP سے آگے بڑھیں۔"},
      {href: "/bulk-image-tools", title: "Bulk Convert Images", body: "ایک مہمان ورک فلو میں کئی تصاویر پروسیس کریں۔"},
    ],
  },
  cta: {
    title: "ایک اور تصویر تبدیل کریں؟",
    body: "ایک اور JPG اپ لوڈ کریں یا مزید امیج ٹولز اور اعلیٰ استعمال کی حدود کے لیے مفت اکاؤنٹ بنائیں۔",
    primaryLabel: "ایک اور تصویر تبدیل کریں",
    secondaryLabel: "مفت اکاؤنٹ بنائیں",
    secondaryHref: "/register",
  },
};

export function getJpgToAvifCopy(locale: string): JpgToAvifCopy {
  return localizedCopy(locale, {en, ur});
}

export function jpgToAvifSeoCompat() {
  const c = en;
  return {
    intro: [
      c.hero.paragraph,
      "Guest files stay on temporary private storage for about one hour, and a new AVIF downloads only when encode succeeds.",
      "This page is about honest AVIF gates and WebP fallbacks — not resize presets or same-format compress dials.",
    ].join(" "),
    why: [
      c.intro.paragraphs[0],
      "Unlike Resize JPG or Compress JPG, this landing is AVIF experimentation that fails closed when encode is unavailable.",
      c.benefits.cards[0]!.body,
      c.whyAvif.note,
    ].join(" "),
    benefits: c.benefits.cards.slice(0, 5).map((card) => ({title: card.title, body: card.body})),
    howTo: [
      "Upload a JPG image",
      "Confirm AVIF encoder availability",
      "Convert with the guest engine",
      "Download the AVIF file when encode succeeds",
    ] as [string, string, string, string],
    technicalTitle: c.whyAvif.title,
    technical: [c.whyAvif.paragraphs[0], ...c.whyAvif.points.slice(0, 3), c.comparison.explanation].join(" "),
    faqs: c.faqs.slice(0, 4),
    ctaLabel: c.cta.primaryLabel,
  };
}

export type JpgToAvifLocale = AppLocale;
