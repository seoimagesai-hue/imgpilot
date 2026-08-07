import {localizedCopy} from "@/lib/marketing/localized-copy";
/**
 * Image Converter master hub — pillar page for "image converter" keywords.
 * Distinct from single-pair convert landings and Bulk Convert.
 */
import type {AppLocale} from "@/i18n/routing";

export type ConvertImageFaq = {q: string; a: string};

export type ConvertImageCopy = {
  metaTitle: string;
  metaDescription: string;
  h1: string;
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
  formats: {
    eyebrow: string;
    title: string;
    cards: {title: string; body: string}[];
  };
  popular: {
    eyebrow: string;
    title: string;
    intro: string;
    cards: {from: string; to: string; href: string; body: string}[];
  };
  intro: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
  };
  why: {
    eyebrow: string;
    title: string;
    cards: {
      title: string;
      body: string;
      icon:
        | "fast"
        | "browser"
        | "privacy"
        | "formats"
        | "install"
        | "mobile"
        | "batch"
        | "safe";
    }[];
  };
  howTo: {
    eyebrow: string;
    title: string;
    steps: {title: string; body: string}[];
    imageAlt: string;
  };
  comparison: {
    title: string;
    intro: string;
    caption: string;
    columns: string[];
    rows: {format: string; cells: string[]}[];
  };
  guide: {
    title: string;
    paragraphs: string[];
    sections: {
      title: string;
      body: string;
      links: {href: string; label: string}[];
    }[];
  };
  faqHeading: string;
  faqs: ConvertImageFaq[];
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

