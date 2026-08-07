/**
 * Privacy / Terms / Cookies presentation models for Img Pilot.
 * Structure inspired by common consumer image-tool legal pages (e.g. purpose,
 * data types, retention, rights, cookies categories) — original wording for
 * Img Pilot product behaviour. Not a substitute for counsel review.
 */
import type {LegalDocModel, LegalSection} from "@/components/marketing/legal-document-view";

const LAST_UPDATED_EN = "August 7, 2026";
const LAST_UPDATED_UR = "۷ اگست ۲۰۲۶";

/** Keys kept for tests that assert accurate guest retention wording. */
export const PRIVACY_LEGAL_PARAGRAPHS = [
  "Guest tool uploads are stored in private object storage and associated with a temporary guest session. Guest assets expire about one hour after the session is created. Downloads do not extend expiry. Authenticated projects keep library data according to your account plan and product retention rules.",
  "This policy describes how Img Pilot handles information in our current product. Company legal entity details and jurisdiction-specific notices may still require professional legal review before a paid production launch.",
] as const;

export const TERMS_LEGAL_PARAGRAPHS = [
  "Guest tools are provided as-is within published free limits. Do not upload unlawful content. You are responsible for rights to any file you process. Paid features require an active plan when billing is configured; checkout remains unavailable until Stripe Price IDs are approved.",
  "By using Img Pilot you agree to these Terms. If you do not agree, do not use the services. Additional product limits and policies on Privacy and Cookies also apply.",
] as const;

