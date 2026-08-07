/**
 * Generate chrome / nav / guest chrome message packs for all non-English locales.
 * Keeps existing ur.json untouched (already full). Overwrites other chrome packs.
 * Run: node scripts/i18n/generate-chrome-packs.js
 */
const fs = require("fs");
const path = require("path");

const LOCALES = [
  "es",
  "fr",
  "de",
  "it",
  "pt",
  "nl",
  "pl",
  "sv",
  "tr",
  "ru",
  "uk",
  "ja",
  "ko",
  "th",
  "id",
  "ms",
  "vi",
  "hi",
  "ar",
  "el",
  "bg",
  "sw",
  "ca",
];

const NATIVE = {
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
  nl: "Nederlands",
  pl: "Polski",
  sv: "Svenska",
  tr: "Türkçe",
  ru: "Русский",
  uk: "Українська",
  ja: "日本語",
  ko: "한국어",
  th: "ไทย",
  id: "Bahasa Indonesia",
  ms: "Bahasa Melayu",
  vi: "Tiếng Việt",
  hi: "हिन्दी",
  ar: "العربية",
  el: "Ελληνικά",
  bg: "Български",
  sw: "Kiswahili",
  ca: "Català",
  ur: "اردو",
  en: "English",
};

/** @type {Record<string, Record<string, unknown>>} */
const CORE = {
  es: {
    common: {
      brand: "Img Pilot",
      comingSoon: "Próximamente",
      openMenu: "Abrir navegación",
      closeMenu: "Cerrar navegación",
      mainNavigation: "Navegación principal",
    },
    navigation: {
      dashboard: "Panel",
      projects: "Proyectos",
      usage: "Analíticas",
      billing: "Facturación",
      developer: "Desarrollador",
      integrations: "Integraciones",
      automation: "Automatización",
      settings: "Ajustes de la cuenta",
      organizations: "Organizaciones",
    },
    language: {label: "Idioma de la interfaz", english: "English", urdu: "Urdu"},
    chrome: {
      imageTools: "Herramientas de imagen",
      compress: "Comprimir",
      resize: "Redimensionar",
      convert: "Convertir",
      seoTools: "Herramientas SEO",
      bulkTools: "Herramientas por lotes",
      openAppGrid: "Abrir menú de herramientas",
      appGridTitle: "Herramientas y recursos",
      languageHint: "Preferencia de idioma",
      menu: "Menú",
      close: "Cerrar",
      footerBlurb:
        "Herramientas privadas en línea para comprimir, redimensionar, convertir y preparar imágenes para la web.",
      popularFormats: "Formatos populares",
      company: "Empresa",
      resources: "Recursos",
      rights: "Todos los derechos reservados.",
    },
  },
  fr: {
    common: {
      brand: "Img Pilot",
      comingSoon: "Bientôt",
      openMenu: "Ouvrir la navigation",
      closeMenu: "Fermer la navigation",
      mainNavigation: "Navigation principale",
    },
    navigation: {
      dashboard: "Tableau de bord",
      projects: "Projets",
      usage: "Analyses",
      billing: "Facturation",
      developer: "Développeur",
      integrations: "Intégrations",
      automation: "Automatisation",
      settings: "Paramètres du compte",
      organizations: "Organisations",
    },
    language: {label: "Langue de l’interface", english: "English", urdu: "Urdu"},
    chrome: {
      imageTools: "Outils image",
      compress: "Compresser",
      resize: "Redimensionner",
      convert: "Convertir",
      seoTools: "Outils SEO",
      bulkTools: "Outils par lot",
      openAppGrid: "Ouvrir le menu des outils",
      appGridTitle: "Outils et ressources",
      languageHint: "Préférence de langue",
      menu: "Menu",
      close: "Fermer",
      footerBlurb:
        "Outils privés en ligne pour compresser, redimensionner, convertir et préparer des images pour le web.",
      popularFormats: "Formats populaires",
      company: "Entreprise",
      resources: "Ressources",
      rights: "Tous droits réservés.",
    },
  },
  de: {
    common: {
      brand: "Img Pilot",
      comingSoon: "Demnächst",
      openMenu: "Navigation öffnen",
      closeMenu: "Navigation schließen",
      mainNavigation: "Hauptnavigation",
    },
    navigation: {
      dashboard: "Dashboard",
      projects: "Projekte",
      usage: "Analysen",
      billing: "Abrechnung",
      developer: "Entwickler",
      integrations: "Integrationen",
      automation: "Automatisierung",
      settings: "Kontoeinstellungen",
      organizations: "Organisationen",
    },
    language: {label: "Oberflächensprache", english: "English", urdu: "Urdu"},
    chrome: {
      imageTools: "Bildwerkzeuge",
      compress: "Komprimieren",
      resize: "Größe ändern",
      convert: "Konvertieren",
      seoTools: "SEO-Tools",
      bulkTools: "Stapeltools",
      openAppGrid: "Werkzeugmenü öffnen",
      appGridTitle: "Tools und Ressourcen",
      languageHint: "Spracheinstellung",
      menu: "Menü",
      close: "Schließen",
      footerBlurb:
        "Private Online-Tools zum Komprimieren, Ändern der Größe, Konvertieren und Vorbereiten von Bildern fürs Web.",
      popularFormats: "Beliebte Formate",
      company: "Unternehmen",
      resources: "Ressourcen",
      rights: "Alle Rechte vorbehalten.",
    },
  },
  it: {
    common: {
      brand: "Img Pilot",
      comingSoon: "Prossimamente",
      openMenu: "Apri navigazione",
      closeMenu: "Chiudi navigazione",
      mainNavigation: "Navigazione principale",
    },
    navigation: {
      dashboard: "Dashboard",
      projects: "Progetti",
      usage: "Analisi",
      billing: "Fatturazione",
      developer: "Sviluppatore",
      integrations: "Integrazioni",
      automation: "Automazione",
      settings: "Impostazioni account",
      organizations: "Organizzazioni",
    },
    language: {label: "Lingua dell’interfaccia", english: "English", urdu: "Urdu"},
    chrome: {
      imageTools: "Strumenti immagine",
      compress: "Comprimi",
      resize: "Ridimensiona",
      convert: "Converti",
      seoTools: "Strumenti SEO",
      bulkTools: "Strumenti in blocco",
      openAppGrid: "Apri menu strumenti",
      appGridTitle: "Strumenti e risorse",
      languageHint: "Preferenza lingua",
      menu: "Menu",
      close: "Chiudi",
      footerBlurb:
        "Strumenti online privati per comprimere, ridimensionare, convertire e preparare immagini per il web.",
      popularFormats: "Formati popolari",
      company: "Azienda",
      resources: "Risorse",
      rights: "Tutti i diritti riservati.",
    },
  },
  pt: {
    common: {
      brand: "Img Pilot",
      comingSoon: "Em breve",
      openMenu: "Abrir navegação",
      closeMenu: "Fechar navegação",
      mainNavigation: "Navegação principal",
    },
    navigation: {
      dashboard: "Painel",
      projects: "Projetos",
      usage: "Análises",
      billing: "Faturação",
      developer: "Programador",
      integrations: "Integrações",
      automation: "Automação",
      settings: "Definições da conta",
      organizations: "Organizações",
    },
    language: {label: "Idioma da interface", english: "English", urdu: "Urdu"},
    chrome: {
      imageTools: "Ferramentas de imagem",
      compress: "Comprimir",
      resize: "Redimensionar",
      convert: "Converter",
      seoTools: "Ferramentas SEO",
      bulkTools: "Ferramentas em lote",
      openAppGrid: "Abrir menu de ferramentas",
      appGridTitle: "Ferramentas e recursos",
      languageHint: "Preferência de idioma",
      menu: "Menu",
      close: "Fechar",
      footerBlurb:
        "Ferramentas privadas online para comprimir, redimensionar, converter e preparar imagens para a web.",
      popularFormats: "Formatos populares",
      company: "Empresa",
      resources: "Recursos",
      rights: "Todos os direitos reservados.",
    },
  },
  nl: {
    common: {
      brand: "Img Pilot",
      comingSoon: "Binnenkort",
      openMenu: "Navigatie openen",
      closeMenu: "Navigatie sluiten",
      mainNavigation: "Hoofdnavigatie",
    },
    navigation: {
      dashboard: "Dashboard",
      projects: "Projecten",
      usage: "Analyses",
      billing: "Facturatie",
      developer: "Developer",
      integrations: "Integraties",
      automation: "Automatisering",
      settings: "Accountinstellingen",
      organizations: "Organisaties",
    },
    language: {label: "Interfacetaal", english: "English", urdu: "Urdu"},
    chrome: {
      imageTools: "Afbeeldingstools",
      compress: "Comprimeren",
      resize: "Formaat wijzigen",
      convert: "Converteren",
      seoTools: "SEO-tools",
      bulkTools: "Bulktools",
      openAppGrid: "Toolsmenu openen",
      appGridTitle: "Tools en bronnen",
      languageHint: "Taalvoorkeur",
      menu: "Menu",
      close: "Sluiten",
      footerBlurb:
        "Privé online tools om afbeeldingen te comprimeren, te verkleinen, te converteren en klaar te maken voor het web.",
      popularFormats: "Populaire formaten",
      company: "Bedrijf",
      resources: "Bronnen",
      rights: "Alle rechten voorbehouden.",
    },
  },
  pl: {
    common: {
      brand: "Img Pilot",
      comingSoon: "Wkrótce",
      openMenu: "Otwórz nawigację",
      closeMenu: "Zamknij nawigację",
      mainNavigation: "Główna nawigacja",
    },
    navigation: {
      dashboard: "Panel",
      projects: "Projekty",
      usage: "Analityka",
      billing: "Płatności",
      developer: "Deweloper",
      integrations: "Integracje",
      automation: "Automatyzacja",
      settings: "Ustawienia konta",
      organizations: "Organizacje",
    },
    language: {label: "Język interfejsu", english: "English", urdu: "Urdu"},
    chrome: {
      imageTools: "Narzędzia obrazów",
      compress: "Kompresuj",
      resize: "Zmień rozmiar",
      convert: "Konwertuj",
      seoTools: "Narzędzia SEO",
      bulkTools: "Narzędzia zbiorcze",
      openAppGrid: "Otwórz menu narzędzi",
      appGridTitle: "Narzędzia i zasoby",
      languageHint: "Preferowany język",
      menu: "Menu",
      close: "Zamknij",
      footerBlurb:
        "Prywatne narzędzia online do kompresji, zmiany rozmiaru, konwersji i przygotowania obrazów pod web.",
      popularFormats: "Popularne formaty",
      company: "Firma",
      resources: "Zasoby",
      rights: "Wszelkie prawa zastrzeżone.",
    },
  },
  sv: {
    common: {
      brand: "Img Pilot",
      comingSoon: "Kommer snart",
      openMenu: "Öppna navigering",
      closeMenu: "Stäng navigering",
      mainNavigation: "Huvudnavigering",
    },
    navigation: {
      dashboard: "Panel",
      projects: "Projekt",
      usage: "Analys",
      billing: "Fakturering",
      developer: "Utvecklare",
      integrations: "Integrationer",
      automation: "Automatisering",
      settings: "Kontoinställningar",
      organizations: "Organisationer",
    },
    language: {label: "Gränssnittsspråk", english: "English", urdu: "Urdu"},
    chrome: {
      imageTools: "Bildverktyg",
      compress: "Komprimera",
      resize: "Ändra storlek",
      convert: "Konvertera",
      seoTools: "SEO-verktyg",
      bulkTools: "Massverktyg",
      openAppGrid: "Öppna verktygsmenyn",
      appGridTitle: "Verktyg och resurser",
      languageHint: "Språkpreferens",
      menu: "Meny",
      close: "Stäng",
      footerBlurb:
        "Privata onlineverktyg för att komprimera, ändra storlek, konvertera och förbereda bilder för webben.",
      popularFormats: "Populära format",
      company: "Företag",
      resources: "Resurser",
      rights: "Alla rättigheter förbehållna.",
    },
  },
  tr: {
    common: {
      brand: "Img Pilot",
      comingSoon: "Yakında",
      openMenu: "Gezinmeyi aç",
      closeMenu: "Gezinmeyi kapat",
      mainNavigation: "Ana gezinme",
    },
    navigation: {
      dashboard: "Panel",
      projects: "Projeler",
      usage: "Analitik",
      billing: "Faturalama",
      developer: "Geliştirici",
      integrations: "Entegrasyonlar",
      automation: "Otomasyon",
      settings: "Hesap ayarları",
      organizations: "Organizasyonlar",
    },
    language: {label: "Arayüz dili", english: "English", urdu: "Urdu"},
    chrome: {
      imageTools: "Görsel araçları",
      compress: "Sıkıştır",
      resize: "Yeniden boyutlandır",
      convert: "Dönüştür",
      seoTools: "SEO araçları",
      bulkTools: "Toplu araçlar",
      openAppGrid: "Araçlar menüsünü aç",
      appGridTitle: "Araçlar ve kaynaklar",
      languageHint: "Dil tercihi",
      menu: "Menü",
      close: "Kapat",
      footerBlurb:
        "Görselleri sıkıştırmak, boyutlandırmak, dönüştürmek ve web için hazırlamak üzere özel çevrimiçi araçlar.",
      popularFormats: "Popüler biçimler",
      company: "Şirket",
      resources: "Kaynaklar",
      rights: "Tüm hakları saklıdır.",
    },
  },
  ru: {
    common: {
      brand: "Img Pilot",
      comingSoon: "Скоро",
      openMenu: "Открыть меню",
      closeMenu: "Закрыть меню",
      mainNavigation: "Основная навигация",
    },
    navigation: {
      dashboard: "Панель",
      projects: "Проекты",
      usage: "Аналитика",
      billing: "Оплата",
      developer: "Разработчик",
      integrations: "Интеграции",
      automation: "Автоматизация",
      settings: "Настройки аккаунта",
      organizations: "Организации",
    },
    language: {label: "Язык интерфейса", english: "English", urdu: "Urdu"},
    chrome: {
      imageTools: "Инструменты для изображений",
      compress: "Сжать",
      resize: "Изменить размер",
      convert: "Конвертировать",
      seoTools: "SEO-инструменты",
      bulkTools: "Пакетные инструменты",
      openAppGrid: "Открыть меню инструментов",
      appGridTitle: "Инструменты и ресурсы",
      languageHint: "Языковые настройки",
      menu: "Меню",
      close: "Закрыть",
      footerBlurb:
        "Приватные онлайн-инструменты для сжатия, изменения размера, конвертации и подготовки изображений для веба.",
      popularFormats: "Популярные форматы",
      company: "Компания",
      resources: "Ресурсы",
      rights: "Все права защищены.",
    },
  },
  uk: {
    common: {
      brand: "Img Pilot",
      comingSoon: "Незабаром",
      openMenu: "Відкрити навігацію",
      closeMenu: "Закрити навігацію",
      mainNavigation: "Головна навігація",
    },
    navigation: {
      dashboard: "Панель",
      projects: "Проєкти",
      usage: "Аналітика",
      billing: "Оплата",
      developer: "Розробник",
      integrations: "Інтеграції",
      automation: "Автоматизація",
      settings: "Налаштування облікового запису",
      organizations: "Організації",
    },
    language: {label: "Мова інтерфейсу", english: "English", urdu: "Urdu"},
    chrome: {
      imageTools: "Інструменти зображень",
      compress: "Стиснути",
      resize: "Змінити розмір",
      convert: "Конвертувати",
      seoTools: "SEO-інструменти",
      bulkTools: "Пакетні інструменти",
      openAppGrid: "Відкрити меню інструментів",
      appGridTitle: "Інструменти та ресурси",
      languageHint: "Мова інтерфейсу",
      menu: "Меню",
      close: "Закрити",
      footerBlurb:
        "Приватні онлайн-інструменти для стиснення, зміни розміру, конвертації та підготовки зображень для вебу.",
      popularFormats: "Популярні формати",
      company: "Компанія",
      resources: "Ресурси",
      rights: "Усі права захищено.",
    },
  },
  ja: {
    common: {
      brand: "Img Pilot",
      comingSoon: "近日公開",
      openMenu: "ナビゲーションを開く",
      closeMenu: "ナビゲーションを閉じる",
      mainNavigation: "メインナビゲーション",
    },
    navigation: {
      dashboard: "ダッシュボード",
      projects: "プロジェクト",
      usage: "分析",
      billing: "請求",
      developer: "デベロッパー",
      integrations: "連携",
      automation: "自動化",
      settings: "アカウント設定",
      organizations: "組織",
    },
    language: {label: "表示言語", english: "English", urdu: "Urdu"},
    chrome: {
      imageTools: "画像ツール",
      compress: "圧縮",
      resize: "リサイズ",
      convert: "変換",
      seoTools: "SEOツール",
      bulkTools: "一括ツール",
      openAppGrid: "ツールメニューを開く",
      appGridTitle: "ツールとリソース",
      languageHint: "言語設定",
      menu: "メニュー",
      close: "閉じる",
      footerBlurb:
        "画像の圧縮・リサイズ・変換、およびWeb向け準備のためのプライベートなオンラインツール。",
      popularFormats: "人気の形式",
      company: "会社情報",
      resources: "リソース",
      rights: "無断転載を禁じます。",
    },
  },
  ko: {
    common: {
      brand: "Img Pilot",
      comingSoon: "곧 제공",
      openMenu: "탐색 열기",
      closeMenu: "탐색 닫기",
      mainNavigation: "기본 탐색",
    },
    navigation: {
      dashboard: "대시보드",
      projects: "프로젝트",
      usage: "분석",
      billing: "결제",
      developer: "개발자",
      integrations: "연동",
      automation: "자동화",
      settings: "계정 설정",
      organizations: "조직",
    },
    language: {label: "인터페이스 언어", english: "English", urdu: "Urdu"},
    chrome: {
      imageTools: "이미지 도구",
      compress: "압축",
      resize: "크기 조정",
      convert: "변환",
      seoTools: "SEO 도구",
      bulkTools: "일괄 도구",
      openAppGrid: "도구 메뉴 열기",
      appGridTitle: "도구 및 리소스",
      languageHint: "언어 환경설정",
      menu: "메뉴",
      close: "닫기",
      footerBlurb:
        "이미지 압축, 크기 조정, 변환 및 웹용 준비를 위한 비공개 온라인 도구입니다.",
      popularFormats: "인기 형식",
      company: "회사",
      resources: "리소스",
      rights: "모든 권리 보유.",
    },
  },
  th: {
    common: {
      brand: "Img Pilot",
      comingSoon: "เร็ว ๆ นี้",
      openMenu: "เปิดเมนูนำทาง",
      closeMenu: "ปิดเมนูนำทาง",
      mainNavigation: "การนำทางหลัก",
    },
    navigation: {
      dashboard: "แดชบอร์ด",
      projects: "โปรเจกต์",
      usage: "การวิเคราะห์",
      billing: "การเรียกเก็บเงิน",
      developer: "นักพัฒนา",
      integrations: "การเชื่อมต่อ",
      automation: "ระบบอัตโนมัติ",
      settings: "การตั้งค่าบัญชี",
      organizations: "องค์กร",
    },
    language: {label: "ภาษาของอินเทอร์เฟซ", english: "English", urdu: "Urdu"},
    chrome: {
      imageTools: "เครื่องมือรูปภาพ",
      compress: "บีบอัด",
      resize: "ปรับขนาด",
      convert: "แปลง",
      seoTools: "เครื่องมือ SEO",
      bulkTools: "เครื่องมือแบบชุด",
      openAppGrid: "เปิดเมนูเครื่องมือ",
      appGridTitle: "เครื่องมือและทรัพยากร",
      languageHint: "การตั้งค่าภาษา",
      menu: "เมนู",
      close: "ปิด",
      footerBlurb:
        "เครื่องมือออนไลน์แบบส่วนตัวสำหรับบีบอัด ปรับขนาด แปลง และเตรียมรูปภาพสำหรับเว็บ",
      popularFormats: "รูปแบบยอดนิยม",
      company: "บริษัท",
      resources: "ทรัพยากร",
      rights: "สงวนลิขสิทธิ์",
    },
  },
  id: {
    common: {
      brand: "Img Pilot",
      comingSoon: "Segera hadir",
      openMenu: "Buka navigasi",
      closeMenu: "Tutup navigasi",
      mainNavigation: "Navigasi utama",
    },
    navigation: {
      dashboard: "Dasbor",
      projects: "Proyek",
      usage: "Analitik",
      billing: "Penagihan",
      developer: "Pengembang",
      integrations: "Integrasi",
      automation: "Otomasi",
      settings: "Pengaturan akun",
      organizations: "Organisasi",
    },
    language: {label: "Bahasa antarmuka", english: "English", urdu: "Urdu"},
    chrome: {
      imageTools: "Alat gambar",
      compress: "Kompres",
      resize: "Ubah ukuran",
      convert: "Konversi",
      seoTools: "Alat SEO",
      bulkTools: "Alat massal",
      openAppGrid: "Buka menu alat",
      appGridTitle: "Alat dan sumber daya",
      languageHint: "Preferensi bahasa",
      menu: "Menu",
      close: "Tutup",
      footerBlurb:
        "Alat online pribadi untuk mengompres, mengubah ukuran, mengonversi, dan menyiapkan gambar untuk web.",
      popularFormats: "Format populer",
      company: "Perusahaan",
      resources: "Sumber daya",
      rights: "Hak cipta dilindungi.",
    },
  },
  ms: {
    common: {
      brand: "Img Pilot",
      comingSoon: "Akan datang",
      openMenu: "Buka navigasi",
      closeMenu: "Tutup navigasi",
      mainNavigation: "Navigasi utama",
    },
    navigation: {
      dashboard: "Papan pemuka",
      projects: "Projek",
      usage: "Analitik",
      billing: "Pengebilan",
      developer: "Pembangun",
      integrations: "Integrasi",
      automation: "Automasi",
      settings: "Tetapan akaun",
      organizations: "Organisasi",
    },
    language: {label: "Bahasa antara muka", english: "English", urdu: "Urdu"},
    chrome: {
      imageTools: "Alat imej",
      compress: "Mampat",
      resize: "Ubah saiz",
      convert: "Tukar",
      seoTools: "Alat SEO",
      bulkTools: "Alat pukal",
      openAppGrid: "Buka menu alat",
      appGridTitle: "Alat dan sumber",
      languageHint: "Keutamaan bahasa",
      menu: "Menu",
      close: "Tutup",
      footerBlurb:
        "Alat dalam talian peribadi untuk memampatkan, mengubah saiz, menukar dan menyediakan imej untuk web.",
      popularFormats: "Format popular",
      company: "Syarikat",
      resources: "Sumber",
      rights: "Hak cipta terpelihara.",
    },
  },
  vi: {
    common: {
      brand: "Img Pilot",
      comingSoon: "Sắp ra mắt",
      openMenu: "Mở điều hướng",
      closeMenu: "Đóng điều hướng",
      mainNavigation: "Điều hướng chính",
    },
    navigation: {
      dashboard: "Bảng điều khiển",
      projects: "Dự án",
      usage: "Phân tích",
      billing: "Thanh toán",
      developer: "Nhà phát triển",
      integrations: "Tích hợp",
      automation: "Tự động hóa",
      settings: "Cài đặt tài khoản",
      organizations: "Tổ chức",
    },
    language: {label: "Ngôn ngữ giao diện", english: "English", urdu: "Urdu"},
    chrome: {
      imageTools: "Công cụ hình ảnh",
      compress: "Nén",
      resize: "Đổi kích thước",
      convert: "Chuyển đổi",
      seoTools: "Công cụ SEO",
      bulkTools: "Công cụ hàng loạt",
      openAppGrid: "Mở menu công cụ",
      appGridTitle: "Công cụ và tài nguyên",
      languageHint: "Tùy chọn ngôn ngữ",
      menu: "Menu",
      close: "Đóng",
      footerBlurb:
        "Công cụ trực tuyến riêng tư để nén, đổi kích thước, chuyển đổi và chuẩn bị hình ảnh cho web.",
      popularFormats: "Định dạng phổ biến",
      company: "Công ty",
      resources: "Tài nguyên",
      rights: "Đã đăng ký bản quyền.",
    },
  },
  hi: {
    common: {
      brand: "Img Pilot",
      comingSoon: "जल्द आ रहा है",
      openMenu: "नेविगेशन खोलें",
      closeMenu: "नेविगेशन बंद करें",
      mainNavigation: "मुख्य नेविगेशन",
    },
    navigation: {
      dashboard: "डैशबोर्ड",
      projects: "प्रोजेक्ट",
      usage: "विश्लेषिकी",
      billing: "बिलिंग",
      developer: "डेवलपर",
      integrations: "एकीकरण",
      automation: "स्वचालन",
      settings: "खाता सेटिंग्स",
      organizations: "संगठन",
    },
    language: {label: "इंटरफ़ेस भाषा", english: "English", urdu: "Urdu"},
    chrome: {
      imageTools: "इमेज टूल्स",
      compress: "कंप्रेस",
      resize: "रिसाइज़",
      convert: "कन्वर्ट",
      seoTools: "SEO टूल्स",
      bulkTools: "बल्क टूल्स",
      openAppGrid: "टूल्स मेनू खोलें",
      appGridTitle: "टूल्स और संसाधन",
      languageHint: "भाषा वरीयता",
      menu: "मेनू",
      close: "बंद करें",
      footerBlurb:
        "इमेज कंप्रेस, रिसाइज़, कन्वर्ट करने और वेब के लिए तैयार करने हेतु निजी ऑनलाइन टूल्स।",
      popularFormats: "लोकप्रिय फ़ॉर्मैट",
      company: "कंपनी",
      resources: "संसाधन",
      rights: "सर्वाधिकार सुरक्षित।",
    },
  },
  ar: {
    common: {
      brand: "Img Pilot",
      comingSoon: "قريبًا",
      openMenu: "فتح التنقل",
      closeMenu: "إغلاق التنقل",
      mainNavigation: "التنقل الرئيسي",
    },
    navigation: {
      dashboard: "لوحة التحكم",
      projects: "المشاريع",
      usage: "التحليلات",
      billing: "الفوترة",
      developer: "المطور",
      integrations: "عمليات التكامل",
      automation: "الأتمتة",
      settings: "إعدادات الحساب",
      organizations: "المؤسسات",
    },
    language: {label: "لغة الواجهة", english: "English", urdu: "Urdu"},
    chrome: {
      imageTools: "أدوات الصور",
      compress: "ضغط",
      resize: "تغيير الحجم",
      convert: "تحويل",
      seoTools: "أدوات SEO",
      bulkTools: "أدوات مجمّعة",
      openAppGrid: "فتح قائمة الأدوات",
      appGridTitle: "الأدوات والموارد",
      languageHint: "تفضيل اللغة",
      menu: "القائمة",
      close: "إغلاق",
      footerBlurb:
        "أدوات خاصة عبر الإنترنت لضغط الصور وتغيير حجمها وتحويلها وتجهيزها للويب.",
      popularFormats: "الصيغ الشائعة",
      company: "الشركة",
      resources: "الموارد",
      rights: "جميع الحقوق محفوظة.",
    },
  },
  el: {
    common: {
      brand: "Img Pilot",
      comingSoon: "Σύντομα",
      openMenu: "Άνοιγμα πλοήγησης",
      closeMenu: "Κλείσιμο πλοήγησης",
      mainNavigation: "Κύρια πλοήγηση",
    },
    navigation: {
      dashboard: "Πίνακας",
      projects: "Έργα",
      usage: "Αναλυτικά",
      billing: "Χρεώσεις",
      developer: "Προγραμματιστής",
      integrations: "Ενσωματώσεις",
      automation: "Αυτοματισμός",
      settings: "Ρυθμίσεις λογαριασμού",
      organizations: "Οργανισμοί",
    },
    language: {label: "Γλώσσα διεπαφής", english: "English", urdu: "Urdu"},
    chrome: {
      imageTools: "Εργαλεία εικόνας",
      compress: "Συμπίεση",
      resize: "Αλλαγή μεγέθους",
      convert: "Μετατροπή",
      seoTools: "Εργαλεία SEO",
      bulkTools: "Ομαδικά εργαλεία",
      openAppGrid: "Άνοιγμα μενού εργαλείων",
      appGridTitle: "Εργαλεία και πόροι",
      languageHint: "Προτίμηση γλώσσας",
      menu: "Μενού",
      close: "Κλείσιμο",
      footerBlurb:
        "Ιδιωτικά διαδικτυακά εργαλεία για συμπίεση, αλλαγή μεγέθους, μετατροπή και προετοιμασία εικόνων για τον ιστό.",
      popularFormats: "Δημοφιλείς μορφές",
      company: "Εταιρεία",
      resources: "Πόροι",
      rights: "Με επιφύλαξη παντός δικαιώματος.",
    },
  },
  bg: {
    common: {
      brand: "Img Pilot",
      comingSoon: "Очаквайте скоро",
      openMenu: "Отвори навигация",
      closeMenu: "Затвори навигация",
      mainNavigation: "Основна навигация",
    },
    navigation: {
      dashboard: "Табло",
      projects: "Проекти",
      usage: "Анализи",
      billing: "Таксуване",
      developer: "Разработчик",
      integrations: "Интеграции",
      automation: "Автоматизация",
      settings: "Настройки на акаунта",
      organizations: "Организации",
    },
    language: {label: "Език на интерфейса", english: "English", urdu: "Urdu"},
    chrome: {
      imageTools: "Инструменти за изображения",
      compress: "Компресирай",
      resize: "Преоразмери",
      convert: "Конвертирай",
      seoTools: "SEO инструменти",
      bulkTools: "Групови инструменти",
      openAppGrid: "Отвори меню с инструменти",
      appGridTitle: "Инструменти и ресурси",
      languageHint: "Езикови предпочитания",
      menu: "Меню",
      close: "Затвори",
      footerBlurb:
        "Частни онлайн инструменти за компресиране, преоразмеряване, конвертиране и подготовка на изображения за уеб.",
      popularFormats: "Популярни формати",
      company: "Компания",
      resources: "Ресурси",
      rights: "Всички права запазени.",
    },
  },
  sw: {
    common: {
      brand: "Img Pilot",
      comingSoon: "Inakuja hivi karibuni",
      openMenu: "Fungua urambazaji",
      closeMenu: "Funga urambazaji",
      mainNavigation: "Urambazaji mkuu",
    },
    navigation: {
      dashboard: "Dashibodi",
      projects: "Miradi",
      usage: "Uchambuzi",
      billing: "Malipo",
      developer: "Msanidi",
      integrations: "Uunganishaji",
      automation: "Otomatiki",
      settings: "Mipangilio ya akaunti",
      organizations: "Mashirika",
    },
    language: {label: "Lugha ya kiolesura", english: "English", urdu: "Urdu"},
    chrome: {
      imageTools: "Zana za picha",
      compress: "Bana",
      resize: "Badilisha ukubwa",
      convert: "Badilisha umbizo",
      seoTools: "Zana za SEO",
      bulkTools: "Zana za wingi",
      openAppGrid: "Fungua menyu ya zana",
      appGridTitle: "Zana na rasilimali",
      languageHint: "Mapendeleo ya lugha",
      menu: "Menyu",
      close: "Funga",
      footerBlurb:
        "Zana za mtandaoni za faragha za kubana, kubadilisha ukubwa, kubadilisha umbizo na kuandaa picha kwa wavuti.",
      popularFormats: "Umbizo maarufu",
      company: "Kampuni",
      resources: "Rasilimali",
      rights: "Haki zote zimehifadhiwa.",
    },
  },
  ca: {
    common: {
      brand: "Img Pilot",
      comingSoon: "Properament",
      openMenu: "Obre la navegació",
      closeMenu: "Tanca la navegació",
      mainNavigation: "Navegació principal",
    },
    navigation: {
      dashboard: "Tauler",
      projects: "Projectes",
      usage: "Analítiques",
      billing: "Facturació",
      developer: "Desenvolupador",
      integrations: "Integracions",
      automation: "Automatització",
      settings: "Configuració del compte",
      organizations: "Organitzacions",
    },
    language: {label: "Idioma de la interfície", english: "English", urdu: "Urdu"},
    chrome: {
      imageTools: "Eines d’imatge",
      compress: "Comprimeix",
      resize: "Canvia la mida",
      convert: "Converteix",
      seoTools: "Eines SEO",
      bulkTools: "Eines massives",
      openAppGrid: "Obre el menú d’eines",
      appGridTitle: "Eines i recursos",
      languageHint: "Preferència d’idioma",
      menu: "Menú",
      close: "Tanca",
      footerBlurb:
        "Eines privades en línia per comprimir, canviar la mida, convertir i preparar imatges per al web.",
      popularFormats: "Formats populars",
      company: "Empresa",
      resources: "Recursos",
      rights: "Tots els drets reservats.",
    },
  },
};

