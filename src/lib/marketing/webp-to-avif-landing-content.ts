import {localizedCopy} from "@/lib/marketing/localized-copy";
/**
 * WebP → AVIF landing — next-gen delivery with fail-closed encode honesty
 * (distinct from WebP→JPG compatibility and WebP→PNG editing paths).
 */
import type {AppLocale} from "@/i18n/routing";

export type WebpToAvifFaq = {q: string; a: string};

export type WebpToAvifCopy = {
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
    rows: {label: string; webp: string; avif: string}[];
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
  faqs: WebpToAvifFaq[];
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

const en: WebpToAvifCopy = {
  metaTitle: "Convert WebP to AVIF Online Free | Img Pilot",
  metaDescription:
    "Convert WebP images to AVIF when AVIF encoding is available on this server. Fail-closed conversion, private guest storage and instant download — no fake stand-in files.",
  h1: "Convert WebP to AVIF Online",
  breadcrumbParent: {href: "/convert-image", label: "Convert Image"},
  breadcrumbCurrent: "WebP to AVIF",
  hero: {
    badge: "WEBP TO AVIF CONVERTER",
    paragraph:
      "Convert WebP images into AVIF when this deployment’s encoder supports it. Reduce transfer size for forward-looking websites while the shared guest convert engine refuses to ship a mislabeled file if AVIF encode is unavailable.",
    trust: ["Fail-Closed Encode", "Modern Delivery", "Private Processing", "No Software Required"],
    uploadCta: "Upload WebP",
    heroImageAlt: "Browser interface converting a WebP image card into a smaller AVIF card with an honest encode gate indicator",
  },
  guestBar: {
    title: "Guest usage",
    deletionTitle: "Automatic deletion",
    countdownLabel: "Temporary files delete automatically in",
  },
  upload: {
    heading: "Upload a WebP Image",
    supporting: "Drag and drop a WebP image, paste from clipboard or browse your computer.",
    chooseLabel: "Choose WebP",
    formatsHint: "WebP · Maximum file size follows guest limits shown above",
    features: [
      {title: "Shared Convert Engine", body: "Uses the same guest convert workflow as sibling format landings."},
      {title: "Honest AVIF Gate", body: "If encode is unavailable, conversion fails closed — no renamed WebP pretending to be AVIF."},
      {title: "Private Processing", body: "Uploads stay in temporary private storage with roughly one-hour guest retention."},
      {title: "Automatic File Deletion", body: "Guest files are removed after the retention countdown on the page."},
    ],
  },
  intro: {
    eyebrow: "NEXT-GEN IMAGE FORMAT",
    title: "Why Convert WebP to AVIF?",
    paragraphs: [
      "AVIF is a modern still-image format that can deliver strong compression on many photographic and graphic assets. Converting WebP to AVIF helps teams evaluate the next step in web delivery when their stack already serves WebP and wants to measure further byte savings.",
      "This converter creates a new AVIF download only when the server runtime can encode AVIF truthfully. Your original WebP stays unchanged on your device.",
      "AVIF is not universal across every browser, email client or embedded WebView. Keep WebP — or use WebP to JPG when interchange matters more than bleeding-edge encoding.",
    ],
    imageAlt: "WebP and AVIF comparison cards showing similar quality with a smaller AVIF file size and a fallback WebP note",
  },
  comparison: {
    eyebrow: "WEBP VS AVIF",
    title: "How WebP and AVIF Compare",
    intro: "Use this table as a practical migration guide — not a promise that AVIF wins on every asset or runtime.",
    columns: ["Compare", "WebP", "AVIF"],
    rows: [
      {
        label: "Average file size",
        webp: "Already efficient for many web photos",
        avif: "Often smaller at comparable quality on supported encoders",
      },
      {
        label: "Compression",
        webp: "Mature modern web encoding",
        avif: "Newer AV1-based still-image encoding",
      },
      {
        label: "Transparency support",
        webp: "Supports alpha on still images",
        avif: "Can store transparency when the encode path supports it",
      },
      {
        label: "Animation",
        webp: "Format can animate; this tool targets stills",
        avif: "Still-image focus here; animated AVIF is out of scope",
      },
      {
        label: "Browser support",
        webp: "Strong on modern browsers",
        avif: "Growing but not universal — verify your visitor matrix",
      },
      {
        label: "Encode availability",
        webp: "Widely available on typical server runtimes",
        avif: "Requires runtime encoder support; this page fails closed without it",
      },
    ],
    explanation:
      "AVIF shines when you control CDN negotiation, picture-element fallbacks and can measure LCP on real devices. Keep WebP in production until AVIF encode availability, cache behavior and visual QA are proven — or switch to WebP to JPG when a partner cannot decode modern formats at all.",
  },
  benefits: {
    eyebrow: "WHY CONVERT",
    title: "Evaluate AVIF Without Fake Downloads",
    cards: [
      {
        title: "Potential Smaller Files",
        body: "AVIF often ships fewer bytes than a similar-looking WebP when encode succeeds and quality settings fit the asset.",
        icon: "size",
      },
      {
        title: "Improve Website Speed",
        body: "Lighter derivatives can help hero and grid images paint sooner on compatible clients.",
        icon: "speed",
      },
      {
        title: "Better Core Web Vitals",
        body: "Measured byte reductions can support LCP when images dominate the critical path.",
        icon: "vitals",
      },
      {
        title: "Private Processing",
        body: "Guest uploads use temporary storage and are not published to a public gallery.",
        icon: "privacy",
      },
      {
        title: "Browser Reality Check",
        body: "Content explains decode caveats so you plan WebP or JPG fallbacks instead of assuming universal AVIF.",
        icon: "browser",
      },
      {
        title: "Original WebP Protected",
        body: "Download a new AVIF only when encode works. Your source WebP remains untouched.",
        icon: "safe",
      },
    ],
  },
  howTo: {
    eyebrow: "THREE SIMPLE STEPS",
    title: "How to Convert WebP to AVIF",
    steps: [
      {
        title: "Upload WebP",
        body: "Choose a WebP from your device, drag it into the upload area or paste it from your clipboard.",
      },
      {
        title: "Confirm AVIF Availability",
        body: "Select AVIF as the target. If the encoder is disabled on this server, the control stays blocked honestly.",
      },
      {
        title: "Convert and Download",
        body: "Run conversion with the shared guest engine, preview when available, and download AVIF while the guest session remains valid.",
      },
    ],
    imageAlt: "Three steps for uploading WebP, confirming AVIF encode availability and downloading the result",
  },
  whyAvif: {
    title: "Why Teams Experiment With AVIF After WebP",
    paragraphs: [
      "Many sites already migrated JPG and PNG masters to WebP. AVIF is the next evaluation step when performance teams want to squeeze additional transfer budget without redesigning every layout.",
      "Honest tooling matters: a fake AVIF extension on a WebP body breaks trust, caches and SEO claims. This landing documents encode gates, guest privacy and fallback paths instead of overselling universality.",
    ],
    points: [
      "Further byte savings — on many assets when encode and quality settings align",
      "Modern CDN paths — when negotiation and fallbacks are already wired",
      "Measured rollouts — A/B against existing WebP before changing defaults",
      "Fail-closed safety — no mislabeled stand-in when encode is unavailable",
      "Shared guest limits — same privacy model and convert engine as Convert Image",
      "Fallback clarity — keep WebP live or use WebP to JPG for interchange",
    ],
    note: "Treat AVIF as a deliberate experiment with measurement and fallbacks — not an overnight rename of every WebP asset on the site.",
  },
  useCases: {
    eyebrow: "COMMON USE CASES",
    title: "Where WebP to AVIF Helps Most",
    cards: [
      {
        title: "CDN Migration Pilots",
        body: "Test AVIF derivatives against live WebP on high-traffic product and hero images.",
      },
      {
        title: "Performance Programs",
        body: "Give Lighthouse and RUM teams a honest encode path when evaluating the next format tier.",
      },
      {
        title: "Marketing Landings",
        body: "Shrink campaign imagery further when visitors already receive WebP and your matrix supports AVIF decode.",
      },
      {
        title: "Design System Audits",
        body: "Compare UI photography and illustration exports before updating component libraries.",
      },
    ],
  },
  tips: {
    eyebrow: "BETTER RESULTS",
    title: "Conversion Tips",
    items: [
      "Keep production WebP live until AVIF encode, cache hits and visual QA pass on staging.",
      "Preview text overlays, logos and product edges — aggressive AVIF settings can smear fine detail.",
      "Use picture elements or CDN format negotiation with WebP fallback during gradual rollout.",
      "Measure encode latency on representative file sizes before batch automation.",
      "When AVIF is blocked here, stay on WebP or convert to JPG for compatibility — never expect a fake AVIF.",
      "Compress WebP afterward only when you must stay on WebP instead of pursuing AVIF.",
    ],
  },
  faqHeading: "Frequently Asked Questions",
  faqs: [
    {
      q: "What is AVIF and why move beyond WebP?",
      a: "AVIF is a newer still-image format built on AV1 compression. Teams convert WebP to AVIF to test whether their stack can save additional bytes on compatible clients — not because AVIF replaces WebP everywhere overnight.",
    },
    {
      q: "What if WebP to AVIF encoding fails on this deployment?",
      a: "Conversion fails closed. You will not receive a renamed WebP or other stand-in labeled as AVIF. Keep serving WebP or use WebP to JPG when interchange outranks AVIF experiments.",
    },
    {
      q: "Is AVIF always smaller than WebP?",
      a: "No. Savings depend on content, dimensions, quality presets and encoder settings. Always measure downloads and visual quality against your existing WebP masters.",
    },
    {
      q: "Will converting overwrite my original WebP?",
      a: "No. A new AVIF is created for download when encode succeeds. The WebP on your device remains unchanged.",
    },
    {
      q: "Do all browsers and apps support AVIF?",
      a: "Modern browsers increasingly decode AVIF, but support is not universal across email clients, older WebViews and legacy software. Plan WebP or JPG fallbacks for visitors who cannot decode AVIF.",
    },
    {
      q: "Should I delete WebP after converting to AVIF?",
      a: "Not until AVIF is proven in your CDN, cache layer and visitor matrix. Most rollouts keep WebP as the fallback format during migration.",
    },
    {
      q: "Are WebP to AVIF uploads private and how long are files kept?",
      a: "Guest images use private temporary storage and are deleted automatically according to the retention countdown on the page — typically around one hour for guest sessions.",
    },
    {
      q: "What are the guest limits for WebP to AVIF conversion?",
      a: "Free guest operations and maximum file size appear in the usage bar above the uploader. Higher limits may require an account.",
    },
    {
      q: "Can I convert multiple WebP images at once on this page?",
      a: "This landing is built for single-image conversion. For several files, use Bulk Image Tools when you need a multi-file workflow.",
    },
    {
      q: "When should I choose WebP to JPG instead of WebP to AVIF?",
      a: "Choose WebP to JPG when email, documents, CMS uploads or partners reject modern formats entirely. AVIF is for measured web delivery experiments where you already control fallbacks.",
    },
  ],
  related: {
    eyebrow: "CONTINUE EDITING",
    title: "Related Image Tools",
    tools: [
      {href: "/webp-to-jpg", title: "Convert WebP to JPG", body: "Create a JPG fallback when partners cannot open WebP or AVIF."},
      {href: "/png-to-avif", title: "PNG to AVIF", body: "Evaluate AVIF from transparent PNG masters."},
      {href: "/jpg-to-avif", title: "JPG to AVIF", body: "Migrate photographic JPG assets into AVIF when encode is available."},
      {href: "/compress-webp", title: "Compress WebP", body: "Reduce WebP weight when AVIF encode is blocked or not ready."},
      {href: "/convert-image", title: "Convert Image", body: "Browse the full guest convert matrix and format honesty rules."},
      {href: "/bulk-image-tools", title: "Bulk Convert Images", body: "Process several images in one guest workflow."},
    ],
  },
  cta: {
    title: "Ready to Convert Another Image?",
    body: "Upload another WebP or create a free account to unlock more image tools and higher usage limits.",
    primaryLabel: "Convert Another Image",
    secondaryLabel: "Create Free Account",
    secondaryHref: "/register",
  },
};

const ur: WebpToAvifCopy = {
  metaTitle: "آن لائن WebP کو AVIF میں تبدیل کریں مفت | Img Pilot",
  metaDescription:
    "جب اس سرور پر AVIF انکوڈنگ دستیاب ہو WebP کو آن لائن AVIF میں تبدیل کریں۔ فیل کلوزڈ کنورژن، نجی مہمان اسٹوریج اور فوری ڈاؤن لوڈ — کوئی جعلی اسٹینڈ اِن فائل نہیں۔",
  h1: "آن لائن WebP کو AVIF میں تبدیل کریں",
  breadcrumbParent: {href: "/convert-image", label: "تصویر تبدیل کریں"},
  breadcrumbCurrent: "WebP to AVIF",
  hero: {
    badge: "WEBP TO AVIF CONVERTER",
    paragraph:
      "جب اس ڈپلائمنٹ کا انکوڈر AVIF سپورٹ کرے WebP تصاویر کو AVIF میں تبدیل کریں۔ آگے کی ویب ڈیلیوری کے لیے ٹرانسفر سائز کم کریں — شیئرڈ مہمان کنورٹ انجن اگر AVIF انکوڈ دستیاب نہ ہو تو غلط لیبل والی فائل نہیں بھیجتا۔",
    trust: ["فیل کلوزڈ انکوڈ", "جدید ڈیلیوری", "نجی پروسیسنگ", "سافٹ ویئر کی ضرورت نہیں"],
    uploadCta: "WebP اپ لوڈ کریں",
    heroImageAlt: "براؤزر انٹرفیس میں WebP کارڈ کو چھوٹے AVIF کارڈ میں تبدیل کرتے ہوئے ایماندار انکوڈ گیٹ کے ساتھ",
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
      {title: "شیئرڈ کنورٹ انجن", body: "باقی فارمیٹ لینڈنگز جیسا ہی مہمان کنورٹ ورک فلو۔"},
      {title: "ایماندار AVIF گیٹ", body: "انکوڈ دستیاب نہ ہو تو کنورژن فیل کلوزڈ — WebP کو AVIF کا نام دے کر نہیں بھیجا جاتا۔"},
      {title: "نجی پروسیسنگ", body: "اپ لوڈز عارضی نجی اسٹوریج میں رہتی ہیں، تقریباً ایک گھنٹے کی مہمان برقرار رکھنا۔"},
      {title: "خودکار فائل حذف", body: "صفحے پر دکھائی گئی برقرار رکھنے کی مدت کے بعد مہمان فائلیں ہٹ جاتی ہیں۔"},
    ],
  },
  intro: {
    eyebrow: "اگلی نسل کا امیج فارمیٹ",
    title: "WebP کو AVIF میں کیوں تبدیل کریں؟",
    paragraphs: [
      "AVIF ایک جدید اسٹل امیج فارمیٹ ہے جو بہت سی فوٹوگرافک اور گرافک اثاثوں پر مضبوط کمپریشن دے سکتا ہے۔ WebP کو AVIF میں بدلنا ان ٹیموں کے لیے ہے جو پہلے سے WebP پیش کرتی ہیں اور مزید بائٹ بچت ناپنا چاہتی ہیں۔",
      "یہ کنورٹر نئی AVIF ڈاؤن لوڈ صرف تب بناتا ہے جب سرور رن ٹائم AVIF ایمانداری سے انکوڈ کر سکے۔ اصل WebP آپ کی ڈیوائس پر جوں کی توں رہتی ہے۔",
      "AVIF ہر براؤزر، ای میل کلائنٹ یا ایمبیڈڈ WebView میں عالمگیر نہیں۔ WebP رکھیں — یا WebP to JPG استعمال کریں جب interchange جدید انکوڈنگ سے اہم ہو۔",
    ],
    imageAlt: "WebP اور AVIF موازنہ کارڈز — ملتا جلتا معیار، چھوٹا AVIF سائز اور WebP فال بیک نوٹ",
  },
  comparison: {
    eyebrow: "WebP بمقابلہ AVIF",
    title: "WebP اور AVIF کا موازنہ",
    intro: "یہ جدول عملی مائیگریشن گائیڈ ہے — وعدہ نہیں کہ AVIF ہر اثاثے یا رن ٹائم پر جیتے گا۔",
    columns: ["موازنہ", "WebP", "AVIF"],
    rows: [
      {
        label: "اوسط فائل سائز",
        webp: "بہت سی ویب فوٹوز کے لیے پہلے سے موثر",
        avif: "سپورٹڈ انکوڈرز پر ملتے جلتے کوالٹی پر اکثر چھوٹا",
      },
      {
        label: "کمپریشن",
        webp: "پختہ جدید ویب انکوڈنگ",
        avif: "AV1 پر مبنی نیا اسٹل انکوڈنگ",
      },
      {
        label: "شفافیت کی سپورٹ",
        webp: "اسٹل امیجز پر الفا سپورٹ",
        avif: "انکوڈ راستہ سپورٹ کرے تو شفافیت رکھ سکتا ہے",
      },
      {
        label: "اینیمیشن",
        webp: "فارمیٹ اینیمیٹ ہو سکتا ہے؛ یہ ٹول اسٹل کے لیے ہے",
        avif: "یہاں اسٹل فوکس؛ متحرک AVIF دائرے سے باہر",
      },
      {
        label: "براؤزر سپورٹ",
        webp: "جدید براؤزرز پر مضبوط",
        avif: "بڑھ رہی مگر عالمگیر نہیں — وزٹر میٹرکس چیک کریں",
      },
      {
        label: "انکوڈ دستیابی",
        webp: "عام سرور رن ٹائمز پر وسیع دستیاب",
        avif: "رن ٹائم انکوڈر چاہیے؛ بغیر اس کے یہ صفحہ فیل کلوزڈ",
      },
    ],
    explanation:
      "AVIF تب چمکتا ہے جب CDN negotiation، picture-element فال بیکس اور حقیقی ڈیوائسز پر LCP ناپ سکیں۔ AVIF انکوڈ، کیش اور بصری QA ثابت ہونے تک WebP پروڈکشن میں رکھیں — یا WebP to JPG جب پارٹنر جدید فارمیٹس نہ کھول سکے۔",
  },
  benefits: {
    eyebrow: "تبدیلی کیوں",
    title: "جعلی ڈاؤن لوڈ کے بغیر AVIF جانچیں",
    cards: [
      {
        title: "ممکنہ چھوٹی فائلیں",
        body: "انکوڈ کامیاب اور کوالٹی مناسب ہو تو AVIF اکثر ملتے جلتے WebP سے کم بائٹس بھیجتا ہے۔",
        icon: "size",
      },
      {
        title: "ویب سائٹ کی رفتار",
        body: "ہلکی derivatives مطابقت پذیر کلائنٹس پر ہیرو اور گرڈ امیجز جلد دکھانے میں مدد کر سکتی ہیں۔",
        icon: "speed",
      },
      {
        title: "بہتر Core Web Vitals",
        body: "ناپی گئی بائٹ کمی LCP میں مدد کر سکتی ہے جب امیجز critical path پر غالب ہوں۔",
        icon: "vitals",
      },
      {
        title: "نجی پروسیسنگ",
        body: "مہمان اپ لوڈز عارضی اسٹوریج استعمال کرتے ہیں اور عوامی گیلری میں نہیں جاتے۔",
        icon: "privacy",
      },
      {
        title: "براؤزر حقیقت",
        body: "مواد decode کی حدود بتاتا ہے تاکہ WebP یا JPG فال بیک منصوبہ بنے، عالمگیر AVIF نہ سمجھا جائے۔",
        icon: "browser",
      },
      {
        title: "اصل WebP محفوظ",
        body: "AVIF صرف انکوڈ کام کرے تو ڈاؤن لوڈ۔ ماخذ WebP untouched رہتی ہے۔",
        icon: "safe",
      },
    ],
  },
  howTo: {
    eyebrow: "تین آسان مراحل",
    title: "WebP کو AVIF میں کیسے تبدیل کریں",
    steps: [
      {
        title: "WebP اپ لوڈ کریں",
        body: "ڈیوائس سے WebP چنیں، اپ لوڈ ایریا میں گھسیٹیں، یا کلپ بورڈ سے چسپاں کریں۔",
      },
      {
        title: "AVIF دستیابی تصدیق کریں",
        body: "AVIF ٹارگٹ چنیں۔ اگر اس سرور پر انکوڈر بند ہو تو کنٹرول ایمانداری سے بلاک رہتا ہے۔",
      },
      {
        title: "تبدیل کریں اور ڈاؤن لوڈ کریں",
        body: "شیئرڈ مہمان انجن سے کنورژن چلائیں، جب دستیاب ہو پیش نظارہ دیکھیں، اور مہمان سیشن کے دوران AVIF ڈاؤن لوڈ کریں۔",
      },
    ],
    imageAlt: "WebP اپ لوڈ، AVIF انکوڈ دستیابی تصدیق اور نتیجہ ڈاؤن لوڈ کے تین مراحل",
  },
  whyAvif: {
    title: "WebP کے بعد ٹیمیں AVIF کیوں آزماتی ہیں",
    paragraphs: [
      "بہت سی سائٹس JPG اور PNG masters پہلے ہی WebP میں لے آ چکی ہیں۔ AVIF اگلا evaluation قدم ہے جب پرفارمنس ٹیمیں مزید ٹرانسفر بجٹ نچوڑنا چاہے بغیر ہر layout ری ڈیزائن کیے۔",
      "ایماندار ٹولنگ اہم ہے: WebP جسم پر جعلی AVIF extension اعتماد، کیش اور SEO دعووں کو توڑتی ہے۔ یہ لینڈنگ encode gates، مہمان privacy اور fallback راستے بیان کرتی ہے بجائے عالمگیری کے oversell کے۔",
    ],
    points: [
      "مزید بائٹ بچت — بہت سے اثاثوں پر جب انکوڈ اور کوالٹی ملیں",
      "جدید CDN راستے — جب negotiation اور fallbacks پہلے سے wired ہوں",
      "ناپا ہوا rollout — defaults بدلنے سے پہلے موجودہ WebP سے A/B",
      "فیل کلوزڈ حفاظت — انکوڈ نہ ہو تو غلط لیبل والا stand-in نہیں",
      "شیئرڈ مہمان حدود — Convert Image جیسا privacy اور کنورٹ انجن",
      "فال بیک وضاحت — WebP live رکھیں یا interchange کے لیے WebP to JPG",
    ],
    note: "AVIF کو جان بوجھ کر تجربے کے طور پر ناپیں اور fallbacks رکھیں — سائٹ پر ہر WebP اثاثے کا راتوں رات rename نہیں۔",
  },
  useCases: {
    eyebrow: "عام استعمالات",
    title: "WebP to AVIF سب سے زیادہ کہاں مدد کرتا ہے",
    cards: [
      {
        title: "CDN مائیگریشن پائلٹ",
        body: "تیز ٹریفک پروڈکٹ اور ہیرو امیجز پر live WebP کے مقابلے AVIF derivatives آزمائیں۔",
      },
      {
        title: "پرفارمنس پروگرام",
        body: "Lighthouse اور RUM ٹیموں کو اگلے format tier پر ایماندار encode راستہ دیں۔",
      },
      {
        title: "مارکیٹنگ لینڈنگز",
        body: "جب وزٹرز پہلے سے WebP ملتے ہیں اور میٹرکس AVIF decode سپورٹ کرے مہم imagery مزید چھوٹی کریں۔",
      },
      {
        title: "ڈیزائن سسٹم آڈٹ",
        body: "component libraries اپ ڈیٹ کرنے سے پہلے UI فوٹو اور illustration exports موازنہ کریں۔",
      },
    ],
  },
  tips: {
    eyebrow: "بہتر نتائج",
    title: "کنورژن کے مشورے",
    items: [
      "AVIF انکوڈ، کیش hits اور بصری QA staging پر pass ہونے تک پروڈکشن WebP live رکھیں۔",
      "ٹیکسٹ اوورلی، لوگوز اور پروڈکٹ کنارے دیکھیں — aggressive AVIF تفصیل مٹا سکتا ہے۔",
      "آہستہ rollout میں picture elements یا CDN format negotiation WebP fallback کے ساتھ۔",
      "batch automation سے پہلے نمائندہ فائل سائزز پر encode latency ناپیں۔",
      "جب AVIF یہاں بلاک ہو WebP پر رہیں یا مطابقت کے لیے JPG — جعلی AVIF کی توقع نہ کریں۔",
      "AVIF نہ ملے تو Compress WebP استعمال کریں جب WebP پر رہنا ہو۔",
    ],
  },
  faqHeading: "عمومی سوالات",
  faqs: [
    {
      q: "AVIF کیا ہے اور WebP سے آگے کیوں جائیں؟",
      a: "AVIF AV1 کمپریشن پر بننے والا نیا اسٹل فارمیٹ ہے۔ ٹیمیں WebP کو AVIF میں بدل کر جانچتی ہیں کہ stack مطابقت پذیر کلائنٹس پر مزید بائٹس بچا سکتا ہے — اس لیے نہیں کہ AVIF راتوں رات ہر جگہ WebP بدل دے۔",
    },
    {
      q: "اگر اس ڈپلائمنٹ پر WebP to AVIF انکوڈنگ ناکام ہو تو کیا ہوگا؟",
      a: "کنورژن فیل کلوزڈ۔ AVIF لیبل والی renamed WebP یا کوئی stand-in نہیں ملے گا۔ WebP پیش کرتے رہیں یا WebP to JPG جب interchange AVIF تجربے سے اہم ہو۔",
    },
    {
      q: "کیا AVIF ہمیشہ WebP سے چھوٹا ہوتا ہے؟",
      a: "نہیں۔ بچت مواد، ابعاد، کوالٹی preset اور انکوڈر settings پر منحصر ہے۔ ہمیشہ ڈاؤن لوڈ اور بصری کوالٹی موجودہ WebP masters سے موازنہ کریں۔",
    },
    {
      q: "کیا کنورژن میری اصل WebP بدل دے گی؟",
      a: "نہیں۔ انکوڈ کامیاب ہو تو نئی AVIF بنتی ہے۔ ڈیوائس پر WebP جوں کی توں رہتی ہے۔",
    },
    {
      q: "کیا تمام براؤزرز اور ایپس AVIF سپورٹ کرتے ہیں؟",
      a: "جدید براؤزرز AVIF decode بڑھاتے جا رہے ہیں، مگر ای میل، پرane WebViews اور پرانے سافٹ ویئر میں سپورٹ عالمگیر نہیں۔ جن وزٹرز AVIF نہ کھول سکیں ان کے لیے WebP یا JPG fallback رکھیں۔",
    },
    {
      q: "AVIF میں بدلنے کے بعد WebP حذف کر دوں؟",
      a: "CDN، کیش layer اور وزٹر میٹرکس میں AVIF ثابت ہونے تک نہیں۔ زیادہ تر rollout میں WebP fallback کے طور پر رہتا ہے۔",
    },
    {
      q: "کیا WebP to AVIF اپ لوڈز نجی ہیں اور فائلیں کتنی دیر رہتی ہیں؟",
      a: "مہمان تصاویر نجی عارضی اسٹوریج استعمال کرتی ہیں اور صفحے پر countdown کے مطابق خود حذف — عام طور پر مہمان session کے لیے تقریباً ایک گھنٹہ۔",
    },
    {
      q: "WebP to AVIF کنورژن کی مہمان حدود کیا ہیں؟",
      a: "مفت مہمان آپریشنز اور زیادہ سے زیادہ فائل سائز اپ لوڈر کے اوپر usage bar میں نظر آتی ہیں۔ اعلیٰ حدود کے لیے اکاؤنٹ درکار ہو سکتا ہے۔",
    },
    {
      q: "کیا اس صفحے پر کئی WebP ایک ساتھ تبدیل ہو سکتی ہیں؟",
      a: "یہ لینڈنگ single-image کنورژن کے لیے ہے۔ کئی فائلوں کے لیے Bulk Image Tools استعمال کریں۔",
    },
    {
      q: "WebP to AVIF کی بجائے WebP to JPG کب چنیں؟",
      a: "WebP to JPG جب ای میل، دستاویزات، CMS یا پارٹنر جدید فارمیٹس بالکل نہ کھولیں۔ AVIF ناپے ہوئے ویب ڈیلیوری تجربات کے لیے ہے جہاں fallbacks آپ کنٹرول کریں۔",
    },
  ],
  related: {
    eyebrow: "مزید ایڈیٹنگ",
    title: "متعلقہ امیج ٹولز",
    tools: [
      {href: "/webp-to-jpg", title: "Convert WebP to JPG", body: "جب پارٹنر WebP یا AVIF نہ کھول سکے JPG fallback بنائیں۔"},
      {href: "/png-to-avif", title: "PNG to AVIF", body: "شفاف PNG masters سے AVIF جانچیں۔"},
      {href: "/jpg-to-avif", title: "JPG to AVIF", body: "فوٹوگرافک JPG اثاثے AVIF میں جب انکوڈ دستیاب ہو۔"},
      {href: "/compress-webp", title: "Compress WebP", body: "AVIF انکوڈ بلاک یا تیار نہ ہو تو WebP وزن کم کریں۔"},
      {href: "/convert-image", title: "Convert Image", body: "مکمل مہمان convert matrix اور فارمیٹ honesty rules دیکھیں۔"},
      {href: "/bulk-image-tools", title: "Bulk Convert Images", body: "ایک مہمان workflow میں کئی تصاویر پروسیس کریں۔"},
    ],
  },
  cta: {
    title: "ایک اور تصویر تبدیل کریں؟",
    body: "ایک اور WebP اپ لوڈ کریں یا مزید امیج ٹولز اور اعلیٰ استعمال کی حدود کے لیے مفت اکاؤنٹ بنائیں۔",
    primaryLabel: "ایک اور تصویر تبدیل کریں",
    secondaryLabel: "مفت اکاؤنٹ بنائیں",
    secondaryHref: "/register",
  },
};

