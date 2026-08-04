/**
 * Approved homepage marketing copy (exact EN from Premium Homepage redesign prompt).
 * Urdu strings are careful translations of the same content — not alternate marketing rewrites.
 */
import type {AppLocale} from "@/i18n/routing";

export type HomeFaq = {q: string; a: string};
export type HomeLink = {href: string; label: string; badge?: string};
export type HomeTool = {
  href: string;
  title: string;
  body: string;
  icon: "compress" | "resize" | "crop" | "convert" | "geotag" | "metadata" | "ai" | "editor" | "bulk";
};
export type HomeTextCard = {title: string; body: string; href?: string};
export type HomeFormatCard = {title: string; body: string; href: string};

export type HomepageCopy = {
  metaTitle: string;
  metaDescription: string;
  heroBadge: string;
  h1: string;
  heroParagraph: string;
  uploadHeading: string;
  uploadSupport: string;
  chooseImage: string;
  pasteHint: string;
  formatLimitLine: string;
  privacyLine: string;
  defaultActionLabel: string;
  trust: HomeTextCard[];
  toolsEyebrow: string;
  toolsHeading: string;
  toolsDescription: string;
  openTool: string;
  tools: HomeTool[];
  formatEyebrow: string;
  formatHeading: string;
  formatDescription: string;
  formats: HomeLink[];
  platformEyebrow: string;
  platformHeading: string;
  platformP1: string;
  platformP2: string;
  platformFeatures: string[];
  whyEyebrow: string;
  whyHeading: string;
  whyIntro: string;
  benefits: HomeTextCard[];
  howEyebrow: string;
  howHeading: string;
  steps: HomeTextCard[];
  beforeHeading: string;
  beforeParagraph: string;
  beforeCaption: string;
  useEyebrow: string;
  useHeading: string;
  useCases: HomeTextCard[];
  seoEyebrow: string;
  seoHeading: string;
  seoP1: string;
  seoP2: string;
  seoLinks: HomeLink[];
  seoDisclaimer: string;
  bulkEyebrow: string;
  bulkHeading: string;
  bulkParagraph: string;
  bulkBullets: string[];
  bulkCta: string;
  bulkNotice: string;
  privacyEyebrow: string;
  privacyHeading: string;
  privacyP1: string;
  privacyP2: string;
  privacyFacts: string[];
  privacyCta: string;
  formatsHeading: string;
  formatsParagraph: string;
  formatCards: HomeFormatCard[];
  faqHeading: string;
  faqs: HomeFaq[];
  finalHeading: string;
  finalParagraph: string;
  finalPrimary: string;
  finalSecondary: string;
  finalTrust: string;
  footerBrand: string;
  footerRights: string;
};

