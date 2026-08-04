/**
 * Guest Metadata Editor — draft + validation + sidecar exports.
 * No embedded EXIF/IPTC writing. No R2 rename. Op-free draft saves.
 */

export const GUEST_METADATA_EDIT_OPERATION = "metadata.edit" as const;
export const GUEST_METADATA_EDITOR_SCHEMA = "image-seo-metadata-v2" as const;

export const GUEST_EDITOR_ALT_HARD_MAX = 200;
export const GUEST_EDITOR_ALT_RECOMMENDED_MAX = 125;
export const GUEST_EDITOR_TITLE_MAX = 80;
export const GUEST_EDITOR_CAPTION_MAX = 200;
export const GUEST_EDITOR_SHORT_MAX = 280;
export const GUEST_EDITOR_LONG_MAX = 800;
export const GUEST_EDITOR_FILENAME_MAX = 80;
export const GUEST_EDITOR_KEYWORDS_MAX = 12;
export const GUEST_EDITOR_KEYWORD_LEN_MAX = 40;
export const GUEST_EDITOR_DRAFT_MAX_CHARS = 24_000;

export type GuestEditorSourceMode = "blank" | "ai_import";

export type GuestEditorMetadata = {
  altText: string;
  title: string;
  caption: string;
  shortDescription: string;
  longDescription: string;
  filename: string;
  keywords: string[];
};

export type GuestEditorDraft = {
  schemaVersion: typeof GUEST_METADATA_EDITOR_SCHEMA;
  sourceMode: GuestEditorSourceMode;
  decorative: boolean;
  metadata: GuestEditorMetadata;
  aiReviewed: boolean;
};

export type GuestEditorIssueSeverity = "recommendation" | "warning" | "blocking";

export type GuestEditorIssue = {
  severity: GuestEditorIssueSeverity;
  code: string;
  field?: keyof GuestEditorMetadata | "decorative" | "general";
  message: string;
};

export type GuestEditorValidation = {
  ok: boolean;
  issues: GuestEditorIssue[];
  checklist: {id: string; passed: boolean; label: string}[];
};

export function emptyGuestEditorMetadata(): GuestEditorMetadata {
  return {
    altText: "",
    title: "",
    caption: "",
    shortDescription: "",
    longDescription: "",
    filename: "",
    keywords: [],
  };
}

export function defaultGuestEditorDraft(): GuestEditorDraft {
  return {
    schemaVersion: GUEST_METADATA_EDITOR_SCHEMA,
    sourceMode: "blank",
    decorative: false,
    metadata: emptyGuestEditorMetadata(),
    aiReviewed: false,
  };
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Neutralize spreadsheet formula injection for CSV cells. */
export function neutralizeCsvCell(value: string): string {
  let v = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (/^[=+\-@]/.test(v)) {
    v = `'${v}`;
  }
  if (/[",\n]/.test(v) || v.startsWith("'")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

export function stripEditorText(raw: unknown, max: number): string {
  if (typeof raw !== "string" && typeof raw !== "number") return "";
  return String(raw)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007f]/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[^\S\n]+/g, " ")
    .trim()
    .slice(0, max);
}

export function sanitizeEditorFilename(raw: unknown): string {
  const input = String(raw ?? "");
  if (input.includes("..") || /[/\\]/.test(input) || input.startsWith(".")) {
    return "";
  }
  const reserved = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
  const lower = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\.(jpe?g|png|webp|gif)$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, GUEST_EDITOR_FILENAME_MAX)
    .replace(/-+$/g, "");
  if (!lower || reserved.test(lower)) return "";
  return lower;
}

export function normalizeEditorKeywords(raw: unknown): string[] {
  const list = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
      ? raw.split(/[,;\n]/)
      : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    const k = stripEditorText(item, GUEST_EDITOR_KEYWORD_LEN_MAX).toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(k);
    if (out.length >= GUEST_EDITOR_KEYWORDS_MAX) break;
  }
  return out;
}

export function trustedExtensionFromMime(mime: string | null | undefined): "jpg" | "png" | "webp" {
  const m = (mime || "").toLowerCase();
  if (m === "image/png") return "png";
  if (m === "image/webp") return "webp";
  return "jpg";
}

export function suggestedFilenameWithExtension(
  base: string,
  mime: string | null | undefined,
): string {
  const safe = sanitizeEditorFilename(base) || "image";
  return `${safe}.${trustedExtensionFromMime(mime)}`;
}

