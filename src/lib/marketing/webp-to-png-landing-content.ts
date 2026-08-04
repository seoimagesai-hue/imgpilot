/**
 * WebP → PNG landing — editing, transparency, lossless PNG masters
 * (distinct from PNG→WebP web delivery and WebP→JPG opaque compatibility).
 */
import type {AppLocale} from "@/i18n/routing";

export type WebpToPngFaq = {q: string; a: string};

export type WebpToPngCopy = {
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
    rows: {label: string; webp: string; png: string}[];
    explanation: string;
  };
  benefits: {
    eyebrow: string;
    title: string;
    cards: {
      title: string;
      body: string;
      icon: "alpha" | "edit" | "compat" | "quality" | "privacy" | "safe";
    }[];
  };
  howTo: {
    eyebrow: string;
    title: string;
    steps: {title: string; body: string}[];
    imageAlt: string;
  };
  whyDesign: {
    title: string;
    paragraphs: string[];
    points: string[];
    highlight: {
      title: string;
      body: string;
      linkHref: "/png-to-webp";
      linkLabel: string;
    };
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
  faqs: WebpToPngFaq[];
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

const en: WebpToPngCopy = {
  metaTitle: "Convert WebP to PNG Online Free | SEO Images",
  metaDescription:
    "Convert WebP images to PNG online while preserving transparency and image quality. Fast, secure browser-based conversion with instant download.",
  h1: "Convert WebP to PNG Online",
  breadcrumbParent: {href: "/convert-image", label: "Convert Image"},
  breadcrumbCurrent: "WebP to PNG",
  hero: {
    badge: "WEBP TO PNG CONVERTER",
    paragraph:
      "Convert WebP images into PNG format while preserving image quality and transparent backgrounds whenever available. Perfect for editing, design work, presentations and software that requires PNG files.",
    trust: [
      "Transparency Supported",
      "Lossless PNG Output",
      "Private Processing",
      "No Software Required",
    ],
    uploadCta: "Upload WebP",
    heroImageAlt:
      "Browser interface converting a transparent WebP graphic into a transparent PNG with editing icons",
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
      {title: "Transparency Preserved", body: "Keep alpha so logos and UI stay cut out when present."},
      {title: "Lossless PNG", body: "Download a PNG container suited for editing and hand-offs."},
      {title: "Private Processing", body: "Uploads stay in temporary private storage."},
      {title: "Automatic File Deletion", body: "Guest files are removed after the retention countdown."},
    ],
  },
  intro: {
    eyebrow: "EDITABLE IMAGE FORMAT",
    title: "Why Convert WebP to PNG?",
    paragraphs: [
      "WebP is ideal for modern websites because of its efficient compression, but PNG is still preferred in many design applications, presentation software and editing workflows.",
      "Converting WebP to PNG creates a widely supported image format that is easier to edit while preserving transparency whenever it exists in the original image.",
      "The original WebP remains unchanged. Choose WebP to JPG only when you intentionally want an opaque photo-style file instead.",
    ],
    imageAlt:
      "Transparent WebP image converted into a transparent PNG with editing icons and checkerboard alpha",
  },
  comparison: {
    eyebrow: "WEBP VS PNG",
    title: "How WebP and PNG Compare",
    intro:
      "Keep WebP for public delivery. Convert to PNG when the next step is editing, presenting or handing assets to tools that expect PNG.",
    columns: ["Compare", "WebP", "PNG"],
    rows: [
      {label: "Transparency", webp: "Supported for still images", png: "Full alpha support"},
      {label: "Compression", webp: "Efficient modern web compression", png: "Often larger lossless files"},
      {label: "Editing Support", webp: "Improving, not always primary", png: "Excellent for design work"},
      {label: "File Size", webp: "Usually smaller for the web", png: "Often grows after conversion"},
      {label: "Quality", webp: "May already be lossy", png: "Lossless PNG output container"},
      {label: "Website Usage", webp: "Best for modern delivery", png: "Use after editing, then re-optimize"},
      {
        label: "Design Software Support",
        webp: "Not universal in every tool",
        png: "Widely supported in Photoshop, Figma and more",
      },
    ],
    explanation:
      "WebP to PNG is for editing and compatibility — not for guaranteed smaller downloads. Size can grow; that is expected when you need a PNG hand-off.",
  },
  benefits: {
    eyebrow: "WHY CONVERT",
    title: "Editable Transparent PNGs From WebP",
    cards: [
      {
        title: "Transparency Preserved",
        body: "Keep see-through backgrounds for logos, icons and UI overlays whenever alpha exists.",
        icon: "alpha",
      },
      {
        title: "Easy Editing",
        body: "Open the PNG in the design and presentation tools your team already uses.",
        icon: "edit",
      },
      {
        title: "Lossless Image Quality",
        body: "Get a PNG output suited for further editing without inventing a new lossy pass for delivery.",
        icon: "quality",
      },
      {
        title: "Universal Design Software Support",
        body: "PNG remains one of the most reliable formats for Photoshop, Figma and similar apps.",
        icon: "compat",
      },
      {
        title: "Private Processing",
        body: "Files remain temporary and are not published to a public gallery.",
        icon: "privacy",
      },
      {
        title: "Original File Protected",
        body: "Download a new PNG. Your original WebP stays unchanged on your device.",
        icon: "safe",
      },
    ],
  },
  howTo: {
    eyebrow: "THREE SIMPLE STEPS",
    title: "How to Convert WebP to PNG",
    steps: [
      {
        title: "Upload WebP",
        body: "Choose a WebP from your device, drag it into the upload area or paste it from your clipboard.",
      },
      {
        title: "Convert",
        body: "Confirm PNG as the target and run conversion with the shared guest convert engine.",
      },
      {
        title: "Download PNG",
        body: "Preview transparency, then download the PNG for editing or presentations.",
      },
    ],
    imageAlt: "Three steps for uploading WebP, converting to PNG and downloading the result",
  },
  whyDesign: {
    title: "When PNG Is the Better Choice",
    paragraphs: [
      "Choose PNG when the next human or tool in your workflow still expects a transparent, widely editable raster file.",
      "Converting once into PNG keeps cutouts usable in design comps without flattening assets the way WebP to JPG would.",
    ],
    points: [
      "Graphic design hand-offs that still standardize on PNG",
      "Photoshop editing of logos, overlays and marketing art",
      "Figma workflows that import transparent raster assets",
      "Logo refinements before shipping a new web derivative",
      "Icon packs and UI assets that need alpha",
      "Screenshots prepared for docs or presentations",
      "Transparent graphics that must not become opaque JPG boxes",
    ],
    highlight: {
      title: "Need smaller website images?",
      body: "Convert PNG back to WebP after editing so production pages stay fast.",
      linkHref: "/png-to-webp",
      linkLabel: "Convert PNG to WebP",
    },
  },
  useCases: {
    eyebrow: "COMMON USE CASES",
    title: "Where WebP to PNG Helps Most",
    cards: [
      {
        title: "Graphic Design",
        body: "Bring web-delivered WebP art into design tools for redesign and layout work.",
      },
      {
        title: "Logos",
        body: "Turn transparent WebP marks into PNG masters for editing and brand kits.",
      },
      {
        title: "UI Assets",
        body: "Prepare icons, overlays and product UI graphics that still need alpha.",
      },
      {
        title: "Presentations",
        body: "Drop PNG slides and decks into tools that handle PNG more reliably than WebP.",
      },
    ],
  },
  tips: {
    eyebrow: "BETTER RESULTS",
    title: "Conversion Tips",
    items: [
      "Keep transparency when logos and UI still need a cutout.",
      "Edit the PNG before converting back to WebP for the public site.",
      "Keep the original WebP if it remains your production delivery file.",
      "Resize only when the layout box truly requires different dimensions.",
      "Compress after editing if the PNG hand-off is too heavy for email.",
      "Use WebP again for websites once design work is finished.",
    ],
  },
  faqHeading: "Frequently Asked Questions",
  faqs: [
    {
      q: "Why convert WebP to PNG?",
      a: "Use PNG when design apps, presentations or partners need a transparent, widely editable file instead of a web-optimized WebP.",
    },
    {
      q: "Does PNG preserve transparency from WebP?",
      a: "Yes for supported still-image alpha paths. Always preview logos and overlays on light and dark backgrounds before handing files off.",
    },
    {
      q: "Will image quality change when converting WebP to PNG?",
      a: "You get a PNG container suitable for editing. Conversion cannot invent detail removed by an earlier lossy WebP encode.",
    },
    {
      q: "Can I edit PNG more easily than WebP?",
      a: "Usually yes. PNG remains one of the most reliable transparent formats for Photoshop, Figma, Illustrator and similar workflows.",
    },
    {
      q: "Are WebP to PNG uploads private?",
      a: "Guest images use private temporary storage and are deleted automatically according to the retention countdown on the page.",
    },
    {
      q: "What are the guest limits for WebP to PNG?",
      a: "Free guest operations and maximum file size appear in the usage bar above the uploader. Higher limits may require an account.",
    },
    {
      q: "What is the maximum upload size for WebP to PNG?",
      a: "The maximum size matches the guest upload limit shown in the usage bar. Oversized files are rejected before conversion starts.",
    },
    {
      q: "What is the difference between PNG and WebP for editing workflows?",
      a: "WebP is usually better for smaller website delivery. PNG is better for editing, design software support and transparent asset hand-offs.",
    },
    {
      q: "Can I convert logos from WebP to PNG?",
      a: "Yes — this landing is built for logos, icons and UI graphics that still need transparency.",
    },
    {
      q: "Will the original WebP image change?",
      a: "No. The converter creates a new PNG download. Your original WebP stays unchanged on your device.",
    },
  ],
  related: {
    eyebrow: "CONTINUE EDITING",
    title: "Related Image Tools",
    tools: [
      {href: "/png-to-webp", title: "PNG to WebP", body: "Ship smaller transparent assets back to the web."},
      {href: "/png-to-jpg", title: "PNG to JPG", body: "Flatten transparency when partners need classic JPG."},
      {href: "/webp-to-jpg", title: "WebP to JPG", body: "Create opaque JPG files for documents and CMS uploads."},
      {href: "/resize-png", title: "Resize PNG", body: "Fit the new PNG to the layout box you need."},
      {href: "/compress-png", title: "Compress PNG", body: "Reduce PNG weight after conversion or editing."},
      {href: "/bulk-image-tools", title: "Bulk Convert Images", body: "Process several images in one guest workflow."},
    ],
  },
  cta: {
    title: "Ready to Convert Another WebP?",
    body: "Upload another WebP image or create a free account for additional image tools and higher usage limits.",
    primaryLabel: "Convert Another Image",
    secondaryLabel: "Create Free Account",
    secondaryHref: "/register",
  },
};

