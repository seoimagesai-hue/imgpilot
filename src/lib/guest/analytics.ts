/**
 * Privacy-safe guest analytics — no filenames, paths, or image bytes.
 */
export type GuestMimeFamily = "jpeg" | "png" | "webp" | "other";
export type GuestSizeBucket = "lte1mb" | "lte5mb" | "lte10mb" | "gt10mb";

export type GuestAnalyticsEvent =
  | {
      name: "guest_tool_upload";
      toolCode: string;
      ok: boolean;
      errorCode?: string;
      mimeFamily?: GuestMimeFamily;
      sizeBucket?: GuestSizeBucket;
    }
  | {
      name: "guest_tool_process";
      toolCode: string;
      ok: boolean;
      errorCode?: string;
      durationMs?: number;
      preset?: string;
    }
  | {
      name: "guest_tool_download";
      toolCode: string;
      ok: boolean;
    }
  | {
      /** Aggregate only — never include coordinates, filenames, or EXIF values. */
      name:
        | "guest_geotag_existing_gps"
        | "guest_geotag_browser_location"
        | "guest_geotag_manual_location"
        | "guest_metadata_export_txt"
        | "guest_metadata_export_json"
        | "guest_metadata_copy_gps"
        | "guest_ai_export_txt"
        | "guest_ai_export_json"
        | "guest_metadata_editor_save"
        | "guest_metadata_editor_validate"
        | "guest_metadata_editor_ai_import"
        | "guest_metadata_editor_copy"
        | "guest_metadata_editor_export_txt"
        | "guest_metadata_editor_export_json"
        | "guest_metadata_editor_export_csv"
        | "guest_metadata_editor_export_html"
        | "guest_metadata_editor_renamed_download";
      toolCode: string;
    };

function mimeFamily(mime: string): GuestMimeFamily {
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpeg";
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  return "other";
}

export function sizeBucket(bytes: number): GuestSizeBucket {
  if (bytes <= 1024 * 1024) return "lte1mb";
  if (bytes <= 5 * 1024 * 1024) return "lte5mb";
  if (bytes <= 10 * 1024 * 1024) return "lte10mb";
  return "gt10mb";
}

export function trackGuestEvent(event: GuestAnalyticsEvent): void {
  if (typeof window === "undefined") return;
  try {
    console.info("[guest-analytics]", event);
  } catch {
    // ignore
  }
}

export function guestMimeFamilyFromFile(file: File): GuestMimeFamily {
  return mimeFamily(file.type || "");
}