const en: ConvertImageCopy = {
  metaTitle: "Image Converter Online Free | Img Pilot",
  metaDescription:
    "Convert JPG, PNG and WebP images online using a secure browser-based image converter. Fast, free and easy image format conversion.",
  h1: "Convert Images Online",
  breadcrumbCurrent: "Convert Images Online",
  hero: {
    badge: "ONLINE IMAGE CONVERTER",
    paragraph:
      "Convert JPG, PNG and WebP images directly in your browser. Upload an image, choose the output format and download the converted file in seconds without installing software.",
    trust: ["JPG", "PNG", "WebP", "Private Processing", "No Software"],
    uploadCta: "Convert Images",
    heroImageAlt:
      "Browser image converter with JPG, PNG and WebP files entering a conversion engine and leaving as converted downloads",
  },
  guestBar: {
    title: "Guest usage",
    deletionTitle: "Automatic deletion",
    countdownLabel: "Temporary files delete automatically in",
  },
  upload: {
    heading: "Upload Your Image",
    supporting: "Drag and drop an image or browse your device.",
    chooseLabel: "Choose Image",
    formatsHint: "JPG · PNG · WebP · Maximum file size follows guest limits shown above",
    features: [
      {title: "Multi-format intake", body: "Start from JPG, PNG or WebP still images."},
      {title: "Choose output format", body: "Pick the destination container after upload."},
      {title: "Private processing", body: "Files stay in temporary private storage."},
      {title: "Automatic cleanup", body: "Guest outputs expire with the session countdown."},
    ],
  },
  formats: {
    eyebrow: "SUPPORTED FORMATS",
    title: "One Converter for Everyday Web Formats",
    cards: [
      {
        title: "JPG",
        body: "The default for photographs and compatible photo sharing across devices, email and older systems.",
      },
      {
        title: "PNG",
        body: "The right home for logos, UI chrome and graphics that need sharp edges or transparency.",
      },
      {
        title: "WebP",
        body: "A modern delivery format for smaller web files that can still keep transparency when you need it.",
      },
    ],
  },
  popular: {
    eyebrow: "POPULAR CONVERSION TOOLS",
    title: "Jump Straight to a Dedicated Converter",
    intro:
      "Need a format-specific landing with tailored guidance? These high-traffic tools use the same convert engine as this hub.",
    cards: [
      {
        from: "JPG",
        to: "WebP",
        href: "/jpg-to-webp",
        body: "Ship lighter photos for modern websites and campaigns.",
      },
      {
        from: "WebP",
        to: "JPG",
        href: "/webp-to-jpg",
        body: "Hand off universal JPG when partners cannot open WebP.",
      },
      {
        from: "PNG",
        to: "JPG",
        href: "/png-to-jpg",
        body: "Flatten graphics into photo-compatible delivery when needed.",
      },
      {
        from: "PNG",
        to: "WebP",
        href: "/png-to-webp",
        body: "Keep transparency paths while shrinking web assets.",
      },
      {
        from: "WebP",
        to: "PNG",
        href: "/webp-to-png",
        body: "Export design-friendly PNG for editors and design tools.",
      },
    ],
  },
  intro: {
    eyebrow: "IMAGE FORMAT CONVERSION",
    title: "Convert Images Without Installing Software",
    paragraphs: [
      "Image formats exist because one encoding cannot serve every job equally well. Photographs, logos, screenshots and illustrations place different demands on color, sharp edges, transparency and file weight. A format that looks fine in a camera roll can be the wrong choice inside a product catalog, and a crisp UI asset can become heavy or muddy if it is forced into the wrong container.",
      "Compatibility is the first practical reason people convert. Some email clients, printers, CMS plugins and desktop editors still expect JPG. Other workflows insist on PNG so transparent overlays do not pick up a white box. Newer sites and CDNs prefer WebP because the same visual quality often arrives in fewer bytes. Converting is not about chasing trends — it is about matching the file to the system that has to open, store or display it.",
      "Website optimization is the second. Large media libraries are one of the fastest ways to slow a page. Moving photographic content into a modern delivery format, or cleaning up oversized PNG photos that never needed lossless encoding, helps pages feel responsive on mobile networks. Conversion alone does not replace resizing or compression, but choosing the right starting format keeps later optimizations honest.",
      "Editing and design introduce different needs. Designers routinely export transparent PNG marks from Figma or similar tools. Photographers deliver JPG galleries because the format is universal. Product teams may switch libraries into WebP for production while keeping PNG masters for editing. A browser converter lets you move between those stages without installing a desktop suite on every machine involved in the process.",
      "Sharing and collaboration reward formats people can open without a lecture. A client who cannot preview WebP still needs a JPG. A developer implementing a dark-mode logo still needs alpha. Screenshots with UI text often stay sharper on PNG, while lifestyle photography belongs on JPG or WebP. Converting the file at hand is frequently clearer than asking every stakeholder to install converters of their own.",
      "Modern formats such as WebP sit beside older ones rather than erasing them. Many teams run a mixed library for years: JPG for archival photos, PNG for brand kits and WebP for public pages. That mix only works if conversion stays predictable — same dimensions, transparent handling you can explain, and temporary private storage so campaign assets are not left behind in a public folder.",
      "Photography, illustrations and screenshots each benefit from a deliberate choice. Photos tolerate lossy compression when skin tones and skies still look natural. Flat illustrations and icons often need clean edges that survive better in PNG or WebP with alpha. Screenshots sit in between — sometimes photographic UI, sometimes crisp type — so teams convert after they know whether the destination is a blog, a ticket tracker or a design critique. Img Pilot keeps that decision in the browser: upload once, choose the output format and download a new file while the original stays untouched on your device.",
    ],
  },
  why: {
    eyebrow: "WHY USE IMG PILOT",
    title: "A Converter Built Like a Modern SaaS Tool",
    cards: [
      {
        title: "Fast Processing",
        body: "Convert a still image in the browser queue without waiting on a desktop export dialog.",
        icon: "fast",
      },
      {
        title: "Browser Based",
        body: "Run the converter where you already work — no installer and no platform juggling.",
        icon: "browser",
      },
      {
        title: "Private Files",
        body: "Guest uploads use temporary private storage and clean up with the session countdown.",
        icon: "privacy",
      },
      {
        title: "Modern Formats",
        body: "Move between JPG, PNG and WebP according to compatibility and performance needs.",
        icon: "formats",
      },
      {
        title: "No Installation",
        body: "Share one URL with teammates instead of asking them to install format utilities.",
        icon: "install",
      },
      {
        title: "Mobile Friendly",
        body: "Large upload controls and a single-column layout keep the tool usable on phones.",
        icon: "mobile",
      },
      {
        title: "Batch Support",
        body: "When one file is not enough, continue into Bulk Convert for shared-output queues.",
        icon: "batch",
      },
      {
        title: "Original Protected",
        body: "Downloads are new converted copies. Masters on your device stay unchanged.",
        icon: "safe",
      },
    ],
  },
  howTo: {
    eyebrow: "FOUR SIMPLE STEPS",
    title: "How Image Conversion Works",
    steps: [
      {
        title: "Upload",
        body: "Add a JPG, PNG or WebP image from your device, drag-and-drop area or clipboard paste where supported.",
      },
      {
        title: "Choose Format",
        body: "Select the output container that matches your destination — compatibility, transparency or web performance.",
      },
      {
        title: "Convert",
        body: "Process the image with the shared guest convert engine under the limits shown in the usage bar.",
      },
      {
        title: "Download",
        body: "Save the newly converted file. Temporary guest storage expires with the countdown on the page.",
      },
    ],
    imageAlt: "Four-step image conversion workflow: upload, choose format, convert and download",
  },
  comparison: {
    title: "Supported Format Comparison",
    intro:
      "Use this as a practical map, not a ranking. The best format depends on whether you need transparency, universal opening or smaller delivery.",
    caption: "Comparison of JPG, PNG and WebP for everyday conversion decisions",
    columns: [
      "Format",
      "Transparency",
      "Compression",
      "Compatibility",
      "Best use",
      "File size",
      "Editing",
      "Photography",
      "Websites",
    ],
    rows: [
      {
        format: "JPG",
        cells: [
          "JPG",
          "No alpha",
          "Lossy",
          "Nearly universal",
          "Photos & sharing",
          "Often smaller than PNG photos",
          "Widely supported",
          "Excellent",
          "Safe default",
        ],
      },
      {
        format: "PNG",
        cells: [
          "PNG",
          "Yes",
          "Lossless-leaning",
          "Excellent",
          "Logos, UI, graphics",
          "Can be heavy for photos",
          "Great for edits",
          "Usually overkill",
          "Best when alpha matters",
        ],
      },
      {
        format: "WebP",
        cells: [
          "WebP",
          "Yes (when used)",
          "Modern lossy/lossless",
          "Strong on modern browsers",
          "Performance delivery",
          "Often smallest",
          "Growing tool support",
          "Strong",
          "Preferred when supported",
        ],
      },
    ],
  },
  guide: {
    title: "Choosing the Right Image Format",
    paragraphs: [
      "Start from the destination, not the habit. If the asset must open everywhere, JPG remains the safest photographic handoff. If the asset must sit on any background color without a white box, keep alpha with PNG or WebP. If the asset will live on a performance-sensitive page, prefer WebP when your stack supports it.",
      "Convert with intent, then continue with resize or compress tools when dimensions or weight still need work. Format choice and pixel count are related jobs — switching containers does not automatically invent the right layout size.",
    ],
    sections: [
      {
        title: "When to use JPG",
        body: "Choose JPG for photographs, lifestyle shots and any delivery where maximum compatibility matters more than transparency.",
        links: [
          {href: "/webp-to-jpg", label: "WebP to JPG"},
          {href: "/png-to-jpg", label: "PNG to JPG"},
          {href: "/compress-jpg", label: "Compress JPG"},
          {href: "/resize-jpg", label: "Resize JPG"},
        ],
      },
      {
        title: "When to use PNG",
        body: "Choose PNG for logos, icons, UI chrome and graphics that need crisp edges or a transparent background.",
        links: [
          {href: "/webp-to-png", label: "WebP to PNG"},
          {href: "/jpg-to-png", label: "JPG to PNG"},
          {href: "/compress-png", label: "Compress PNG"},
          {href: "/resize-png", label: "Resize PNG"},
        ],
      },
      {
        title: "When to use WebP",
        body: "Choose WebP for modern websites and campaigns that benefit from smaller files and can still preserve transparency when required.",
        links: [
          {href: "/jpg-to-webp", label: "JPG to WebP"},
          {href: "/png-to-webp", label: "PNG to WebP"},
          {href: "/compress-webp", label: "Compress WebP"},
          {href: "/resize-webp", label: "Resize WebP"},
        ],
      },
    ],
  },
  faqHeading: "Frequently Asked Questions",
  faqs: [
    {
      q: "What is the best image format for websites?",
      a: "There is no single winner. WebP is often best for modern performance when browsers and tooling support it. JPG remains the safest photographic fallback. PNG is best when transparency or crisp UI graphics matter more than smallest file size.",
    },
    {
      q: "What is the difference between JPG and PNG?",
      a: "JPG uses lossy compression and does not keep transparency, which suits photographs. PNG keeps sharp edges and alpha, which suits logos and UI, but photo-like PNGs can grow large.",
    },
    {
      q: "What is the difference between PNG and WebP?",
      a: "Both can keep transparency. WebP often produces smaller files for the same visual role on the web, while PNG remains familiar in design and editing tools.",
    },
    {
      q: "What is the difference between JPG and WebP?",
      a: "Both can deliver photographs efficiently. WebP is usually smaller at similar quality on modern browsers, while JPG opens everywhere including older email and print workflows.",
    },
    {
      q: "Which formats support transparency?",
      a: "PNG and WebP can carry an alpha channel. JPG does not — converting a transparent graphic to JPG flattens it onto a solid background.",
    },
    {
      q: "Does converting an image compress it?",
      a: "Conversion can change size because encoders differ, but it is not the same control as Compress Images. After you lock the format, use compress tools when weight is still too high.",
    },
    {
      q: "Will converted images stay compatible with older devices?",
      a: "JPG is the most compatible photographic choice. PNG is widely supported for graphics. WebP needs modern clients — convert back to JPG or PNG when a partner cannot open WebP.",
    },
    {
      q: "Can image conversion improve website performance?",
      a: "Choosing a more efficient format often reduces bytes, which helps pages load faster. Pair conversion with Resize Images or Compress Images when dimensions or quality settings still need tuning.",
    },
    {
      q: "Which formats does the Img Pilot converter support?",
      a: "Guest convert accepts JPG, PNG and WebP still images and can target those containers according to the convert matrix. Dedicated pair landings cover the most common paths.",
    },
    {
      q: "Are uploads to the image converter private?",
      a: "Guest files use temporary private storage and are deleted automatically according to the retention countdown shown above the uploader.",
    },
    {
      q: "What are the guest limits for Convert Images?",
      a: "Daily operations and maximum upload size appear in the usage bar. Higher limits may require creating an account.",
    },
    {
      q: "Will converting reduce image quality?",
      a: "Lossy paths can discard detail depending on the destination and quality preset. Preview the result, especially for logos and skin tones, before replacing a production asset.",
    },
    {
      q: "Does conversion preserve metadata?",
      a: "Guest conversion summarizes processing results in the tool panel. Do not assume every EXIF or color-profile detail survives every path — keep masters when metadata is critical.",
    },
    {
      q: "Can I convert many images at once?",
      a: "Yes. Use Bulk Convert Images when you need one shared output format across a queue, then download a ZIP of the results.",
    },
    {
      q: "Does the image converter work on mobile?",
      a: "Yes. The hub layout stacks to a single column with a large upload target so you can convert on phones and tablets as well as desktops.",
    },
  ],
  related: {
    eyebrow: "RELATED CATEGORIES",
    title: "Continue Optimizing After Conversion",
    tools: [
      {href: "/compress-image", title: "Compress Images", body: "Reduce file weight after the format is correct."},
      {href: "/resize-image", title: "Resize Images", body: "Fit images to layout boxes and responsive breakpoints."},
      {href: "/crop-image", title: "Crop Images", body: "Frame subjects before format delivery."},
      {href: "/bulk-convert", title: "Bulk Convert", body: "Convert whole batches to one output format."},
      {href: "/bulk-resize", title: "Bulk Resize", body: "Normalize dimensions across many files."},
      {href: "/bulk-compress", title: "Bulk Compress", body: "Lighten an entire library in one queue."},
    ],
  },
  cta: {
    title: "Ready to Convert Images?",
    body: "Upload your first image or create a free account for advanced tools and larger limits.",
    primaryLabel: "Convert Images",
    secondaryLabel: "Create Free Account",
    secondaryHref: "/register",
  },
};

