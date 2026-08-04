/**
 * Compress PNG landing — transparency / logos / UI focus (distinct from Compress JPG).
 */
import type {AppLocale} from "@/i18n/routing";

export type CompressPngFaq = {q: string; a: string};

export type CompressPngCopy = {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  breadcrumbParent: {href: "/compress-image"; label: string};
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
  benefits: {
    eyebrow: string;
    title: string;
    cards: {
      title: string;
      body: string;
      icon: "transparency" | "sharp" | "size" | "privacy" | "browser" | "safe";
    }[];
  };
  howTo: {
    eyebrow: string;
    title: string;
    steps: {title: string; body: string}[];
    imageAlt: string;
  };
  useCases: {
    eyebrow: string;
    title: string;
    cards: {title: string; body: string}[];
  };
  explainer: {
    title: string;
    points: string[];
    tableCaption: string;
    formats: {name: string; rows: string[]}[];
  };
  tips: {
    eyebrow: string;
    title: string;
    items: string[];
  };
  faqHeading: string;
  faqs: CompressPngFaq[];
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

const en: CompressPngCopy = {
  metaTitle: "Compress PNG Images Online Free | SEO Images",
  metaDescription:
    "Compress PNG images online while preserving transparency. Reduce PNG file size securely and download an optimized image in seconds.",
  h1: "Compress PNG Images Online",
  breadcrumbParent: {href: "/compress-image", label: "Compress Image"},
  hero: {
    badge: "PNG IMAGE COMPRESSOR",
    paragraph:
      "Reduce PNG image file size without sacrificing transparency or image clarity. Upload your PNG, choose your preferred compression settings and download an optimized image ready for websites, online stores, apps and presentations.",
    trust: [
      "Supports transparency",
      "No software required",
      "Secure temporary processing",
      "Original image stays unchanged",
    ],
    uploadCta: "Upload PNG Image",
    heroImageAlt: "PNG compression interface showing a transparent logo and a smaller optimized file",
  },
  guestBar: {
    title: "Guest usage",
    deletionTitle: "Automatic deletion",
    countdownLabel: "Temporary files delete automatically in",
  },
  upload: {
    heading: "Upload a PNG Image",
    supporting: "Drag and drop a PNG image, paste it from your clipboard or browse your device.",
    chooseLabel: "Choose PNG",
    formatsHint: "PNG · Maximum file size follows guest limits shown above",
    features: [
      {title: "Private Processing", body: "Uploads stay in temporary private storage."},
      {title: "Transparency Preserved", body: "Alpha channels are kept when the PNG has transparency."},
      {title: "Automatic File Deletion", body: "Guest files are removed after the retention countdown."},
      {title: "No Signup Required", body: "Use the free guest allowance without creating an account."},
    ],
  },
  intro: {
    eyebrow: "LOSSLESS PNG OPTIMIZATION",
    title: "Compress PNG Images While Keeping Transparency",
    paragraphs: [
      "PNG files are ideal for logos, screenshots, interface graphics and illustrations because they support transparent backgrounds and sharp image quality. However, PNG images are often significantly larger than JPG files.",
      "This PNG compressor reduces unnecessary file data while preserving transparency whenever possible. The result is a smaller PNG that's easier to upload, store and publish online.",
      "The tool creates a new optimized PNG. Your original file remains unchanged on your device.",
    ],
    imageAlt: "Before and after PNG optimization with transparent backgrounds preserved",
  },
  benefits: {
    eyebrow: "WHY COMPRESS PNG",
    title: "Optimized PNGs for Logos, UI and Screenshots",
    cards: [
      {
        title: "Transparent Backgrounds",
        body: "PNG transparency remains intact so logos and overlays still sit cleanly on any page colour.",
        icon: "transparency",
      },
      {
        title: "Sharper Graphics",
        body: "Ideal for logos, icons and interface elements where crisp edges matter more than photo grain.",
        icon: "sharp",
      },
      {
        title: "Smaller File Sizes",
        body: "Reduce storage use, upload time and page weight without leaving the PNG format.",
        icon: "size",
      },
      {
        title: "Private Processing",
        body: "Guest files use temporary secure storage and are not published to a public gallery.",
        icon: "privacy",
      },
      {
        title: "No Software",
        body: "Compress PNGs entirely in a modern web browser on desktop, tablet or mobile.",
        icon: "browser",
      },
      {
        title: "Original Protected",
        body: "You download a new optimized PNG. The original image on your device is not overwritten.",
        icon: "safe",
      },
    ],
  },
  howTo: {
    eyebrow: "THREE SIMPLE STEPS",
    title: "How to Compress a PNG Image",
    steps: [
      {
        title: "Upload PNG",
        body: "Choose a PNG from your device, drag it into the upload area or paste it from your clipboard.",
      },
      {
        title: "Compress",
        body: "Select a compression preset or adjust strength, then process the image with a live preview.",
      },
      {
        title: "Download",
        body: "Save the smaller PNG while keeping transparency and leaving your original file unchanged.",
      },
    ],
    imageAlt: "Three steps for uploading, compressing and downloading a transparent PNG",
  },
  useCases: {
    eyebrow: "BEST USE CASES",
    title: "When PNG Compression Helps Most",
    cards: [
      {
        title: "Company Logos",
        body: "Shrink brand marks and lockups for headers, emails and downloads without losing clear edges.",
      },
      {
        title: "Website Icons",
        body: "Keep icon sets sharp while cutting bytes that slow menus, footers and feature grids.",
      },
      {
        title: "App UI Assets",
        body: "Optimize buttons, badges and interface chrome destined for product marketing or help centres.",
      },
      {
        title: "Screenshots",
        body: "Reduce heavy screen captures for documentation, changelogs and support articles.",
      },
    ],
  },
  explainer: {
    title: "Why PNG Files Are Larger Than JPG",
    points: [
      "PNG often uses lossless compression that retains more pixel detail.",
      "Transparency adds an alpha channel that JPG cannot store.",
      "Sharp edges in logos and UI art resist heavy lossy shortcuts.",
      "PNG is usually better for graphics; JPG is usually better for photographs.",
      "Those strengths are why PNGs are frequently larger before optimization.",
    ],
    tableCaption: "Quick format comparison",
    formats: [
      {
        name: "PNG",
        rows: ["Supports transparency", "Lossless-friendly", "Better for logos", "Larger files"],
      },
      {
        name: "JPG",
        rows: ["No transparency", "Lossy", "Better for photos", "Smaller files"],
      },
      {
        name: "WebP",
        rows: ["Supports transparency", "Modern compression", "Smaller files", "Best for many websites"],
      },
    ],
  },
  tips: {
    eyebrow: "BETTER RESULTS",
    title: "PNG Optimization Tips",
    items: [
      "Keep transparency only when the design needs a see-through background.",
      "Use PNG for graphics and screenshots instead of photographic scenes.",
      "Resize oversized images first when full pixel dimensions are not required.",
      "Convert to WebP for modern websites when the destination supports it.",
      "Compress before uploading to CMSs, stores and app consoles.",
    ],
  },
  faqHeading: "Frequently Asked Questions",
  faqs: [
    {
      q: "Does PNG compression remove transparency?",
      a: "This page keeps the PNG container and aims to preserve transparency when it is present. Always preview logos and overlays before publishing.",
    },
    {
      q: "Is PNG better than JPG?",
      a: "PNG is usually better for logos, screenshots and UI graphics. JPG is usually better for photographs. Choose based on the content, not just the file extension.",
    },
    {
      q: "Can PNG quality decrease after compression?",
      a: "PNG compression on this tool focuses on reducing file weight. Preview important edges and text after processing so you can confirm the result still looks sharp.",
    },
    {
      q: "Can I compress logos with this tool?",
      a: "Yes. PNG compression is well suited to logos and marks, especially when you need a transparent background.",
    },
    {
      q: "Can screenshots be compressed?",
      a: "Yes. Screenshots are a common PNG use case. Large captures often shrink meaningfully after compression, and resizing first can help even more.",
    },
    {
      q: "Is the original PNG overwritten?",
      a: "No. A new optimized PNG is created for download. The original file on your device remains unchanged.",
    },
    {
      q: "Are uploaded PNG files private?",
      a: "Guest images use private temporary storage and are deleted automatically according to the retention countdown on the page. They are not published in a public gallery.",
    },
    {
      q: "Can guests compress PNG images without an account?",
      a: "Yes. Free guest operations are available without signing in. Higher limits and project history may require an account.",
    },
    {
      q: "What is the maximum PNG upload size?",
      a: "The maximum size follows the guest policy shown in the usage bar on this page. Large files above that limit should be resized or split before upload.",
    },
    {
      q: "What is the difference between PNG and WebP?",
      a: "Both can support transparency. WebP often produces smaller files for web delivery, while PNG remains widely compatible for design handoff and many CMS workflows.",
    },
  ],
  related: {
    eyebrow: "CONTINUE EDITING",
    title: "Related PNG Tools",
    tools: [
      {href: "/compress-jpg", title: "Compress JPG", body: "Reduce the file size of photographic JPG images."},
      {href: "/resize-png", title: "Resize PNG", body: "Change PNG width and height before or after compression."},
      {href: "/png-to-jpg", title: "PNG to JPG", body: "Convert PNG graphics into JPG when transparency is not required."},
      {href: "/png-to-webp", title: "PNG to WebP", body: "Create a modern WebP version for website delivery."},
      {href: "/crop-png", title: "Crop PNG", body: "Trim unwanted areas from a PNG image."},
      {
        href: "/bulk-image-tools",
        title: "Bulk Compress Images",
        body: "Compress several images in one workflow.",
      },
    ],
  },
  cta: {
    title: "Ready to Optimize Another PNG?",
    body: "Upload another PNG or create a free account for higher limits and project history.",
    primaryLabel: "Compress Another PNG",
    secondaryLabel: "Create Free Account",
    secondaryHref: "/register",
  },
};

const ur: CompressPngCopy = {
  metaTitle: "آن لائن PNG تصاویر کمپریس کریں مفت | SEO Images",
  metaDescription:
    "شفافیت برقرار رکھتے ہوئے آن لائن PNG تصاویر کمپریس کریں۔ فائل سائز محفوظ طریقے سے کم کریں اور چند سیکنڈز میں آپٹیمائزڈ تصویر ڈاؤن لوڈ کریں۔",
  h1: "آن لائن PNG تصاویر کمپریس کریں",
  breadcrumbParent: {href: "/compress-image", label: "تصویر کمپریس کریں"},
  hero: {
    badge: "PNG امیج کمپریسر",
    paragraph:
      "شفافیت یا تصویری وضاحت قربان کیے بغیر PNG فائل سائز کم کریں۔ اپنی PNG اپ لوڈ کریں، کمپریشن سیٹنگز چنیں، اور ویب سائٹس، آن لائن اسٹورز، ایپس اور پریزنٹیشنز کے لیے تیار آپٹیمائزڈ تصویر ڈاؤن لوڈ کریں۔",
    trust: [
      "شفافیت کی سپورٹ",
      "سافٹ ویئر درکار نہیں",
      "محفوظ عارضی پروسیسنگ",
      "اصل تصویر جوں کی توں",
    ],
    uploadCta: "PNG تصویر اپ لوڈ کریں",
    heroImageAlt: "شفاف لوگو اور چھوٹی آپٹیمائزڈ فائل دکھاتا PNG کمپریشن انٹرفیس",
  },
  guestBar: {
    title: "مہمان استعمال",
    deletionTitle: "خودکار حذف",
    countdownLabel: "عارضی فائلیں خودبخود حذف ہونے میں باقی:",
  },
  upload: {
    heading: "PNG تصویر اپ لوڈ کریں",
    supporting: "PNG گھسیٹ کر چھوڑیں، کلپ بورڈ سے چسپاں کریں، یا ڈیوائس سے منتخب کریں۔",
    chooseLabel: "PNG منتخب کریں",
    formatsHint: "PNG · زیادہ سے زیادہ فائل سائز اوپر دکھائی گئی مہمان حدود کے مطابق",
    features: [
      {title: "نجی پروسیسنگ", body: "اپ لوڈز عارضی نجی اسٹوریج میں رہتی ہیں۔"},
      {title: "شفافیت محفوظ", body: "جب PNG میں شفافیت ہو تو الفا چینل برقرار رہتا ہے۔"},
      {title: "خودکار حذف", body: "مہمان فائلیں برقرار رکھنے کی مدت ختم ہونے پر ہٹا دی جاتی ہیں۔"},
      {title: "سائن اپ ضروری نہیں", body: "بغیر اکاؤنٹ مفت مہمان الاؤنس استعمال کریں۔"},
    ],
  },
  intro: {
    eyebrow: "لاسلیس PNG آپٹیمائزیشن",
    title: "شفافیت رکھتے ہوئے PNG تصاویر کمپریس کریں",
    paragraphs: [
      "PNG فائلیں لوگو، اسکرین شاٹس، انٹرفیس گرافکس اور السٹریشنز کے لیے موزوں ہیں کیونکہ وہ شفاف پس منظر اور تیز معیار دیتی ہیں۔ تاہم PNG اکثر JPG سے بہت بڑی ہوتی ہیں۔",
      "یہ PNG کمپریسر جہاں ممکن ہو شفافیت برقرار رکھتے ہوئے غیر ضروری فائل ڈیٹا کم کرتا ہے۔ نتیجہ چھوٹی PNG ہے جو اپ لوڈ، محفوظ اور آن لائن شائع کرنا آسان ہے۔",
      "ٹول ایک نئی آپٹیمائزڈ PNG بناتا ہے۔ آپ کی اصل فائل ڈیوائس پر جوں کی توں رہتی ہے۔",
    ],
    imageAlt: "شفاف پس منظر برقرار رکھتے ہوئے PNG آپٹیمائزیشن کا پہلے اور بعد موازنہ",
  },
  benefits: {
    eyebrow: "PNG کیوں کمپریس کریں",
    title: "لوگو، UI اور اسکرین شاٹس کے لیے آپٹیمائزڈ PNG",
    cards: [
      {
        title: "شفاف پس منظر",
        body: "PNG شفافیت برقرار رہتی ہے تاکہ لوگو اور اوورلیز ہر صفحہ رنگ پر صاف بیٹھیں۔",
        icon: "transparency",
      },
      {
        title: "تیز گرافکس",
        body: "لوگو، آئیکنز اور انٹرفیس عناصر کے لیے موزوں جہاں کنارے فوٹو گرین سے زیادہ اہم ہوں۔",
        icon: "sharp",
      },
      {
        title: "چھوٹی فائل سائز",
        body: "PNG فارمیٹ چھوڑے بغیر اسٹوریج، اپ لوڈ وقت اور صفحہ وزن کم کریں۔",
        icon: "size",
      },
      {
        title: "نجی پروسیسنگ",
        body: "مہمان فائلیں عارضی محفوظ اسٹوریج استعمال کرتی ہیں اور عوامی گیلری میں نہیں جاتیں۔",
        icon: "privacy",
      },
      {
        title: "بغیر سافٹ ویئر",
        body: "ڈیسکٹاپ، ٹیبلیٹ یا موبائل پر جدید ویب براؤزر میں ہی کمپریس کریں۔",
        icon: "browser",
      },
      {
        title: "اصل محفوظ",
        body: "آپ نئی آپٹیمائزڈ PNG ڈاؤن لوڈ کرتے ہیں۔ ڈیوائس پر اصل تصویر اوور رائٹ نہیں ہوتی۔",
        icon: "safe",
      },
    ],
  },
  howTo: {
    eyebrow: "تین آسان مراحل",
    title: "PNG تصویر کیسے کمپریس کریں",
    steps: [
      {
        title: "PNG اپ لوڈ کریں",
        body: "ڈیوائس سے PNG چنیں، اپ لوڈ ایریا میں گھسیٹیں، یا کلپ بورڈ سے چسپاں کریں۔",
      },
      {
        title: "کمپریس کریں",
        body: "کمپریشن پری سیٹ یا طاقت چنیں، پھر لائیو پیش نظارہ کے ساتھ تصویر پروسیس کریں۔",
      },
      {
        title: "ڈاؤن لوڈ کریں",
        body: "شفافیت رکھتے ہوئے چھوٹی PNG محفوظ کریں اور اصل فائل جوں کی توں رہنے دیں۔",
      },
    ],
    imageAlt: "شفاف PNG اپ لوڈ، کمپریس اور ڈاؤن لوڈ کے تین مراحل",
  },
  useCases: {
    eyebrow: "بہترین استعمالات",
    title: "PNG کمپریشن سب سے زیادہ کب مدد کرتا ہے",
    cards: [
      {
        title: "کمپنی لوگو",
        body: "ہیڈر، ای میل اور ڈاؤن لوڈز کے لیے برانڈ مارکس چھوٹے بنائیں بغیر کنارے دھندلے کیے۔",
      },
      {
        title: "ویب سائٹ آئیکنز",
        body: "آئیکن سیٹس تیز رکھیں اور مینو، فوٹر اور فیچر گرڈز سست کرنے والے بائٹس کاٹیں۔",
      },
      {
        title: "ایپ UI اثاثے",
        body: "بٹن، بیجز اور انٹرفیس کروم کو پروڈکٹ مارکیٹنگ یا مدد مراکز کے لیے بہتر بنائیں۔",
      },
      {
        title: "اسکرین شاٹس",
        body: "دستاویزات، چینج لاگز اور سپورٹ مضامین کے لیے بھاری اسکرین کیپچرز کم کریں۔",
      },
    ],
  },
  explainer: {
    title: "PNG فائلیں JPG سے بڑی کیوں ہوتی ہیں",
    points: [
      "PNG اکثر لاسلیس کمپریشن استعمال کرتی ہے جو زیادہ پکسل تفصیل رکھتی ہے۔",
      "شفافیت الفا چینل بڑھاتی ہے جو JPG محفوظ نہیں کر سکتا۔",
      "لوگو اور UI آرٹ کے تیز کنارے بھاری لاسی شارٹ کٹس برداشت نہیں کرتے۔",
      "PNG عموماً گرافکس کے لیے بہتر؛ JPG عموماً فوٹو کے لیے بہتر۔",
      "یہی خوبیاں ہیں جن کی وجہ سے آپٹیمائزیشن سے پہلے PNG اکثر بڑی ہوتی ہیں۔",
    ],
    tableCaption: "مختصر فارمیٹ موازنہ",
    formats: [
      {
        name: "PNG",
        rows: ["شفافیت سپورٹ", "لاسلیس دوستانہ", "لوگو کے لیے بہتر", "بڑی فائلیں"],
      },
      {
        name: "JPG",
        rows: ["شفافیت نہیں", "لاسی", "فوٹو کے لیے بہتر", "چھوٹی فائلیں"],
      },
      {
        name: "WebP",
        rows: ["شفافیت سپورٹ", "جدید کمپریشن", "چھوٹی فائلیں", "بہت سی ویب سائٹس کے لیے بہترین"],
      },
    ],
  },
  tips: {
    eyebrow: "بہتر نتائج",
    title: "PNG آپٹیمائزیشن کے مشورے",
    items: [
      "شفافیت صرف تب رکھیں جب ڈیزائن کو شفاف پس منظر درکار ہو۔",
      "فوٹوگرافک مناظر کے بجائے گرافکس اور اسکرین شاٹس کے لیے PNG استعمال کریں۔",
      "جب مکمل ابعاد درکار نہ ہوں تو پہلے بڑی تصاویر کا سائز کم کریں۔",
      "جدید ویب سائٹس پر جب ممکن ہو WebP میں تبدیل کریں۔",
      "CMS، اسٹورز اور ایپ کنسولز پر اپ لوڈ سے پہلے کمپریس کریں۔",
    ],
  },
  faqHeading: "عمومی سوالات",
  faqs: [
    {
      q: "کیا PNG کمپریشن شفافیت ہٹا دیتی ہے؟",
      a: "یہ صفحہ PNG کنٹینر رکھتا ہے اور موجود شفافیت برقرار رکھنے کی کوشش کرتا ہے۔ شائع کرنے سے پہلے لوگو اور اوورلیز کا پیش نظارہ ضرور دیکھیں۔",
    },
    {
      q: "کیا PNG، JPG سے بہتر ہے؟",
      a: "لوگو، اسکرین شاٹس اور UI گرافکس کے لیے عموماً PNG بہتر ہے۔ فوٹوگرافز کے لیے عموماً JPG بہتر ہے۔ صرف ایکسٹینشن نہیں، مواد دیکھ کر چنیں۔",
    },
    {
      q: "کیا کمپریشن کے بعد PNG کوالٹی کم ہو سکتی ہے؟",
      a: "اس ٹول پر PNG کمپریشن فائل وزن کم کرنے پر مرکوز ہے۔ پروسیسنگ کے بعد اہم کنارے اور متن چیک کریں کہ نتیجہ تیز نظر آئے۔",
    },
    {
      q: "کیا لوگو کمپریس ہو سکتے ہیں؟",
      a: "ہاں۔ خصوصاً جب شفاف پس منظر درکار ہو تو لوگو اور مارکس کے لیے PNG کمپریشن موزوں ہے۔",
    },
    {
      q: "کیا اسکرین شاٹس کمپریس ہو سکتی ہیں؟",
      a: "ہاں۔ اسکرین شاٹس عام PNG استعمال ہیں۔ بڑی کیپچرز اکثر نمایاں طور پر چھوٹی ہو جاتی ہیں، اور پہلے ری سائز اور بھی مدد کر سکتا ہے۔",
    },
    {
      q: "کیا اصل PNG اوور رائٹ ہوتی ہے؟",
      a: "نہیں۔ ڈاؤن لوڈ کے لیے نئی آپٹیمائزڈ PNG بنتی ہے۔ ڈیوائس پر اصل فائل جوں کی توں رہتی ہے۔",
    },
    {
      q: "کیا اپ لوڈ شدہ PNG فائلیں نجی ہیں؟",
      a: "مہمان تصاویر نجی عارضی اسٹوریج استعمال کرتی ہیں اور صفحے پر دکھائی گئی برقرار رکھنے کی مدت کے مطابق خودبخود حذف ہوتی ہیں۔ عوامی گیلری میں نہیں جاتیں۔",
    },
    {
      q: "کیا مہمان بغیر اکاؤنٹ PNG کمپریس کر سکتے ہیں؟",
      a: "ہاں۔ بغیر سائن اِن مفت مہمان آپریشنز دستیاب ہیں۔ اعلیٰ حدود اور پروجیکٹ ہسٹری کے لیے اکاؤنٹ درکار ہو سکتا ہے۔",
    },
    {
      q: "زیادہ سے زیادہ PNG اپ لوڈ سائز کیا ہے؟",
      a: "زیادہ سے زیادہ سائز اس صفحے کے استعمال بار میں دکھائی گئی مہمان پالیسی کے مطابق ہے۔ اس سے بڑی فائلیں پہلے ری سائز یا تقسیم کریں۔",
    },
    {
      q: "PNG اور WebP میں فرق کیا ہے؟",
      a: "دونوں شفافیت سپورٹ کر سکتے ہیں۔ ویب ڈیلیوری کے لیے WebP اکثر چھوٹی فائل دیتا ہے، جبکہ PNG ڈیزائن ہینڈ آف اور بہت سے CMS ورک فلو کے لیے وسیع مطابقت رکھتا ہے۔",
    },
  ],
  related: {
    eyebrow: "مزید ایڈیٹنگ",
    title: "متعلقہ PNG ٹولز",
    tools: [
      {href: "/compress-jpg", title: "Compress JPG", body: "فوٹوگرافک JPG کا فائل سائز کم کریں۔"},
      {href: "/resize-png", title: "Resize PNG", body: "کمپریشن سے پہلے یا بعد PNG چوڑائی اور اونچائی بدلیں۔"},
      {href: "/png-to-jpg", title: "PNG to JPG", body: "جب شفافیت درکار نہ ہو PNG کو JPG میں بدلیں۔"},
      {href: "/png-to-webp", title: "PNG to WebP", body: "ویب ڈیلیوری کے لیے جدید WebP ورژن بنائیں۔"},
      {href: "/crop-png", title: "Crop PNG", body: "PNG کے غیر ضروری حصے کاٹیں۔"},
      {
        href: "/bulk-image-tools",
        title: "Bulk Compress Images",
        body: "ایک ورک فلو میں کئی تصاویر کمپریس کریں۔",
      },
    ],
  },
  cta: {
    title: "ایک اور PNG آپٹیمائز کریں؟",
    body: "ایک اور PNG اپ لوڈ کریں یا اعلیٰ حدود اور پروجیکٹ ہسٹری کے لیے مفت اکاؤنٹ بنائیں۔",
    primaryLabel: "ایک اور PNG کمپریس کریں",
    secondaryLabel: "مفت اکاؤنٹ بنائیں",
    secondaryHref: "/register",
  },
};

export function getCompressPngCopy(locale: string): CompressPngCopy {
  return locale === "ur" ? ur : en;
}

export function compressPngSeoCompat() {
  const c = en;
  return {
    intro: [
      c.hero.paragraph,
      "Guest sessions stay private with temporary storage, and the download is a new PNG rather than an overwrite of your original asset.",
    ].join(" "),
    why: [
      c.intro.paragraphs[0],
      c.intro.paragraphs[1],
      "Unlike Compress JPG, this landing targets logos, UI chrome, and screenshots where transparency and hard edges matter more than photographic grain.",
      c.benefits.cards[0]!.body,
    ].join(" "),
    benefits: c.benefits.cards.map((card) => ({title: card.title, body: card.body})),
    howTo: [
      "Upload a PNG image",
      "Choose compression settings",
      "Preview the optimized result",
      "Download the smaller PNG",
    ] as [string, string, string, string],
    technicalTitle: c.explainer.title,
    technical: [...c.explainer.points, c.tips.items.slice(0, 3).join(" ")].join(" "),
    faqs: c.faqs,
    ctaLabel: c.cta.primaryLabel,
  };
}

// Keep AppLocale referenced for future typed locale helpers.
export type CompressPngLocale = AppLocale;