export function parseGuestEditorDraft(raw: unknown): GuestEditorDraft {
  if (!raw || typeof raw !== "object") throw new Error("DRAFT_INVALID");
  const obj = raw as Record<string, unknown>;
  for (const banned of ["storageKey", "signedUrl", "htmlRaw", "script", "prompt", "scrubbed"]) {
    if (banned in obj) throw new Error("DRAFT_INVALID");
  }
  const metaRaw =
    obj.metadata && typeof obj.metadata === "object"
      ? (obj.metadata as Record<string, unknown>)
      : obj;
  const decorative = obj.decorative === true;
  const draft: GuestEditorDraft = {
    schemaVersion: GUEST_METADATA_EDITOR_SCHEMA,
    sourceMode: obj.sourceMode === "ai_import" ? "ai_import" : "blank",
    decorative,
    metadata: {
      altText: decorative
        ? ""
        : stripEditorText(metaRaw.altText, GUEST_EDITOR_ALT_HARD_MAX),
      title: stripEditorText(metaRaw.title, GUEST_EDITOR_TITLE_MAX),
      caption: stripEditorText(metaRaw.caption, GUEST_EDITOR_CAPTION_MAX),
      shortDescription: stripEditorText(metaRaw.shortDescription, GUEST_EDITOR_SHORT_MAX),
      longDescription: stripEditorText(metaRaw.longDescription, GUEST_EDITOR_LONG_MAX),
      filename: sanitizeEditorFilename(metaRaw.filename),
      keywords: normalizeEditorKeywords(metaRaw.keywords),
    },
    aiReviewed: obj.aiReviewed === true,
  };
  if (JSON.stringify(draft).length > GUEST_EDITOR_DRAFT_MAX_CHARS) {
    throw new Error("DRAFT_TOO_LARGE");
  }
  return draft;
}

export function validateGuestEditorDraft(draft: GuestEditorDraft): GuestEditorValidation {
  const issues: GuestEditorIssue[] = [];
  const m = draft.metadata;

  if (!draft.decorative && !m.altText) {
    issues.push({
      severity: "warning",
      code: "ALT_MISSING",
      field: "altText",
      message: "Meaningful images should include alt text (or mark decorative).",
    });
  }
  if (draft.decorative && m.altText) {
    issues.push({
      severity: "blocking",
      code: "DECORATIVE_ALT_CONFLICT",
      field: "decorative",
      message: "Decorative mode requires empty alt text.",
    });
  }
  if (m.altText.length > GUEST_EDITOR_ALT_RECOMMENDED_MAX) {
    issues.push({
      severity: "recommendation",
      code: "ALT_LONG",
      field: "altText",
      message: `Alt text is longer than the recommended ${GUEST_EDITOR_ALT_RECOMMENDED_MAX} characters.`,
    });
  }
  if (/^(image of|picture of)\b/i.test(m.altText)) {
    issues.push({
      severity: "warning",
      code: "ALT_IMAGE_OF",
      field: "altText",
      message: 'Avoid starting with "image of" or "picture of" unless necessary.',
    });
  }
  if (!m.title) {
    issues.push({
      severity: "recommendation",
      code: "TITLE_MISSING",
      field: "title",
      message: "A title is recommended for SEO and CMS fields.",
    });
  }
  if (!m.filename) {
    issues.push({
      severity: "blocking",
      code: "FILENAME_INVALID",
      field: "filename",
      message: "Suggested filename is required and must be a safe Latin slug.",
    });
  } else if (m.filename.length < 3 || m.filename === "image") {
    issues.push({
      severity: "warning",
      code: "FILENAME_GENERIC",
      field: "filename",
      message: "Filename is very generic; consider a more descriptive slug.",
    });
  }
  if (m.title && m.filename && m.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") === m.filename) {
    issues.push({
      severity: "recommendation",
      code: "TITLE_EQUALS_FILENAME",
      field: "title",
      message: "Title is nearly identical to the filename.",
    });
  }
  if (m.caption && m.altText && m.caption === m.altText) {
    issues.push({
      severity: "recommendation",
      code: "CAPTION_DUP_ALT",
      field: "caption",
      message: "Caption duplicates alt text.",
    });
  }
  if (draft.sourceMode === "ai_import" && !draft.aiReviewed) {
    issues.push({
      severity: "warning",
      code: "AI_NOT_REVIEWED",
      field: "general",
      message: "AI-generated content may contain mistakes — review before using it.",
    });
  }
  const words = m.altText.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length >= 4) {
    const joined = words.join(" ");
    const half = words.slice(0, Math.floor(words.length / 2)).join(" ");
    if (half.length >= 8 && joined.includes(`${half} ${half}`)) {
      issues.push({
        severity: "warning",
        code: "ALT_REPEATED",
        field: "altText",
        message: "Alt text appears to repeat keyword phrases.",
      });
    }
  }

  const checklist = [
    {
      id: "alt",
      passed: draft.decorative || Boolean(m.altText),
      label: "Alt text present or decorative mode selected",
    },
    {id: "title", passed: Boolean(m.title), label: "Title present"},
    {id: "filename", passed: Boolean(m.filename), label: "Suggested filename valid"},
    {
      id: "keywords",
      passed: m.keywords.length === new Set(m.keywords.map((k) => k.toLowerCase())).size,
      label: "Keywords deduplicated",
    },
    {
      id: "blocking",
      passed: !issues.some((i) => i.severity === "blocking"),
      label: "No blocking errors",
    },
    {
      id: "ai",
      passed: draft.sourceMode !== "ai_import" || draft.aiReviewed,
      label: "AI content reviewed when imported",
    },
  ];

  return {
    ok: !issues.some((i) => i.severity === "blocking"),
    issues,
    checklist,
  };
}