const en: HomepageCopy = {
  metaTitle: "SEO Images — Compress, Resize, Convert and Optimize Images Online",
  metaDescription:
    "Compress, resize, crop, convert and optimize JPG, PNG and WebP images online. Use private guest tools without an account, with automatic deletion within one hour.",
  heroBadge: "Free online image tools for faster, cleaner websites",
  h1: "Optimize Every Image in One Simple Workspace",
  heroParagraph:
    "Compress, resize, crop, convert and optimize your images without installing software. Start free without an account, keep full control of your files, and download clean, verified results in just a few clicks.",
  uploadHeading: "Drop an image here to get started",
  uploadSupport: "Upload a JPG, PNG or WebP image, or paste one directly from your clipboard.",
  chooseImage: "Choose an Image",
  pasteHint: "You can also paste an image with Ctrl + V or ⌘ + V",
  formatLimitLine: "JPG, PNG and WebP • Up to {maxFileSize} • No account required",
  privacyLine: "Your guest files stay private and are automatically deleted within one hour.",
  defaultActionLabel: "Start with Image Compression",
  trust: [
    {title: "No Account Required", body: "Use essential image tools instantly as a guest."},
    {title: "Private Processing", body: "Files remain in protected temporary storage."},
    {title: "Automatic Deletion", body: "Guest files expire within one hour."},
    {title: "Verified Results", body: "Outputs are checked by the server before download."},
  ],
  toolsEyebrow: "Everything you need",
  toolsHeading: "Powerful Image Tools, Ready When You Are",
  toolsDescription:
    "Handle everyday image tasks from one clean workspace. Each tool is designed to be simple for beginners while still giving professionals the controls they need.",
  openTool: "Open tool",
  tools: [
    {href: "/compress-image", title: "Compress Image", body: "Reduce JPG, PNG and WebP file sizes while keeping the result clear and usable.", icon: "compress"},
    {href: "/resize-image", title: "Resize Image", body: "Change image dimensions by width, height or fit-inside settings without unwanted enlargement.", icon: "resize"},
    {href: "/crop-image", title: "Crop Image", body: "Select the exact area you want to keep with free and fixed-ratio crop controls.", icon: "crop"},
    {href: "/convert-image", title: "Convert Image", body: "Convert between JPG, PNG, WebP and supported AVIF formats with safe output verification.", icon: "convert"},
    {href: "/geotag-image", title: "Geotag Image", body: "Add verified GPS coordinates to compatible JPEG images without changing the original.", icon: "geotag"},
    {href: "/image-metadata", title: "Image Metadata Viewer", body: "Inspect dimensions, color information and safe allow-listed image metadata.", icon: "metadata"},
    {href: "/ai-alt-text", title: "AI Alt Text Generator", body: "Generate structured alt text, titles, descriptions and filename ideas when AI is configured.", icon: "ai"},
    {href: "/image-metadata-editor", title: "Image SEO Metadata Editor", body: "Write, review and export image SEO fields for your website or content management system.", icon: "editor"},
    {href: "/bulk-image-tools", title: "Bulk Image Tools", body: "Compress, resize or convert several images and download successful results together.", icon: "bulk"},
  ],
  formatEyebrow: "Popular image tasks",
  formatHeading: "Go Straight to the Format You Need",
  formatDescription:
    "Choose a dedicated tool for your image format or conversion. Your preferred source and output settings will already be selected.",
  formats: [
    {href: "/compress-jpg", label: "Compress JPG", badge: "JPG"},
    {href: "/compress-png", label: "Compress PNG", badge: "PNG"},
    {href: "/compress-webp", label: "Compress WebP", badge: "WebP"},
    {href: "/resize-jpg", label: "Resize JPG", badge: "JPG"},
    {href: "/resize-png", label: "Resize PNG", badge: "PNG"},
    {href: "/resize-webp", label: "Resize WebP", badge: "WebP"},
    {href: "/jpg-to-png", label: "JPG to PNG", badge: "JPG→PNG"},
    {href: "/jpg-to-webp", label: "JPG to WebP", badge: "JPG→WebP"},
    {href: "/png-to-jpg", label: "PNG to JPG", badge: "PNG→JPG"},
    {href: "/png-to-webp", label: "PNG to WebP", badge: "PNG→WebP"},
    {href: "/webp-to-jpg", label: "WebP to JPG", badge: "WebP→JPG"},
    {href: "/webp-to-png", label: "WebP to PNG", badge: "WebP→PNG"},
  ],
  platformEyebrow: "One private image workspace",
  platformHeading: "From Upload to Download Without the Usual Complexity",
  platformP1:
    "SEO Images brings the most useful image workflows into one consistent experience. You do not need to learn a different interface for every task. Upload your image, choose the settings that matter, process it securely and download the verified result.",
  platformP2:
    "The same workflow supports quick single-image jobs, format-specific landing pages and selected bulk operations. Guest tools require no account, while signed-in users can access projects and longer-term workspace features.",
  platformFeatures: [
    "One consistent tool workspace",
    "Clear before-and-after information",
    "Private temporary guest storage",
    "Individual and selected bulk workflows",
    "English and Urdu interfaces",
    "Server-verified outputs",
  ],
  whyEyebrow: "Built around clarity and control",
  whyHeading: "Image Tools That Respect Your Time and Your Files",
  whyIntro:
    "Every workflow is designed to remove unnecessary steps while keeping the important controls visible. You always know what will happen to your image, what the result contains and when temporary files will be removed.",
  benefits: [
    {title: "Start Immediately", body: "Use core guest tools without registration, software installation or a project setup process."},
    {title: "Keep the Original Safe", body: "Processing creates a new result while the uploaded original remains unchanged."},
    {title: "Know What Changed", body: "Compare dimensions, formats and file sizes before downloading the final result."},
    {title: "Work Across Formats", body: "Use dedicated workflows for JPG, PNG and WebP with honest format-specific handling."},
    {title: "Protect Temporary Files", body: "Guest images and generated results are removed automatically within the retention window."},
    {title: "Prepare Images for Search", body: "Review metadata, improve filenames and organize alt text for website and CMS use."},
  ],
  howEyebrow: "Simple from start to finish",
  howHeading: "Finish Your Image Task in Four Clear Steps",
  steps: [
    {title: "Upload Your Image", body: "Choose a supported image, drag it into the workspace or paste it from your clipboard."},
    {title: "Select Your Settings", body: "Choose the format, dimensions, quality, crop area or metadata options required for your task."},
    {title: "Process Securely", body: "The server performs and verifies the operation while showing clear progress and error states."},
    {title: "Download the Result", body: "Review the final details, download your file and process another image whenever needed."},
  ],
  beforeHeading: "See the Difference Before You Download",
  beforeParagraph:
    "Clear result summaries help you understand what changed. Compare the original image with the processed version, review file size or dimensions and download only when the output matches your needs.",
  beforeCaption: "Product illustration — example only. Actual savings vary by image.",
  useEyebrow: "Designed for real work",
  useHeading: "Prepare Images for Websites, Content and Everyday Sharing",
  useCases: [
    {title: "Websites", body: "Reduce unnecessary image weight and prepare consistent dimensions for faster, cleaner pages."},
    {title: "Online stores", body: "Organize product image formats, filenames, dimensions and metadata before publishing."},
    {title: "Social content", body: "Resize and crop images into practical aspect ratios for posts, thumbnails and campaigns."},
    {title: "Blogs and publishers", body: "Create lighter article images and prepare accessible, descriptive image text."},
    {title: "Email and documents", body: "Reduce large files so images are easier to attach, share and include in presentations."},
    {title: "Local SEO", body: "Inspect metadata, add verified JPEG coordinates and organize image SEO information for local content workflows."},
  ],
  seoEyebrow: "More than basic editing",
  seoHeading: "Turn Ordinary Images Into Better Website Assets",
  seoP1:
    "Image optimization is not only about reducing file size. Clear filenames, accurate alternative text, appropriate dimensions and useful metadata can make image libraries easier to manage and website content more accessible.",
  seoP2:
    "SEO Images includes tools for inspecting metadata, drafting image SEO fields, generating structured AI suggestions when configured and exporting information for use in a website or CMS.",
  seoLinks: [
    {href: "/ai-alt-text", label: "Generate AI Alt Text"},
    {href: "/image-metadata", label: "View Image Metadata"},
    {href: "/image-metadata-editor", label: "Edit Image SEO Metadata"},
    {href: "/geotag-image", label: "Geotag a JPEG"},
  ],
  seoDisclaimer:
    "SEO and accessibility tools provide assistance and recommendations. They do not guarantee search rankings or automatic compliance.",
  bulkEyebrow: "Working with more than one image?",
  bulkHeading: "Process a Small Batch Without Repeating Every Step",
  bulkParagraph:
    "Use Bulk Image Tools to compress, resize or convert several supported images with one shared set of options. Review each file separately, download individual results or collect successful outputs in a ZIP archive.",
  bulkBullets: [
    "Bulk Compress",
    "Bulk Resize",
    "Bulk Convert",
    "Per-file processing status",
    "Individual downloads",
    "ZIP archive for successful results",
  ],
  bulkCta: "Open Bulk Image Tools",
  bulkNotice: "Guest bulk limits apply. Larger workflows may require an account.",
  privacyEyebrow: "Privacy by design",
  privacyHeading: "Temporary Files Should Stay Temporary",
  privacyP1:
    "Guest uploads are stored privately while your selected tool is working. Your image, generated outputs and temporary result data expire within one hour. Downloading, refreshing or reprocessing does not extend that deadline.",
  privacyP2:
    "Guest sessions do not create a permanent image library. Sign in only when you need projects or longer-term account features.",
  privacyFacts: [
    "Private temporary object storage",
    "Short-lived previews and downloads",
    "No public guest image URL",
    "Automatic cleanup",
    "No permanent guest history",
    "Original files remain unchanged during processing",
  ],
  privacyCta: "Read Our Privacy Policy",
  formatsHeading: "Work With the Image Formats You Use Most",
  formatsParagraph:
    "Core guest tools support JPG, PNG and WebP images. Available output formats and metadata features depend on the selected operation and the capabilities of each image format.",
  formatCards: [
    {title: "JPG", body: "A practical format for photographs, web content and smaller lossy image files.", href: "/compress-jpg"},
    {title: "PNG", body: "A lossless format commonly used for graphics and images that require transparency.", href: "/compress-png"},
    {title: "WebP", body: "A modern web format that can provide efficient compression with optional transparency.", href: "/compress-webp"},
    {title: "AVIF", body: "Available for supported conversion workflows when the server runtime can encode and verify it.", href: "/jpg-to-avif"},
  ],
  faqHeading: "Frequently asked questions",
  faqs: [
    {
      q: "Do I need an account to use SEO Images?",
      a: "No. Core guest tools can be used without creating an account. Guest limits apply, and account features are available when you need saved projects or higher workflow limits.",
    },
    {
      q: "How long are guest images stored?",
      a: "Guest images and temporary results expire within one hour. Downloading, refreshing or reprocessing does not extend that deadline.",
    },
    {
      q: "Will processing overwrite my original image?",
      a: "No. Processing creates a separate result. The uploaded original remains unchanged during the active guest session.",
    },
    {
      q: "Which image formats are supported?",
      a: "Core tools support JPG, PNG and WebP. Some conversion workflows may also support AVIF when the server can encode and verify the result.",
    },
    {
      q: "Can I process several images together?",
      a: "Yes. Bulk Image Tools support selected compress, resize and convert workflows. Guest batch limits apply.",
    },
    {
      q: "Does compressing an image always make it smaller?",
      a: "Not always. The final size depends on the original image, its format and the selected settings. SEO Images reports the actual result honestly, including when an output is larger.",
    },
    {
      q: "Is alt text embedded inside the image?",
      a: "Alt text is normally added to a website or CMS record rather than universally embedded in the image file. The Metadata Editor helps you prepare and export it for use on your website.",
    },
    {
      q: "Does image optimization guarantee better search rankings?",
      a: "No. Image optimization can support performance, organization and accessibility, but no individual image tool can guarantee search rankings.",
    },
  ] satisfies HomeFaq[],
  finalHeading: "Your Next Image Is Ready to Be Optimized",
  finalParagraph:
    "Upload a JPG, PNG or WebP image and complete your task without installing software or creating an account.",
  finalPrimary: "Choose an Image",
  finalSecondary: "Explore All Image Tools",
  finalTrust: "Private guest processing • Automatic one-hour deletion • No watermark",
  footerBrand:
    "Private online tools for compressing, resizing, converting and preparing images for the web.",
  footerRights: "© {year} SEO Images. All rights reserved.",
};