const ur: WebpToPngCopy = {
  metaTitle: "آن لائن WebP کو PNG میں تبدیل کریں مفت | SEO Images",
  metaDescription:
    "شفافیت اور امیج کوالٹی برقرار رکھتے ہوئے WebP تصاویر آن لائن PNG میں تبدیل کریں۔ تیز، محفوظ براؤزر پر مبنی کنورژن فوری ڈاؤن لوڈ کے ساتھ۔",
  h1: "آن لائن WebP کو PNG میں تبدیل کریں",
  breadcrumbParent: {href: "/convert-image", label: "تصویر تبدیل کریں"},
  breadcrumbCurrent: "WebP to PNG",
  hero: {
    badge: "WEBP TO PNG CONVERTER",
    paragraph:
      "جب دستیاب ہو تو امیج کوالٹی اور شفاف پس منظر برقرار رکھتے ہوئے WebP تصاویر کو PNG میں تبدیل کریں۔ ایڈیٹنگ، ڈیزائن ورک، پریزنٹیشنز اور وہ سافٹ ویئر جنہیں PNG درکار ہو، سب کے لیے موزوں۔",
    trust: ["شفافیت سپورٹڈ", "لاسلیس PNG آؤٹ پٹ", "نجی پروسیسنگ", "سافٹ ویئر کی ضرورت نہیں"],
    uploadCta: "WebP اپ لوڈ کریں",
    heroImageAlt: "براؤزر میں شفاف WebP گرافک کو ایڈیٹنگ آئیکنز کے ساتھ شفاف PNG میں تبدیل کرتے ہوئے",
  },
  guestBar: {
    title: "مہمان استعمال",
    deletionTitle: "خودکار حذف",
    countdownLabel: "عارضی فائلیں خود بخود حذف ہوں گی",
  },
  upload: {
    heading: "WebP تصویر اپ لوڈ کریں",
    supporting: "WebP گھسیٹیں، کلپ بورڈ سے چسپاں کریں یا اپنی ڈیوائس سے چنیں۔",
    chooseLabel: "WebP چنیں",
    formatsHint: "WebP · زیادہ سے زیادہ فائل سائز اوپر دکھائی گئی مہمان حد کے مطابق",
    features: [
      {title: "شفافیت محفوظ", body: "جب الفا موجود ہو تو لوگو اور UI کٹ آؤٹ رہتے ہیں۔"},
      {title: "لاسلیس PNG", body: "ایڈیٹنگ اور ہینڈ آف کے لیے موزوں PNG کنٹینر ڈاؤن لوڈ کریں۔"},
      {title: "نجی پروسیسنگ", body: "اپ لوڈز عارضی نجی اسٹوریج میں رہتی ہیں۔"},
      {title: "خودکار فائل حذف", body: "برقرار رکھنے کی مدت کے بعد مہمان فائلیں ہٹ جاتی ہیں۔"},
    ],
  },
  intro: {
    eyebrow: "ایڈیٹ ایبل امیج فارمیٹ",
    title: "WebP کو PNG میں کیوں تبدیل کریں؟",
    paragraphs: [
      "WebP مؤثر کمپریشن کی وجہ سے جدید ویب سائٹس کے لیے مثالی ہے، مگر PNG اب بھی بہت سی ڈیزائن ایپلیکیشنز، پریزنٹیشن سافٹ ویئر اور ایڈیٹنگ ورک فلوز میں ترجیح دی جاتی ہے۔",
      "WebP کو PNG میں بدلنے سے وسیع سپورٹ والا فارمیٹ بنتا ہے جسے ایڈٹ کرنا آسان ہوتا ہے اور جب اصل تصویر میں شفافیت ہو تو وہ محفوظ رہتی ہے۔",
      "اصل WebP جوں کی توں رہتی ہے۔ صرف تب WebP to JPG چنیں جب جان بوجھ کر غیر شفاف فوٹو اسٹائل فائل چاہیے۔",
    ],
    imageAlt: "شفاف WebP کو شفاف PNG میں تبدیل کرتے ہوئے، ایڈیٹنگ آئیکنز اور چیکربورڈ الفا کے ساتھ",
  },
  comparison: {
    eyebrow: "WebP بمقابلہ PNG",
    title: "WebP اور PNG کا موازنہ",
    intro:
      "عوامی ڈیلیوری کے لیے WebP رکھیں۔ جب اگلا قدم ایڈیٹنگ، پریزنٹیشن یا PNG چاہنے والے ٹولز ہوں تو PNG میں تبدیل کریں۔",
    columns: ["موازنہ", "WebP", "PNG"],
    rows: [
      {label: "شفافیت", webp: "اسٹل امیجز کے لیے سپورٹڈ", png: "مکمل الفا سپورٹ"},
      {label: "کمپریشن", webp: "مؤثر جدید ویب کمپریشن", png: "اکثر بڑی لاسلیس فائلیں"},
      {label: "ایڈیٹنگ سپورٹ", webp: "بہتری، ہمیشہ بنیادی نہیں", png: "ڈیزائن ورک کے لیے بہترین"},
      {label: "فائل سائز", webp: "ویب کے لیے عموماً چھوٹا", png: "کنورژن کے بعد اکثر بڑھتا ہے"},
      {label: "کوالٹی", webp: "پہلے سے لاسی ہو سکتا ہے", png: "لاسلیس PNG آؤٹ پٹ کنٹینر"},
      {label: "ویب سائٹ استعمال", webp: "جدید ڈیلیوری کے لیے بہترین", png: "ایڈیٹنگ کے بعد دوبارہ آپٹمائز کریں"},
      {
        label: "ڈیزائن سافٹ ویئر سپورٹ",
        webp: "ہر ٹول میں عالمگیر نہیں",
        png: "Photoshop، Figma وغیرہ میں وسیع سپورٹ",
      },
    ],
    explanation:
      "WebP to PNG ایڈیٹنگ اور مطابقت کے لیے ہے — چھوٹی ڈاؤن لوڈز کی ضمانت نہیں۔ سائز بڑھ سکتا ہے؛ جب PNG ہینڈ آف چاہیے تو یہ متوقع ہے۔",
  },
  benefits: {
    eyebrow: "تبدیلی کیوں",
    title: "WebP سے ایڈیٹ ایبل شفاف PNGs",
    cards: [
      {
        title: "شفافیت محفوظ",
        body: "جب الفا موجود ہو تو لوگو، آئیکنز اور UI اوورلیز کے لیے شفاف پس منظر رکھیں۔",
        icon: "alpha",
      },
      {
        title: "آسان ایڈیٹنگ",
        body: "PNG کو ان ڈیزائن اور پریزنٹیشن ٹولز میں کھولیں جو ٹیم پہلے سے استعمال کرتی ہے۔",
        icon: "edit",
      },
      {
        title: "لاسلیس امیج کوالٹی",
        body: "مزید ایڈیٹنگ کے لیے موزوں PNG حاصل کریں بغیر صرف ڈیلیوری کے لیے نیا لاسی پاس بنانے کے۔",
        icon: "quality",
      },
      {
        title: "عالمگیر ڈیزائن سافٹ ویئر سپورٹ",
        body: "PNG Photoshop، Figma اور ملتے جلتے ایپس کے لیے قابل اعتماد فارمیٹس میں سے ہے۔",
        icon: "compat",
      },
      {
        title: "نجی پروسیسنگ",
        body: "فائلیں عارضی رہتی ہیں اور عوامی گیلری میں نہیں جاتیں۔",
        icon: "privacy",
      },
      {
        title: "اصل فائل محفوظ",
        body: "نئی PNG ڈاؤن لوڈ کریں۔ اصل WebP آپ کی ڈیوائس پر جوں کی توں رہتی ہے۔",
        icon: "safe",
      },
    ],
  },
  howTo: {
    eyebrow: "تین آسان مراحل",
    title: "WebP کو PNG میں کیسے تبدیل کریں",
    steps: [
      {
        title: "WebP اپ لوڈ کریں",
        body: "ڈیوائس سے WebP چنیں، اپ لوڈ ایریا میں گھسیٹیں، یا کلپ بورڈ سے چسپاں کریں۔",
      },
      {
        title: "تبدیل کریں",
        body: "ٹارگٹ PNG تصدیق کریں اور شیئرڈ مہمان کنورٹ انجن چلائیں۔",
      },
      {
        title: "PNG ڈاؤن لوڈ کریں",
        body: "شفافیت دیکھیں، پھر ایڈیٹنگ یا پریزنٹیشنز کے لیے PNG ڈاؤن لوڈ کریں۔",
      },
    ],
    imageAlt: "WebP اپ لوڈ، PNG کنورژن اور ڈاؤن لوڈ کے تین مراحل",
  },
  whyDesign: {
    title: "PNG کب بہتر انتخاب ہے",
    paragraphs: [
      "جب آپ کے ورک فلو کا اگلا شخص یا ٹول اب بھی شفاف، وسیع ایڈیٹ ایبل raster فائل چاہے تو PNG چنیں۔",
      "ایک بار PNG میں بدلنے سے ڈیزائن comps میں کٹ آؤٹس قابل استعمال رہتے ہیں — WebP to JPG کی طرح فلیٹن نہیں ہوتے۔",
    ],
    points: [
      "گرافک ڈیزائن ہینڈ آفس جو اب بھی PNG پر معیاری ہیں",
      "Photoshop میں لوگو، اوورلیز اور مارکیٹنگ آرٹ ایڈیٹنگ",
      "Figma ورک فلوز جو شفاف raster اثاثے امپورٹ کرتے ہیں",
      "نیا ویب ڈیریویٹو بھیجنے سے پہلے لوگو ریفائنمنٹ",
      "آئیکن پیکس اور UI اثاثے جنہیں الفا چاہیے",
      "دستاویزات یا پریزنٹیشنز کے لیے اسکرین شاٹس",
      "شفاف گرافکس جو غیر شفاف JPG باکس نہ بنیں",
    ],
    highlight: {
      title: "چھوٹی ویب سائٹ امیجز درکار ہیں؟",
      body: "ایڈیٹنگ کے بعد PNG کو واپس WebP میں تبدیل کریں تاکہ پروڈکشن صفحات تیز رہیں۔",
      linkHref: "/png-to-webp",
      linkLabel: "PNG کو WebP میں تبدیل کریں",
    },
  },
  useCases: {
    eyebrow: "عام استعمالات",
    title: "WebP to PNG سب سے زیادہ کہاں مدد کرتا ہے",
    cards: [
      {
        title: "گرافک ڈیزائن",
        body: "ویب سے ملنے والی WebP آرٹ کو ری ڈیزائن اور لے آؤٹ کے لیے ڈیزائن ٹولز میں لائیں۔",
      },
      {
        title: "لوگو",
        body: "شفاف WebP نشانوں کو ایڈیٹنگ اور برانڈ کٹس کے لیے PNG ماسٹرز بنائیں۔",
      },
      {
        title: "UI اثاثے",
        body: "آئیکنز، اوورلیز اور پروڈکٹ UI گرافکس تیار کریں جنہیں اب بھی الفا چاہیے۔",
      },
      {
        title: "پریزنٹیشنز",
        body: "ایسے ٹولز میں PNG سلائیڈز ڈالیں جو WebP سے بہتر PNG سنبھالتے ہیں۔",
      },
    ],
  },
  tips: {
    eyebrow: "بہتر نتائج",
    title: "کنورژن کے مشورے",
    items: [
      "جب لوگو اور UI کو کٹ آؤٹ چاہیے تو شفافیت رکھیں۔",
      "عوامی سائٹ کے لیے WebP واپس بنانے سے پہلے PNG ایڈٹ کریں۔",
      "اگر WebP اب بھی پروڈکشن ڈیلیوری ہے تو اصل WebP رکھیں۔",
      "صرف تب ری سائز کریں جب لے آؤٹ باکس واقعی مختلف ابعاد مانگے۔",
      "اگر PNG ہینڈ آف ای میل کے لیے بھاری ہو تو ایڈیٹنگ کے بعد کمپریس کریں۔",
      "ڈیزائن ورک ختم ہونے کے بعد ویب سائٹس کے لیے دوبارہ WebP استعمال کریں۔",
    ],
  },
  faqHeading: "عمومی سوالات",
  faqs: [
    {
      q: "WebP کو PNG میں کیوں تبدیل کریں؟",
      a: "جب ڈیزائن ایپس، پریزنٹیشنز یا پارٹنرز کو شفاف، وسیع ایڈیٹ ایبل فائل چاہیے بجائے ویب آپٹیمائزڈ WebP کے، تو PNG استعمال کریں۔",
    },
    {
      q: "کیا PNG، WebP سے شفافیت محفوظ رکھتا ہے؟",
      a: "سپورٹڈ اسٹل امیج الفا راستوں پر ہاں۔ فائلیں دینے سے پہلے لوگو اور اوورلیز ہلکے و گہرے پس منظر پر دیکھیں۔",
    },
    {
      q: "کیا WebP to PNG سے امیج کوالٹی بدلتی ہے؟",
      a: "آپ کو ایڈیٹنگ کے لیے موزوں PNG کنٹینر ملتا ہے۔ کنورژن پہلے والے لاسی WebP encode سے ہٹائی گئی تفصیل ایجاد نہیں کر سکتا۔",
    },
    {
      q: "کیا PNG کو WebP سے زیادہ آسان ایڈٹ کیا جا سکتا ہے؟",
      a: "عمومی طور پر ہاں۔ PNG Photoshop، Figma، Illustrator اور ملتے جلتے ورک فلوز کے لیے قابل اعتماد شفاف فارمیٹس میں سے ہے۔",
    },
    {
      q: "کیا WebP to PNG اپ لوڈز نجی ہیں؟",
      a: "مہمان تصاویر نجی عارضی اسٹوریج استعمال کرتی ہیں اور صفحے پر دکھائی گئی برقرار رکھنے کی مدت کے مطابق خودبخود حذف ہوتی ہیں۔",
    },
    {
      q: "WebP to PNG کی مہمان حدود کیا ہیں؟",
      a: "مفت مہمان آپریشنز اور زیادہ سے زیادہ فائل سائز اپ لوڈر کے اوپر استعمال بار میں نظر آتی ہیں۔ اعلیٰ حدود کے لیے اکاؤنٹ درکار ہو سکتا ہے۔",
    },
    {
      q: "WebP to PNG کی زیادہ سے زیادہ اپ لوڈ سائز کیا ہے؟",
      a: "زیادہ سے زیادہ سائز استعمال بار میں دکھائی گئی مہمان اپ لوڈ حد کے برابر ہے۔ بڑی فائلیں کنورژن سے پہلے مسترد ہوتی ہیں۔",
    },
    {
      q: "ایڈیٹنگ ورک فلوز کے لیے PNG اور WebP میں کیا فرق ہے؟",
      a: "WebP عموماً چھوٹی ویب سائٹ ڈیلیوری کے لیے بہتر ہے۔ PNG ایڈیٹنگ، ڈیزائن سافٹ ویئر سپورٹ اور شفاف اثاثہ ہینڈ آفس کے لیے بہتر ہے۔",
    },
    {
      q: "کیا لوگو WebP سے PNG میں تبدیل ہو سکتے ہیں؟",
      a: "ہاں — یہ لینڈنگ لوگو، آئیکنز اور UI گرافکس کے لیے ہے جنہیں اب بھی شفافیت چاہیے۔",
    },
    {
      q: "کیا اصل WebP تصویر بدل جائے گی؟",
      a: "نہیں۔ کنورٹر نئی PNG ڈاؤن لوڈ بناتا ہے۔ اصل WebP آپ کی ڈیوائس پر جوں کی توں رہتی ہے۔",
    },
  ],
  related: {
    eyebrow: "مزید ایڈیٹنگ",
    title: "متعلقہ امیج ٹولز",
    tools: [
      {href: "/png-to-webp", title: "PNG to WebP", body: "شفاف اثاثے دوبارہ ویب کے لیے چھوٹے کریں۔"},
      {href: "/png-to-jpg", title: "PNG to JPG", body: "جب پارٹنرز کلاسیک JPG چاہیں تو شفافیت فلیٹن کریں۔"},
      {href: "/webp-to-jpg", title: "WebP to JPG", body: "دستاویزات اور CMS اپ لوڈز کے لیے غیر شفاف JPG بنائیں۔"},
      {href: "/resize-png", title: "Resize PNG", body: "نئی PNG کو درکار لے آؤٹ باکس پر فٹ کریں۔"},
      {href: "/compress-png", title: "Compress PNG", body: "کنورژن یا ایڈیٹنگ کے بعد PNG وزن کم کریں۔"},
      {href: "/bulk-image-tools", title: "Bulk Convert Images", body: "ایک مہمان ورک فلو میں کئی تصاویر پروسیس کریں۔"},
    ],
  },
  cta: {
    title: "ایک اور WebP تبدیل کریں؟",
    body: "ایک اور WebP تصویر اپ لوڈ کریں یا اضافی امیج ٹولز اور اعلیٰ استعمال کی حدود کے لیے مفت اکاؤنٹ بنائیں۔",
    primaryLabel: "ایک اور تصویر تبدیل کریں",
    secondaryLabel: "مفت اکاؤنٹ بنائیں",
    secondaryHref: "/register",
  },
};