function privacySections(ur: boolean): LegalSection[] {
  if (ur) {
    return [
      {
        id: "purpose",
        title: "۱. اس پالیسی کا مقصد",
        paragraphs: [
          "Img Pilot صارف کی پرائیویسی اور سیکیورٹی کا احترام کرنے کے لیے پرعزم ہے۔ یہ پرائیویسی پالیسی بتاتی ہے کہ جب آپ ہماری ویب سائٹ اور امیج ٹولز استعمال کرتے ہیں تو ہم کون سی معلومات جمع، استعمال، ذخیرہ اور محفوظ کر سکتے ہیں۔",
          "آپ یہ صفحہ پرنٹ کر کے حوالے کے طور پر رکھ سکتے ہیں۔",
        ],
      },
      {
        id: "controller",
        title: "۲. کون ذمہ دار ہے؟",
        paragraphs: [
          "“ذاتی ڈیٹا” کسی شناخت شدہ یا قابلِ شناخت شخص سے متعلق معلومات ہے، جیسے نام یا ای میل۔",
          "Img Pilot اس پالیسی میں بیان کردہ مصنوعاتی طریقوں کے مطابق ڈیٹا پروسیس کرتا ہے۔ سرکاری کمپنی کا نام، رجسٹرڈ پتہ اور دائرہ اختیار ابھی قانونی جائزے کے بعد شائع کیے جائیں گے۔ سوالات کے لیے /contact پر سپورٹ سے رابطہ کریں۔",
          "جب آپ فائلیں اپلوڈ کرتے ہیں جن میں تیسرے فریق کا ڈیٹا ہو سکتا ہے، تو آپ اس بات کے ذمہ دار ہیں کہ آپ کو یہ مواد پروسیس کرنے کی اجازت حاصل ہے۔",
        ],
      },
      {
        id: "data-we-process",
        title: "۳. ہم کون سا ڈیٹا پروسیس کرتے ہیں؟",
        paragraphs: [
          "ہم وہ ڈیٹا پروسیس کر سکتے ہیں جو آپ براہِ راست دیتے ہیں (مثلاً رجسٹریشن، اکاؤنٹ سیٹنگز یا رابطہ پیغام) اور وہ ڈیٹا جو سروس کے استعمال سے پیدا ہوتا ہے (مثلاً سیشن شناخت، ٹول کی قسم، پروسیسنگ سٹیٹس، بنیادی تکنیکی لاگز)۔",
          "فائل مواد کے بارے میں: ہم آپ کی تصاویر کے مواد کو دیکھنے، تجزیہ یا اشاعت کے لیے نہیں کھولتے سوائے اس کے جو ٹول چلانے کے لیے ضروری ہو (جیسے کمپریس، ری سائز، کنورٹ، میٹا ڈیٹا پڑھنا، یا جب آپ AI الٹ ٹیکسٹ جیسی فیچر چالو کریں)۔",
          "جہاں AI پرووائیڈر ترتیب ہو، متعلقہ ٹولز درخواست پوری کرنے کے لیے تصویر کا مواد منتخب پرووائیڈرز کو بھیج سکتے ہیں۔ ہم آپ کے گیسٹ/لائبریری مواد کو عام اشتہارات کے لیے نہیں بیچتے۔",
        ],
        bullets: [
          "اکاؤنٹ ڈیٹا: ای میل، ڈسپلے نام، تصدیق سیشن",
          "گیسٹ سیشن: عارضی سیشن شناخت (کوکی) تاکہ اپلوڈ/جابز جڑیں",
          "پروسیسنگ میٹا ڈیٹا: فارمیٹ، سائز، آپریشن قسم، وقت، خرابی کوڈ",
          "بلنگ (اگر فعال): Stripe کے ذریعے ادائیگی اسٹیٹس — کارڈ ڈیٹا ہمارے سرورز پر محفوظ نہیں",
          "سپورٹ پیغامات جو آپ بھیجتے ہیں",
        ],
      },
      {
        id: "purposes",
        title: "۴. مقاصد اور قانونی بنیادیں",
        paragraphs: [
          "ہم ڈیٹا ان مقاصد کے لیے استعمال کرتے ہیں:",
        ],
        bullets: [
          "آپ کی درخواست کردہ امیج ٹول سروسز فراہم کرنا (کنٹریکٹ/سروس کارکردگی)",
          "اکاؤنٹس، سیکیورٹی، دھوکہ دہی روک تھام اور غلط استعمال کی روک تھام",
          "کوٹہ، پلان حدود اور (جب ترتیب ہو) بلنگ چلانا",
          "سپورٹ سوالات اور حقوق کی درخواستوں کا جواب",
          "قانونی ذمہ داریوں کی تکمیل",
          "ضروری کوکیز کے ذریعے سیشن برقرار رکھنا؛ غیر ضروری ٹریکنگ صرف رضامندی سے جہاں لاگو ہو",
        ],
      },
      {
        id: "sharing",
        title: "۵. شیئرنگ اور سروس پرووائیڈرز",
        paragraphs: [
          "ہم ذاتی ڈیٹا اشتہار دہندگان کو نہیں بیچتے۔ ہم مندرجہ ذیل صورتوں میں تیسرے فریق استعمال کر سکتے ہیں جو ہماری ہدایت پر کام کرتے ہیں:",
        ],
        bullets: [
          "کلاؤڈ ہوسٹنگ اور نجی آبجیکٹ اسٹوریج (جیسے Cloudflare R2) اپلوڈ اور نتائج کے لیے",
          "ڈیٹا بیس ہوسٹنگ اکاؤنٹ اور پروجیکٹ ریکارڈز کے لیے",
          "ادائیگی پروسیسنگ (Stripe) جب چیک آؤٹ فعال ہو",
          "AI / ماڈل پرووائیڈرز صرف ان فیچرز کے لیے جو آپ استعمال کرتے ہیں اور جو ترتیب شدہ ہوں",
          "قانونی تقاضے یا مجاز حکام جہاں قانون لازم کرے",
        ],
        callout:
          "بین الاقوامی منتقلی ہو سکتی ہے جہاں پرووائیڈرز مختلف خطوں میں چلتے ہیں۔ لانچ سے پہلے قانونی جائزہ حفاظتی میکانزم کی تفصیل بھرے گا۔۔",
      },
      {
        id: "retention",
        title: "۶. کتنی دیر رکھتے ہیں؟",
        paragraphs: [PRIVACY_LEGAL_PARAGRAPHS[0]],
        bullets: [
          "گیسٹ فائلیں: سیشن بننے کے بعد تقریباً ایک گھنٹے میں حذف/ختم",
          "ڈاؤنلوڈز عمومی طور پر گیسٹ ایکسپائری نہیں بڑھاتے",
          "سائنڈ اِن لائبریری: پلان اور پروڈکٹ ریٹنشن قواعد کے مطابق",
          "اکاؤنٹ اور بلنگ ریکارڈز: اکاؤنٹ فعال رہنے اور قانونی ضروریات کے مطابق",
        ],
      },
      {
        id: "rights",
        title: "۷. آپ کے حقوق",
        paragraphs: [
          "آپ کے علاقے کے قوانین کے مطابق آپ رسائی، درستگی، حذف، پابندی، اعتراض یا پورٹیبلٹی کی درخواست کر سکتے ہیں۔ جہاں رضامندی بنیاد ہو، آپ اسے واپس لے سکتے ہیں۔",
          "درخواستیں /contact کے ذریعے بھیجیں۔ ہم آپ کی شناخت تصدیق کر سکتے ہیں پھر قانونی حد میں جواب دیں گے۔",
        ],
      },
      {
        id: "security",
        title: "۸. سیکیورٹی",
        paragraphs: [
          "ہم مناسب تکنیکی اور تنظیمی اقدامات استعمال کرتے ہیں، بشمول نجی آبجیکٹ اسٹوریج، مختصر عمر والے سائنڈ URLs جہاں لاگو ہوں، اور گیسٹ اثاثوں کے لیے محدود برقراری۔ کوئی بھی آن لائن سروس ۱۰۰٪ خطرے سے پاک نہیں۔",
        ],
      },
      {
        id: "minors",
        title: "۹. نابالغ",
        paragraphs: [
          "سروسز عام صارفین کے لیے ہیں اور نابالغوں کی طرف خاص طور پر ہدف نہیں۔ جہاں قانون درکار ہو، نابالغ صرف والدین/سرپرست کی نگرانی سے استعمال کریں۔ اگر نابالغ نے بغیر مناسب اجازت استعمال کیا ہو تو ہمیں مطلع کریں تاکہ ہم مناسب اقدامات کر سکیں۔",
        ],
      },
      {
        id: "ai",
        title: "۱۰. AI اور فائل مواد",
        paragraphs: [
          "کچھ ٹولز (جیسے AI مدد سے المیٹ ٹیکسٹ یا میٹا ڈیٹا) ترتیب شدہ AI پرووائیڈر کو مواد بھیج سکتے ہیں۔ Img Pilot آپ کے اپلوڈ کردہ مواد کو عمومی اشتہارات کے ماڈلز کی تربیت کے لیے فروخت کرنے کا دعویٰ نہیں کرتا۔ پرووائیڈر کی اپنی پالیسیاں بھی لاگو ہو سکتی ہیں۔",
        ],
      },
      {
        id: "changes",
        title: "۱۱. پالیسی میں تبدیلیاں",
        paragraphs: [
          "ہم قانون یا پروڈکٹ میں متعلقہ تبدیلی پر یہ پالیسی اپ ڈیٹ کر سکتے ہیں۔ تازہ ترین ورژن اس صفحے پر “آخری اپڈیٹ” تاریخ کے ساتھ شائع ہوگا۔",
        ],
      },
      {
        id: "status",
        title: "۱۲. قانونی حیثیت",
        paragraphs: [PRIVACY_LEGAL_PARAGRAPHS[1]],
        callout: "کمپنی رجسٹریشن، سرکاری رابطہ ای میل اور دائرہ اختیار کی تفصیل قانونی جائزے کے بعد شامل کی جائے گی۔",
      },
    ];
  }

  return [
    {
      id: "purpose",
      title: "1. Purpose of this Privacy Policy",
      paragraphs: [
        "Img Pilot is committed to respecting your privacy and keeping the Img Pilot website and image tools reasonably secure. This Privacy Policy explains what information we may collect, use, store and protect when you visit or use our services.",
        "You can print this page from your browser for your records.",
      ],
    },
    {
      id: "controller",
      title: "2. Who is responsible?",
      paragraphs: [
        "“Personal data” means information relating to an identified or identifiable person, such as a name or email address.",
        "Img Pilot processes information as described in this product Privacy Policy. Our formal legal-entity name, registered address and governing jurisdiction will be published after professional legal review. For questions, contact support via /contact.",
        "If you upload files that may contain third-party personal data, you are responsible for having the rights and authority to process that content with our tools.",
      ],
    },
    {
      id: "data-we-process",
      title: "3. What personal data do we process?",
      paragraphs: [
        "We may process data you provide directly (for example when you create an account, update settings or contact us) and data generated by using the services (for example session identifiers, tool type, job status and basic technical logs).",
        "About file contents: we do not browse, publish or index your images for marketing. We process file bytes only as needed to run the tool you requested (compress, resize, convert, metadata read/edit, geotagging, bulk jobs, and similar) and to deliver the result.",
        "When AI-assisted features are enabled and configured, selected providers may receive image data solely to fulfil that request. We do not sell your guest or library content as an advertising dataset.",
      ],
      bullets: [
        "Account data: email, display name, authentication session",
        "Guest session: temporary session id (cookie) so uploads and jobs stay linked to you",
        "Processing metadata: format, size, operation type, timestamps, error codes",
        "Billing (when enabled): payment status via Stripe — card details are not stored on our servers",
        "Support messages you send us",
      ],
    },
    {
      id: "purposes",
      title: "4. Purposes and legal bases",
      paragraphs: ["We use information for these purposes:"],
      bullets: [
        "Providing the image tools and downloads you request (performance of a service/contract)",
        "Operating accounts, security, abuse prevention and service integrity",
        "Enforcing quotas, plan limits and billing when configured",
        "Responding to support questions and privacy requests",
        "Complying with legal obligations",
        "Keeping essential sessions via necessary cookies; non-essential tracking only where consent applies",
      ],
    },
    {
      id: "sharing",
      title: "5. Sharing and service providers",
      paragraphs: [
        "We do not sell personal data to advertisers. We may use processors that act on our instructions, including:",
      ],
      bullets: [
        "Cloud hosting and private object storage (for example Cloudflare R2) for uploads and results",
        "Database hosting for accounts and project records",
        "Payment processing (Stripe) when checkout is enabled",
        "AI / model providers only for features you use when those providers are configured",
        "Authorities when required by law",
      ],
      callout:
        "International processing may occur when providers operate in other regions. Pre-launch legal review will document transfer safeguards in more detail where required.",
    },
    {
      id: "retention",
      title: "6. How long do we keep data?",
      paragraphs: [PRIVACY_LEGAL_PARAGRAPHS[0]],
      bullets: [
        "Guest files: deleted/expired about one hour after the guest session is created",
        "Downloads generally do not extend guest expiry",
        "Signed-in libraries: according to plan and product retention rules",
        "Account and billing records: while the account is active and as needed for legal compliance",
      ],
    },
    {
      id: "rights",
      title: "7. Your rights",
      paragraphs: [
        "Depending on where you live, you may have rights to access, correct, delete, restrict or object to certain processing, and to data portability. Where processing is based on consent, you may withdraw consent.",
        "Send requests through /contact. We may need to verify your identity before responding within applicable legal timelines.",
      ],
    },
    {
      id: "security",
      title: "8. Security",
      paragraphs: [
        "We use reasonable technical and organisational measures, including private object storage, short-lived signed URLs where applicable, and short retention for guest assets. No online service is 100% risk-free.",
      ],
    },
    {
      id: "minors",
      title: "9. Minors",
      paragraphs: [
        "Our services are general-audience tools and are not directed at children. Where law requires, minors should use the services only with parent or guardian supervision. Contact us if a minor used the services without appropriate permission so we can take reasonable steps.",
      ],
    },
    {
      id: "ai",
      title: "10. AI and file content",
      paragraphs: [
        "Some tools (for example AI-assisted alt text or metadata) may send content to a configured AI provider to complete your request. Img Pilot does not sell your uploaded content to train advertising models. Provider terms and privacy notices may also apply.",
      ],
    },
    {
      id: "changes",
      title: "11. Changes to this policy",
      paragraphs: [
        "We may update this Privacy Policy when the law or product changes. The latest version will be published on this page with a revised “Last updated” date.",
      ],
    },
    {
      id: "status",
      title: "12. Legal status",
      paragraphs: [PRIVACY_LEGAL_PARAGRAPHS[1]],
      callout:
        "Company registration details, official privacy contact email and governing jurisdiction will be completed after legal review.",
    },
  ];
}

