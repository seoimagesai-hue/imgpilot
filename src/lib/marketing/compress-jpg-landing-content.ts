import {localizedCopy} from "@/lib/marketing/localized-copy";
/**
 * Compress JPG landing copy — English + natural Urdu (RTL-ready).
 * Processing stays on LandingToolWorkspace; this module is marketing + SEO only.
 */
import type {AppLocale} from "@/i18n/routing";

export type CompressJpgFaq = {q: string; a: string};

export type CompressJpgCopy = {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  breadcrumbParent: {href: "/compress-image"; label: string};
  hero: {
    badge: string;
    paragraph: string;
    supporting: string;
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
    originalLabel: string;
    compressedLabel: string;
    dimensionsLabel: string;
    formatLabel: string;
    sizeLabel: string;
    reducedBy: string;
    placeholderHint: string;
    explanation: string;
  };
  benefits: {
    eyebrow: string;
    title: string;
    intro: string;
    cards: {
      title: string;
      body: string;
      icon: "speed" | "bandwidth" | "quality" | "share" | "privacy" | "safe";
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
  quality: {
    title: string;
    paragraphs: string[];
    scales: {title: string; items: string[]}[];
    noteTitle: string;
    noteBefore: string;
    noteLink: string;
    noteAfter: string;
  };
  tips: {
    eyebrow: string;
    title: string;
    items: string[];
  };
  formats: {
    eyebrow: string;
    title: string;
    cards: {title: string; body: string}[];
    conclusionBefore: string;
    conclusionLink: string;
    conclusionAfter: string;
  };
  faqHeading: string;
  faqs: CompressJpgFaq[];
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

const en: CompressJpgCopy = {
  metaTitle: "Compress JPG Images Online Free | Img Pilot",
  metaDescription:
    "Compress JPG images online and reduce file size with adjustable quality controls. Preview the result and download a smaller optimized JPG securely.",
  h1: "Compress JPG Images Online",
  breadcrumbParent: {href: "/compress-image", label: "Compress Image"},
  hero: {
    badge: "JPG IMAGE COMPRESSOR",
    paragraph:
      "Reduce the file size of JPG images directly in your browser without installing complicated software. Upload a photo, choose your preferred compression level and download a smaller JPG that is easier to use on websites, online stores, emails and social media.",
    supporting:
      "Your original image remains unchanged, and temporary guest files are deleted automatically after the configured storage period.",
    trust: [
      "No software installation",
      "Adjustable JPG quality",
      "Private temporary processing",
      "Original image stays unchanged",
    ],
    uploadCta: "Upload JPG Image",
    heroImageAlt: "JPG compression interface showing a smaller optimized image file",
  },
  guestBar: {
    title: "Guest usage",
    deletionTitle: "Automatic deletion",
    countdownLabel: "Temporary files delete automatically in",
  },
  upload: {
    heading: "Upload a JPG image",
    supporting:
      "Drag and drop an image here, paste it from your clipboard or select a file from your device.",
    chooseLabel: "Choose Image",
    formatsHint: "JPG, PNG and WebP supported · Maximum file size 10 MB",
    features: [
      {
        title: "Private processing",
        body: "Uploaded files are not added to a public image gallery.",
      },
      {
        title: "Automatic deletion",
        body: "Guest files are removed automatically after temporary storage expires.",
      },
      {
        title: "Original remains safe",
        body: "A new compressed copy is created for download.",
      },
      {
        title: "No installation",
        body: "Compress images from a modern web browser.",
      },
    ],
  },
  intro: {
    eyebrow: "FASTER IMAGES, SMALLER FILES",
    title: "Reduce JPG File Size Without Complicated Editing",
    paragraphs: [
      "Large JPG files can slow down websites, make email attachments harder to send and use unnecessary storage space. Images exported from cameras, design tools and smartphones are often saved at a higher quality than most online uses require.",
      "This JPG compressor reduces the amount of data stored inside an image while keeping the photo visually useful. You can choose a balanced preset or adjust the JPG quality manually according to your requirements.",
      "The tool creates a new compressed JPG file. Your original image remains unchanged on your device.",
    ],
    imageAlt: "Comparison between an original JPG and a smaller compressed JPG",
  },
  comparison: {
    eyebrow: "SEE THE DIFFERENCE",
    title: "Compare the Original and Compressed JPG",
    originalLabel: "Original Image",
    compressedLabel: "Compressed Image",
    dimensionsLabel: "Dimensions",
    formatLabel: "Format",
    sizeLabel: "File size",
    reducedBy: "File size reduced by {percent}%",
    placeholderHint: "Upload and compress an image to see live before-and-after file sizes here.",
    explanation:
      "The visual difference between two JPG quality levels may be small even when the file-size reduction is significant. Always preview important details before downloading the final image.",
  },
  benefits: {
    eyebrow: "WHY COMPRESS JPG IMAGES",
    title: "Optimized Images for Faster Digital Experiences",
    intro:
      "Smaller image files are easier to upload, share, store and deliver across websites and online platforms.",
    cards: [
      {
        title: "Faster Website Loading",
        body: "Smaller JPG files require less data to download, which can improve the loading experience for website visitors.",
        icon: "speed",
      },
      {
        title: "Lower Bandwidth Usage",
        body: "Optimized images reduce the amount of data transferred when users open pages, emails or online documents.",
        icon: "bandwidth",
      },
      {
        title: "Adjustable Image Quality",
        body: "Choose a balanced preset or manually adjust JPG quality based on how the image will be used.",
        icon: "quality",
      },
      {
        title: "Easier File Sharing",
        body: "Compressed images are more convenient to send through email, messaging platforms and client portals.",
        icon: "share",
      },
      {
        title: "Private Temporary Processing",
        body: "Guest files are kept in temporary private storage and deleted automatically according to the displayed retention period.",
        icon: "privacy",
      },
      {
        title: "Original File Remains Unchanged",
        body: "The compressor creates a separate optimized file and does not overwrite the image stored on your device.",
        icon: "safe",
      },
    ],
  },
  howTo: {
    eyebrow: "THREE SIMPLE STEPS",
    title: "How to Compress a JPG Image",
    steps: [
      {
        title: "Upload Your Image",
        body: "Choose a JPG, PNG or WebP image from your device, drag it into the upload area or paste it from your clipboard.",
      },
      {
        title: "Choose the Compression Level",
        body: "Select a preset or adjust JPG quality manually. Preview the image and compare the estimated or processed file size.",
      },
      {
        title: "Download the Smaller JPG",
        body: "Process the image and download a new compressed JPG while keeping the original file unchanged.",
      },
    ],
    imageAlt: "Three steps for uploading, compressing and downloading a JPG image",
  },
  useCases: {
    eyebrow: "MADE FOR EVERYDAY IMAGE TASKS",
    title: "When Should You Compress a JPG?",
    cards: [
      {
        title: "Website Images",
        body: "Reduce the size of hero images, blog graphics and page illustrations before publishing them online.",
      },
      {
        title: "Product Photos",
        body: "Optimize online-store images so product pages can load more efficiently without unnecessarily large files.",
      },
      {
        title: "Email Attachments",
        body: "Create smaller image attachments that are easier to send and download.",
      },
      {
        title: "Social Media and Client Work",
        body: "Prepare lighter image files for social posts, presentations, client approvals and online platforms.",
      },
    ],
  },
  quality: {
    title: "How JPG Compression Affects Image Quality",
    paragraphs: [
      "JPG is a lossy image format. This means some image information is removed when a photo is compressed. Stronger compression usually creates a smaller file, but it can also introduce visible softness, block patterns or colour changes.",
      "For photographs, a moderate JPG quality setting often provides a useful balance between image clarity and file size. Images containing small text, diagrams, screenshots or sharp interface elements may require a higher quality level.",
      "The best setting depends on the image and its intended use. Preview the processed result at full size before downloading it.",
    ],
    scales: [
      {
        title: "Higher Quality",
        items: [
          "Larger file",
          "More image detail",
          "Suitable for portfolios and important photography",
        ],
      },
      {
        title: "Balanced",
        items: [
          "Moderate file size",
          "Good general image quality",
          "Suitable for websites and social media",
        ],
      },
      {
        title: "Stronger Compression",
        items: [
          "Smaller file",
          "Greater possibility of visible artifacts",
          "Suitable when file size is the main priority",
        ],
      },
    ],
    noteTitle: "Compression changes file size, not image dimensions.",
    noteBefore: "To change the width and height of an image, use the ",
    noteLink: "Resize JPG tool",
    noteAfter: ".",
  },
  tips: {
    eyebrow: "BETTER RESULTS",
    title: "Tips for Compressing JPG Images",
    items: [
      "Use the recommended preset when you are unsure which quality level to choose.",
      "Preview faces, text, logos and detailed areas before downloading.",
      "Avoid repeatedly compressing the same JPG because quality loss can accumulate.",
      "Keep a copy of the highest-quality original file.",
      "Resize very large images before compression when the full dimensions are not required.",
      "Use PNG or WebP when those formats are more suitable for the image.",
      "Test important website images on both desktop and mobile screens.",
      "Compare visual quality instead of selecting the smallest possible file automatically.",
    ],
  },
  formats: {
    eyebrow: "CHOOSE THE RIGHT FORMAT",
    title: "Should You Use JPG, PNG or WebP?",
    cards: [
      {
        title: "JPG",
        body: "Best suited to photographs, realistic images and graphics with many colours. It supports strong compression but does not support transparent backgrounds.",
      },
      {
        title: "PNG",
        body: "Useful for graphics, screenshots and images that require transparency or lossless detail. PNG files may be larger than JPG files for photographs.",
      },
      {
        title: "WebP",
        body: "A modern web image format that can provide efficient file sizes and support both photographic images and transparency.",
      },
    ],
    conclusionBefore:
      "For most photographs, JPG remains a practical format. For modern websites, converting JPG to WebP may create an additional optimization opportunity. ",
    conclusionLink: "Convert JPG to WebP",
    conclusionAfter: ".",
  },
  faqHeading: "Frequently Asked Questions",
  faqs: [
    {
      q: "What does JPG compression do?",
      a: "JPG compression reduces the amount of image data stored in a file. This can create a smaller download, although stronger compression may also reduce visible image quality.",
    },
    {
      q: "Will compressing a JPG change its dimensions?",
      a: "Not necessarily. Compression primarily changes the file data and quality level. Use the Resize JPG tool when you need to change image width and height.",
    },
    {
      q: "Can I choose the JPG quality?",
      a: "Yes. You can select a ready-made compression preset or use the available quality controls to choose a custom setting.",
    },
    {
      q: "Can the tool compress a JPG to an exact KB size?",
      a: "The final size depends on image detail, dimensions, colours and JPG quality. Unless an exact-size feature is specifically available in the interface, the tool cannot guarantee an exact KB result.",
    },
    {
      q: "Does JPG compression reduce image quality?",
      a: "JPG uses lossy compression, so some image data may be removed. Moderate compression can create a much smaller file while maintaining useful visual quality, but stronger settings may produce visible artifacts.",
    },
    {
      q: "Is my original JPG overwritten?",
      a: "No. A separate compressed file is created for download. The original image on your device remains unchanged.",
    },
    {
      q: "Are uploaded images private?",
      a: "Guest images are processed through private temporary storage and are deleted automatically according to the retention period shown on the page. They are not published in a public gallery.",
    },
    {
      q: "Can I compress images without creating an account?",
      a: "Yes. Guest users can use the available free operations without signing in. Higher limits and project features may require an account.",
    },
    {
      q: "Which formats can I upload?",
      a: "The uploader supports JPG, PNG and WebP according to the limits shown on the page. The processed result from this page is downloaded as a JPG.",
    },
    {
      q: "Should I resize or compress an image first?",
      a: "When both dimensions and file size are too large, resize the image first and compress the resized version afterwards. This usually avoids storing unnecessary pixels.",
    },
    {
      q: "Can I compress several images at once?",
      a: "Use the Bulk Compress Images tool when you need to process multiple files in one workflow.",
    },
    {
      q: "Why does a detailed photo remain larger than a simple image?",
      a: "Detailed photographs contain more colour variation, texture and visual information. They often require more data than simple images, even when the same JPG quality setting is used.",
    },
  ],
  related: {
    eyebrow: "CONTINUE EDITING",
    title: "Related JPG Tools",
    tools: [
      {href: "/resize-jpg", title: "Resize JPG", body: "Change the image width and height."},
      {
        href: "/jpg-to-webp",
        title: "Convert JPG to WebP",
        body: "Create a modern WebP version for website use.",
      },
      {href: "/crop-jpg", title: "Crop JPG", body: "Remove unwanted areas from an image."},
      {href: "/jpg-to-png", title: "JPG to PNG", body: "Convert a JPG image into PNG format."},
      {
        href: "/webp-to-jpg",
        title: "WebP to JPG",
        body: "Convert a WebP image into a widely supported JPG.",
      },
      {
        href: "/bulk-image-tools",
        title: "Bulk Compress Images",
        body: "Reduce the file size of several images in one workflow.",
      },
    ],
  },
  cta: {
    title: "Ready to Create a Smaller JPG?",
    body: "Upload another image or create a free account to access additional image tools, saved projects and higher usage limits.",
    primaryLabel: "Compress Another Image",
    secondaryLabel: "Create Free Account",
    secondaryHref: "/register",
  },
};

const ur: CompressJpgCopy = {
  metaTitle: "آن لائن JPG تصاویر کمپریس کریں مفت | Img Pilot",
  metaDescription:
    "آن لائن JPG تصاویر کمپریس کریں اور قابلِ ایڈجسٹ کوالٹی سے فائل سائز کم کریں۔ نتیجہ دیکھیں اور چھوٹی، محفوظ JPG ڈاؤن لوڈ کریں۔",
  h1: "آن لائن JPG تصاویر کمپریس کریں",
  breadcrumbParent: {href: "/compress-image", label: "تصویر کمپریس کریں"},
  hero: {
    badge: "JPG امیج کمپریسر",
    paragraph:
      "بغیر پیچیدہ سافٹ ویئر لگائے اپنے براؤزر میں JPG فائل سائز کم کریں۔ تصویر اپ لوڈ کریں، پسندیدہ کمپریشن سطح منتخب کریں، اور ویب سائٹس، آن لائن اسٹورز، ای میلز اور سوشل میڈیا کے لیے ہلکی JPG ڈاؤن لوڈ کریں۔",
    supporting:
      "آپ کی اصل تصویر جوں کی توں رہتی ہے، اور مہمان کی عارضی فائلیں طے شدہ اسٹوریج مدت کے بعد خودبخود حذف ہو جاتی ہیں۔",
    trust: [
      "سافٹ ویئر انسٹال کرنے کی ضرورت نہیں",
      "قابلِ ایڈجسٹ JPG کوالٹی",
      "نجی عارضی پروسیسنگ",
      "اصل تصویر محفوظ رہتی ہے",
    ],
    uploadCta: "JPG تصویر اپ لوڈ کریں",
    heroImageAlt: "JPG کمپریشن انٹرفیس جو چھوٹی آپٹیمائزڈ امیج فائل دکھاتا ہے",
  },
  guestBar: {
    title: "مہمان استعمال",
    deletionTitle: "خودکار حذف",
    countdownLabel: "عارضی فائلیں خودبخود حذف ہونے میں باقی:",
  },
  upload: {
    heading: "JPG تصویر اپ لوڈ کریں",
    supporting:
      "تصویر یہاں گھسیٹ کر چھوڑیں، کلپ بورڈ سے چسپاں کریں، یا اپنی ڈیوائس سے فائل منتخب کریں۔",
    chooseLabel: "تصویر منتخب کریں",
    formatsHint: "JPG، PNG اور WebP سپورٹ · زیادہ سے زیادہ فائل سائز 10 MB",
    features: [
      {
        title: "نجی پروسیسنگ",
        body: "اپ لوڈ شدہ فائلیں عوامی امیج گیلری میں شامل نہیں ہوتیں۔",
      },
      {
        title: "خودکار حذف",
        body: "مہمان فائلیں عارضی اسٹوریج ختم ہونے پر خودبخود ہٹا دی جاتی ہیں۔",
      },
      {
        title: "اصل محفوظ رہتی ہے",
        body: "ڈاؤن لوڈ کے لیے ایک نئی کمپریس شدہ کاپی بنتی ہے۔",
      },
      {
        title: "انسٹالیشن نہیں",
        body: "جدید ویب براؤزر سے ہی تصاویر کمپریس کریں۔",
      },
    ],
  },
  intro: {
    eyebrow: "تیز تصاویر، چھوٹی فائلیں",
    title: "بغیر پیچیدہ ایڈیٹنگ کے JPG فائل سائز کم کریں",
    paragraphs: [
      "بڑی JPG فائلیں ویب سائٹ سست کر سکتی ہیں، ای میل اٹیچمنٹ بھیجنا مشکل بنا سکتی ہیں اور غیر ضروری اسٹوریج استعمال کرتی ہیں۔ کیمرے، ڈیزائن ٹولز اور اسمارٹ فونز اکثر ایسی کوالٹی میں محفوظ کرتے ہیں جو زیادہ تر آن لائن استعمال سے زیادہ ہوتی ہے۔",
      "یہ JPG کمپریسر تصویر کو بصری طور پر مفید رکھتے ہوئے اس کے اندر ذخیرہ شدہ ڈیٹا کم کرتا ہے۔ آپ متوازن پری سیٹ چن سکتے ہیں یا اپنی ضرورت کے مطابق JPG کوالٹی خود سیٹ کر سکتے ہیں۔",
      "ٹول ایک نئی کمپریس شدہ JPG بناتا ہے۔ آپ کی اصل تصویر ڈیوائس پر جوں کی توں رہتی ہے۔",
    ],
    imageAlt: "اصل JPG اور چھوٹی کمپریس شدہ JPG کا موازنہ",
  },
  comparison: {
    eyebrow: "فرق دیکھیں",
    title: "اصل اور کمپریس شدہ JPG کا موازنہ کریں",
    originalLabel: "اصل تصویر",
    compressedLabel: "کمپریس شدہ تصویر",
    dimensionsLabel: "ابعاد",
    formatLabel: "فارمیٹ",
    sizeLabel: "فائل سائز",
    reducedBy: "فائل سائز میں {percent}% کمی",
    placeholderHint: "لائیو اصل اور کمپریس سائز دیکھنے کے لیے تصویر اپ لوڈ کر کے کمپریس کریں۔",
    explanation:
      "دو JPG کوالٹی لیولز کے درمیان بصری فرق کم ہو سکتا ہے، چاہے فائل سائز میں کمی کافی ہو۔ حتمی تصویر ڈاؤن لوڈ کرنے سے پہلے اہم تفصیلات چیک کریں۔",
  },
  benefits: {
    eyebrow: "JPG تصاویر کیوں کمپریس کریں",
    title: "تیز ڈیجیٹل تجربے کے لیے آپٹیمائزڈ تصاویر",
    intro:
      "چھوٹی امیج فائلیں اپ لوڈ، شیئر، محفوظ اور ویب سائٹس پر ڈیلیور کرنا آسان بناتی ہیں۔",
    cards: [
      {
        title: "تیز ویب سائٹ لوڈنگ",
        body: "چھوٹی JPG فائلیں کم ڈیٹا مانگتی ہیں، جس سے زائرین کا لوڈنگ تجربہ بہتر ہو سکتا ہے۔",
        icon: "speed",
      },
      {
        title: "کم بینڈوڈتھ استعمال",
        body: "آپٹیمائزڈ تصاویر صفحات، ای میلز یا آن لائن دستاویزات کھولتے وقت منتقل ہونے والا ڈیٹا کم کرتی ہیں۔",
        icon: "bandwidth",
      },
      {
        title: "قابلِ ایڈجسٹ امیج کوالٹی",
        body: "متوازن پری سیٹ چنیں یا تصویر کے استعمال کے مطابق JPG کوالٹی خود ایڈجسٹ کریں۔",
        icon: "quality",
      },
      {
        title: "آسان فائل شیئرنگ",
        body: "کمپریس شدہ تصاویر ای میل، میسجنگ پلیٹ فارمز اور کلائنٹ پورٹلز پر بھیجنا آسان بناتی ہیں۔",
        icon: "share",
      },
      {
        title: "نجی عارضی پروسیسنگ",
        body: "مہمان فائلیں عارضی نجی اسٹوریج میں رہتی ہیں اور دکھائی گئی برقرار رکھنے کی مدت کے مطابق خودبخود حذف ہوتی ہیں۔",
        icon: "privacy",
      },
      {
        title: "اصل فائل جوں کی توں",
        body: "کمپریسر الگ آپٹیمائزڈ فائل بناتا ہے اور آپ کی ڈیوائس پر موجود تصویر کو اوور رائٹ نہیں کرتا۔",
        icon: "safe",
      },
    ],
  },
  howTo: {
    eyebrow: "تین آسان مراحل",
    title: "JPG تصویر کیسے کمپریس کریں",
    steps: [
      {
        title: "اپنی تصویر اپ لوڈ کریں",
        body: "ڈیوائس سے JPG، PNG یا WebP منتخب کریں، اپ لوڈ ایریا میں گھسیٹیں، یا کلپ بورڈ سے چسپاں کریں۔",
      },
      {
        title: "کمپریشن سطح چنیں",
        body: "پری سیٹ منتخب کریں یا JPG کوالٹی خود ایڈجسٹ کریں۔ پیش نظارہ دیکھیں اور پروسیس شدہ فائل سائز کا موازنہ کریں۔",
      },
      {
        title: "چھوٹی JPG ڈاؤن لوڈ کریں",
        body: "تصویر پروسیس کریں اور اصل فائل محفوظ رکھتے ہوئے نئی کمپریس شدہ JPG ڈاؤن لوڈ کریں۔",
      },
    ],
    imageAlt: "JPG اپ لوڈ، کمپریس اور ڈاؤن لوڈ کے تین مراحل",
  },
  useCases: {
    eyebrow: "روزمرہ امیج کاموں کے لیے",
    title: "JPG کب کمپریس کریں؟",
    cards: [
      {
        title: "ویب سائٹ تصاویر",
        body: "آن لائن شائع کرنے سے پہلے ہیرو امیجز، بلاگ گرافکس اور صفحہ کی تصاویر کا سائز کم کریں۔",
      },
      {
        title: "پروڈکٹ فوٹوز",
        body: "آن لائن اسٹور تصاویر کو بہتر بنائیں تاکہ پروڈکٹ صفحات غیر ضروری بڑی فائلوں کے بغیر تیز لوڈ ہوں۔",
      },
      {
        title: "ای میل اٹیچمنٹس",
        body: "ایسی چھوٹی امیج اٹیچمنٹس بنائیں جو بھیجنا اور ڈاؤن لوڈ کرنا آسان ہوں۔",
      },
      {
        title: "سوشل میڈیا اور کلائنٹ ورک",
        body: "سوشل پوسٹس، پریزنٹیشنز، کلائنٹ منظوری اور آن لائن پلیٹ فارمز کے لیے ہلکی فائلیں تیار کریں۔",
      },
    ],
  },
  quality: {
    title: "JPG کمپریشن امیج کوالٹی کو کیسے متاثر کرتا ہے",
    paragraphs: [
      "JPG ایک لاسی امیج فارمیٹ ہے۔ مطلب کمپریشن کے دوران کچھ تصویری معلومات نکالی جاتی ہیں۔ مضبوط کمپریشن عموماً چھوٹی فائل بناتی ہے، مگر نرم پن، بلاک پیٹرنز یا رنگ کی تبدیلیاں بھی آ سکتی ہیں۔",
      "تصاویر کے لیے درمیانی JPG کوالٹی اکثر وضاحت اور فائل سائز کا مفید توازن دیتی ہے۔ چھوٹے متن، ڈایاگرام، اسکرین شاٹس یا تیز انٹرفیس عناصر والی تصاویر کو اعلیٰ کوالٹی درکار ہو سکتی ہے۔",
      "بہترین سیٹنگ تصویر اور اس کے استعمال پر منحصر ہے۔ ڈاؤن لوڈ سے پہلے مکمل سائز میں نتیجہ چیک کریں۔",
    ],
    scales: [
      {
        title: "اعلیٰ کوالٹی",
        items: ["بڑی فائل", "زیادہ تصویری تفصیل", "پورٹ فولیو اور اہم فوٹوگرافی کے لیے موزوں"],
      },
      {
        title: "متوازن",
        items: ["درمیانی فائل سائز", "اچھی عمومی کوالٹی", "ویب سائٹس اور سوشل میڈیا کے لیے موزوں"],
      },
      {
        title: "مضبوط کمپریشن",
        items: ["چھوٹی فائل", "ظاہر آرٹیفیکٹس کا زیادہ امکان", "جب فائل سائز سب سے اہم ہو"],
      },
    ],
    noteTitle: "کمپریشن فائل سائز بدلتی ہے، تصویر کے ابعاد نہیں۔",
    noteBefore: "چوڑائی اور اونچائی بدلنے کے لیے ",
    noteLink: "Resize JPG ٹول",
    noteAfter: " استعمال کریں۔",
  },
  tips: {
    eyebrow: "بہتر نتائج",
    title: "JPG کمپریس کرنے کے مشورے",
    items: [
      "اگر کوالٹی لیول کا پتہ نہ ہو تو تجویز کردہ پری سیٹ استعمال کریں۔",
      "ڈاؤن لوڈ سے پہلے چہرے، متن، لوگو اور تفصیلی حصے چیک کریں۔",
      "ایک ہی JPG کو بار بار کمپریس نہ کریں کیونکہ کوالٹی کا نقصان جمع ہو سکتا ہے۔",
      "سب سے اعلیٰ کوالٹی والی اصل فائل کا بیک اپ رکھیں۔",
      "جب مکمل ابعاد درکار نہ ہوں تو کمپریشن سے پہلے بہت بڑی تصاویر کا سائز کم کریں۔",
      "جہاں PNG یا WebP زیادہ موزوں ہوں وہاں وہ استعمال کریں۔",
      "اہم ویب سائٹ تصاویر ڈیسکٹاپ اور موبائل دونوں پر آزمائیں۔",
      "سب سے چھوٹی فائل خودبخود چننے کے بجائے بصری کوالٹی کا موازنہ کریں۔",
    ],
  },
  formats: {
    eyebrow: "صحیح فارمیٹ چنیں",
    title: "JPG، PNG یا WebP؟",
    cards: [
      {
        title: "JPG",
        body: "فوٹوگرافز، حقیقت پسندانہ تصاویر اور کئی رنگوں والے گرافکس کے لیے بہترین۔ مضبوط کمپریشن دیتا ہے مگر شفاف پس منظر سپورٹ نہیں کرتا۔",
      },
      {
        title: "PNG",
        body: "گرافکس، اسکرین شاٹس اور شفافیت یا لاسلیس تفصیل والی تصاویر کے لیے مفید۔ فوٹو کے لیے PNG فائلیں JPG سے بڑی ہو سکتی ہیں۔",
      },
      {
        title: "WebP",
        body: "جدید ویب امیج فارمیٹ جو موثر فائل سائز دے سکتا ہے اور فوٹوگرافک امیجز و شفافیت دونوں سپورٹ کر سکتا ہے۔",
      },
    ],
    conclusionBefore:
      "زیادہ تر فوٹوگرافز کے لیے JPG عملی فارمیٹ ہے۔ جدید ویب سائٹس پر JPG کو WebP میں تبدیل کرنا اضافی آپٹیمائزیشن کا موقع دے سکتا ہے۔ ",
    conclusionLink: "JPG کو WebP میں تبدیل کریں",
    conclusionAfter: "۔",
  },
  faqHeading: "عمومی سوالات",
  faqs: [
    {
      q: "JPG کمپریشن کیا کرتی ہے؟",
      a: "JPG کمپریشن فائل میں محفوظ تصویری ڈیٹا کم کرتی ہے۔ اس سے ڈاؤن لوڈ چھوٹا ہو سکتا ہے، مگر مضبوط کمپریشن بصری کوالٹی بھی کم کر سکتی ہے۔",
    },
    {
      q: "کیا کمپریشن سے JPG کے ابعاد بدلیں گے؟",
      a: "ضروری نہیں۔ کمپریشن بنیادی طور پر فائل ڈیٹا اور کوالٹی بدلتی ہے۔ چوڑائی اور اونچائی کے لیے Resize JPG ٹول استعمال کریں۔",
    },
    {
      q: "کیا میں JPG کوالٹی خود چن سکتا/سکتی ہوں؟",
      a: "ہاں۔ تیار کمپریشن پری سیٹ منتخب کر سکتے ہیں یا دستیابی کوالٹی کنٹرولز سے حسبِ ضرورت سیٹنگ رکھ سکتے ہیں۔",
    },
    {
      q: "کیا ٹول JPG کو عین KB سائز تک کمپریس کر سکتا ہے؟",
      a: "حتمی سائز تصویر کی تفصیل، ابعاد، رنگوں اور JPG کوالٹی پر منحصر ہے۔ جب تک انٹرفیس میں عین سائز فیچر نہ ہو، ٹول عین KB کی ضمانت نہیں دے سکتا۔",
    },
    {
      q: "کیا JPG کمپریشن امیج کوالٹی کم کرتی ہے؟",
      a: "JPG لاسی کمپریشن استعمال کرتا ہے، اس لیے کچھ ڈیٹا نکل سکتا ہے۔ درمیانی کمپریشن مفید بصری کوالٹی رکھتے ہوئے فائل چھوٹی کر سکتی ہے، مگر مضبوط سیٹنگز آرٹیفیکٹس لا سکتی ہیں۔",
    },
    {
      q: "کیا میری اصل JPG اوور رائٹ ہوتی ہے؟",
      a: "نہیں۔ ڈاؤن لوڈ کے لیے الگ کمپریس شدہ فائل بنتی ہے۔ آپ کی ڈیوائس پر اصل تصویر جوں کی توں رہتی ہے۔",
    },
    {
      q: "کیا اپ لوڈ شدہ تصاویر نجی ہیں؟",
      a: "مہمان تصاویر نجی عارضی اسٹوریج سے پروسیس ہوتی ہیں اور صفحے پر دکھائی گئی برقرار رکھنے کی مدت کے مطابق خودبخود حذف ہوتی ہیں۔ وہ عوامی گیلری میں شائع نہیں ہوتیں۔",
    },
    {
      q: "کیا بغیر اکاؤنٹ کے کمپریس کر سکتا/سکتی ہوں؟",
      a: "ہاں۔ مہمان صارفین دستیاب مفت آپریشنز بغیر سائن اِن استعمال کر سکتے ہیں۔ اعلیٰ حدود اور پروجیکٹ فیچرز کے لیے اکاؤنٹ درکار ہو سکتا ہے۔",
    },
    {
      q: "کون سے فارمیٹس اپ لوڈ ہو سکتے ہیں؟",
      a: "اپ لوڈر صفحے پر دکھائی گئی حدود کے مطابق JPG، PNG اور WebP سپورٹ کرتا ہے۔ اس صفحے کا نتیجہ JPG کے طور پر ڈاؤن لوڈ ہوتا ہے۔",
    },
    {
      q: "پہلے ری سائز کروں یا کمپریس؟",
      a: "جب ابعاد اور فائل سائز دونوں بڑے ہوں تو پہلے ری سائز کریں، پھر ری سائز شدہ ورژن کمپریس کریں۔ اس سے غیر ضروری پکسلز بچتے ہیں۔",
    },
    {
      q: "کیا ایک ساتھ کئی تصاویر کمپریس ہو سکتی ہیں؟",
      a: "جب ایک ہی ورک فلو میں متعدد فائلیں پروسیس کرنی ہوں تو Bulk Compress Images ٹول استعمال کریں۔",
    },
    {
      q: "تفصیلی فوٹو سادہ تصویر سے بڑی کیوں رہتی ہے؟",
      a: "تفصیلی فوٹوگرافز میں زیادہ رنگ، ساخت اور بصری معلومات ہوتی ہیں۔ ایک ہی JPG کوالٹی پر بھی انہیں سادہ تصاویر سے زیادہ ڈیٹا درکار ہو سکتا ہے۔",
    },
  ],
  related: {
    eyebrow: "مزید ایڈیٹنگ",
    title: "متعلقہ JPG ٹولز",
    tools: [
      {href: "/resize-jpg", title: "Resize JPG", body: "تصویر کی چوڑائی اور اونچائی بدلیں۔"},
      {
        href: "/jpg-to-webp",
        title: "JPG کو WebP میں تبدیل کریں",
        body: "ویب سائٹ کے لیے جدید WebP ورژن بنائیں۔",
      },
      {href: "/crop-jpg", title: "Crop JPG", body: "تصویر کے غیر ضروری حصے ہٹائیں۔"},
      {href: "/jpg-to-png", title: "JPG to PNG", body: "JPG کو PNG فارمیٹ میں تبدیل کریں۔"},
      {
        href: "/webp-to-jpg",
        title: "WebP to JPG",
        body: "WebP کو عام سپورٹ والے JPG میں تبدیل کریں۔",
      },
      {
        href: "/bulk-image-tools",
        title: "Bulk Compress Images",
        body: "ایک ورک فلو میں کئی تصاویر کا فائل سائز کم کریں۔",
      },
    ],
  },
  cta: {
    title: "چھوٹی JPG تیار ہیں؟",
    body: "ایک اور تصویر اپ لوڈ کریں یا اضافی امیج ٹولز، محفوظ پروجیکٹس اور زیادہ حدود کے لیے مفت اکاؤنٹ بنائیں۔",
    primaryLabel: "ایک اور تصویر کمپریس کریں",
    secondaryLabel: "مفت اکاؤنٹ بنائیں",
    secondaryHref: "/register",
  },
};

export function getCompressJpgCopy(locale: string): CompressJpgCopy {
  return localizedCopy(locale, {en, ur});
}

/** Shared SEO registry payload (English) for landing-content tests. */
export function compressJpgSeoCompat() {
  const c = en;
  return {
    intro: `${c.hero.paragraph} ${c.hero.supporting}`,
    why: [c.benefits.intro, c.intro.paragraphs[0], c.intro.paragraphs[1]].join(" "),
    benefits: c.benefits.cards.map((card) => ({title: card.title, body: card.body})),
    howTo: [
      "Upload a JPG, PNG or WebP image",
      "Choose a compression preset or custom quality",
      "Preview original and compressed sizes",
      "Download the smaller JPG",
    ] as [string, string, string, string],
    technicalTitle: c.quality.title,
    technical: c.quality.paragraphs.join(" "),
    faqs: c.faqs,
    ctaLabel: c.cta.primaryLabel,
  };
}
