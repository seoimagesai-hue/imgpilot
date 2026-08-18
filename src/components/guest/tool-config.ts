"use client";

import type {ComponentType} from "react";
import type {GuestProgressPhase} from "@/components/guest/progress-card";
import type {PreviewMeta} from "@/components/guest/before-after-preview";
import type {ToolResultRow} from "@/components/guest/tool-result-panel";

export type GuestToolResultView = {
  savedLabel?: string | null;
  afterMeta?: PreviewMeta | null;
  rows: ToolResultRow[];
};

export type GuestToolPresentation = {
  statusBarVariant?: "default" | "premium";
  guestBarTitle?: string;
  guestBarBody?: string;
  guestCountdownLabel?: string;
  dropLabel?: string;
  supportLabel?: string;
  browseLabel?: string;
  formatsHint?: string;
  /** Landing pages: clean hero upload chrome matching marketing mockups. */
  landingChrome?: "marketing";
  uploadFeatures?: readonly {title: string; body: string}[];
  showPopularSizes?: boolean;
  /** Override popular resize chips (defaults to social/web presets). */
  popularSizes?: readonly {id: string; label: string; width: number; height: number}[];
  showQualityNote?: boolean;
  qualityNoteHref?: string;
  qualityNoteBefore?: string;
  qualityNoteLink?: string;
  qualityNoteAfter?: string;
  /** Compress landing: Maximum Quality / Recommended / Smaller File / Custom labels. */
  marketingCompressPresets?: boolean;
  enableExternalReset?: boolean;
  /** Emit live result events for marketing comparison sections. */
  emitResultEvents?: boolean;
  resultEventTool?: string;
  guestDeletionTitle?: string;
  /** Homepage hero only — return to the picker chrome instead of the default dropzone. */
  onIdleReset?: () => void;
};

export type GuestToolOptionsPanelProps<TOptions> = {
  options: TOptions;
  sourceWidth: number | null;
  sourceHeight: number | null;
  /** Object URL / preview URL for interactive tools (crop). */
  imageUrl: string | null;
  sourceMimeType: string | null;
  hasAlpha: boolean | null;
  avifEncodeSupported: boolean;
  /** Validated guest upload id when available (inspect APIs). */
  uploadId?: string | null;
  /** When true, shared Process action stays disabled (e.g. geotag replace gate). */
  onProcessGateChange?: (blocked: boolean) => void;
  onChange: (next: TOptions) => void;
  disabled?: boolean;
  presentation?: GuestToolPresentation;
};

export type GuestToolConfig<TOptions> = {
  toolCode: string;
  operation: string;
  /** Optional MIME allow-list override for format-specific landings. */
  allowedMimeTypes?: readonly string[];
  /** Hide ToolHeader when the landing page already provides H1. */
  hideToolHeader?: boolean;
  /** Optional marketing presentation overrides (no processing changes). */
  presentation?: GuestToolPresentation;
  /** i18n key under guest.tools.* */
  titleKey:
    | "compress"
    | "resize"
    | "crop"
    | "convert"
    | "rotate"
    | "watermark"
    | "blur"
    | "meme"
    | "geotag"
    | "metadata"
    | "aiAlt"
    | "metadataEditor";
  /** Nested message namespace e.g. compress / resize / crop / convert / geotag / metadata */
  messageNamespace:
    | "compress"
    | "resize"
    | "crop"
    | "convert"
    | "rotate"
    | "watermark"
    | "blur"
    | "meme"
    | "geotag"
    | "metadata"
    | "aiAlt"
    | "metadataEditor";
  processingPhase: Extract<
    GuestProgressPhase,
    | "compressing"
    | "resizing"
    | "cropping"
    | "converting"
    | "writing_gps"
    | "reading_metadata"
    | "generating_metadata"
    | "preparing_editor"
    | "processing"
  >;
  defaultOptions: TOptions;
  downloadFilenamePrefix?: string;
  /** Optional download name builder (safe client suggestion only). */
  buildDownloadFilename?: (originalFilename: string | null) => string;
  /** Keep options/editor visible after a successful run (re-crop / re-convert). */
  showOptionsWhenDone?: boolean;
  /** Show process action again on the done stage. */
  allowReprocess?: boolean;
  /** Viewer-only tools: no processed-image download. */
  hideImageDownload?: boolean;
  OptionsPanel: ComponentType<GuestToolOptionsPanelProps<TOptions>>;
  buildJobOptions: (options: TOptions) => Record<string, unknown>;
  mapResultSummary: (
    summary: Record<string, unknown> | null | undefined,
    helpers: {
      formatBytes: (n: number) => string;
      tTool: (key: string, values?: Record<string, string | number | Date>) => string;
    },
  ) => GuestToolResultView;
  /** Optional rich result (Metadata Viewer sections + exports). */
  CustomResultPanel?: ComponentType<{
    summary: Record<string, unknown> | null | undefined;
    expiresAt: string | null;
    uploadId?: string | null;
    jobId?: string | null;
  }>;
};