export function buildHtmlImageSnippet(params: {
  filename: string;
  altText: string;
  title: string;
  decorative: boolean;
}): string {
  const src = `/images/${escapeHtml(params.filename || "image.jpg")}`;
  const alt = params.decorative ? "" : escapeHtml(params.altText);
  const title = escapeHtml(params.title);
  return `<img\n  src="${src}"\n  alt="${alt}"${title ? `\n  title="${title}"` : ""}\n/>`;
}

export function buildHtmlFigureSnippet(params: {
  filename: string;
  altText: string;
  caption: string;
  decorative: boolean;
}): string {
  const src = `/images/${escapeHtml(params.filename || "image.jpg")}`;
  const alt = params.decorative ? "" : escapeHtml(params.altText);
  const caption = escapeHtml(params.caption);
  const lines = [
    "<figure>",
    `  <img src="${src}" alt="${alt}" />`,
    caption ? `  <figcaption>${caption}</figcaption>` : null,
    "</figure>",
  ];
  return lines.filter(Boolean).join("\n");
}

export function formatEditorTxt(params: {
  draft: GuestEditorDraft;
  suggestedFilename: string;
  format: string;
  width: number | null;
  height: number | null;
  expiresAt?: string | null;
}): string {
  const m = params.draft.metadata;
  return [
    "Image SEO Metadata Editor export",
    "These checks are recommendations and do not guarantee search rankings.",
    "",
    `Format: ${params.format}`,
    `Dimensions: ${params.width ?? "—"}×${params.height ?? "—"}`,
    `Suggested filename: ${params.suggestedFilename}`,
    `Decorative: ${params.draft.decorative ? "yes" : "no"}`,
    params.expiresAt ? `Expires: ${params.expiresAt}` : null,
    "",
    `Alt text: ${m.altText || "(empty)"}`,
    `Title: ${m.title || "—"}`,
    `Caption: ${m.caption || "—"}`,
    `Short description: ${m.shortDescription || "—"}`,
    `Long description: ${m.longDescription || "—"}`,
    `Filename base: ${m.filename || "—"}`,
    `Keywords: ${m.keywords.join(", ") || "—"}`,
    "",
    "Alt text must normally be added in your website or CMS.",
    "Exporting metadata does not publish it.",
    "",
  ]
    .filter((l) => l !== null)
    .join("\n");
}

export function formatEditorJson(params: {
  draft: GuestEditorDraft;
  originalFilename: string | null;
  suggestedFilename: string;
  format: string;
  width: number | null;
  height: number | null;
  generatedAt: string;
  expiresAt?: string | null;
}): string {
  return `${JSON.stringify(
    {
      schemaVersion: GUEST_METADATA_EDITOR_SCHEMA,
      image: {
        filename: params.originalFilename,
        suggestedFilename: params.suggestedFilename,
        format: params.format,
        width: params.width,
        height: params.height,
      },
      metadata: {
        ...params.draft.metadata,
        decorative: params.draft.decorative,
      },
      generatedAt: params.generatedAt,
      expiresAt: params.expiresAt ?? null,
    },
    null,
    2,
  )}\n`;
}

export function formatEditorCsv(params: {
  draft: GuestEditorDraft;
  originalFilename: string | null;
  suggestedFilename: string;
  format: string;
  width: number | null;
  height: number | null;
}): string {
  const m = params.draft.metadata;
  const headers = [
    "original_filename",
    "suggested_filename",
    "alt_text",
    "title",
    "caption",
    "short_description",
    "long_description",
    "keywords",
    "decorative",
    "format",
    "width",
    "height",
  ];
  const row = [
    params.originalFilename ?? "",
    params.suggestedFilename,
    m.altText,
    m.title,
    m.caption,
    m.shortDescription,
    m.longDescription,
    m.keywords.join("|"),
    params.draft.decorative ? "true" : "false",
    params.format,
    String(params.width ?? ""),
    String(params.height ?? ""),
  ].map(neutralizeCsvCell);
  return `${headers.join(",")}\n${row.join(",")}\n`;
}

export function mapAiResultToEditorDraft(aiResult: {
  altText?: string;
  title?: string;
  caption?: string;
  shortDescription?: string;
  longDescription?: string;
  filename?: string;
  keywords?: string[];
}): GuestEditorDraft {
  return parseGuestEditorDraft({
    sourceMode: "ai_import",
    decorative: false,
    aiReviewed: false,
    metadata: {
      altText: aiResult.altText ?? "",
      title: aiResult.title ?? "",
      caption: aiResult.caption ?? "",
      shortDescription: aiResult.shortDescription ?? "",
      longDescription: aiResult.longDescription ?? "",
      filename: aiResult.filename ?? "",
      keywords: aiResult.keywords ?? [],
    },
  });
}