/** @type {Record<string, Record<string, unknown>>} */
const GUEST = {
  es: {
    nav: {
      brand: "Img Pilot",
      tools: "Herramientas",
      pricing: "Precios",
      docs: "Docs",
      signIn: "Iniciar sesión",
      register: "Crear cuenta",
      dashboard: "Panel",
    },
    tools: {
      compress: "Comprimir imagen",
      resize: "Redimensionar imagen",
      crop: "Recortar imagen",
      convert: "Convertir imagen",
      rotate: "Rotar imagen",
      watermark: "Marca de agua",
      blur: "Desenfocar región",
      meme: "Generador de memes",
      geotag: "Geolocalizar imagen",
      metadata: "Visor de metadatos",
      aiAlt: "Generador de texto alt con IA",
      metadataEditor: "Editor de metadatos",
      bulk: "Herramientas por lotes",
      comingSoon: "Disponible en un próximo prompt",
      ready: "Disponible ahora",
      geotagJpegOnly: "Solo JPEG — GPS verificado",
    },
    upload: {
      drop: "Suelta una imagen aquí",
      browse: "o examina archivos",
      or: "o",
      browseButton: "Explorar archivos",
      pasteHint: "O pega con Ctrl+V / ⌘V",
      dropAria: "Sube una imagen soltándola, explorando o pegando",
      formats: "Formatos admitidos: JPEG, PNG, WebP",
      maxSize: "Tamaño máximo: {maxMb} MB",
      privacy: "Almacenamiento temporal privado. Se elimina tras una hora.",
      uploading: "Subiendo…",
      validating: "Validando…",
      ready: "Listo",
      failed: "Error al subir",
    },
    tool: {
      process: "Procesar imagen",
      processing: "Procesando…",
      download: "Descargar",
      downloadCompressed: "Descargar imagen comprimida",
      downloadAll: "Descargar todo",
      downloadAllSoon: "Descarga múltiple próximamente",
      processAnother: "Procesar otra imagen",
      actionsAria: "Acciones de la herramienta",
    },
    footer: {
      privacy: "Privacidad",
      terms: "Términos",
      retention: "Los archivos de invitados caducan tras una hora.",
    },
    faq: {title: "Preguntas frecuentes"},
  },
};