const ur: HomepageCopy = {
  ...en,
  metaTitle: "SEO Images — تصاویر آن لائن کمپریس، ری سائز، کنورٹ اور بہتر بنائیں",
  metaDescription:
    "JPG، PNG اور WebP تصاویر آن لائن کمپریس، ری سائز، کراپ، کنورٹ اور بہتر بنائیں۔ بغیر اکاؤنٹ نجی مہمان ٹولز استعمال کریں؛ فائلیں ایک گھنٹے میں خودکار حذف ہوتی ہیں۔",
  heroBadge: "تیز اور صاف ویب سائٹس کے لیے مفت آن لائن امیج ٹولز",
  h1: "ہر تصویر ایک سادہ ورک اسپیس میں بہتر بنائیں",
  heroParagraph:
    "سافٹ ویئر انسٹال کیے بغیر تصاویر کمپریس، ری سائز، کراپ، کنورٹ اور بہتر بنائیں۔ بغیر اکاؤنٹ مفت شروع کریں، فائلوں پر مکمل کنٹرول رکھیں، اور چند کلکس میں تصدیق شدہ نتائج ڈاؤن لوڈ کریں۔",
  uploadHeading: "شروع کرنے کے لیے یہاں تصویر ڈراپ کریں",
  uploadSupport: "JPG، PNG یا WebP تصویر اپ لوڈ کریں، یا کلپ بورڈ سے پیسٹ کریں۔",
  chooseImage: "تصویر منتخب کریں",
  pasteHint: "آپ Ctrl + V یا ⌘ + V سے بھی تصویر پیسٹ کر سکتے ہیں",
  formatLimitLine: "JPG، PNG اور WebP • زیادہ سے زیادہ {maxFileSize} • اکاؤنٹ درکار نہیں",
  privacyLine: "آپ کی مہمان فائلیں نجی رہتی ہیں اور ایک گھنٹے میں خودکار حذف ہو جاتی ہیں۔",
  defaultActionLabel: "امیج کمپریشن سے شروع کریں",
  trust: [
    {title: "اکاؤنٹ درکار نہیں", body: "ضروری امیج ٹولز فوراً مہمان کے طور پر استعمال کریں۔"},
    {title: "نجی پروسیسنگ", body: "فائلیں محفوظ عارضی اسٹوریج میں رہتی ہیں۔"},
    {title: "خودکار حذف", body: "مہمان فائلیں ایک گھنٹے میں ختم ہو جاتی ہیں۔"},
    {title: "تصدیق شدہ نتائج", body: "ڈاؤن لوڈ سے پہلے آؤٹ پٹ سرور پر چیک ہوتے ہیں۔"},
  ],
  toolsEyebrow: "سب کچھ ایک جگہ",
  toolsHeading: "طاقتور امیج ٹولز، جب آپ تیار ہوں",
  toolsDescription:
    "روزانہ کی امیج ٹاسکس ایک صاف ورک اسپیس سے نمٹائیں۔ ہر ٹول ابتدائی صارفین کے لیے سادہ ہے اور پیشہ ور افراد کو مطلوب کنٹرول بھی دیتا ہے۔",
  openTool: "ٹول کھولیں",
  tools: en.tools.map((t) => ({...t})),
  finalHeading: "آپ کی اگلی تصویر بہتر بنانے کے لیے تیار ہے",
  finalParagraph:
    "JPG، PNG یا WebP تصویر اپ لوڈ کریں اور سافٹ ویئر یا اکاؤنٹ کے بغیر اپنا کام مکمل کریں۔",
  finalPrimary: "تصویر منتخب کریں",
  finalSecondary: "تمام امیج ٹولز دیکھیں",
  finalTrust: "نجی مہمان پروسیسنگ • ایک گھنٹے کی خودکار حذف • بغیر واٹر مارک",
  footerBrand: "ویب کے لیے تصاویر کمپریس، ری سائز، کنورٹ اور تیار کرنے کے نجی آن لائن ٹولز۔",
  footerRights: "© {year} SEO Images. جملہ حقوق محفوظ ہیں۔",
  faqHeading: "اکثر پوچھے گئے سوالات",
  faqs: [
    {
      q: "کیا SEO Images استعمال کرنے کے لیے اکاؤنٹ چاہیے؟",
      a: "نہیں۔ بنیادی مہمان ٹولز بغیر اکاؤنٹ استعمال ہو سکتے ہیں۔ مہمان حدود لاگو ہوتی ہیں، اور محفوظ پروجیکٹس یا زیادہ حدود کے لیے اکاؤنٹ دستیاب ہے۔",
    },
    {
      q: "مہمان تصاویر کب تک محفوظ رہتی ہیں؟",
      a: "مہمان تصاویر اور عارضی نتائج ایک گھنٹے میں ختم ہو جاتے ہیں۔ ڈاؤن لوڈ، ریفریش یا دوبارہ پروسیس اس مہلت کو نہیں بڑھاتا۔",
    },
    {
      q: "کیا پروسیسنگ اصل تصویر کو اوور رائٹ کرے گی؟",
      a: "نہیں۔ پروسیسنگ الگ نتیجہ بناتی ہے۔ اپ لوڈ شدہ اصل فعال مہمان سیشن کے دوران برقرار رہتی ہے۔",
    },
    {
      q: "کون سے امیج فارمیٹس سپورٹ ہیں؟",
      a: "بنیادی ٹولز JPG، PNG اور WebP سپورٹ کرتے ہیں۔ کچھ کنورژن ورک فلو AVIF بھی سپورٹ کر سکتے ہیں جب سرور انکوڈ اور تصدیق کر سکے۔",
    },
    {
      q: "کیا میں ایک ساتھ کئی تصاویر پروسیس کر سکتا/سکتی ہوں؟",
      a: "ہاں۔ Bulk Image Tools منتخب کمپریس، ری سائز اور کنورٹ ورک فلو سپورٹ کرتے ہیں۔ مہمان بیچ حدود لاگو ہوتی ہیں۔",
    },
    {
      q: "کیا کمپریس ہمیشہ فائل چھوٹی بناتا ہے؟",
      a: "ہمیشہ نہیں۔ حتمی سائز اصل تصویر، فارمیٹ اور سیٹنگز پر منحصر ہے۔ SEO Images اصل نتیجہ ایمانداری سے دکھاتا ہے، بشمول جب آؤٹ پٹ بڑا ہو۔",
    },
    {
      q: "کیا alt text تصویر کے اندر ایمبیڈ ہوتا ہے؟",
      a: "Alt text عموماً ویب سائٹ یا CMS ریکارڈ میں شامل ہوتا ہے، تصویری فائل میں ہمیشہ نہیں۔ Metadata Editor اسے ویب سائٹ کے لیے تیار اور ایکسپورٹ کرنے میں مدد دیتا ہے۔",
    },
    {
      q: "کیا امیج آپٹیمائزیشن بہتر سرچ رینکنگ کی ضمانت دیتی ہے؟",
      a: "نہیں۔ امیج آپٹیمائزیشن کارکردگی، تنظیم اور رسائی میں مدد دے سکتی ہے، مگر کوئی ٹول سرچ رینکنگ کی ضمانت نہیں دے سکتا۔",
    },
  ],
  platformEyebrow: "ایک نجی امیج ورک اسپیس",
  platformHeading: "اپ لوڈ سے ڈاؤن لوڈ تک بغیر غیر ضروری پیچیدگی",
  platformP1:
    "SEO Images سب سے مفید امیج ورک فلو ایک مستقل تجربے میں لاتا ہے۔ ہر کام کے لیے الگ انٹرفیس سیکھنے کی ضرورت نہیں۔ تصویر اپ لوڈ کریں، اہم سیٹنگز چنیں، محفوظ طریقے سے پروسیس کریں اور تصدیق شدہ نتیجہ ڈاؤن لوڈ کریں۔",
  platformP2:
    "یہی ورک فلو تیز سنگل امیج کام، فارمیٹ لینڈنگ صفحات اور منتخب بلک آپریشنز کو سپورٹ کرتا ہے۔ مہمان ٹولز کے لیے اکاؤنٹ درکار نہیں، جبکہ سائنڈ ان صارفین پروجیکٹس اور طویل مدتی فیچرز استعمال کر سکتے ہیں۔",
  platformFeatures: [
    "ایک مستقل ٹول ورک اسپیس",
    "صاف قبل از بعد معلومات",
    "نجی عارضی مہمان اسٹوریج",
    "انفرادی اور منتخب بلک ورک فلو",
    "انگریزی اور اردو انٹرفیس",
    "سرور تصدیق شدہ آؤٹ پٹ",
  ],
  whyEyebrow: "وضاحت اور کنٹرول کے گرد بنایا گیا",
  whyHeading: "ایسے امیج ٹولز جو آپ کے وقت اور فائلوں کا احترام کریں",
  whyIntro:
    "ہر ورک فلو غیر ضروری قدم ہٹاتا ہے جبکہ اہم کنٹرول نظر انداز نہیں ہوتے۔ آپ جانتے ہیں تصویر کے ساتھ کیا ہوگا، نتیجہ کیا ہوگا اور عارضی فائلیں کب ہٹیں گی۔",
  benefits: [
    {title: "فوراً شروع کریں", body: "رجسٹریشن، سافٹ ویئر انسٹال یا پروجیکٹ سیٹ اپ کے بغیر بنیادی مہمان ٹولز استعمال کریں۔"},
    {title: "اصل محفوظ رکھیں", body: "پروسیسنگ نیا نتیجہ بناتی ہے جبکہ اپ لوڈ شدہ اصل برقرار رہتی ہے۔"},
    {title: "جانیں کیا بدلا", body: "ڈاؤن لوڈ سے پہلے ڈائمنشنز، فارمیٹس اور فائل سائز کا موازنہ کریں۔"},
    {title: "مختلف فارمیٹس پر کام", body: "JPG، PNG اور WebP کے لیے مخصوص ورک فلو ایماندارانہ فارمیٹ ہینڈلنگ کے ساتھ۔"},
    {title: "عارضی فائلوں کا تحفظ", body: "مہمان تصاویر اور نتائج خود بخود ریٹینشن ونڈو میں ہٹا دیے جاتے ہیں۔"},
    {title: "تلاش کے لیے تصاویر تیار کریں", body: "میٹا ڈیٹا دیکھیں، فائل نام بہتر کریں اور ویب/CMS کے لیے alt text منظم کریں۔"},
  ],
  howEyebrow: "شروع سے آخر تک آسان",
  howHeading: "چار واضح قدموں میں امیج ٹاسک مکمل کریں",
  steps: [
    {title: "تصویر اپ لوڈ کریں", body: "سپورٹڈ تصویر چنیں، ورک اسپیس میں ڈریگ کریں یا کلپ بورڈ سے پیسٹ کریں۔"},
    {title: "سیٹنگز منتخب کریں", body: "فارمیٹ، ڈائمنشنز، کوالٹی، کراپ یا میٹا ڈیٹا آپشنز چنیں۔"},
    {title: "محفوظ پروسیس", body: "سرور آپریشن انجام دیتا اور تصدیق کرتا ہے، واضح پیشرفت اور غلطیوں کے ساتھ۔"},
    {title: "نتیجہ ڈاؤن لوڈ کریں", body: "تفصیلات دیکھیں، فائل ڈاؤن لوڈ کریں اور جب چاہیں اگلی تصویر پروسیس کریں۔"},
  ],
  beforeHeading: "ڈاؤن لوڈ سے پہلے فرق دیکھیں",
  beforeParagraph:
    "صاف نتیجہ خلاصے بتاتے ہیں کیا بدلا۔ اصل اور پروسیس شدہ تصویر کا موازنہ کریں، سائز یا ڈائمنشنز دیکھیں، اور صرف ضرورت پورا ہونے پر ڈاؤن لوڈ کریں۔",
  beforeCaption: "پروڈکٹ وضاحتی مثال — اصل بچت تصویر کے مطابق مختلف ہوتی ہے۔",
  useEyebrow: "حقیقی کام کے لیے",
  useHeading: "ویب سائٹس، مواد اور روزمرہ شیئرنگ کے لیے تصاویر تیار کریں",
  useCases: [
    {title: "ویب سائٹس", body: "غیر ضروری وزن کم کریں اور تیز صفحات کے لیے یکساں ڈائمنشنز تیار کریں۔"},
    {title: "آن لائن اسٹورز", body: "اشاعت سے پہلے پروڈکٹ امیج فارمیٹس، فائل نام، ڈائمنشنز اور میٹا ڈیٹا منظم کریں۔"},
    {title: "سوشل مواد", body: "پوسٹس، تھمب نیلز اور مہمات کے لیے عملی آسپیکٹ ریشو میں ری سائز اور کراپ کریں۔"},
    {title: "بلاگز اور پبلشرز", body: "ہلکی آرٹیکل تصاویر بنائیں اور قابلِ رسائی وضاحتی ٹیکسٹ تیار کریں۔"},
    {title: "ای میل اور دستاویزات", body: "بڑی فائلیں کم کریں تاکہ منسلکہ اور پیشکشیں آسان ہوں۔"},
    {title: "لوکل SEO", body: "میٹا ڈیٹا دیکھیں، تصدیق شدہ JPEG کوآرڈینیٹس شامل کریں اور لوکل مواد کے لیے امیج SEO منظم کریں۔"},
  ],
  seoEyebrow: "بنیادی ایڈیٹنگ سے زیادہ",
  seoHeading: "عام تصاویر کو بہتر ویب اثاثے بنائیں",
  seoP1:
    "امیج آپٹیمائزیشن صرف فائل سائز کم کرنا نہیں۔ واضح فائل نام، درست alt text، مناسب ڈائمنشنز اور مفید میٹا ڈیٹا امیج لائبریری اور رسائی کو بہتر بنا سکتے ہیں۔",
  seoP2:
    "SEO Images میٹا ڈیٹا معائنہ، SEO فیلڈز مسودہ، کنفیگر ہونے پر AI تجاویز، اور ویب/CMS کے لیے ایکسپورٹ کے ٹولز فراہم کرتا ہے۔",
  seoLinks: [
    {href: "/ai-alt-text", label: "AI Alt Text بنائیں"},
    {href: "/image-metadata", label: "امیج میٹا ڈیٹا دیکھیں"},
    {href: "/image-metadata-editor", label: "امیج SEO میٹا ڈیٹا ایڈٹ کریں"},
    {href: "/geotag-image", label: "JPEG جیو ٹیگ کریں"},
  ],
  seoDisclaimer:
    "SEO اور رسائی کے ٹولز مدد اور سفارشات دیتے ہیں۔ وہ سرچ رینکنگ یا خودکار تعمیل کی ضمانت نہیں دیتے۔",
  bulkEyebrow: "ایک سے زیادہ تصاویر؟",
  bulkHeading: "ہر قدم دہرائے بغیر چھوٹا بیچ پروسیس کریں",
  bulkParagraph:
    "Bulk Image Tools سے کئی سپورٹڈ تصاویر پر مشترکہ آپشنز سے کمپریس، ری سائز یا کنورٹ کریں۔ ہر فائل الگ دیکھیں، انفرادی ڈاؤن لوڈ کریں یا کامیاب نتائج ZIP میں جمع کریں۔",
  bulkBullets: [
    "بلک کمپریس",
    "بلک ری سائز",
    "بلک کنورٹ",
    "فی فائل پروسیسنگ اسٹیٹس",
    "انفرادی ڈاؤن لوڈز",
    "کامیاب نتائج کے لیے ZIP",
  ],
  bulkCta: "Bulk Image Tools کھولیں",
  bulkNotice: "مہمان بلک حدود لاگو ہیں۔ بڑے ورک فلو کے لیے اکاؤنٹ درکار ہو سکتا ہے۔",
  privacyEyebrow: "ڈیزائن سے ہی پرائیویسی",
  privacyHeading: "عارضی فائلیں عارضی ہی رہنی چاہئیں",
  privacyP1:
    "مهhman اپ لوڈز نجی طور پر محفوظ رہتے ہیں جب منتخب ٹول کام کر رہا ہو۔ تصویر، آؤٹ پٹ اور عارضی ڈیٹا ایک گھنٹے میں ختم ہو جاتے ہیں۔ ڈاؤن لوڈ، ریفریش یا دوبارہ پروسیس اس مہلت کو نہیں بڑھاتا۔",
  privacyP2:
    "مہمان سیشن مستقل امیج لائبریری نہیں بناتے۔ صرف پروجیکٹس یا طویل مدتی فیچرز کے لیے سائن ان کریں۔",
  privacyFacts: [
    "نجی عارضی آبجیکٹ اسٹوریج",
    "مختصر مدت کے پریویو اور ڈاؤن لوڈ",
    "کوئی عوامی مہمان امیج URL نہیں",
    "خودکار صفائی",
    "کوئی مستقل مہمان ہسٹری نہیں",
    "پروسیسنگ کے دوران اصل فائلیں برقرار",
  ],
  privacyCta: "پرائیویسی پالیسی پڑھیں",
  formatsHeading: "سب سے زیادہ استعمال ہونے والے امیج فارمیٹس کے ساتھ کام کریں",
  formatsParagraph:
    "بنیادی مہمان ٹولز JPG، PNG اور WebP سپورٹ کرتے ہیں۔ دستیاب آؤٹ پٹ فارمیٹس اور میٹا ڈیٹا فیچرز منتخب آپریشن اور فارمیٹ کی صلاحیتوں پر منحصر ہیں۔",
  formatCards: [
    {title: "JPG", body: "فوٹوز، ویب مواد اور چھوٹی لوسی تصاویر کے لیے عملی فارمیٹ۔", href: "/compress-jpg"},
    {title: "PNG", body: "گرافکس اور شفافیت والی تصاویر کے لیے عام لاسلیس فارمیٹ۔", href: "/compress-png"},
    {title: "WebP", body: "جدید ویب فارمیٹ جو مؤثر کمپریشن اور اختیاری شفافیت دے سکتا ہے۔", href: "/compress-webp"},
    {title: "AVIF", body: "سپورٹڈ کنورژن ورک فلو میں دستیاب جب سرور انکوڈ اور تصدیق کر سکے۔", href: "/jpg-to-avif"},
  ],
  formatEyebrow: "مشہور امیج ٹاسکس",
  formatHeading: "براہِ راست مطلوبہ فارمیٹ پر جائیں",
  formatDescription:
    "اپنے امیج فارمیٹ یا کنورژن کے لیے مخصوص ٹول چنیں۔ سورس اور آؤٹ پٹ سیٹنگز پہلے ہی منتخب ہوں گی۔",
  formats: en.formats.map((f) => ({...f})),
};