function termsSections(ur: boolean): LegalSection[] {
  if (ur) {
    return [
      {
        id: "acceptance",
        title: "۱. قبولیت",
        paragraphs: [
          TERMS_LEGAL_PARAGRAPHS[1],
          "سروسز کا استعمال آپ کو صارف بناتا ہے اور ان شرائط، پرائیویسی پالیسی اور کوکی پالیسی کی مکمل قبولیت سمجھا جاتا ہے۔",
        ],
      },
      {
        id: "services",
        title: "۲. سروسز کیا ہیں؟",
        paragraphs: [
          "Img Pilot براؤزر پر مبنی امیج ٹولز فراہم کرتا ہے (جیسے کمپریس، ری سائز، کراپ، کنورٹ، جیوٹیگ، میٹا ڈیٹا اور متعلقہ گیسٹ یا اکاؤنٹ فیچرز) نیز جب دستیاب ہو تو اکاؤنٹ، پروجیکٹ لائبریری اور انضمام۔",
          "فیچرز، حدود اور دستیابی وقتاً فوقتاً بدل سکتی ہیں۔ ہم بغیر نوٹس کے تجرباتی یا بیٹا فیچرز تبدیل یا ہٹا سکتے ہیں۔",
        ],
      },
      {
        id: "accounts",
        title: "۳. اکاؤنٹس",
        paragraphs: [
          "بعض فیچرز کے لیے اکاؤنٹ درکار ہے۔ آپ درست معلومات دیں، پاس ورڈ محفوظ رکھیں، اور اپنے اکاؤنٹ کی سرگرمی کے ذمہ دار ہیں۔ مشکوک رسائی کی اطلاع فوراً دیں۔",
        ],
      },
      {
        id: "acceptable-use",
        title: "۴. جائز استعمال",
        paragraphs: ["آپ اتفاق کرتے ہیں کہ آپ:"],
        bullets: [
          "غیر قانونی، نقصان دہ، گمراہ کن یا حقوق کی خلاف ورزی والا مواد اپلوڈ نہیں کریں گے",
          "سروسز کو ہیک، اوورلوڈ، اسکین یا ریورس انجینئر کرنے کی کوشش نہیں کریں گے",
          "دوسروں کے اکاؤنٹس یا سیکیورٹی کنٹرولز کو بائی پاس نہیں کریں گے",
          "شائع شدہ ریٹ لمٹس، کوٹہ اور گیسٹ حدود کا احترام کریں گے",
          "خودکار اسکریپنگ یا غلط استعمال سے بچیں گے جو سروس متاثر کرے",
        ],
      },
      {
        id: "content",
        title: "۵. آپ کا مواد اور لائسنس",
        paragraphs: [
          "آپ اپنے فائلوں کے حقوق اپنے پاس رکھتے ہیں۔ سروس چلانے کے لیے آپ ہمیں محدود لائسنس دیتے ہیں کہ ہم فائلیں میزبانی، پروسیس، عارضی طور پر ذخیرہ اور آپ کو نتیجہ ڈیلیور کر سکیں۔",
          "گیسٹ مواد عارضی ہے اور تقریباً ایک گھنٹے میں ختم ہو جاتا ہے۔ اصل فائلیں وہاں اوور رائٹ نہیں ہوتیں جہاں پروڈکٹ الگ آؤٹ پٹ بناتی ہے۔",
        ],
      },
      {
        id: "privacy",
        title: "۶. پرائیویسی",
        paragraphs: [
          "ذاتی ڈیٹا کی پروسیسنگ ہماری پرائیویسی پالیسی کے تحت ہے۔ سروس استعمال کر کے آپ تصدیق کرتے ہیں کہ آپ نے وہ پالیسی پڑھ لی۔",
        ],
      },
      {
        id: "plans",
        title: "۷. مفت حدود اور ادا شدہ پلانز",
        paragraphs: [TERMS_LEGAL_PARAGRAPHS[0]],
        bullets: [
          "گیسٹ ٹولز شائع شدہ مفت حدود کے اندر “جیسے ہیں” دستیاب",
          "اکاؤنٹ پلانز الگ حدود اور فیچرز دے سکتے ہیں",
          "ادا شدہ چیک آؤٹ صرف جب Stripe Price IDs منظور اور ترتیب ہوں",
        ],
      },
      {
        id: "third-parties",
        title: "۸. تیسرے فریق",
        paragraphs: [
          "سروسز میں تیسرے فریق کی سائٹس یا انضمام کے لنکس ہو سکتے ہیں۔ ان کے اپنے شرائط اور پالیسیاں لاگو ہوتی ہیں۔ Img Pilot ان مواد کا کنٹرول یا ضمانت نہیں دیتا۔",
        ],
      },
      {
        id: "disclaimers",
        title: "۹. ڈسکلیمرز",
        paragraphs: [
          "قانون کی اجازت کی حد تک سروسز “جیسے ہیں” اور “جیسے دستیاب” بنیاد پر فراہم کی جاتی ہیں بغیر ہر قسم کی ضمانت کے، بشمول تجارت پذیری، مخصوص مقصد کے لیے موزوںیت یا غیر خلاف ورزی۔",
          "ہم ضمانت نہیں دیتے کہ آؤٹ پٹ ہر استعمال کے لیے بے عیب، بلا رکاوٹ یا موزوں ہوگا۔ فارمیٹ کنورژن اور کمپریشن معیار سورس فائل پر منحصر ہے۔",
        ],
      },
      {
        id: "liability",
        title: "۱۰. ذمہ داری کی حد",
        paragraphs: [
          "قانون کی اجازت کی حد تک Img Pilot بالواسطہ، اتفاقی، خاص یا نتیجہ خیز نقصانات کا ذمہ دار نہیں، اور مجموعی ذمہ داری پچھلے بارہ مہینوں میں آپ کی ادائیگیوں (یا مفت استعمال پر صفر) تک محدود ہو سکتی ہے، جہاں قابلِ اطلاق قانون اجازت دے۔",
        ],
      },
      {
        id: "termination",
        title: "۱۱. معطلی اور ختم کرنا",
        paragraphs: [
          "ہم غلط استعمال، خطرہ یا ان شرائط کی خلاف ورزی پر رسائی معطل یا ختم کر سکتے ہیں۔ آپ اکاؤنٹ بند کرنے کی درخواست /contact کے ذریعے کر سکتے ہیں، جس کے بعد ریٹنشن قواعد لاگو ہوتے ہیں۔",
        ],
      },
      {
        id: "changes-terms",
        title: "۱۲. شرائط میں تبدیلی",
        paragraphs: [
          "ہم یہ شرائط اپ ڈیٹ کر سکتے ہیں۔ تازہ ترین ورژن اس صفحے پر شائع ہوگا۔ تبدیلی کے بعد مسلسل استعمال قبولیت سمجھا جا سکتا ہے جہاں قانون اجازت دے۔",
        ],
      },
      {
        id: "status",
        title: "۱۳. قانونی حیثیت",
        paragraphs: [
          "یہ شرائط پروڈکٹ کے موجودہ رویے کی عکاسی کرتی ہیں۔ کمپنی کی شناخت، گورننگ لاء اور تنازعات کا فورم پیشہ ورانہ قانونی جائزے کے بعد مکمل ہوں گے۔",
        ],
        callout: "ادا شدہ پروڈکشن لانچ سے پہلے وکیل کا جائزہ تجویز کیا جاتا ہے۔",
      },
    ];
  }

  return [
    {
      id: "acceptance",
      title: "1. Acceptance of these Terms",
      paragraphs: [
        TERMS_LEGAL_PARAGRAPHS[1],
        "Using the services makes you a user and means you fully accept these Terms together with our Privacy Policy and Cookie Policy.",
      ],
    },
    {
      id: "services",
      title: "2. The services",
      paragraphs: [
        "Img Pilot provides browser-based image tools (including compress, resize, crop, convert, geotag, metadata and related guest or account features) and, when available, accounts, project libraries and integrations.",
        "Features, limits and availability may change over time. We may modify or remove experimental or beta features without notice.",
      ],
    },
    {
      id: "accounts",
      title: "3. Accounts",
      paragraphs: [
        "Some features require an account. You must provide accurate information, keep credentials secure and are responsible for activity under your account. Tell us promptly about suspected unauthorised access.",
      ],
    },
    {
      id: "acceptable-use",
      title: "4. Acceptable use",
      paragraphs: ["You agree that you will not:"],
      bullets: [
        "Upload unlawful, harmful, deceptive or infringing content",
        "Attempt to hack, overload, scrape without permission or reverse engineer the services",
        "Bypass other users’ accounts or our security controls",
        "Ignore published rate limits, quotas and guest limits",
        "Use automation in a way that harms service availability for others",
      ],
    },
    {
      id: "content",
      title: "5. Your content and licence",
      paragraphs: [
        "You keep ownership of your files. To run the tools, you grant us a limited licence to host, process, temporarily store and deliver results to you.",
        "Guest content is temporary and expires about one hour after the session starts. Where the product creates separate outputs, originals are not overwritten.",
      ],
    },
    {
      id: "privacy",
      title: "6. Privacy",
      paragraphs: [
        "Personal data is handled under our Privacy Policy. By using the services you confirm you have read that policy.",
      ],
    },
    {
      id: "plans",
      title: "7. Free limits and paid plans",
      paragraphs: [TERMS_LEGAL_PARAGRAPHS[0]],
      bullets: [
        "Guest tools are available “as is” within published free limits",
        "Account plans may unlock higher limits and additional features",
        "Paid checkout is available only when approved Stripe Price IDs are configured",
      ],
    },
    {
      id: "third-parties",
      title: "8. Third parties",
      paragraphs: [
        "The services may link to third-party sites or integrations. Their terms and privacy policies apply. Img Pilot does not control or warrant third-party content.",
      ],
    },
    {
      id: "disclaimers",
      title: "9. Disclaimers",
      paragraphs: [
        "To the fullest extent permitted by law, the services are provided “as is” and “as available” without warranties of any kind, including merchantability, fitness for a particular purpose or non-infringement.",
        "We do not warrant that outputs will be uninterrupted, error-free or suitable for every use case. Conversion and compression quality depend on the source file and your settings.",
      ],
    },
    {
      id: "liability",
      title: "10. Limitation of liability",
      paragraphs: [
        "To the fullest extent permitted by law, Img Pilot is not liable for indirect, incidental, special or consequential damages, and total liability may be limited to the fees you paid us in the twelve months before the claim (or zero for free use), where applicable law allows.",
      ],
    },
    {
      id: "termination",
      title: "11. Suspension and termination",
      paragraphs: [
        "We may suspend or terminate access for abuse, risk or breach of these Terms. You may request account closure via /contact, after which retention rules apply.",
      ],
    },
    {
      id: "changes-terms",
      title: "12. Changes to these Terms",
      paragraphs: [
        "We may update these Terms. The latest version will be published on this page. Continued use after changes may constitute acceptance where permitted by law.",
      ],
    },
    {
      id: "status",
      title: "13. Legal status",
      paragraphs: [
        "These Terms reflect current product behaviour. Formal company identity, governing law and dispute forum will be completed after professional legal review.",
      ],
      callout: "Counsel review is recommended before a paid production launch.",
    },
  ];
}

