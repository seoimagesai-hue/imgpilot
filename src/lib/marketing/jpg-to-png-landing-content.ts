import {localizedCopy} from "@/lib/marketing/localized-copy";
/**
 * JPG → PNG landing — editor / print handoff / PNG-required workflows
 * (distinct from JPG→WebP web delivery and PNG→JPG flatten stories).
 */
import type {AppLocale} from "@/i18n/routing";

export type JpgToPngFaq = {q: string; a: string};

export type JpgToPngCopy = {
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
    rows: {label: string; jpg: string; png: string}[];
    explanation: string;
  };
  benefits: {
    eyebrow: string;
    title: string;
    cards: {
      title: string;
      body: string;
      icon: "compat" | "size" | "privacy" | "docs" | "safe" | "share";
    }[];
  };
  howTo: {
    eyebrow: string;
    title: string;
    steps: {title: string; body: string}[];
    imageAlt: string;
  };
  whyPng: {
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
  faqs: JpgToPngFaq[];
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

const en: JpgToPngCopy = {
  metaTitle: "Convert JPG to PNG Online Free | Img Pilot",
  metaDescription:
    "Convert JPG images to PNG online when editors, printers or workflows require PNG. Honest browser-based conversion with private temporary storage and instant download.",
  h1: "Convert JPG to PNG Online",
  breadcrumbParent: {href: "/convert-image", label: "Convert Image"},
  breadcrumbCurrent: "JPG to PNG",
  hero: {
    badge: "JPG TO PNG CONVERTER",
    paragraph:
      "Convert JPG images into PNG format directly in your browser when the next step in your workflow requires PNG. Create a compatible handoff file without installing desktop software — with clear expectations about file size and transparency.",
    trust: ["PNG Compatibility", "Honest Conversion", "Private Processing", "No Software Required"],
    uploadCta: "Upload JPG",
    heroImageAlt: "Browser interface in a jpg-to-png workflow converting a JPG photo card into a PNG image card",
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
    formatsHint: "JPG · Maximum file size follows guest limits shown above",
    features: [
      {title: "Fast Conversion", body: "Turn a JPG into PNG with the shared guest convert engine."},
      {title: "PNG Output", body: "Download a PNG when partners or tools reject JPEG containers."},
      {title: "Private Processing", body: "Uploads stay in temporary private storage for about one hour."},
      {title: "Automatic File Deletion", body: "Guest files are removed after the retention countdown."},
    ],
  },
  intro: {
    eyebrow: "FORMAT HANDOFF",
    title: "Why Convert JPG to PNG?",
    paragraphs: [
      "Some design tools, print pipelines and legacy upload forms still require PNG even when your camera or export delivered a JPG. Converting creates a predictable PNG container for those handoffs without forcing everyone to reinstall desktop software.",
      "This converter creates a new PNG while keeping your original JPG unchanged on your device. It is not an upscale — JPEG compression already discarded detail, and changing containers cannot bring that data back.",
      "PNG also does not magically add transparency from a JPG source. JPG has no alpha channel, so the converted PNG starts fully opaque. For public websites where smaller files matter, JPG to WebP is usually the better delivery path.",
    ],
    imageAlt: "Jpg-to-png comparison cards showing a JPG photo beside a larger PNG output with an honest size note",
  },
  comparison: {
    eyebrow: "JPG VS PNG",
    title: "How JPG and PNG Compare",
    intro: "Choose based on what the destination requires — not because PNG always improves a photographic JPG.",
    columns: ["Compare", "JPG", "PNG"],
    rows: [
      {
        label: "Compression style",
        jpg: "Lossy photographic encode",
        png: "Lossless container (source was already lossy)",
      },
      {
        label: "Transparency",
        jpg: "No alpha channel",
        png: "Supports alpha, but not created from JPG",
      },
      {
        label: "Typical photo file size",
        jpg: "Often smaller for everyday photos",
        png: "Often larger for the same photo",
      },
      {
        label: "Detail recovery",
        jpg: "Discards data during JPEG encode",
        png: "Cannot restore discarded JPEG detail",
      },
      {
        label: "Editing handoffs",
        jpg: "Works widely, but some tools insist on PNG",
        png: "Accepted in many design and print pipelines",
      },
      {
        label: "Website delivery",
        jpg: "Strong everyday photographic choice",
        png: "Usually heavier unless graphics need lossless edges",
      },
    ],
    explanation:
      "Use JPG to PNG when a teammate, printer or CMS module literally requires PNG. Keep JPG or move to WebP for public web photos when compatibility allows — PNG is not a free quality or size upgrade from JPEG.",
  },
  benefits: {
    eyebrow: "WHY CONVERT",
    title: "PNG When the Workflow Demands It",
    cards: [
      {
        title: "PNG Compatibility",
        body: "Satisfy editors, printers and upload forms that reject JPEG even for photographic content.",
        icon: "compat",
      },
      {
        title: "Honest Size Expectations",
        body: "Photographic PNGs are often larger than the source JPG — preview before emailing or uploading.",
        icon: "size",
      },
      {
        title: "Design & Print Handoffs",
        body: "Move camera JPGs into PNG containers expected by layout, prepress or asset pipelines.",
        icon: "docs",
      },
      {
        title: "Easy Sharing",
        body: "Send PNG when the recipient's checklist or vendor portal lists PNG as the required format.",
        icon: "share",
      },
      {
        title: "Private Processing",
        body: "Files remain temporary on private storage and are not published to a public gallery.",
        icon: "privacy",
      },
      {
        title: "Original Protected",
        body: "Download a new PNG. Your original JPG stays unchanged on your device.",
        icon: "safe",
      },
    ],
  },
  howTo: {
    eyebrow: "THREE SIMPLE STEPS",
    title: "How to Convert JPG to PNG",
    steps: [
      {
        title: "Upload JPG",
        body: "Choose a JPG from your device, drag it into the upload area or paste it from your clipboard.",
      },
      {
        title: "Convert",
        body: "Confirm PNG as the target and run conversion with the shared guest convert engine.",
      },
      {
        title: "Download PNG",
        body: "Preview the result and download the new PNG while keeping the original JPG safe.",
      },
    ],
    imageAlt: "Three jpg-to-png steps for uploading a JPG, converting to PNG and downloading the result",
  },
  whyPng: {
    title: "When PNG Is the Right Container — Not a Magic Upgrade",
    paragraphs: [
      "Teams reach for PNG when downstream software standardizes on that extension, not because every JPG becomes sharper or lighter overnight. Treat this conversion as a compatibility step.",
      "Guest sessions use private temporary storage and expire after about one hour. Download your PNG before the countdown finishes — refreshing the page does not extend retention.",
    ],
    points: [
      "Editor compatibility — satisfy tools that refuse JPEG imports",
      "Print and prepress — deliver PNG when vendor specs list it explicitly",
      "Legacy CMS uploads — meet forms that only accept PNG attachments",
      "Lossless container — PNG stores pixels without another lossy JPEG pass",
      "No hidden transparency — JPG sources stay opaque in the PNG output",
      "Honest expectations — file size may grow; quality cannot exceed the JPG master",
    ],
    note: "Many photographic workflows should stay on JPG or WebP for delivery. Convert to PNG only when the next system in the chain requires that format.",
  },
  useCases: {
    eyebrow: "COMMON USE CASES",
    title: "Where JPG to PNG Helps Most",
    cards: [
      {
        title: "Design Software Imports",
        body: "Hand photographic JPGs to teammates whose layout tools expect PNG assets.",
      },
      {
        title: "Print Vendor Specs",
        body: "Submit PNG when a printer or prepress checklist lists PNG even for photo content.",
      },
      {
        title: "Legacy CMS Forms",
        body: "Pass upload validators that accept PNG but reject JPEG product or banner files.",
      },
      {
        title: "Asset Pipeline Standards",
        body: "Normalize camera exports into PNG when your internal DAM or ticket template requires it.",
      },
    ],
  },
  tips: {
    eyebrow: "BETTER RESULTS",
    title: "Conversion Tips",
    items: [
      "Do not expect transparency — JPG has no alpha to carry into PNG.",
      "Expect larger files for many photos — compress PNG afterward only if you still need PNG.",
      "Keep JPG for web delivery when browsers and CDNs accept JPEG or WebP.",
      "Start with the highest-quality JPG available; conversion is not an upscale.",
      "Resize before converting if the layout box is much smaller than the source dimensions.",
      "Keep the original JPG as a separate master for future edits and smaller exports.",
    ],
  },
  faqHeading: "Frequently Asked Questions",
  faqs: [
    {
      q: "Why convert JPG to PNG?",
      a: "Use PNG when an editor, printer, CMS or teammate requires that format even though your source is a photographic JPG. This landing focuses on compatibility handoffs, not smaller web delivery.",
    },
    {
      q: "Will JPG to PNG add transparency?",
      a: "No. JPG has no alpha channel, so converting to PNG does not create a transparent background. The output PNG is fully opaque.",
    },
    {
      q: "Will converting JPG to PNG make the file larger?",
      a: "Often yes for photographic content. PNG is lossless and can grow versus a compressed JPG. Preview file size before sharing or uploading.",
    },
    {
      q: "Does JPG to PNG improve image quality?",
      a: "No. JPEG compression already removed detail. Changing to PNG preserves what remains but cannot recover discarded information — this is not an upscale.",
    },
    {
      q: "Can JPG to PNG recover detail lost in JPEG compression?",
      a: "No. Once JPEG discards data, a format change cannot invent it back. Always keep your best JPG master separately.",
    },
    {
      q: "When should I keep JPG instead of converting to PNG?",
      a: "Keep JPG for websites, email and everyday sharing when PNG is not required. For modern browsers, JPG to WebP usually delivers smaller files.",
    },
    {
      q: "Will converting overwrite my original JPG?",
      a: "No. A new PNG is created for download. The JPG on your device remains unchanged.",
    },
    {
      q: "Are JPG to PNG uploads private?",
      a: "Guest images use private temporary storage and are deleted automatically according to the retention countdown on the page — about one hour after the guest session starts.",
    },
    {
      q: "What are the guest limits for JPG to PNG conversion?",
      a: "Free guest operations and maximum file size appear in the usage bar above the uploader. Higher limits may require an account.",
    },
    {
      q: "What is the difference between JPG and PNG for editing workflows?",
      a: "JPG is a lossy photographic format suited to cameras and web photos. PNG is a lossless container many design and print tools prefer, but converting JPG to PNG does not add transparency or recover lost JPEG detail.",
    },
  ],
  related: {
    eyebrow: "CONTINUE EDITING",
    title: "Related Image Tools",
    tools: [
      {href: "/png-to-jpg", title: "PNG to JPG", body: "Return to JPG when transparency is gone and you need a smaller photo."},
      {href: "/jpg-to-webp", title: "JPG to WebP", body: "Ship lighter photographic assets for modern websites."},
      {href: "/compress-png", title: "Compress PNG", body: "Reduce PNG weight when you must stay on PNG after converting."},
      {href: "/resize-jpg", title: "Resize JPG", body: "Fix dimensions on the JPG master before or instead of converting."},
      {href: "/png-to-webp", title: "PNG to WebP", body: "Move PNG graphics to a modern web format with optional transparency."},
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

const ur: JpgToPngCopy = {
  metaTitle: "آن لائن JPG کو PNG میں تبدیل کریں مفت | Img Pilot",
  metaDescription:
    "جب ایڈیٹرز، پرنٹرز یا ورک فلو PNG چاہیں تو JPG تصاویر آن لائن PNG میں تبدیل کریں۔ نجی عارضی اسٹوریج اور فوری ڈاؤن لوڈ کے ساتھ ایماندار براؤزر کنورژن۔",
  h1: "آن لائن JPG کو PNG میں تبدیل کریں",
  breadcrumbParent: {href: "/convert-image", label: "تصویر تبدیل کریں"},
  breadcrumbCurrent: "JPG to PNG",
  hero: {
    badge: "JPG TO PNG CONVERTER",
    paragraph:
      "جب آپ کے ورک فلو کا اگلا مرحلہ PNG مانگے تو اپنے براؤزر میں ہی JPG تصاویر کو PNG فارمیٹ میں تبدیل کریں۔ ڈیسکٹاپ سافٹ ویئر انسٹال کیے بغیر مطابقت والی فائل بنائیں — فائل سائز اور شفافیت کے بارے میں واضح توقعات کے ساتھ۔",
    trust: ["PNG مطابقت", "ایماندار کنورژن", "نجی پروسیسنگ", "سافٹ ویئر کی ضرورت نہیں"],
    uploadCta: "JPG اپ لوڈ کریں",
    heroImageAlt: "jpg-to-png ورک فلو میں براؤزر انٹرفیس JPG فوٹو کارڈ کو PNG امیج کارڈ میں تبدیل کرتے ہوئے",
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
    formatsHint: "JPG · زیادہ سے زیادہ فائل سائز اوپر دکھائی گئی مہمان حد کے مطابق",
    features: [
      {title: "تیز کنورژن", body: "شیئرڈ مہمان کنورٹ انجن سے JPG کو PNG بنائیں۔"},
      {title: "PNG آؤٹ پٹ", body: "جب پارٹنرز یا ٹولز JPEG کنٹینر مسترد کریں تو PNG ڈاؤن لوڈ کریں۔"},
      {title: "نجی پروسیسنگ", body: "اپ لوڈز تقریباً ایک گھنٹے کے لیے عارضی نجی اسٹوریج میں رہتی ہیں۔"},
      {title: "خودکار فائل حذف", body: "برقرار رکھنے کی مدت کے بعد مہمان فائلیں ہٹ جاتی ہیں۔"},
    ],
  },
  intro: {
    eyebrow: "فارمیٹ ہینڈ آف",
    title: "JPG کو PNG میں کیوں تبدیل کریں؟",
    paragraphs: [
      "کچھ ڈیزائن ٹولز، پرنٹ پائپ لائنز اور پرانے اپ لوڈ فارم اب بھی PNG چاہتے ہیں چاہے کیمرے یا ایکسپورٹ نے JPG دی ہو۔ تبدیلی ان ہینڈ آفز کے لیے پیش گوئی کے قابل PNG کنٹینر بناتی ہے بغیر ہر کسی کو ڈیسکٹاپ سافٹ ویئر دوبارہ انسٹال کرائے۔",
      "یہ کنورٹر نئی PNG بناتا ہے جبکہ آپ کی اصل JPG ڈیوائس پر جوں کی توں رہتی ہے۔ یہ اپ اسکیل نہیں — JPEG کمپریشن پہلے ہی تفصیل ضائع کر چکی ہوتی ہے، اور کنٹینر بدلنے سے وہ ڈیٹا واپس نہیں آتا۔",
      "PNG JPG ماخذ سے جادوئی طور پر شفافیت بھی نہیں بناتا۔ JPG میں الفا چینل نہیں، اس لیے تبدیل شدہ PNG مکمل غیر شفاف شروع ہوتی ہے۔ عوامی ویب سائٹس جہاں چھوٹی فائلیں اہم ہوں، JPG to WebP عام طور پر بہتر ڈیلیوری راستہ ہے۔",
    ],
    imageAlt: "jpg-to-png موازنہ کارڈز — JPG فوٹو اور بڑی PNG آؤٹ پٹ ساتھ ایماندار سائز نوٹ",
  },
  comparison: {
    eyebrow: "JPG بمقابلہ PNG",
    title: "JPG اور PNG کا موازنہ",
    intro: "فیصلہ اس بات پر کریں کہ منزل کیا مانگتی ہے — نہ کہ PNG ہمیشہ فوٹوگرافک JPG بہتر بناتا ہے۔",
    columns: ["موازنہ", "JPG", "PNG"],
    rows: [
      {
        label: "کمپریشن انداز",
        jpg: "لاسی فوٹوگرافک انکوڈ",
        png: "لاسلیس کنٹینر (ماخذ پہلے ہی لاسی تھا)",
      },
      {
        label: "شفافیت",
        jpg: "الفا چینل نہیں",
        png: "الفا سپورٹ، مگر JPG سے نہیں بنتی",
      },
      {
        label: "عام فوٹو فائل سائز",
        jpg: "روزمرہ فوٹوز کے لیے اکثر چھوٹا",
        png: "اسی فوٹو کے لیے اکثر بڑا",
      },
      {
        label: "تفصیل بحالی",
        jpg: "JPEG انکوڈ کے دوران ڈیٹا ضائع",
        png: "ضائع JPEG تفصیل بحال نہیں کر سکتا",
      },
      {
        label: "ایڈیٹنگ ہینڈ آف",
        jpg: "وسیع کام، مگر کچھ ٹولز PNG پر اصرار",
        png: "بہت سے ڈیزائن اور پرنٹ پائپ لائنز میں قبول",
      },
      {
        label: "ویب سائٹ ڈیلیوری",
        jpg: "روزمرہ فوٹوگرافک انتخاب",
        png: "عمومی طور پر بھاری جب گرافکس کو لاسلیس کنارے نہ چاہیے",
      },
    ],
    explanation:
      "JPG to PNG استعمال کریں جب ساتھی، پرنٹر یا CMS ماڈیول واقعی PNG مانگے۔ عوامی ویب فوٹوز کے لیے JPG رکھیں یا WebP پر جائیں جب مطابقت ہو — PNG JPEG سے مفت کوالٹی یا سائز اپ گریڈ نہیں۔",
  },
  benefits: {
    eyebrow: "تبدیلی کیوں",
    title: "جب ورک فلو PNG مانگے",
    cards: [
      {
        title: "PNG مطابقت",
        body: "ایڈیٹرز، پرنٹرز اور اپ لوڈ فارم جو فوٹوگرافک مواد پر JPEG مسترد کریں، ان کی ضرورت پوری کریں۔",
        icon: "compat",
      },
      {
        title: "ایماندار سائز توقعات",
        body: "فوٹوگرافک PNG اکثر ماخذ JPG سے بڑی ہوتی ہے — ای میل یا اپ لوڈ سے پہلے دیکھیں۔",
        icon: "size",
      },
      {
        title: "ڈیزائن اور پرنٹ ہینڈ آف",
        body: "کیمرے JPG کو PNG کنٹینرز میں لائیں جو لے آؤٹ، پری پریس یا اثاثہ پائپ لائنز توقع کرتی ہیں۔",
        icon: "docs",
      },
      {
        title: "آسان شیئرنگ",
        body: "PNG بھیجیں جب وصول کنندہ کی چیک لسٹ یا وینڈر پورٹل PNG کو مطلوب فارمیٹ فہرست میں رکھے۔",
        icon: "share",
      },
      {
        title: "نجی پروسیسنگ",
        body: "فائلیں نجی عارضی اسٹوریج پر رہتی ہیں اور عوامی گیلری میں نہیں جاتیں۔",
        icon: "privacy",
      },
      {
        title: "اصل محفوظ",
        body: "نئی PNG ڈاؤن لوڈ کریں۔ اصل JPG آپ کی ڈیوائس پر جوں کی توں رہتی ہے۔",
        icon: "safe",
      },
    ],
  },
  howTo: {
    eyebrow: "تین آسان مراحل",
    title: "JPG کو PNG میں کیسے تبدیل کریں",
    steps: [
      {
        title: "JPG اپ لوڈ کریں",
        body: "ڈیوائس سے JPG چنیں، اپ لوڈ ایریا میں گھسیٹیں، یا کلپ بورڈ سے چسپاں کریں۔",
      },
      {
        title: "تبدیل کریں",
        body: "ٹارگٹ PNG تصدیق کریں اور شیئرڈ مہمان کنورٹ انجن چلائیں۔",
      },
      {
        title: "PNG ڈاؤن لوڈ کریں",
        body: "نتیجہ دیکھیں اور اصل JPG محفوظ رکھتے ہوئے نئی PNG ڈاؤن لوڈ کریں۔",
      },
    ],
    imageAlt: "jpg-to-png کے تین مراحل — JPG اپ لوڈ، PNG کنورژن اور ڈاؤن لوڈ",
  },
  whyPng: {
    title: "جب PNG صحیح کنٹینر ہے — جادوئی اپ گریڈ نہیں",
    paragraphs: [
      "ٹیمیں PNG اس لیے چنتے ہیں جب ڈاؤن سٹریم سافٹ ویئر اس ایکسٹینشن پر معیار بناتا ہے، نہ کہ ہر JPG ایک رات میں تیز یا ہلکی ہو جاتی ہے۔ اس کنورژن کو مطابقت کا مرحلہ سمجھیں۔",
      "مہمان سیشنز نجی عارضی اسٹوریج استعمال کرتے ہیں اور تقریباً ایک گھنٹے بعد ختم ہو جاتے ہیں۔ کاؤنٹ ڈاؤن ختم ہونے سے پہلے PNG ڈاؤن لوڈ کریں — صفحہ ریفریش برقرار رکھنے کی مدت بڑھاتا نہیں۔",
    ],
    points: [
      "ایڈیٹر مطابقت — وہ ٹولز جو JPEG امپورٹ مسترد کریں",
      "پرنٹ اور پری پریس — جب وینڈر سپécifications PNG فہرست میں کریں",
      "پرانے CMS اپ لوڈ — وہ فارم جو PNG اٹیچمنٹ قبول کریں مگر JPEG نہیں",
      "لاسلیس کنٹینر — PNG بغیر دوسرے لاسی JPEG پاس کے پکسلز رکھتا ہے",
      "چھپی ہوئی شفافیت نہیں — JPG ماخذ PNG آؤٹ پٹ میں غیر شفاف رہتا ہے",
      "ایماندار توقعات — فائل بڑی ہو سکتی ہے؛ کوالٹی JPG ماسٹر سے زیادہ نہیں",
    ],
    note: "بہت سے فوٹوگرافک ورک فلو ڈیلیوری کے لیے JPG یا WebP پر رہنا چاہیے۔ PNG میں تبدیل کریں صرف جب زنجیر کا اگلا سسٹم وہ فارمیٹ مانگے۔",
  },
  useCases: {
    eyebrow: "عام استعمالات",
    title: "JPG to PNG سب سے زیادہ کہاں مدد کرتا ہے",
    cards: [
      {
        title: "ڈیزائن سافٹ ویئر امپورٹ",
        body: "فوٹوگرافک JPG ساتھیوں کو دیں جن کے لے آؤٹ ٹولز PNG اثاثے توقع کرتے ہیں۔",
      },
      {
        title: "پرنٹ وینڈر سپécifications",
        body: "PNG جمع کرائیں جب پرنٹر یا پری پریس چیک لسٹ فوٹو مواد کے لیے بھی PNG فہرست میں کرے۔",
      },
      {
        title: "پرانے CMS فارم",
        body: "اپ لوڈ validators پاس کریں جو PNG قبول کریں مگر JPEG پروڈکٹ یا بینر فائلیں مسترد کریں۔",
      },
      {
        title: "اثاثہ پائپ لائن معیارات",
        body: "کیمرے ایکسپورٹس PNG میں معیار بنائیں جب اندرونی DAM یا ٹکٹ ٹیمپلیٹ PNG مانگے۔",
      },
    ],
  },
  tips: {
    eyebrow: "بہتر نتائج",
    title: "کنورژن کے مشورے",
    items: [
      "شفافیت کی توقع نہ رکھیں — JPG میں PNG میں لے جانے کے لیے الفا نہیں۔",
      "بہت سی فوٹوز کے لیے بڑی فائلیں توقع کریں — PNG پر رہنا ہو تو بعد میں Compress PNG استعمال کریں۔",
      "ویب ڈیلیوری کے لیے JPG رکھیں جب براؤزرز اور CDN JPEG یا WebP قبول کریں۔",
      "بہترین دستیاب JPG سے شروع کریں؛ کنورژن اپ اسکیل نہیں۔",
      "اگر لے آؤٹ باکس ماخذ سے بہت چھوٹا ہو تو تبدیلی سے پہلے ری سائز کریں۔",
      "مستقبل کی ایڈٹنگ اور چھوٹے ایکسپورٹ کے لیے اصل JPG الگ ماسٹر رکھیں۔",
    ],
  },
  faqHeading: "عمومی سوالات",
  faqs: [
    {
      q: "JPG کو PNG میں کیوں تبدیل کریں؟",
      a: "PNG استعمال کریں جب ایڈیٹر، پرنٹر، CMS یا ساتھی وہ فارمیٹ مانگے چاہے ماخذ فوٹوگرافک JPG ہو۔ یہ لینڈنگ مطابقت والے ہینڈ آفز پر ہے، چھوٹی ویب ڈیلیوری پر نہیں۔",
    },
    {
      q: "کیا JPG to PNG شفافیت شامل کرتا ہے؟",
      a: "نہیں۔ JPG میں الفا چینل نہیں، اس لیے PNG میں تبدیلی شفاف پس منظر نہیں بناتی۔ آؤٹ پٹ PNG مکمل غیر شفاف ہے۔",
    },
    {
      q: "کیا JPG کو PNG بنانے سے فائل بڑی ہو گی؟",
      a: "فوٹوگرافک مواد کے لیے اکثر ہاں۔ PNG لاسلیس ہے اور کمپریس JPG کے مقابلے بڑھ سکتی ہے۔ شیئر یا اپ لوڈ سے پہلے سائز دیکھیں۔",
    },
    {
      q: "کیا JPG to PNG سے امیج کوالٹی بہتر ہوتی ہے؟",
      a: "نہیں۔ JPEG کمپریشن پہلے ہی تفصیل ہٹا چکی ہوتی ہے۔ PNG میں بدلنا جو بچا ہے وہ رکھتا ہے مگر ضائع معلومات بحال نہیں — یہ اپ اسکیل نہیں۔",
    },
    {
      q: "کیا JPG to PNG JPEG کمپریشن میں ضائع تفصیل بحال کر سکتا ہے؟",
      a: "نہیں۔ JPEG ڈیٹا ضائع ہونے کے بعد فارمیٹ تبدیلی اسے واپس نہیں لا سکتی۔ ہمیشہ بہترین JPG ماسٹر الگ رکھیں۔",
    },
    {
      q: "PNG میں تبدیل کرنے کے بجائے JPG کب رکھنا چاہیے؟",
      a: "ویب سائٹس، ای میل اور روزمرہ شیئرنگ کے لیے JPG رکھیں جب PNG درکار نہ ہو۔ جدید براؤزرز کے لیے JPG to WebP عام طور پر چھوٹی فائلیں دیتا ہے۔",
    },
    {
      q: "کیا کنورژن میری اصل JPG کو اوور رائٹ کرتا ہے؟",
      a: "نہیں۔ ڈاؤن لوڈ کے لیے نئی PNG بنتی ہے۔ ڈیوائس پر JPG جوں کی توں رہتی ہے۔",
    },
    {
      q: "کیا JPG to PNG اپ لوڈز نجی ہیں؟",
      a: "مہمان تصاویر نجی عارضی اسٹوریج استعمال کرتی ہیں اور صفحے پر دکھائی گئی برقرار رکھنے کی مدت کے مطابق خودبخود حذف ہوتی ہیں — مہمان سیشن شروع ہونے کے تقریباً ایک گھنٹے بعد۔",
    },
    {
      q: "JPG to PNG کنورژن کی مہمان حدود کیا ہیں؟",
      a: "مفت مہمان آپریشنز اور زیادہ سے زیادہ فائل سائز اپ لوڈر کے اوپر استعمال بار میں نظر آتی ہیں۔ اعلیٰ حدود کے لیے اکاؤنٹ درکار ہو سکتا ہے۔",
    },
    {
      q: "ایڈیٹنگ ورک فلو کے لیے JPG اور PNG میں کیا فرق ہے؟",
      a: "JPG لاسی فوٹوگرافک فارمیٹ ہے جو کیمروں اور ویب فوٹوز کے لیے موزوں ہے۔ PNG لاسلیس کنٹینر ہے جو بہت سے ڈیزائن اور پرنٹ ٹولز پسند کرتے ہیں، مگر JPG کو PNG میں بدلنا شفافیت نہیں دیتا اور ضائع JPEG تفصیل بحال نہیں کرتا۔",
    },
  ],
  related: {
    eyebrow: "مزید ایڈیٹنگ",
    title: "متعلقہ امیج ٹولز",
    tools: [
      {href: "/png-to-jpg", title: "PNG to JPG", body: "جب شفافیت ختم ہو اور چھوٹی فوٹو چاہیے تو JPG پر واپس آئیں۔"},
      {href: "/jpg-to-webp", title: "JPG to WebP", body: "جدید ویب سائٹس کے لیے ہلکی فوٹوگرافک اثاثے بھیجیں۔"},
      {href: "/compress-png", title: "Compress PNG", body: "تبدیلی کے بعد PNG پر رہنا ہو تو وزن کم کریں۔"},
      {href: "/resize-jpg", title: "Resize JPG", body: "تبدیلی سے پہلے یا اس کے بجائے JPG ماسٹر کے ابعاد درست کریں۔"},
      {href: "/png-to-webp", title: "PNG to WebP", body: "PNG گرافکس کو جدید ویب فارمیٹ میں لائیں، اختیاری شفافیت کے ساتھ۔"},
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

export function getJpgToPngCopy(locale: string): JpgToPngCopy {
  return localizedCopy(locale, {en, ur});
}

export function jpgToPngSeoCompat() {
  const c = en;
  return {
    intro: [
      c.hero.paragraph,
      "Guest files stay on temporary private storage for about one hour, and the download is a new PNG rather than an overwrite of your JPG.",
      "This page covers PNG-required handoffs — not lighter web delivery or invented transparency from JPEG.",
    ].join(" "),
    why: [
      c.intro.paragraphs[0],
      "Unlike JPG to WebP or PNG to JPG, JPG to PNG targets tools that refuse JPEG even though PNG may grow and cannot restore lost JPEG detail.",
      c.benefits.cards[1]!.body,
      "Prefer WebP for public sites after the handoff unless the destination truly needs PNG.",
    ].join(" "),
    benefits: c.benefits.cards.slice(0, 5).map((card) => ({title: card.title, body: card.body})),
    howTo: [
      "Upload a JPG image",
      "Confirm PNG as the target format",
      "Convert with the guest engine",
      "Download the PNG file",
    ] as [string, string, string, string],
    technicalTitle: c.whyPng.title,
    technical: [c.whyPng.paragraphs[0], ...c.whyPng.points.slice(0, 3), c.comparison.explanation].join(" "),
    faqs: c.faqs.slice(0, 4),
    ctaLabel: c.cta.primaryLabel,
  };
}

export type JpgToPngLocale = AppLocale;