// Fix the accidental bad field and fill remaining UR tool descriptions with exact EN titles
// (tool product names stay English for recognition) + UR bodies:
const urTools = [
  {...en.tools[0], body: "نتیجہ واضح رکھتے ہوئے JPG، PNG اور WebP فائل سائز کم کریں۔"},
  {...en.tools[1], body: "چوڑائی، اونچائی یا fit-inside سیٹنگز سے ڈائمنشنز بدلیں بغیر غیر مطلوب انلاجمنٹ کے۔"},
  {...en.tools[2], body: "فری اور فکسڈ ریشو کراپ کنٹرولز سے وہی حصہ رکھیں جو آپ چاہتے ہیں۔"},
  {...en.tools[3], body: "JPG، PNG، WebP اور سپورٹڈ AVIF کے درمیان محفوظ تصدیق کے ساتھ کنورٹ کریں۔"},
  {...en.tools[4], body: "اصل تبدیل کیے بغیر موافق JPEG میں تصدیق شدہ GPS شامل کریں۔"},
  {...en.tools[5], body: "ڈائمنشنز، رنگ معلومات اور محفوظ allow-listed میٹا ڈیٹا دیکھیں۔"},
  {...en.tools[6], body: "AI کنفیگر ہونے پر منظم alt text، عنوانات، وضاحتیں اور فائل نام تجاویز بنائیں۔"},
  {...en.tools[7], body: "ویب سائٹ یا CMS کے لیے امیج SEO فیلڈز لکھیں، جائزہ لیں اور ایکسپورٹ کریں۔"},
  {...en.tools[8], body: "کئی تصاویر کمپریس، ری سائز یا کنورٹ کریں اور کامیاب نتائج اکٹھے ڈاؤن لوڈ کریں۔"},
] as HomeTool[];

export function getHomepageCopy(locale: AppLocale): HomepageCopy {
  if (locale === "ur") {
    return {
      ...ur,
      tools: urTools,
      privacyP1: ur.privacyP1.replace("مهhman", "مہمان"),
    };
  }
  return en;
}