const ur: ConvertImageCopy = {
  metaTitle: "آن لائن امیج کنورٹر مفت | Img Pilot",
  metaDescription:
    "محفوظ براؤزر پر مبنی امیج کنورٹر سے JPG، PNG اور WebP امیجز آن لائن کنورٹ کریں۔ تیز، مفت اور آسان فارمیٹ کنورژن۔",
  h1: "آن لائن امیجز کنورٹ کریں",
  breadcrumbCurrent: "آن لائن امیجز کنورٹ کریں",
  hero: {
    badge: "ONLINE IMAGE CONVERTER",
    paragraph:
      "JPG، PNG اور WebP امیجز براہِ راست اپنے براؤزر میں کنورٹ کریں۔ امیج اپ لوڈ کریں، آؤٹ پٹ فارمیٹ چنیں اور سافٹ ویئر انسٹال کیے بغیر چند سیکنڈ میں کنورٹ شدہ فائل ڈاؤن لوڈ کریں۔",
    trust: ["JPG", "PNG", "WebP", "نجی پروسیسنگ", "سافٹ ویئر نہیں"],
    uploadCta: "امیجز کنورٹ کریں",
    heroImageAlt:
      "براؤزر امیج کنورٹر جہاں JPG، PNG اور WebP فائلیں کنورژن انجن میں داخل ہو کر کنورٹ شدہ ڈاؤن لوڈز بنتی ہیں",
  },
  guestBar: {
    title: "مہمان استعمال",
    deletionTitle: "خودکار حذف",
    countdownLabel: "عارضی فائلیں خودکار حذف ہوں گی",
  },
  upload: {
    heading: "اپنی امیج اپ لوڈ کریں",
    supporting: "امیج گھسیٹیں یا اپنے ڈیوائس سے براؤز کریں۔",
    chooseLabel: "امیج چنیں",
    formatsHint: "JPG · PNG · WebP · زیادہ سے زیادہ فائل سائز اوپر دکھائی گئی مہمان حدود کے مطابق ہے",
    features: [
      {title: "متعدد فارمیٹس کی قبولیت", body: "JPG، PNG یا WebP اسٹل امیجز سے شروع کریں۔"},
      {title: "آؤٹ پٹ فارمیٹ چنیں", body: "اپ لوڈ کے بعد منزل کا کنٹینر منتخب کریں۔"},
      {title: "نجی پروسیسنگ", body: "فائلیں عارضی نجی اسٹوریج میں رہتی ہیں۔"},
      {title: "خودکار صفائی", body: "مہمان آؤٹ پٹس سیشن کاؤنٹ ڈاؤن کے ساتھ ختم ہوتے ہیں۔"},
    ],
  },
  formats: {
    eyebrow: "سپورٹڈ فارمیٹس",
    title: "روزمرہ ویب فارمیٹس کے لیے ایک کنورٹر",
    cards: [
      {
        title: "JPG",
        body: "فوٹوگرافز، ای میل اور پرانے سسٹمز میں فوٹو شیئرنگ کے لیے ڈیفالٹ انتخاب۔",
      },
      {
        title: "PNG",
        body: "لوگوز، UI عناصر اور گرافکس کے لیے موزوں جہاں تیز کنارے یا شفافیت درکار ہو۔",
      },
      {
        title: "WebP",
        body: "جدید ویب ڈیلیوری فارمیٹ — چھوٹی فائلیں اور ضرورت پڑنے پر شفافیت بھی۔",
      },
    ],
  },
  popular: {
    eyebrow: "مشہور کنورژن ٹولز",
    title: "براہِ راست مخصوص کنورٹر پر جائیں",
    intro:
      "فارمیٹ مخصوص لینڈنگ اور تفصیلی رہنمائی چاہیے؟ یہ high-traffic ٹولز اسی کنورٹ انجن کو استعمال کرتے ہیں جو اس hub پر ہے۔",
    cards: [
      {
        from: "JPG",
        to: "WebP",
        href: "/jpg-to-webp",
        body: "جدید ویب سائٹس اور مہمات کے لیے ہلکی فوٹو ڈیلیوری۔",
      },
      {
        from: "WebP",
        to: "JPG",
        href: "/webp-to-jpg",
        body: "جب پارٹنر WebP نہ کھول سکے تو عالمی JPG دیں۔",
      },
      {
        from: "PNG",
        to: "JPG",
        href: "/png-to-jpg",
        body: "ضرورت ہو تو گرافکس کو مطابقت پذیر فوٹو طرز ڈیلیوری میں فلیٹن کریں۔",
      },
      {
        from: "PNG",
        to: "WebP",
        href: "/png-to-webp",
        body: "ویب اثاثے سکڑاتے ہوئے شفافیت کے راستے رکھیں۔",
      },
      {
        from: "WebP",
        to: "PNG",
        href: "/webp-to-png",
        body: "جب ایڈیٹرز کو چاہیے تو ڈیزائن موافق PNG ایکسپورٹ کریں۔",
      },
    ],
  },
  intro: {
    eyebrow: "امیج فارمیٹ کنورژن",
    title: "سافٹ ویئر انسٹال کیے بغیر امیجز کنورٹ کریں",
    paragraphs: [
      "امیج فارمیٹس اس لیے موجود ہیں کیونکہ ایک انکوڈنگ ہر کام کے لیے یکساں موزوں نہیں ہو سکتی۔ فوٹوگرافز، لوگوز، اسکرین شاٹس اور علامتی تصاویر رنگ، تیز کناروں، شفافیت اور فائل وزن پر مختلف مطالبے رکھتے ہیں۔ کیمرا رول میں ٹھیک لگنے والا فارمیٹ پروڈکٹ کیٹلاگ میں غلط ہو سکتا ہے، اور تیز UI اثاثہ غلط کنٹینر میں بھاری یا دھندلا ہو سکتا ہے۔",
      "مطابقت عملی طور پر لوگ کنورٹ کرنے کی پہلی وجہ ہے۔ کچھ ای میل کلائنٹس، پرنٹرز، CMS پلگ انز اور ڈیسک ٹاپ ایڈیٹرز اب بھی JPG توقع کرتے ہیں۔ دوسرے ورک فلو PNG چاہتے ہیں تاکہ شفاف اوورلیز پر سفید باکس نہ آئے۔ نئی سائٹس اور CDN WebP ترجیح دیتے ہیں کیونکہ یکساں بصری معیار اکثر کم bytes میں آتا ہے۔ کنورژن رجحانات کا پیچھا نہیں — یہ فائل کو اس سسٹم سے ملانا ہے جو اسے کھول، محفوظ یا دکھائے۔",
      "ویب سائٹ کی بہتر کاری دوسری وجہ ہے۔ بڑی media لائبریریز صفحہ سست کرنے کے تیز ترین طریقوں میں سے ایک ہیں۔ فوٹوگرافک مواد کو جدید ڈیلیوری فارمیٹ میں منتقل کرنا، یا oversized PNG فوٹوز صاف کرنا جو lossless encoding کی ضرورت نہیں رکھتیں، mobile networks پر صفحات responsive محسوس کراتی ہیں۔ کنورژن اکیلے resize یا compress کی جگہ نہیں لے سکتی، مگر صحیح شروعاتی فارمیٹ بعد کی optimizations کو درست رکھتا ہے۔",
      "ایڈیٹنگ اور ڈیزائن مختلف ضروریات لاتے ہیں۔ ڈیزائنرز Figma یا اس جیسے ٹولز سے شفاف PNG marks برآمد کرتے ہیں۔ فوٹوگرافرز JPG galleries دیتے ہیں کیونکہ فارمیٹ عالمی ہے۔ پروڈکٹ ٹیمیں production کے لیے WebP لائبریریز میں بدل سکتی ہیں جبکہ editing کے لیے PNG masters رکھتی ہیں۔ براؤزر کنورٹر ہر مشین پر ڈیسک ٹاپ suite انسٹال کیے بغیر ان مراحل کے درمیان منتقل ہونے دیتا ہے۔",
      "شیئرنگ اور collaboration ایسے فارمیٹس کا انعام دیتے ہیں جو بغیر طویل وضاحت کھل جائیں۔ WebP preview نہ کر سکنے والے کلائنٹ کو JPG چاہیے۔ dark-mode logo implement کرنے والے developer کو alpha چاہیے۔ UI text والے اسکرین شاٹس اکثر PNG پر تیز رہتے ہیں، جبکہ lifestyle photography JPG یا WebP کی ہے۔ ہاتھ میں موجود فائل کنورٹ کرنا اکثر واضح ہوتا ہے کہ ہر stakeholder سے اپنے converter انسٹال کروانا۔",
      "WebP جیسے جدید فارمیٹس پرانے فارمیٹس کے ساتھ رہتے ہیں، انہیں مٹاتے نہیں۔ بہت سی ٹیمیں سالوں مخلوط لائبریری چلاتی ہیں: archival فوٹوز JPG، brand kits PNG، public pages WebP۔ یہ mix تب کام کرتا ہے جب کنورژن predictable رہے — یکساں ابعاد، واضح transparent handling، اور عارضی نجی storage تاکہ مہم اثاثے public folder میں نہ رہ جائیں۔",
      "فوٹوگرافی، علامتی تصاویر اور اسکرین شاٹس ہر ایک deliberate انتخاب سے فائدہ اٹھاتے ہیں۔ فوٹوز lossy compression برداشت کر سکتے ہیں جب skin tones اور skies قدرتی لگیں۔ ہموار علامتی تصاویر اور icons اکثر PNG یا alpha والی WebP میں تیز کنارے رکھتے ہیں۔ اسکرین شاٹس درمیان میں ہیں — کبھی photographic UI، کبھی crisp type — اس لیے ٹیمیں convert کرتی ہیں جب منزل blog، ticket tracker یا design critique معلوم ہو۔ Img Pilot یہ فیصلہ براؤزر میں رکھتا ہے: ایک بار اپ لوڈ، آؤٹ پٹ فارمیٹ چنیں، اور نئی فائل ڈاؤن لوڈ کریں جبکہ اصل آپ کے ڈیوائس پر جوں کی توں رہے۔",
    ],
  },
  why: {
    eyebrow: "IMG PILOT کیوں استعمال کریں",
    title: "جدید SaaS ٹول کی طرح بنایا گیا کنورٹر",
    cards: [
      {
        title: "تیز پروسیسنگ",
        body: "ڈیسک ٹاپ export dialog کا انتظار کیے بغیر براؤزر queue میں اسٹل امیج کنورٹ کریں۔",
        icon: "fast",
      },
      {
        title: "براؤزر پر مبنی",
        body: "جہاں پہلے سے کام کرتے ہیں وہیں چلائیں — کوئی installer نہیں، کوئی platform juggling نہیں۔",
        icon: "browser",
      },
      {
        title: "نجی فائلیں",
        body: "مہمان اپ لوڈز عارضی نجی اسٹوریج استعمال کرتے ہیں اور سیشن کاؤنٹ ڈاؤن کے ساتھ صاف ہو جاتے ہیں۔",
        icon: "privacy",
      },
      {
        title: "جدید فارمیٹس",
        body: "مطابقت اور performance ضروریات کے مطابق JPG، PNG اور WebP کے درمیان منتقل ہوں۔",
        icon: "formats",
      },
      {
        title: "انسٹالیشن نہیں",
        body: "ٹیم ممبرز سے format utilities انسٹال کروانے کے بجائے ایک URL شیئر کریں۔",
        icon: "install",
      },
      {
        title: "موبائل دوستانہ",
        body: "بڑے upload controls اور single-column layout فون پر ٹول استعمال رکھتے ہیں۔",
        icon: "mobile",
      },
      {
        title: "بیچ سپورٹ",
        body: "جب ایک فائل کافی نہ ہو، shared-output queues کے لیے Bulk Convert میں جاری رکھیں۔",
        icon: "batch",
      },
      {
        title: "اصل محفوظ",
        body: "ڈاؤن لوڈز نئی کنورٹ شدہ کاپیاں ہیں۔ آپ کے ڈیوائس پر masters unchanged رہتے ہیں۔",
        icon: "safe",
      },
    ],
  },
  howTo: {
    eyebrow: "چار آسان مراحل",
    title: "امیج کنورژن کیسے کام کرتی ہے",
    steps: [
      {
        title: "اپ لوڈ",
        body: "اپنے ڈیوائس، drag-and-drop ایریا یا clipboard paste (جہاں سپورٹ ہو) سے JPG، PNG یا WebP امیج شامل کریں۔",
      },
      {
        title: "فارمیٹ چنیں",
        body: "وہ آؤٹ پٹ کنٹینر منتخب کریں جو منزل سے ملے — مطابقت، شفافیت یا ویب performance۔",
      },
      {
        title: "کنورٹ",
        body: "usage bar میں دکھائی گئی حدود کے تحت shared guest convert engine سے امیج پروسیس کریں۔",
      },
      {
        title: "ڈاؤن لوڈ",
        body: "نئی کنورٹ شدہ فائل محفوظ کریں۔ عارضی مہمان storage صفحے پر کاؤنٹ ڈاؤن کے ساتھ ختم ہوتا ہے۔",
      },
    ],
    imageAlt: "چار مرحلہ امیج کنورژن ورک فلو: اپ لوڈ، فارمیٹ چنیں، کنورٹ اور ڈاؤن لوڈ",
  },
  comparison: {
    title: "سپورٹڈ فارمیٹ موازنہ",
    intro:
      "یہ practical map کے طور پر استعمال کریں، ranking نہیں۔ بہترین فارمیٹ اس بات پر منحصر ہے کہ شفافیت، universal opening یا چھوٹی delivery چاہیے۔",
    caption: "روزمرہ کنورژن فیصلوں کے لیے JPG، PNG اور WebP کا موازنہ",
    columns: [
      "فارمیٹ",
      "شفافیت",
      "کمپریشن",
      "مطابقت",
      "بہترین استعمال",
      "فائل سائز",
      "ایڈیٹنگ",
      "فوٹوگرافی",
      "ویب سائٹس",
    ],
    rows: [
      {
        format: "JPG",
        cells: [
          "JPG",
          "Alpha نہیں",
          "Lossy",
          "تقریباً عالمی",
          "فوٹوز اور شیئرنگ",
          "اکثر PNG فوٹوز سے چھوٹا",
          "وسیع سپورٹ",
          "بہترین",
          "محفوظ ڈیفالٹ",
        ],
      },
      {
        format: "PNG",
        cells: [
          "PNG",
          "ہاں",
          "Lossless-leaning",
          "بہترین",
          "لوگوز، UI، گرافکس",
          "فوٹوز کے لیے بھاری ہو سکتا ہے",
          "ایڈٹس کے لیے بہترین",
          "عام طور پر overkill",
          "جب alpha اہم ہو",
        ],
      },
      {
        format: "WebP",
        cells: [
          "WebP",
          "ہاں (جب استعمال ہو)",
          "جدید lossy/lossless",
          "جدید براؤزرز پر مضبوط",
          "Performance delivery",
          "اکثر سب سے چھوٹا",
          "بڑھتی tool support",
          "مضبوط",
          "جب سپورٹ ہو ترجیح",
        ],
      },
    ],
  },
  guide: {
    title: "صحیح امیج فارمیٹ کا انتخاب",
    paragraphs: [
      "عادت سے نہیں، منزل سے شروع کریں۔ اگر اثاثہ ہر جگہ کھلنا چاہیے، JPG فوٹوگرافک handoff کے لیے محفوظ ترین ہے۔ اگر اثاثہ کسی بھی background color پر سفید باکس کے بغیر بیٹھنا چاہیے، PNG یا WebP سے alpha رکھیں۔ اگر اثاثہ performance-sensitive صفحے پر رہے گا، stack سپورٹ کرے تو WebP ترجیح دیں۔",
      "ارادے سے convert کریں، پھر resize یا compress tools استعمال کریں جب dimensions یا وزن اب بھی کام مانگے۔ فارمیٹ choice اور pixel count متعلقہ کام ہیں — کنٹینر بدلنا خود layout size invent نہیں کرتا۔",
    ],
    sections: [
      {
        title: "JPG کب استعمال کریں",
        body: "فوٹوگرافز، lifestyle shots اور ایسی delivery کے لیے JPG چنیں جہاں شفافیت سے زیادہ maximum compatibility اہم ہو۔",
        links: [
          {href: "/webp-to-jpg", label: "WebP to JPG"},
          {href: "/png-to-jpg", label: "PNG to JPG"},
          {href: "/compress-jpg", label: "Compress JPG"},
          {href: "/resize-jpg", label: "Resize JPG"},
        ],
      },
      {
        title: "PNG کب استعمال کریں",
        body: "لوگوز، icons، UI chrome اور گرافکس کے لیے PNG چنیں جنہیں تیز کنارے یا شفاف background چاہیے۔",
        links: [
          {href: "/webp-to-png", label: "WebP to PNG"},
          {href: "/jpg-to-png", label: "JPG to PNG"},
          {href: "/compress-png", label: "Compress PNG"},
          {href: "/resize-png", label: "Resize PNG"},
        ],
      },
      {
        title: "WebP کب استعمال کریں",
        body: "جدید ویب سائٹس اور مہمات کے لیے WebP چنیں جو چھوٹی فائلوں سے فائدہ اٹھائیں اور ضرورت پڑنے پر شفافیت بھی رکھ سکیں۔",
        links: [
          {href: "/jpg-to-webp", label: "JPG to WebP"},
          {href: "/png-to-webp", label: "PNG to WebP"},
          {href: "/compress-webp", label: "Compress WebP"},
          {href: "/resize-webp", label: "Resize WebP"},
        ],
      },
    ],
  },
  faqHeading: "اکثر پوچھے گئے سوالات",
  faqs: [
    {
      q: "ویب سائٹس کے لیے بہترین امیج فارمیٹ کون سا ہے؟",
      a: "ایک فاتح نہیں۔ WebP اکثر جدید performance کے لیے بہتر ہے جب براؤزرز اور tooling سپورٹ کریں۔ JPG فوٹوگرافک fallback کے طور پر محفوظ ترین ہے۔ PNG تب بہتر ہے جب شفافیت یا تیز UI graphics سب سے چھوٹی فائل سائز سے زیادہ اہم ہوں۔",
    },
    {
      q: "JPG اور PNG میں کیا فرق ہے؟",
      a: "JPG lossy compression استعمال کرتا ہے اور شفافیت نہیں رکھتا، جو فوٹوز کے لیے موزوں ہے۔ PNG تیز کنارے اور alpha رکھتا ہے، جو لوگوز اور UI کے لیے موزوں ہے، مگر photo-like PNGs بڑے ہو سکتے ہیں۔",
    },
    {
      q: "PNG اور WebP میں کیا فرق ہے؟",
      a: "دونوں شفافیت رکھ سکتے ہیں۔ WebP ویب پر one visual role کے لیے اکثر چھوٹی فائلیں بناتا ہے، جبکہ PNG design اور editing tools میں مانوس ہے۔",
    },
    {
      q: "JPG اور WebP میں کیا فرق ہے؟",
      a: "دونوں فوٹوز efficiently deliver کر سکتے ہیں۔ WebP جدید براؤزرز پر similar quality پر عام طور پر چھوٹا ہے، جبکہ JPG پرانے email اور print workflows سمیت ہر جگہ کھلتا ہے۔",
    },
    {
      q: "کون سے فارمیٹس شفافیت سپورٹ کرتے ہیں؟",
      a: "PNG اور WebP alpha channel رکھ سکتے ہیں۔ JPG نہیں — شفاف graphic کو JPG میں convert کرنا اسے solid background پر فلیٹن کر دیتا ہے۔",
    },
    {
      q: "کیا امیج convert کرنا compress کرتا ہے؟",
      a: "encoders مختلف ہونے سے سائز بدل سکتا ہے، مگر یہ Compress Images جیسا control نہیں۔ فارمیٹ lock کرنے کے بعد، جب وزن اب بھی زیادہ ہو compress tools استعمال کریں۔",
    },
    {
      q: "کیا converted امیجز پرانے devices پر compatible رہیں گی؟",
      a: "JPG سب سے compatible فوٹوگرافک choice ہے۔ PNG graphics کے لیے وسیع سپورٹ ہے۔ WebP کو modern clients چاہیے — جب partner WebP نہ کھول سکے JPG یا PNG میں واپس convert کریں۔",
    },
    {
      q: "کیا امیج کنورژن ویب سائٹ performance بہتر بنا سکتی ہے؟",
      a: "زیادہ efficient فارمیٹ چننا اکثر bytes کم کرتا ہے، جس سے صفحے تیز لوڈ ہوتے ہیں۔ dimensions یا quality settings اب بھی tune درکار ہوں تو Resize Images یا Compress Images کے ساتھ جوڑیں۔",
    },
    {
      q: "Img Pilot converter کون سے فارمیٹس سپورٹ کرتا ہے؟",
      a: "مہمان convert JPG، PNG اور WebP still images قبول کرتا ہے اور convert matrix کے مطابق ان containers کو target کر سکتا ہے۔ dedicated pair landings common paths cover کرتے ہیں۔",
    },
    {
      q: "کیا image converter پر اپ لوڈز نجی ہیں؟",
      a: "مہمان فائلیں عارضی نجی storage استعمال کرتی ہیں اور uploader کے اوپر دکھائے گئے retention countdown کے مطابق خودکار حذف ہو جاتی ہیں۔",
    },
    {
      q: "Convert Images کے مہمان limits کیا ہیں؟",
      a: "روزانہ operations اور maximum upload size usage bar میں دکھائی دیتی ہیں۔ زیادہ limits کے لیے account بنانا پڑ سکتا ہے۔",
    },
    {
      q: "کیا convert کرنے سے image quality کم ہوگی؟",
      a: "Lossy paths destination اور quality preset کے مطابق detail ہٹا سکتے ہیں۔ production asset بدلنے سے پہلے نتیجہ preview کریں، خاص طور پر logos اور skin tones کے لیے۔",
    },
    {
      q: "کیا کنورژن metadata محفوظ رکھتی ہے؟",
      a: "مہمان conversion tool panel میں processing results summarize کرتا ہے۔ ہر EXIF یا color-profile detail ہر path میں survive — یہ assume نہ کریں؛ metadata critical ہو تو masters رکھیں۔",
    },
    {
      q: "کیا میں ایک ساتھ بہت سی امیجز convert کر سکتا ہوں؟",
      a: "ہاں۔ جب queue میں ایک shared output format چاہیے تو Bulk Convert Images استعمال کریں، پھر results کا ZIP ڈاؤن لوڈ کریں۔",
    },
    {
      q: "کیا image converter mobile پر کام کرتا ہے؟",
      a: "ہاں۔ hub layout single column میں stack ہوتا ہے اور بڑا upload target فون اور tablets پر بھی convert کرنے دیتا ہے۔",
    },
  ],
  related: {
    eyebrow: "متعلقہ زمرے",
    title: "کنورژن کے بعد optimization جاری رکھیں",
    tools: [
      {href: "/compress-image", title: "Compress Images", body: "فارمیٹ درست ہونے کے بعد فائل وزن کم کریں۔"},
      {href: "/resize-image", title: "Resize Images", body: "layout boxes اور responsive breakpoints کے مطابق امیجز فٹ کریں۔"},
      {href: "/crop-image", title: "Crop Images", body: "فارمیٹ delivery سے پہلے subjects frame کریں۔"},
      {href: "/bulk-convert", title: "Bulk Convert", body: "پوری batches کو ایک output format میں convert کریں۔"},
      {href: "/bulk-resize", title: "Bulk Resize", body: "بہت سی فائلوں میں dimensions normalize کریں۔"},
      {href: "/bulk-compress", title: "Bulk Compress", body: "پوری لائبریری ایک queue میں ہلکی کریں۔"},
    ],
  },
  cta: {
    title: "امیجز کنورٹ کرنے کے لیے تیار ہیں؟",
    body: "اپنی پہلی امیج اپ لوڈ کریں یا advanced tools اور بڑی limits کے لیے مفت اکاؤنٹ بنائیں۔",
    primaryLabel: "امیجز کنورٹ کریں",
    secondaryLabel: "مفت اکاؤنٹ بنائیں",
    secondaryHref: "/register",
  },
};

export function getConvertImageCopy(locale: string): ConvertImageCopy {
  return localizedCopy(locale, {en, ur});
}

export type ConvertImageLocale = AppLocale;