function cookiesSections(ur: boolean): LegalSection[] {
  if (ur) {
    return [
      {
        id: "overview",
        title: "۱. جائزہ",
        paragraphs: [
          "کوکیز چھوٹی ٹیکسٹ فائلیں ہیں جو ویب سائٹ آپ کے براؤزر میں رکھ سکتی ہے۔ یورپی صارفین کے لیے شفافیت اہم ہے — یہ صفحہ بتاتا ہے کہ Img Pilot کون سی کوکیز استعمال کرتا ہے اور کیوں۔",
          "ضروری کوکیز سروس چلانے کے لیے درکار ہوتی ہیں۔ غیر ضروری کوکیز (اگر فعال ہوں) عموماً رضامندی پر منحصر ہوتی ہیں۔",
        ],
      },
      {
        id: "categories",
        title: "۲. کوکی کیٹیگریز",
        cards: [
          {
            title: "ضروری",
            body: "سیشن، سیکیورٹی اور بنیادی ٹول کارکردگی کے لیے لازم — مثلاً گیسٹ سیشن کوکی۔",
          },
          {
            title: "ترجیحات",
            body: "زبان یا UI ترجیحات یاد رکھنے کے لیے (اگر مستقبل میں الگ کوکی استعمال ہو)۔",
          },
          {
            title: "تجزیات",
            body: "استعمال سمجھنے کے لیے۔ ہم اس صفحے پر تھرڈ پارٹی analytics تب تک فروغ نہیں دیتے جب تک پروڈکٹ انہیں واضح طور پر فعال نہ کرے۔",
          },
          {
            title: "مارکیٹنگ",
            body: "اشتہاری ری ٹارگٹنگ۔ Img Pilot اس خلاصے میں مارکیٹنگ کوکیز کا دعویٰ نہیں کرتا۔",
          },
        ],
      },
      {
        id: "essential",
        title: "۳. ضروری کوکیز جو ہم استعمال کرتے ہیں",
        bullets: [
          "`seoimages_guest` (یا ماحول میں ترتیب شدہ گیسٹ کوکی نام) — HttpOnly گیسٹ سیشن ٹوکن تاکہ اپلوڈ اور جابز اسی زائر سے جڑیں۔",
          "سائنڈ اِن اکاؤنٹس کے لیے Auth.js / NextAuth سیشن کوکیز جب آپ لاگ اِن ہوں۔",
          "سیکیورٹی / CSRF سے متعلق کوکیز جہاں فریم ورک انہیں سیٹ کرے۔",
        ],
        callout: "گیسٹ اثاثے عارضی ہیں؛ سیشن ختم ہونے کے بعد پروسیسنگ برقراری قواعد کے مطابق جاری نہیں رہتی۔",
      },
      {
        id: "control",
        title: "۴. کوکیز کیسے کنٹرول کریں",
        paragraphs: [
          "آپ براؤزر سیٹنگز سے کوکیز صاف، بلاک یا سائٹ کے لحاظ سے محدود کر سکتے ہیں۔ ضروری گیسٹ کوکی بلاک کرنے سے بغیر اکاؤنٹ ٹولز کام کرنا بند ہو سکتے ہیں۔",
          "مزید پرائیویسی تفصیل کے لیے ہماری پرائیویسی پالیسی دیکھیں۔",
        ],
      },
      {
        id: "changes",
        title: "۵. تبدیلیاں",
        paragraphs: [
          "اگر ہم نئی کوکی کیٹیگریز یا پرووائیڈرز شامل کریں تو یہ صفحہ اپ ڈیٹ کیا جائے گا۔",
        ],
      },
      {
        id: "status",
        title: "۶. قانونی حیثیت",
        paragraphs: [
          "یہ ایماندار مصنوعاتی کوکی پالیسی ہے۔ پیشہ ورانہ قانونی جائزہ ادا شدہ پروڈکشن لانچ سے پہلے ابھی درکار ہو سکتا ہے۔",
        ],
      },
    ];
  }

  return [
    {
      id: "overview",
      title: "1. Overview",
      paragraphs: [
        "Cookies are small text files a website may store in your browser. For transparency — including under European cookie rules — this page explains which cookies Img Pilot uses and why.",
        "Essential cookies are required to run the service. Non-essential cookies (if ever enabled) generally depend on consent where required by law.",
      ],
    },
    {
      id: "categories",
      title: "2. Cookie categories",
      cards: [
        {
          title: "Essential",
          body: "Required for sessions, security and basic tool operation — for example the guest session cookie.",
        },
        {
          title: "Preferences",
          body: "Used to remember language or UI choices if stored in a dedicated cookie later.",
        },
        {
          title: "Analytics",
          body: "Used to understand product usage. This page does not claim third-party analytics cookies unless the product explicitly enables them.",
        },
        {
          title: "Marketing",
          body: "Used for advertising retargeting. Img Pilot does not claim marketing cookies in this summary.",
        },
      ],
    },
    {
      id: "essential",
      title: "3. Essential cookies we use",
      bullets: [
        "`seoimages_guest` (or the configured guest cookie name) — HttpOnly guest session token so uploads and jobs stay tied to the same visitor.",
        "Auth.js / NextAuth session cookies for signed-in accounts when you log in.",
        "Security / CSRF-related cookies where the framework sets them.",
      ],
      callout:
        "Guest assets are temporary; processing does not continue after the session expires under product retention rules.",
    },
    {
      id: "control",
      title: "4. How to control cookies",
      paragraphs: [
        "You can clear, block or limit cookies in your browser settings. Blocking the essential guest cookie may stop guest tools from working.",
        "For broader privacy details, see our Privacy Policy.",
      ],
    },
    {
      id: "changes",
      title: "5. Changes",
      paragraphs: [
        "If we add new cookie categories or providers, we will update this page.",
      ],
    },
    {
      id: "status",
      title: "6. Legal status",
      paragraphs: [
        "This is an honest product Cookie Policy. Professional legal review may still be required before a paid production launch.",
      ],
    },
  ];
}