// Derive remaining guest packs from Spanish structure with language-specific nav/tools where we have CORE
function guestFromCore(locale) {
  if (GUEST[locale]) return GUEST[locale];
  const c = CORE[locale];
  if (!c) return {};
  // Minimal guest chrome using chrome labels when possible
  return {
    nav: {
      brand: "Img Pilot",
      tools: c.chrome.imageTools,
      pricing: localePricing(locale),
      docs: "Docs",
      signIn: localeSignIn(locale),
      register: localeRegister(locale),
      dashboard: c.navigation.dashboard,
    },
    tools: {
      compress: `${c.chrome.compress}`,
      resize: `${c.chrome.resize}`,
      crop: localeCrop(locale),
      convert: `${c.chrome.convert}`,
      rotate: localeRotate(locale),
      watermark: localeWatermark(locale),
      blur: localeBlur(locale),
      meme: localeMeme(locale),
      geotag: localeGeotag(locale),
      metadata: localeMetadata(locale),
      aiAlt: "AI Alt Text",
      metadataEditor: localeMetadataEditor(locale),
      bulk: c.chrome.bulkTools,
      comingSoon: c.common.comingSoon,
      ready: localeReady(locale),
      geotagJpegOnly: "JPEG",
    },
    upload: {
      drop: localeDrop(locale),
      browse: localeBrowse(locale),
      or: localeOr(locale),
      browseButton: localeBrowseButton(locale),
      pasteHint: "Ctrl+V / ⌘V",
      dropAria: localeDrop(locale),
      formats: "JPEG, PNG, WebP",
      maxSize: "{maxMb} MB",
      privacy: localePrivacy(locale),
      uploading: "…",
      validating: "…",
      ready: localeReady(locale),
      failed: "Error",
    },
    tool: {
      process: c.chrome.imageTools,
      processing: "…",
      download: localeDownload(locale),
      downloadCompressed: localeDownload(locale),
      downloadAll: localeDownload(locale),
      downloadAllSoon: c.common.comingSoon,
      processAnother: c.chrome.imageTools,
      actionsAria: c.chrome.imageTools,
    },
    footer: {
      privacy: localePrivacyWord(locale),
      terms: localeTerms(locale),
      retention: localeRetention(locale),
    },
    faq: {title: localeFaq(locale)},
  };
}