export function getWebpToPngCopy(locale: string): WebpToPngCopy {
  return locale === "ur" ? ur : en;
}

export function webpToPngSeoCompat() {
  const c = en;
  return {
    intro: [
      c.hero.paragraph,
      "Guest sessions stay private on temporary storage, and the download is a new PNG rather than an overwrite of your original WebP.",
      "This landing focuses on editing, transparency and lossless PNG masters — not web-weight reduction the way PNG to WebP does.",
    ].join(" "),
    why: [
      c.intro.paragraphs[0],
      c.intro.paragraphs[1],
      "Unlike WebP to JPG (opaque compatibility) or PNG to WebP (smaller web delivery), WebP to PNG is for logos, icons and UI assets that must stay editable.",
      c.benefits.cards[1]!.body,
      c.whyDesign.highlight.body,
    ].join(" "),
    benefits: c.benefits.cards.map((card) => ({title: card.title, body: card.body})),
    howTo: [
      "Upload a WebP image",
      "Confirm PNG as the target format",
      "Convert with the guest engine",
      "Download the PNG file",
    ] as [string, string, string, string],
    technicalTitle: c.whyDesign.title,
    technical: [...c.whyDesign.paragraphs, ...c.whyDesign.points.slice(0, 4), c.comparison.explanation].join(" "),
    faqs: c.faqs,
    ctaLabel: c.cta.primaryLabel,
  };
}

export type WebpToPngLocale = AppLocale;