export function getPrivacyDoc(locale: string): LegalDocModel {
  const ur = locale === "ur";
  return {
    path: "/privacy",
    metaTitle: ur ? "پرائیویسی پالیسی | Img Pilot" : "Privacy Policy | Img Pilot",
    metaDescription: ur
      ? "جانیں کہ Img Pilot براؤزر پر مبنی امیج ٹولز استعمال کرتے وقت آپ کی معلومات کیسے جمع، استعمال، ذخیرہ اور محفوظ کرتا ہے۔"
      : "Learn how Img Pilot collects, uses, stores and protects your information when you use our browser-based image tools.",
    breadcrumbCurrent: ur ? "پرائیویسی پالیسی" : "Privacy Policy",
    hero: {
      badge: "LEGAL",
      h1: ur ? "پرائیویسی پالیسی" : "Privacy Policy",
      paragraph: ur
        ? "شفاف تفصیل کہ Img Pilot گیسٹ ٹولز اور اکاؤنٹس کے ساتھ آپ کا ڈیٹا کیسے سنبھالتا ہے — بشمول تقریباً ایک گھنٹے کی گیسٹ فائل برقراری۔"
        : "A clear explanation of how Img Pilot handles your data with guest tools and accounts — including roughly one-hour guest file retention.",
      heroImageSrc: "/illustrations/privacy-hero.webp",
      heroImageAlt: ur
        ? "پرائیویسی شیلڈ، کلاؤڈ سیکیورٹی اور براؤزر ڈیش بورڈ کی مثال"
        : "Privacy shield, cloud security and browser dashboard illustration",
    },
    metaCards: [
      {
        label: ur ? "آخری اپڈیٹ" : "Last Updated",
        value: ur ? LAST_UPDATED_UR : LAST_UPDATED_EN,
      },
      {
        label: ur ? "موثر تاریخ" : "Effective Date",
        value: ur ? LAST_UPDATED_UR : LAST_UPDATED_EN,
      },
      {
        label: ur ? "لاگو ہوتا ہے" : "Applies To",
        value: ur ? "گیسٹ ٹولز اور سائنڈ اِن اکاؤنٹس" : "Guest tools and signed-in accounts",
      },
    ],
    tocLabel: ur ? "اس صفحے پر" : "On this page",
    sections: privacySections(ur),
    contact: {
      title: ur ? "سوالات؟" : "Questions?",
      body: ur
        ? "پرائیویسی درخواستوں یا سوالات کے لیے سپورٹ سے رابطہ کریں۔"
        : "Contact support for privacy requests or product questions.",
      cta: ur ? "سپورٹ سے رابطہ" : "Contact Support",
    },
  };
}