function localePricing(l) {
  const m = {fr:"Tarifs",de:"Preise",it:"Prezzi",pt:"Preços",nl:"Prijzen",pl:"Cennik",sv:"Priser",tr:"Fiyatlar",ru:"Цены",uk:"Ціни",ja:"料金",ko:"요금",th:"ราคา",id:"Harga",ms:"Harga",vi:"Bảng giá",hi:"मूल्य",ar:"الأسعار",el:"Τιμές",bg:"Цени",sw:"Bei",ca:"Preus"};
  return m[l] || "Pricing";
}
function localeSignIn(l) {
  const m = {fr:"Connexion",de:"Anmelden",it:"Accedi",pt:"Iniciar sessão",nl:"Inloggen",pl:"Zaloguj się",sv:"Logga in",tr:"Giriş yap",ru:"Войти",uk:"Увійти",ja:"ログイン",ko:"로그인",th:"เข้าสู่ระบบ",id:"Masuk",ms:"Log masuk",vi:"Đăng nhập",hi:"साइन इन",ar:"تسجيل الدخول",el:"Σύνδεση",bg:"Вход",sw:"Ingia",ca:"Inicia la sessió"};
  return m[l] || "Sign in";
}
function localeRegister(l) {
  const m = {fr:"Créer un compte",de:"Konto erstellen",it:"Crea account",pt:"Criar conta",nl:"Account maken",pl:"Utwórz konto",sv:"Skapa konto",tr:"Hesap oluştur",ru:"Создать аккаунт",uk:"Створити обліковий запис",ja:"アカウント作成",ko:"계정 만들기",th:"สร้างบัญชี",id:"Buat akun",ms:"Buat akaun",vi:"Tạo tài khoản",hi:"खाता बनाएँ",ar:"إنشاء حساب",el:"Δημιουργία λογαριασμού",bg:"Създай акаунт",sw:"Fungua akaunti",ca:"Crea un compte"};
  return m[l] || "Create account";
}
function localeCrop(l) {
  const m = {fr:"Recadrer",de:"Zuschneiden",it:"Ritaglia",pt:"Recortar",nl:"Bijsnijden",pl:"Przytnij",sv:"Beskär",tr:"Kırp",ru:"Обрезать",uk:"Обрізати",ja:"切り抜き",ko:"자르기",th:"ครอป",id:"Potong",ms:"Potong",vi:"Cắt",hi:"क्रॉप",ar:"قص",el:"Περικοπή",bg:"Изрежи",sw:"Kata",ca:"Retalla"};
  return m[l] || "Crop";
}
function localeRotate(l) {
  const m = {fr:"Pivoter",de:"Drehen",it:"Ruota",pt:"Rodar",nl:"Roteren",pl:"Obróć",sv:"Rotera",tr:"Döndür",ru:"Повернуть",uk:"Повернути",ja:"回転",ko:"회전",th:"หมุน",id:"Putar",ms:"Putar",vi:"Xoay",hi:"घुमाएँ",ar:"تدوير",el:"Περιστροφή",bg:"Завърти",sw:"Zungusha",ca:"Gira"};
  return m[l] || "Rotate";
}
function localeWatermark(l) {
  const m = {fr:"Filigrane",de:"Wasserzeichen",it:"Filigrana",pt:"Marca d’água",nl:"Watermerk",pl:"Znak wodny",sv:"Vattenstämpel",tr:"Filigran",ru:"Водяной знак",uk:"Водяний знак",ja:"透かし",ko:"워터마크",th:"ลายน้ำ",id:"Tanda air",ms:"Tanda air",vi:"Watermark",hi:"वॉटरमार्क",ar:"علامة مائية",el:"Υδατογράφημα",bg:"Воден знак",sw:"Alama ya maji",ca:"Filigrana"};
  return m[l] || "Watermark";
}
function localeBlur(l) {
  const m = {fr:"Flouter",de:"Unscharf",it:"Sfoca",pt:"Desfocar",nl:"Vervagen",pl:"Rozmyj",sv:"Oskärpa",tr:"Bulanıklaştır",ru:"Размыть",uk:"Розмити",ja:"ぼかし",ko:"흐리게",th:"เบลอ",id:"Buramkan",ms:"Kaburkan",vi:"Làm mờ",hi:"ब्लर",ar:"تمويه",el:"Θόλωμα",bg:"Замъгли",sw:"Fifia",ca:"Difumina"};
  return m[l] || "Blur";
}
function localeMeme(l) {
  const m = {fr:"Mème",de:"Meme",it:"Meme",pt:"Meme",nl:"Meme",pl:"Mem",sv:"Meme",tr:"Meme",ru:"Мем",uk:"Мем",ja:"ミーム",ko:"밈",th:"มีม",id:"Meme",ms:"Meme",vi:"Meme",hi:"मीम",ar:"ميم",el:"Meme",bg:"Мим",sw:"Meme",ca:"Meme"};
  return m[l] || "Meme";
}
function localeGeotag(l) {
  const m = {fr:"Géolocaliser",de:"Geotag",it:"Geotag",pt:"Geotag",nl:"Geotag",pl:"Geotag",sv:"Geotagga",tr:"Konum etiketi",ru:"Геотег",uk:"Геотег",ja:"ジオタグ",ko:"지오태그",th:"จีโอแท็ก",id:"Geotag",ms:"Geotag",vi:"Gắn vị trí",hi:"जियोटैग",ar:"وسم جغرافي",el:"Γεωετικέτα",bg:"Геотаг",sw:"Geotag",ca:"Geotag"};
  return m[l] || "Geotag";
}
function localeMetadata(l) {
  const m = {fr:"Métadonnées",de:"Metadaten",it:"Metadati",pt:"Metadados",nl:"Metadata",pl:"Metadane",sv:"Metadata",tr:"Meta veri",ru:"Метаданные",uk:"Метадані",ja:"メタデータ",ko:"메타데이터",th:"เมตาดาตา",id:"Metadata",ms:"Metadata",vi:"Metadata",hi:"मेटाडेटा",ar:"البيانات الوصفية",el:"Μεταδεδομένα",bg:"Метаданни",sw:"Metadata",ca:"Metadades"};
  return m[l] || "Metadata";
}
function localeMetadataEditor(l) {
  return localeMetadata(l);
}
function localeReady(l) {
  const m = {fr:"Disponible",de:"Verfügbar",it:"Disponibile",pt:"Disponível",nl:"Beschikbaar",pl:"Dostępne",sv:"Tillgänglig",tr:"Hazır",ru:"Доступно",uk:"Доступно",ja:"利用可能",ko:"사용 가능",th:"พร้อมใช้",id:"Tersedia",ms:"Sedia",vi:"Sẵn sàng",hi:"उपलब्ध",ar:"متاح",el:"Διαθέσιμο",bg:"Налично",sw:"Tayari",ca:"Disponible"};
  return m[l] || "Ready";
}
function localeDrop(l) {
  const m = {fr:"Déposez une image ici",de:"Bild hier ablegen",it:"Trascina un’immagine qui",pt:"Largue uma imagem aqui",nl:"Sleep hier een afbeelding",pl:"Upuść obraz tutaj",sv:"Släpp en bild här",tr:"Bir görseli buraya bırakın",ru:"Перетащите изображение сюда",uk:"Перетягніть зображення сюди",ja:"ここに画像をドロップ",ko:"여기에 이미지를 놓으세요",th:"วางรูปที่นี่",id:"Lepaskan gambar di sini",ms:"Lepaskan imej di sini",vi:"Thả ảnh vào đây",hi:"यहाँ छवि छोड़ें",ar:"أسقط صورة هنا",el:"Αφήστε μια εικόνα εδώ",bg:"Пуснете изображение тук",sw:"Dondosha picha hapa",ca:"Deixa anar una imatge aquí"};
  return m[l] || "Drop an image here";
}
function localeBrowse(l) {
  const m = {fr:"ou parcourir",de:"oder Dateien wählen",it:"oppure sfoglia",pt:"ou escolher ficheiros",nl:"of bladeren",pl:"lub przeglądaj",sv:"eller bläddra",tr:"veya göz atın",ru:"или выберите файлы",uk:"або виберіть файли",ja:"または参照",ko:"또는 찾아보기",th:"หรือเรียกดู",id:"atau jelajahi",ms:"atau layari",vi:"hoặc duyệt",hi:"या ब्राउज़ करें",ar:"أو تصفح الملفات",el:"ή περιήγηση",bg:"или преглед",sw:"au vinjari",ca:"o exploreu"};
  return m[l] || "or browse files";
}
function localeOr(l) {
  const m = {fr:"ou",de:"oder",it:"oppure",pt:"ou",nl:"of",pl:"lub",sv:"eller",tr:"veya",ru:"или",uk:"або",ja:"または",ko:"또는",th:"หรือ",id:"atau",ms:"atau",vi:"hoặc",hi:"या",ar:"أو",el:"ή",bg:"или",sw:"au",ca:"o"};
  return m[l] || "or";
}
function localeBrowseButton(l) {
  const m = {fr:"Parcourir",de:"Dateien wählen",it:"Sfoglia",pt:"Escolher ficheiros",nl:"Bladeren",pl:"Przeglądaj",sv:"Bläddra",tr:"Göz at",ru:"Выбрать",uk:"Вибрати",ja:"参照",ko:"찾아보기",th:"เลือกไฟล์",id:"Jelajahi",ms:"Layari",vi:"Duyệt tệp",hi:"ब्राउज़",ar:"تصفح",el:"Περιήγηση",bg:"Преглед",sw:"Vinjari",ca:"Explora"};
  return m[l] || "Browse files";
}
function localePrivacy(l) {
  const m = {fr:"Stockage temporaire privé. Suppression après une heure.",de:"Privater temporärer Speicher. Löschung nach einer Stunde.",it:"Archiviazione temporanea privata. Eliminati dopo un’ora.",pt:"Armazenamento temporário privado. Eliminado após uma hora.",nl:"Privé tijdelijke opslag. Verwijderd na één uur.",pl:"Prywatne przechowywanie tymczasowe. Usuwane po godzinie.",sv:"Privat tillfällig lagring. Raderas efter en timme.",tr:"Özel geçici depolama. Bir saat sonra silinir.",ru:"Частное временное хранение. Удаляется через час.",uk:"Приватне тимчасове зберігання. Видаляється за годину.",ja:"プライベートな一時保存。1時間後に削除。",ko:"비공개 임시 저장. 1시간 후 삭제.",th:"ที่เก็บชั่วคราวแบบส่วนตัว ลบหลังหนึ่งชั่วโมง",id:"Penyimpanan sementara privat. Dihapus setelah satu jam.",ms:"Storan sementara peribadi. Dipadam selepas satu jam.",vi:"Lưu trữ tạm riêng tư. Xóa sau một giờ.",hi:"निजी अस्थायी संग्रहण। एक घंटे बाद हटाया जाता है।",ar:"تخزين مؤقت خاص. يُحذف بعد ساعة.",el:"Ιδιωτική προσωρινή αποθήκευση. Διαγραφή μετά από μία ώρα.",bg:"Частно временно хранилище. Изтрива се след един час.",sw:"Hifadhi ya muda ya faragha. Hufutwa baada ya saa moja.",ca:"Emmagatzematge temporal privat. S’elimina al cap d’una hora."};
  return m[l] || "Private temporary storage. Deleted after one hour.";
}
function localeDownload(l) {
  const m = {fr:"Télécharger",de:"Herunterladen",it:"Scarica",pt:"Transferir",nl:"Downloaden",pl:"Pobierz",sv:"Ladda ner",tr:"İndir",ru:"Скачать",uk:"Завантажити",ja:"ダウンロード",ko:"다운로드",th:"ดาวน์โหลด",id:"Unduh",ms:"Muat turun",vi:"Tải xuống",hi:"डाउनलोड",ar:"تنزيل",el:"Λήψη",bg:"Изтегли",sw:"Pakua",ca:"Baixa"};
  return m[l] || "Download";
}
function localePrivacyWord(l) {
  const m = {fr:"Confidentialité",de:"Datenschutz",it:"Privacy",pt:"Privacidade",nl:"Privacy",pl:"Prywatność",sv:"Integritet",tr:"Gizlilik",ru:"Конфиденциальность",uk:"Конфіденційність",ja:"プライバシー",ko:"개인정보",th:"ความเป็นส่วนตัว",id:"Privasi",ms:"Privasi",vi:"Quyền riêng tư",hi:"गोपनीयता",ar:"الخصوصية",el:"Απόρρητο",bg:"Поверителност",sw:"Faragha",ca:"Privadesa"};
  return m[l] || "Privacy";
}
function localeTerms(l) {
  const m = {fr:"Conditions",de:"Bedingungen",it:"Termini",pt:"Termos",nl:"Voorwaarden",pl:"Warunki",sv:"Villkor",tr:"Şartlar",ru:"Условия",uk:"Умови",ja:"利用規約",ko:"약관",th:"ข้อกำหนด",id:"Ketentuan",ms:"Terma",vi:"Điều khoản",hi:"शर्तें",ar:"الشروط",el:"Όροι",bg:"Условия",sw:"Sheria",ca:"Condicions"};
  return m[l] || "Terms";
}
function localeRetention(l) {
  const m = {fr:"Les fichiers invités expirent après une heure.",de:"Gast-Dateien laufen nach einer Stunde ab.",it:"I file ospiti scadono dopo un’ora.",pt:"Os ficheiros de convidado expiram após uma hora.",nl:"Gastbestanden verlopen na één uur.",pl:"Pliki gościa wygasają po godzinie.",sv:"Gästfiler upphör efter en timme.",tr:"Misafir dosyaları bir saat sonra silinir.",ru:"Гостевые файлы удаляются через час.",uk:"Гостьові файли зникають за годину.",ja:"ゲストファイルは1時間後に期限切れになります。",ko:"게스트 파일은 1시간 후 만료됩니다.",th:"ไฟล์ของผู้เยี่ยมชมหมดอายุหลังหนึ่งชั่วโมง",id:"File tamu kedaluwarsa setelah satu jam.",ms:"Fail tetamu tamat selepas satu jam.",vi:"Tệp khách hết hạn sau một giờ.",hi:"अतिथि फ़ाइलें एक घंटे बाद समाप्त होती हैं।",ar:"تنتهي صلاحية ملفات الضيوف بعد ساعة.",el:"Τα αρχεία επισκεπτών λήγουν μετά από μία ώρα.",bg:"Гост файловете изтичат след един час.",sw:"Faili za wageni huisha baada ya saa moja.",ca:"Els fitxers de convidat caduquen al cap d’una hora."};
  return m[l] || "Guest files expire after one hour.";
}
function localeFaq(l) {
  const m = {fr:"Questions fréquentes",de:"Häufige Fragen",it:"Domande frequenti",pt:"Perguntas frequentes",nl:"Veelgestelde vragen",pl:"Najczęstsze pytania",sv:"Vanliga frågor",tr:"SSS",ru:"Частые вопросы",uk:"Поширені запитання",ja:"よくある質問",ko:"자주 묻는 질문",th:"คำถามที่พบบ่อย",id:"FAQ",ms:"Soalan lazim",vi:"Câu hỏi thường gặp",hi:"अक्सर पूछे जाने वाले प्रश्न",ar:"الأسئلة الشائعة",el:"Συχνές ερωτήσεις",bg:"Често задавани въпроси",sw:"Maswali yanayoulizwa mara kwa mara",ca:"Preguntes freqüents"};
  return m[l] || "FAQ";
}

const root = path.join(__dirname, "../../src/messages");
const guestRoot = path.join(root, "guest");

for (const locale of LOCALES) {
  const core = CORE[locale];
  if (!core) throw new Error(`Missing CORE for ${locale}`);
  // Enrich language.nativeNames for switcher label fallbacks
  core.language = {
    ...core.language,
    nativeNames: NATIVE,
  };
  fs.writeFileSync(path.join(root, `${locale}.json`), JSON.stringify(core, null, 2) + "\n");
  const guest = guestFromCore(locale);
  fs.writeFileSync(path.join(guestRoot, `${locale}.json`), JSON.stringify(guest, null, 2) + "\n");
  console.log("wrote", locale);
}

// Enrich en + ur language.nativeNames without wiping existing content
for (const locale of ["en", "ur"]) {
  const file = path.join(root, `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  data.language = {
    ...(data.language || {}),
    nativeNames: NATIVE,
  };
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  console.log("enriched language.nativeNames", locale);
}

console.log("chrome packs ready");