export function getWebpToAvifCopy(locale: string): WebpToAvifCopy {
  return localizedCopy(locale, {en, ur});
}

export function webpToAvifSeoCompat() {
  const c = en;
  return {
    intro: [
      c.hero.paragraph,
      "Guest files stay temporary and private; a new AVIF downloads only when encode succeeds — never a mislabeled WebP stand-in.",
      "This page is measured AVIF delivery with CDN fallbacks — not compatibility interchange or same-format compress.",
    ].join(" "),
    why: [
      c.intro.paragraphs[0],
      "Unlike WebP to JPG or Compress WebP, this landing evaluates AVIF with fail-closed encode when the runtime cannot produce it.",
      c.benefits.cards[0]!.body,
      c.whyAvif.note,
    ].join(" "),
    benefits: c.benefits.cards.slice(0, 5).map((card) => ({title: card.title, body: card.body})),
    howTo: [
      "Upload a WebP image",
      "Confirm AVIF encode availability",
      "Convert with the guest engine",
      "Download the AVIF file",
    ] as [string, string, string, string],
    technicalTitle: c.whyAvif.title,
    technical: [c.whyAvif.paragraphs[0], ...c.whyAvif.points.slice(0, 3), c.comparison.explanation].join(" "),
    faqs: c.faqs.slice(0, 4),
    ctaLabel: c.cta.primaryLabel,
  };
}

export type WebpToAvifLocale = AppLocale;