export function getTermsDoc(locale: string): LegalDocModel {
  const ur = locale === "ur";
  return {
    path: "/terms",
    metaTitle: ur ? "شرائط و ضوابط | Img Pilot" : "Terms & Conditions | Img Pilot",
    metaDescription: ur
      ? "Img Pilot گیسٹ ٹولز اور اکاؤنٹس کے استعمال کی شرائط۔"
      : "Terms of use for Img Pilot guest tools and accounts.",
    breadcrumbCurrent: ur ? "شرائط و ضوابط" : "Terms & Conditions",
    hero: {
      badge: "LEGAL",
      h1: ur ? "شرائط و ضوابط" : "Terms & Conditions",
      paragraph: ur
        ? "Img Pilot استعمال کرنے سے پہلے یہ قواعد پڑھیں — قابلِ قبول استعمال، آپ کا مواد، حدود اور ذمہ داری۔"
        : "Read these rules before using Img Pilot — acceptable use, your content, limits and liability.",
      heroImageSrc: "/illustrations/terms-hero.webp",
      heroImageAlt: ur
        ? "ڈیجیٹل معاہدہ، دستاویزات اور سیکیورٹی شیلڈ کی مثال"
        : "Digital agreement, documents and security shield illustration",
    },
    metaCards: [
      {
        label: ur ? "آخری اپڈیٹ" : "Last Updated",
        value: ur ? LAST_UPDATED_UR : LAST_UPDATED_EN,
      },
      {
        label: ur ? "موثر تاریخ" : "Effective Date",
        value: ur ? LAST_UPDATED_UR : LAST_UPDATED_EN,
      },
      {
        label: ur ? "لاگو ہوتا ہے" : "Applies To",
        value: ur ? "تمام Img Pilot صارفین" : "All Img Pilot users",
      },
    ],
    tocLabel: ur ? "اس صفحے پر" : "On this page",
    sections: termsSections(ur),
    contact: {
      title: ur ? "سوالات؟" : "Questions?",
      body: ur
        ? "شرائط کے بارے میں سوال ہو تو سپورٹ سے رابطہ کریں۔"
        : "Contact support if you have questions about these terms.",
      cta: ur ? "سپورٹ سے رابطہ" : "Contact Support",
    },
  };
}

