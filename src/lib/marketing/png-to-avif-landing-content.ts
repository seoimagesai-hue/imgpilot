/**
 * PNG → AVIF landing — modern compression with encode honesty
 * (distinct from PNG→WebP fallback path and JPG→AVIF photographic migration).
 */
import type {AppLocale} from "@/i18n/routing";

export type PngToAvifFaq = {q: string; a: string};

export type PngToAvifCopy = {
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
    rows: {label: string; png: string; avif: string}[];
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
  faqs: PngToAvifFaq[];
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

const en: PngToAvifCopy = {
  metaTitle: "Convert PNG to AVIF Online Free | SEO Images",
  metaDescription:
    "Convert PNG images to AVIF when encoder support is available. Fail-closed honesty, private guest storage, and PNG to WebP as the recommended fallback when AVIF is blocked.",
  h1: "Convert PNG to AVIF Online",
  breadcrumbParent: {href: "/convert-image", label: "Convert Image"},
  breadcrumbCurrent: "PNG to AVIF",
  hero: {
    badge: "PNG TO AVIF CONVERTER",
    paragraph:
      "Convert PNG images into AVIF when this deployment's encoder supports it. Create smaller next-generation web assets while keeping transparency in scope — with fail-closed honesty when AVIF cannot be produced.",
    trust: [
      "Fail-Closed Encode",
      "Transparency QA Required",
      "Private Guest Storage",
      "WebP Fallback Ready",
    ],
    uploadCta: "Upload PNG",
    heroImageAlt: "Browser interface converting a transparent PNG logo into an AVIF image with encoder availability check",
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
      {title: "Encoder Honesty", body: "If AVIF encode is unavailable, conversion fails closed — no fake AVIF downloads."},
      {title: "Alpha in Scope", body: "AVIF can carry transparency, but preview edges on light and dark backgrounds before shipping."},
      {title: "Private Processing", body: "Uploads stay in temporary private storage with automatic guest expiry."},
      {title: "Shared Convert Engine", body: "Uses the same guest convert workflow, limits and matrix checks as sibling tools."},
    ],
  },
  intro: {
    eyebrow: "NEXT-GENERATION WEB FORMAT",
    title: "Why Convert PNG to AVIF?",
    paragraphs: [
      "PNG files deliver excellent quality and full alpha, but they are often too heavy for modern web delivery at scale.",
      "AVIF can offer strong compression for compatible browsers and CDNs, making it worth evaluating for logos, UI graphics and marketing illustrations — when encode support is actually available.",
      "This converter creates a new AVIF only when the runtime encoder succeeds. If AVIF is blocked here, use PNG to WebP as the recommended fallback rather than expecting a renamed stand-in file.",
    ],
    imageAlt: "Transparent PNG logo evaluated for AVIF conversion with transparency preview on contrasting backgrounds",
  },
  comparison: {
    eyebrow: "PNG VS AVIF",
    title: "How PNG and AVIF Compare",
    intro: "Keep PNG as the editing master. Evaluate AVIF for delivery only where encode works, browsers decode it, and visual QA passes.",
    columns: ["Compare", "PNG", "AVIF"],
    rows: [
      {label: "Compression", png: "Lossless / large by default", avif: "Modern codec — often smaller when encode succeeds"},
      {label: "Transparency", png: "Full alpha support", avif: "Alpha possible — verify edges, do not assume perfect parity"},
      {label: "Typical file size", png: "Often large on websites", avif: "Often competitive when measured on real assets"},
      {label: "Website speed", png: "Can slow LCP when oversized", avif: "Potential gains on supported clients after QA"},
      {label: "Editing workflows", png: "Best master for design tools", avif: "Usually a delivery derivative, not a design source"},
      {label: "Browser support", png: "Nearly universal", avif: "Strong on modern engines — not infinite across every WebView"},
    ],
    explanation:
      "Keep PNG masters in Figma or Photoshop. Test AVIF on a subset of high-traffic assets first. Pair with WebP or PNG fallbacks until your CDN negotiation and browser matrix are proven.",
  },
  benefits: {
    eyebrow: "WHY CONVERT",
    title: "Evaluate AVIF Without Overselling It",
    cards: [
      {
        title: "Transparency Needs QA",
        body: "AVIF can keep alpha, but preview logos and UI overlays on light and dark backgrounds before publishing.",
        icon: "alpha",
      },
      {
        title: "Potential Size Wins",
        body: "AVIF often competes well against PNG on supported runtimes — measure your own assets instead of assuming.",
        icon: "size",
      },
      {
        title: "Performance Experiments",
        body: "Useful for teams testing next-gen delivery on modern browsers and forward-looking CDNs.",
        icon: "speed",
      },
      {
        title: "Browser Caveats",
        body: "Decode coverage is strong but not universal. Plan fallbacks for older clients and embedded WebViews.",
        icon: "browser",
      },
      {
        title: "Private Guest Processing",
        body: "Files remain temporary, are not published to a public gallery, and delete after the retention countdown.",
        icon: "privacy",
      },
      {
        title: "Fail-Closed Safety",
        body: "Download a real AVIF when encode works. Your original PNG stays unchanged on your device.",
        icon: "safe",
      },
    ],
  },
  howTo: {
    eyebrow: "THREE SIMPLE STEPS",
    title: "How to Convert PNG to AVIF",
    steps: [
      {
        title: "Upload PNG",
        body: "Choose a PNG from your device, drag it into the upload area or paste it from your clipboard.",
      },
      {
        title: "Confirm AVIF Availability",
        body: "Run conversion through the shared guest convert engine. If the encoder is unavailable, the tool fails closed.",
      },
      {
        title: "Download and QA",
        body: "Preview transparency on light and dark backgrounds, then download the AVIF while the guest session is valid.",
      },
    ],
    imageAlt: "Three steps for uploading PNG, confirming AVIF encode availability and downloading after visual QA",
  },
  whyAvif: {
    title: "Modern Delivery With Honest Encode Gates",
    paragraphs: [
      "Design systems and marketing sites sometimes evaluate AVIF against PNG masters for LCP-sensitive graphics. That only makes sense when encode succeeds, decode coverage matches your audience, and visual QA passes.",
      "Guest sessions use private temporary storage with roughly one-hour retention. When AVIF is blocked on this deployment, PNG to WebP remains the practical modern alternative — not a mislabeled PNG pretending to be AVIF.",
    ],
    points: [
      "Fail closed when the runtime encoder cannot produce AVIF",
      "PNG to WebP recommended fallback during gradual rollout",
      "Visual QA for alpha edges, thin text and brand marks",
      "Browser and CDN support evolving — keep picture-element fallbacks",
      "Shared convert engine, guest limits and privacy match Convert Image",
      "Start with a measured subset before replacing entire PNG libraries",
    ],
    note: "AVIF is a deliberate performance experiment — not a keyword synonym for every PNG in your brand library overnight.",
  },
  useCases: {
    eyebrow: "COMMON USE CASES",
    title: "Where PNG to AVIF Evaluation Helps",
    cards: [
      {
        title: "Website Logos",
        body: "Test lighter transparent marks on modern browsers after alpha edge checks.",
      },
      {
        title: "Landing Pages",
        body: "Measure campaign illustrations against existing WebP before declaring AVIF the default.",
      },
      {
        title: "UI Graphics",
        body: "Evaluate product UI captures where compatible clients and CDN negotiation are already proven.",
      },
      {
        title: "Icons & Illustrations",
        body: "Pilot icon sets on high-traffic pages with WebP or PNG fallbacks still in place.",
      },
    ],
  },
  tips: {
    eyebrow: "BETTER RESULTS",
    title: "Conversion Tips",
    items: [
      "If AVIF encode fails here, switch to PNG to WebP instead of forcing a fake output.",
      "Preview transparency on both light and dark backgrounds — do not assume perfect alpha parity.",
      "Keep the original PNG as the editable master in your design repository.",
      "Measure encode latency and cache behavior before batch automation.",
      "Pair AVIF with WebP fallbacks until browser and CDN matrices are verified.",
      "Resize before conversion when the layout box is much smaller than the source file.",
    ],
  },
  faqHeading: "Frequently Asked Questions",
  faqs: [
    {
      q: "Why convert PNG to AVIF instead of staying on PNG?",
      a: "Evaluate AVIF when you want to test next-generation compression on compatible browsers while keeping transparency in scope. Keep PNG as the editing master.",
    },
    {
      q: "What happens if AVIF encoding is unavailable on this server?",
      a: "The tool fails closed. You will not receive a renamed PNG pretending to be AVIF. Use PNG to WebP as the recommended fallback.",
    },
    {
      q: "Should I use PNG to WebP instead of PNG to AVIF?",
      a: "Yes when AVIF encode is blocked, browser coverage is uncertain, or you need a broadly supported modern format today. WebP remains the pragmatic sibling path.",
    },
    {
      q: "Does PNG to AVIF preserve transparency perfectly?",
      a: "AVIF can carry alpha, but edge fidelity varies by content and encoder settings. Always run visual QA on logos and UI overlays before replacing production assets.",
    },
    {
      q: "Which browsers can display AVIF from PNG conversions?",
      a: "Modern Chromium, Firefox and Safari engines decode AVIF well, but coverage is not infinite across every older browser or embedded WebView. Plan fallbacks.",
    },
    {
      q: "Is PNG to AVIF good for website logos and UI graphics?",
      a: "It can be, after encode succeeds and you confirm alpha on target devices. Start with a subset and keep WebP or PNG fallbacks during migration.",
    },
    {
      q: "Are PNG to AVIF uploads private and temporary?",
      a: "Yes. Guest images use private temporary storage and are deleted automatically according to the retention countdown on the page.",
    },
    {
      q: "How long do guest PNG to AVIF files stay stored?",
      a: "Guest files follow the roughly one-hour retention shown in the usage bar. Download your AVIF while the session remains valid.",
    },
    {
      q: "Does PNG to AVIF use the same convert engine as other tools?",
      a: "Yes. Processing reuses the shared guest convert engine with the same privacy model, operation limits and format matrix checks as sibling convert landings.",
    },
    {
      q: "When should I keep the original PNG master after AVIF conversion?",
      a: "Always. AVIF is a delivery derivative. Retain PNG for editing, print workflows and environments where AVIF decode or encode is not yet reliable.",
    },
  ],
  related: {
    eyebrow: "CONTINUE EDITING",
    title: "Related Image Tools",
    tools: [
      {href: "/png-to-webp", title: "PNG to WebP", body: "Recommended modern fallback when AVIF encode is blocked or still in evaluation."},
      {href: "/jpg-to-avif", title: "JPG to AVIF", body: "Convert photographic JPG masters when AVIF encode is available."},
      {href: "/compress-png", title: "Compress PNG", body: "Reduce PNG weight when you must stay on the lossless master format."},
      {href: "/convert-image", title: "Convert Image", body: "Browse the full guest convert matrix and shared privacy rules."},
      {href: "/webp-to-avif", title: "WebP to AVIF", body: "Step up from WebP when AVIF encode and QA both pass on your stack."},
      {href: "/bulk-image-tools", title: "Bulk Convert Images", body: "Process several images in one guest workflow after single-file validation."},
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

const ur: PngToAvifCopy = {
  metaTitle: "آن لائن PNG کو AVIF میں تبدیل کریں مفت | SEO Images",
  metaDescription:
    "جب انکوڈر سپورٹ دستیاب ہو تو PNG تصاویر AVIF میں تبدیل کریں۔ انکوڈر بند ہونے پر fail-closed ایمانداری، نجی مہمان اسٹوریج، اور AVIF بلاک ہونے پر PNG to WebP بطور تجویز کردہ متبادل۔",
  h1: "آن لائن PNG کو AVIF میں تبدیل کریں",
  breadcrumbParent: {href: "/convert-image", label: "تصویر تبدیل کریں"},
  breadcrumbCurrent: "PNG to AVIF",
  hero: {
    badge: "PNG TO AVIF CONVERTER",
    paragraph:
      "جب اس ڈپلائمنٹ کا انکوڈر AVIF سپورٹ کرتا ہو تو PNG تصاویر AVIF میں تبدیل کریں۔ شفافیت کے دائرے میں چھوٹے جدید ویب اثاثے بنائیں — اور جب AVIF نہیں بن سکتا تو fail-closed ایمانداری کے ساتھ۔",
    trust: ["Fail-Closed Encode", "شفافیت QA ضروری", "نجی مہمان اسٹوریج", "WebP متبادل تیار"],
    uploadCta: "PNG اپ لوڈ کریں",
    heroImageAlt: "براؤزر میں شفاف PNG لوگو کو AVIF میں تبدیل کرتے ہوئے انکوڈر دستیابی کی جانچ",
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
      {title: "انکوڈر ایمانداری", body: "اگر AVIF انکوڈ دستیاب نہیں تو کنورژن fail closed — جعلی AVIF ڈاؤن لوڈ نہیں۔"},
      {title: "الفا دائرے میں", body: "AVIF شفافیت رکھ سکتا ہے، مگر شائع کرنے سے پہلے ہلکے و گہرے پس منظر پر کنارے دیکھیں۔"},
      {title: "نجی پروسیسنگ", body: "اپ لوڈز عارضی نجی اسٹوریج میں رہتی ہیں اور مہمان مدت ختم ہونے پر حذف ہوتی ہیں۔"},
      {title: "شیئرڈ کنورٹ انجن", body: "بہن ٹولز جیسا ہی مہمان کنورٹ ورک فلو، حدود اور میٹرکس چیک۔"},
    ],
  },
  intro: {
    eyebrow: "اگلی نسل کا ویب فارمیٹ",
    title: "PNG کو AVIF میں کیوں تبدیل کریں؟",
    paragraphs: [
      "PNG بہترین معیار اور مکمل الفا دیتی ہے، مگر جدید ویب ڈیلیوری کے لیے اکثر بہت بھاری ہو جاتی ہے۔",
      "AVIF سپورٹڈ براؤزرز اور CDN پر مضبوط کمپریشن دے سکتا ہے — لوگو، UI گرافکس اور مارکیٹنگ الیسٹریشنز کے لیے قابلِ جانچ، بشرطیکہ انکوڈ واقعی دستیاب ہو۔",
      "یہ کنورٹر AVIF صرف تب بناتا ہے جب رن ٹائم انکوڈر کامیاب ہو۔ اگر AVIF یہاں بلاک ہے تو PNG to WebP تجویز کردہ متبادل ہے — نام بدل کر PNG AVIF نہیں بنتی۔",
    ],
    imageAlt: "شفاف PNG لوگو AVIF کنورژن کے لیے مختلف پس منظر پر شفافیت کی جانچ کے ساتھ",
  },
  comparison: {
    eyebrow: "PNG بمقابلہ AVIF",
    title: "PNG اور AVIF کا موازنہ",
    intro: "PNG کو ایڈیٹنگ ماسٹر رکھیں۔ AVIF ڈیلیوری صرف وہاں جانچیں جہاں انکوڈ کام کرے، براؤزر ڈیکوڈ کریں، اور بصری QA پاس ہو۔",
    columns: ["موازنہ", "PNG", "AVIF"],
    rows: [
      {label: "کمپریشن", png: "لاسلیس / ڈیفالٹ بڑا", avif: "جدید کوڈیک — انکوڈ کامیاب ہونے پر اکثر چھوٹا"},
      {label: "شفافیت", png: "مکمل الفا سپورٹ", avif: "الفا ممکن — کنارے چیک کریں، مکمل برابری نہ مانیں"},
      {label: "عام فائل سائز", png: "ویب پر اکثر بڑا", avif: "حقیقی اثاثوں پر اکثر مسابقتی"},
      {label: "ویب سائٹ رفتار", png: "بڑے ہونے پر LCP سست", avif: "QA کے بعد سپورٹڈ کلائنٹس پر ممکنہ فائدہ"},
      {label: "ایڈیٹنگ ورک فلو", png: "ڈیزائن ٹولز کے لیے بہترین ماسٹر", avif: "عام طور پر ڈیلیوری مشتق، ڈیزائن سورس نہیں"},
      {label: "براؤزر سپورٹ", png: "تقریباً عالمگیر", avif: "جدید انجنز پر مضبوط — ہر WebView میں نہیں"},
    ],
    explanation:
      "Figma یا Photoshop میں PNG ماسٹرز رکھیں۔ پہلے زیادہ وزٹ والے اثاثوں کا ذیلی سیٹ ٹیسٹ کریں۔ CDN اور براؤزر میٹرکس ثابت ہونے تک WebP یا PNG فال بیکس رکھیں۔",
  },
  benefits: {
    eyebrow: "تبدیلی کیوں",
    title: "AVIF کی جانچ بغیر زیادہ فروخت",
    cards: [
      {
        title: "شفافیت QA چاہیے",
        body: "AVIF الفا رکھ سکتا ہے، مگر شائع کرنے سے پہلے لوگو اور UI اوورلیز ہلکے و گہرے پس منظر پر دیکھیں۔",
        icon: "alpha",
      },
      {
        title: "سائز میں ممکنہ فائدہ",
        body: "AVIF سپورٹڈ رن ٹائمز پر PNG سے اکثر مقابلہ کرتا ہے — اپنے اثاثے ماپیں، نہ کہ فرض کریں۔",
        icon: "size",
      },
      {
        title: "کارکردگی کے تجربات",
        body: "جدید براؤزرز اور آگے دیکھنے والے CDN پر اگلی نسل کی ڈیلیوری ٹیسٹ کرنے والے ٹیموں کے لیے مفید۔",
        icon: "speed",
      },
      {
        title: "براؤزر کی حدود",
        body: "ڈیکوڈ کوریج مضبوط مگر عالمگیر نہیں۔ پرانے کلائنٹس اور embedded WebViews کے لیے فال بیک منصوبہ بنائیں۔",
        icon: "browser",
      },
      {
        title: "نجی مہمان پروسیسنگ",
        body: "فائلیں عارضی رہتی ہیں، عوامی گیلری میں نہیں جاتیں، اور برقرار رکھنے کی مدت کے بعد حذف ہوتی ہیں۔",
        icon: "privacy",
      },
      {
        title: "Fail-Closed حفاظت",
        body: "انکوڈ کام کرے تو حقیقی AVIF ڈاؤن لوڈ کریں۔ اصل PNG آپ کی ڈیوائس پر جوں کی توں رہتی ہے۔",
        icon: "safe",
      },
    ],
  },
  howTo: {
    eyebrow: "تین آسان مراحل",
    title: "PNG کو AVIF میں کیسے تبدیل کریں",
    steps: [
      {
        title: "PNG اپ لوڈ کریں",
        body: "ڈیوائس سے PNG چنیں، اپ لوڈ ایریا میں گھسیٹیں، یا کلپ بورڈ سے چسپاں کریں۔",
      },
      {
        title: "AVIF دستیابی تصدیق کریں",
        body: "شیئرڈ مہمان کنورٹ انجن چلائیں۔ اگر انکوڈر دستیاب نہیں تو ٹول fail closed ہوتا ہے۔",
      },
      {
        title: "ڈاؤن لوڈ اور QA",
        body: "ہلکے و گہرے پس منظر پر شفافیت دیکھیں، پھر مہمان سیشن درست رہتے ہوئے AVIF ڈاؤن لوڈ کریں۔",
      },
    ],
    imageAlt: "PNG اپ لوڈ، AVIF انکوڈ دستیابی کی تصدیق اور بصری QA کے بعد ڈاؤن لوڈ کے تین مراحل",
  },
  whyAvif: {
    title: "ایماندار انکوڈ گیٹس کے ساتھ جدید ڈیلیوری",
    paragraphs: [
      "ڈیزائن سسٹمز اور مارکیٹنگ سائٹس کبھی LCP حساس گرافکس کے لیے PNG ماسٹرز کے مقابلے AVIF جانچتی ہیں — صرف تب جب انکوڈ کامیاب ہو، ڈیکوڈ کوریج آپ کے سامعین سے ملے، اور بصری QA پاس ہو۔",
      "مہمان سیشنز نجی عارضی اسٹوریج استعمال کرتے ہیں، تقریباً ایک گھنٹے کی برقرار رکھنے کے ساتھ۔ جب AVIF اس ڈپلائمنٹ پر بلاک ہو تو PNG to WebP عملی جدید متبادل ہے — نام بدل کر PNG AVIF نہیں۔",
    ],
    points: [
      "رن ٹائم انکوڈر AVIF نہیں بنا سکتا تو fail closed",
      "بتدریج رول آؤٹ میں PNG to WebP تجویز کردہ فال بیک",
      "الفا کناروں، باریک ٹیکسٹ اور برانڈ نشانات کے لیے بصری QA",
      "براؤزر اور CDN سپورٹ بدل رہی — picture-element فال بیکس رکھیں",
      "شیئرڈ کنورٹ انجن، مہمان حدود اور پرائیویسی Convert Image جیسی",
      "پورا PNG لائبریری بدلنے سے پہلے ماپے ہوئے ذیلی سیٹ سے شروع کریں",
    ],
    note: "AVIF جان بوجھ کر کارکردگی کا تجربہ ہے — آپ کی برانڈ لائبریری کے ہر PNG کا فوری متبادل نہیں۔",
  },
  useCases: {
    eyebrow: "عام استعمالات",
    title: "PNG to AVIF جانچ سب سے زیادہ کہاں مدد کرتی ہے",
    cards: [
      {
        title: "ویب سائٹ لوگو",
        body: "الفا کنارے چیک کے بعد جدید براؤزرز پر ہلکے شفاف نشانات ٹیسٹ کریں۔",
      },
      {
        title: "لینڈنگ پیجز",
        body: "AVIF کو ڈیفالٹ قرار دینے سے پہلے مہمات کی الیسٹریشنز موجودہ WebP سے ماپیں۔",
      },
      {
        title: "UI گرافکس",
        body: "پروڈکٹ UI کیپچرز وہاں جانچیں جہاں سپورٹڈ کلائنٹس اور CDN پہلے سے ثابت ہیں۔",
      },
      {
        title: "آئیکنز اور الیسٹریشنز",
        body: "زیادہ وزٹ والے صفحات پر آئیکن سیٹس آزمائیں، WebP یا PNG فال بیکس برقرار رکھتے ہوئے۔",
      },
    ],
  },
  tips: {
    eyebrow: "بہتر نتائج",
    title: "کنورژن کے مشورے",
    items: [
      "اگر AVIF انکوڈ یہاں ناکام ہو تو PNG to WebP استعمال کریں، جعلی آؤٹ پٹ نہ بنوائیں۔",
      "ہلکے و گہرے پس منظر پر شفافیت دیکھیں — مکمل الفا برابری نہ مانیں۔",
      "ڈیزائن ریپو میں اصل PNG کو ایڈیٹ ایبل ماسٹر رکھیں۔",
      "بیچ پروسیسنگ سے پہلے انکوڈ تاخیر اور کیش رویے ماپیں۔",
      "براؤزر اور CDN میٹرکس ثابت ہونے تک AVIF کو WebP فال بیکس کے ساتھ جوڑیں۔",
      "اگر لے آؤٹ باکس بہت چھوٹا ہو تو کنورژن سے پہلے ری سائز کریں۔",
    ],
  },
  faqHeading: "عمومی سوالات",
  faqs: [
    {
      q: "PNG کو AVIF میں کیوں تبدیل کریں، PNG پر نہ رہیں؟",
      a: "AVIF تب جانچیں جب سپورٹڈ براؤزرز پر اگلی نسل کی کمپریشن آزمانی ہو اور شفافیت دائرے میں رہے۔ PNG کو ایڈیٹنگ ماسٹر رکھیں۔",
    },
    {
      q: "اگر AVIF انکوڈنگ اس سرور پر دستیاب نہیں؟",
      a: "ٹول fail closed ہوتا ہے۔ نام بدل کر PNG AVIF نہیں ملے گی۔ PNG to WebP تجویز کردہ متبادل ہے۔",
    },
    {
      q: "کیا PNG to WebP PNG to AVIF سے بہتر ہے؟",
      a: "ہاں جب AVIF انکوڈ بلاک ہو، براؤزر کوریج غیر یقینی ہو، یا آج وسیع سپورٹڈ جدید فارمیٹ چاہیے۔ WebP عملی بہن راستہ ہے۔",
    },
    {
      q: "کیا PNG to AVIF شفافیت مکمل محفوظ رکھتا ہے؟",
      a: "AVIF الفا رکھ سکتا ہے، مگر کناروں کی وفاداری مواد اور انکوڈر سیٹنگز پر منحصر ہے۔ پروڈکشن اثاثے بدلنے سے پہلے بصری QA کریں۔",
    },
    {
      q: "PNG کنورژن سے AVIF کون سے براؤزرز دکھا سکتے ہیں؟",
      a: "جدید Chromium، Firefox اور Safari AVIF اچھا ڈیکوڈ کرتے ہیں، مگر ہر پرانے براؤزر یا embedded WebView میں نہیں۔ فال بیک منصوبہ بنائیں۔",
    },
    {
      q: "کیا PNG to AVIF ویب لوگو اور UI گرافکس کے لیے اچھا ہے؟",
      a: "انکوڈ کامیاب ہونے اور ٹارگٹ ڈیوائسز پر الفا تصدیق کے بعد ہو سکتا ہے۔ ذیلی سیٹ سے شروع کریں اور مائگریشن میں WebP یا PNG فال بیک رکھیں۔",
    },
    {
      q: "کیا PNG to AVIF اپ لوڈز نجی اور عارضی ہیں؟",
      a: "ہاں۔ مہمان تصاویر نجی عارضی اسٹوریج استعمال کرتی ہیں اور صفحے پر دکھائی گئی برقرار رکھنے کی مدت کے مطابق خودبخود حذف ہوتی ہیں۔",
    },
    {
      q: "مہمان PNG to AVIF فائلیں کتنی دیر محفوظ رہتی ہیں؟",
      a: "مہمان فائلیں استعمال بار میں دکھائی گئی تقریباً ایک گھنٹے کی برقرار رکھنے کی پیروی کرتی ہیں۔ سیشن درست رہتے ہوئے AVIF ڈاؤن لوڈ کریں۔",
    },
    {
      q: "کیا PNG to AVIF دوسرے ٹولز جیسا ہی کنورٹ انجن استعمال کرتا ہے؟",
      a: "ہاں۔ پروسیسنگ بہن کنورٹ لینڈنگز جیسا ہی شیئرڈ مہمان کنورٹ انجن، پرائیویسی ماڈل، آپریشن حدود اور فارمیٹ میٹرکس چیک استعمال کرتی ہے۔",
    },
    {
      q: "AVIF کنورژن کے بعد اصل PNG ماسٹر کب رکھنا چاہیے؟",
      a: "ہمیشہ۔ AVIF ڈیلیوری مشتق ہے۔ ایڈیٹنگ، پرنٹ ورک فلو اور ایسے ماحول کے لیے PNG رکھیں جہاں AVIF ڈیکوڈ یا انکوڈ ابھی قابلِ اعتماد نہیں۔",
    },
  ],
  related: {
    eyebrow: "مزید ایڈیٹنگ",
    title: "متعلقہ امیج ٹولز",
    tools: [
      {href: "/png-to-webp", title: "PNG to WebP", body: "AVIF انکوڈ بلاک یا ابھی جانچ میں ہو تو تجویز کردہ جدید متبادل۔"},
      {href: "/jpg-to-avif", title: "JPG to AVIF", body: "AVIF انکوڈ دستیاب ہو تو فوٹوگرافک JPG ماسٹرز تبدیل کریں۔"},
      {href: "/compress-png", title: "Compress PNG", body: "جب لاسلیس ماسٹر فارمیٹ پر رہنا ہو تو PNG وزن کم کریں۔"},
      {href: "/convert-image", title: "Convert Image", body: "مکمل مہمان کنورٹ میٹرکس اور شیئرڈ پرائیویسی قواعد دیکھیں۔"},
      {href: "/webp-to-avif", title: "WebP to AVIF", body: "جب AVIF انکوڈ اور QA دونوں پاس ہوں تو WebP سے آگے بڑھیں۔"},
      {href: "/bulk-image-tools", title: "Bulk Convert Images", body: "سنگل فائل تصدیق کے بعد ایک مہمان ورک فلو میں کئی تصاویر پروسیس کریں۔"},
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

export function getPngToAvifCopy(locale: string): PngToAvifCopy {
  return locale === "ur" ? ur : en;
}

export function pngToAvifSeoCompat() {
  const c = en;
  return {
    intro: [
      c.hero.paragraph,
      "Guest files stay temporary and private; a new AVIF downloads only when encode succeeds — never a renamed PNG stand-in.",
      "If AVIF encoding is unavailable here, use PNG to WebP instead of expecting a fake AVIF file.",
    ].join(" "),
    why: [
      c.intro.paragraphs[0],
      c.intro.paragraphs[1],
      "Unlike JPG to AVIF or PNG to WebP, this page is for deliberate AVIF evaluation on PNG assets after visual QA.",
      c.benefits.cards[0]!.body,
      c.whyAvif.note,
    ].join(" "),
    benefits: c.benefits.cards.slice(0, 5).map((card) => ({title: card.title, body: card.body})),
    howTo: [
      "Upload a PNG image",
      "Confirm AVIF encoder availability",
      "Convert with the shared guest engine",
      "Download the AVIF after visual QA",
    ] as [string, string, string, string],
    technicalTitle: c.whyAvif.title,
    technical: [c.whyAvif.paragraphs[0], ...c.whyAvif.points.slice(0, 3), c.comparison.explanation].join(" "),
    faqs: c.faqs.slice(0, 4),
    ctaLabel: c.cta.primaryLabel,
  };
}

export type PngToAvifLocale = AppLocale;