export function getCookiesDoc(locale: string): LegalDocModel {
  const ur = locale === "ur";
  return {
    path: "/cookies",
    metaTitle: ur ? "کوکی پالیسی | Img Pilot" : "Cookie Policy | Img Pilot",
    metaDescription: ur
      ? "جانیں کہ Img Pilot ضروری کوکیز جیسے گیسٹ سیشن کوکی کیسے استعمال کرتا ہے۔"
      : "Learn how Img Pilot uses essential cookies such as the guest session cookie.",
    breadcrumbCurrent: ur ? "کوکی پالیسی" : "Cookie Policy",
    hero: {
      badge: "LEGAL",
      h1: ur ? "کوکی پالیسی" : "Cookie Policy",
      paragraph: ur
        ? "شفاف تفصیل کہ Img Pilot کون سی کوکیز استعمال کرتا ہے — ضروری سیشنز سے لے کر ترجیحات اور کنٹرول تک۔"
        : "Transparent detail on which cookies Img Pilot uses — from essential sessions to preferences and controls.",
      heroImageSrc: "/illustrations/cookies-hero.webp",
      heroImageAlt: ur
        ? "براؤزر کوکیز، پرائیویسی سیٹنگز اور رضامندی بینر کی مثال"
        : "Browser cookies, privacy settings and consent banner illustration",
    },
    metaCards: [
      {
        label: ur ? "آخری اپڈیٹ" : "Last Updated",
        value: ur ? LAST_UPDATED_UR : LAST_UPDATED_EN,
      },
      {
        label: ur ? "موثر تاریخ" : "Effective Date",
        value: ur ? LAST_UPDATED_UR : LAST_UPDATED_EN,
      },
      {
        label: ur ? "لاگو ہوتا ہے" : "Applies To",
        value: ur ? "Img Pilot ویب سائٹ زائرین" : "Visitors to the Img Pilot website",
      },
    ],
    tocLabel: ur ? "اس صفحے پر" : "On this page",
    sections: cookiesSections(ur),
    contact: {
      title: ur ? "سوالات؟" : "Questions?",
      body: ur
        ? "کوکیز یا پرائیویسی کے بارے میں پوچھیں تو سپورٹ سے رابطہ کریں۔"
        : "Contact support if you have questions about cookies or privacy.",
      cta: ur ? "سپورٹ سے رابطہ" : "Contact Support",
    },
  };
}
