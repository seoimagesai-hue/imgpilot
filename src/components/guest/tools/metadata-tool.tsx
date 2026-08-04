"use client";

import {useId, useState, type ReactNode} from "react";
import {useTranslations} from "next-intl";
import {trackGuestEvent} from "@/lib/guest/analytics";
import {
  copyDimensionsText,
  copyGpsText,
  defaultGuestMetadataOptions,
  formatSafeMetadataJson,
  formatSafeMetadataTxt,
  type GuestMetadataOptions,
  type MetadataExportLabels,
  type SafeMetadataResult,
} from "@/lib/guest/metadata-policy";
import type {GuestToolConfig, GuestToolOptionsPanelProps} from "@/components/guest/tool-config";

function isSafeMetadataResult(raw: unknown): raw is SafeMetadataResult {
  return Boolean(
    raw &&
      typeof raw === "object" &&
      (raw as SafeMetadataResult).schemaVersion === "guest-image-metadata-v2" &&
      (raw as SafeMetadataResult).file &&
      (raw as SafeMetadataResult).image,
  );
}

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], {type: mime});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function Field({label, value}: {label: string; value: string | number | null | undefined}) {
  if (value == null || value === "") return null;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-2 text-sm">
      <dt className="text-[var(--muted-foreground)]">{label}</dt>
      <dd className="font-medium" dir="ltr">
        {value}
      </dd>
    </div>
  );
}

function Section({
  id,
  title,
  children,
  notice,
}: {
  id: string;
  title: string;
  children: ReactNode;
  notice?: string;
}) {
  return (
    <section className="space-y-2 rounded-xl border border-[var(--border)] p-4" aria-labelledby={id}>
      <h3 id={id} className="text-sm font-semibold">
        {title}
      </h3>
      {notice ? (
        <p className="text-xs text-[var(--muted-foreground)]" role="note">
          {notice}
        </p>
      ) : null}
      <dl className="space-y-1.5">{children}</dl>
    </section>
  );
}

function MetadataOptionsPanel({disabled}: GuestToolOptionsPanelProps<GuestMetadataOptions>) {
  const t = useTranslations("guest.metadata");
  return (
    <section className="space-y-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
      <h2 className="text-sm font-semibold">{t("optionsTitle")}</h2>
      <p className="text-sm text-[var(--muted-foreground)]">{t("optionsHint")}</p>
      <p className="text-xs text-[var(--muted-foreground)]">{t("formats")}</p>
      <p className="text-xs text-[var(--muted-foreground)]" aria-live="polite">
        {disabled ? t("inspecting") : t("viewerOnly")}
      </p>
    </section>
  );
}

function MetadataResultPanel({
  summary,
  expiresAt,
}: {
  summary: Record<string, unknown> | null | undefined;
  expiresAt: string | null;
}) {
  const t = useTranslations("guest.metadata");
  const formId = useId();
  const [status, setStatus] = useState<string | null>(null);

  if (!isSafeMetadataResult(summary)) {
    return (
      <p className="text-sm text-[var(--muted-foreground)]" role="status">
        {t("resultUnavailable")}
      </p>
    );
  }

  const result = summary;
  const na = t("na");
  const yes = t("yes");
  const no = t("no");

  function exportLabels(): MetadataExportLabels {
    return {
      file: t("sections.file"),
      image: t("sections.image"),
      camera: t("sections.camera"),
      gps: t("sections.gps"),
      color: t("sections.color"),
      resolution: t("sections.resolution"),
      animation: t("sections.animation"),
      privacy: t("sections.privacy"),
      filename: t("fields.filename"),
      format: t("fields.format"),
      mimeType: t("fields.mimeType"),
      byteSize: t("fields.byteSize"),
      width: t("fields.width"),
      height: t("fields.height"),
      aspectRatio: t("fields.aspectRatio"),
      pixelCount: t("fields.pixelCount"),
      orientation: t("fields.orientation"),
      animated: t("fields.animated"),
      frameCount: t("fields.frameCount"),
      hasAlpha: t("fields.hasAlpha"),
      colorSpace: t("fields.colorSpace"),
      channels: t("fields.channels"),
      bitDepth: t("fields.bitDepth"),
      density: t("fields.density"),
      printSize: t("fields.printSize"),
      printSizeNote: t("fields.printSizeNote"),
      icc: t("fields.icc"),
      progressive: t("fields.progressive"),
      chroma: t("fields.chroma"),
      make: t("fields.make"),
      model: t("fields.model"),
      lens: t("fields.lens"),
      iso: t("fields.iso"),
      exposureTime: t("fields.exposureTime"),
      aperture: t("fields.aperture"),
      focalLength: t("fields.focalLength"),
      flash: t("fields.flash"),
      whiteBalance: t("fields.whiteBalance"),
      exposureProgram: t("fields.exposureProgram"),
      meteringMode: t("fields.meteringMode"),
      dateTaken: t("fields.dateTaken"),
      software: t("fields.software"),
      gpsPresent: t("gps.present"),
      gpsAbsent: t("gps.absent"),
      gpsUnreadable: t("gps.unreadable"),
      latitude: t("fields.latitude"),
      longitude: t("fields.longitude"),
      altitude: t("fields.altitude"),
      gpsSensitive: t("gps.sensitive"),
      na,
      yes,
      no,
    };
  }

  async function onCopy(kind: string, text: string | null) {
    if (!text) {
      setStatus(t("copyEmpty"));
      return;
    }
    const ok = await copyText(text);
    setStatus(ok ? t("copySuccess") : t("copyFailed"));
    if (kind === "gps") {
      trackGuestEvent({name: "guest_metadata_copy_gps", toolCode: "image-metadata"});
    }
  }

  function onTxt() {
    const txt = formatSafeMetadataTxt(result, exportLabels(), {expiresAt});
    downloadBlob("image-metadata.txt", txt, "text/plain;charset=utf-8");
    trackGuestEvent({name: "guest_metadata_export_txt", toolCode: "image-metadata"});
    setStatus(t("exportTxtReady"));
  }

  function onJson() {
    downloadBlob("image-metadata.json", formatSafeMetadataJson(result), "application/json;charset=utf-8");
    trackGuestEvent({name: "guest_metadata_export_json", toolCode: "image-metadata"});
    setStatus(t("exportJsonReady"));
  }

  const cam = result.camera;
  const hasCamera = Object.values(cam).some((v) => v != null && v !== "");
  const dens =
    result.image.densityX != null
      ? `${result.image.densityX} × ${result.image.densityY ?? result.image.densityX} ${result.image.densityUnit ?? "dpi"}`
      : null;
  const print =
    result.image.printWidthInches != null && result.image.printHeightInches != null
      ? `${result.image.printWidthInches} × ${result.image.printHeightInches} in`
      : null;

  return (
    <div className="space-y-4" aria-labelledby={`${formId}-results`}>
      <h2 id={`${formId}-results`} className="text-base font-semibold">
        {t("result.title")}
      </h2>

      <Section id={`${formId}-file`} title={t("sections.file")}>
        <Field label={t("fields.filename")} value={result.file.filename} />
        <Field label={t("fields.format")} value={result.file.format.toUpperCase()} />
        <Field label={t("fields.mimeType")} value={result.file.mimeType} />
        <Field label={t("fields.byteSize")} value={result.file.byteSize} />
      </Section>

      <Section id={`${formId}-image`} title={t("sections.image")}>
        <Field label={t("fields.width")} value={result.image.width} />
        <Field label={t("fields.height")} value={result.image.height} />
        <Field label={t("fields.aspectRatio")} value={result.image.aspectRatio} />
        <Field label={t("fields.pixelCount")} value={result.image.pixelCount} />
        <Field label={t("fields.orientation")} value={result.image.orientation} />
        <Field
          label={t("fields.hasAlpha")}
          value={result.image.hasAlpha == null ? null : result.image.hasAlpha ? yes : no}
        />
      </Section>

      <Section id={`${formId}-color`} title={t("sections.color")}>
        <Field label={t("fields.colorSpace")} value={result.image.colorSpace} />
        <Field label={t("fields.channels")} value={result.image.channels} />
        <Field label={t("fields.bitDepth")} value={result.image.bitDepth} />
        <Field
          label={t("fields.icc")}
          value={
            result.image.iccProfilePresent == null
              ? null
              : result.image.iccProfilePresent
                ? yes
                : no
          }
        />
        <Field
          label={t("fields.progressive")}
          value={
            result.image.progressive == null ? null : result.image.progressive ? yes : no
          }
        />
        <Field label={t("fields.chroma")} value={result.image.chromaSubsampling} />
      </Section>

      {(dens || print) && (
        <Section id={`${formId}-res`} title={t("sections.resolution")} notice={t("fields.printSizeNote")}>
          <Field label={t("fields.density")} value={dens} />
          <Field label={t("fields.printSize")} value={print} />
        </Section>
      )}

      <Section id={`${formId}-anim`} title={t("sections.animation")}>
        <Field label={t("fields.animated")} value={result.image.animated ? yes : no} />
        <Field label={t("fields.frameCount")} value={result.image.frameCount} />
      </Section>

      {hasCamera ? (
        <Section id={`${formId}-cam`} title={t("sections.camera")}>
          <Field label={t("fields.make")} value={cam.make} />
          <Field label={t("fields.model")} value={cam.model} />
          <Field label={t("fields.lens")} value={cam.lens} />
          <Field label={t("fields.iso")} value={cam.iso} />
          <Field label={t("fields.exposureTime")} value={cam.exposureTime} />
          <Field label={t("fields.aperture")} value={cam.aperture} />
          <Field label={t("fields.focalLength")} value={cam.focalLength} />
          <Field label={t("fields.flash")} value={cam.flash} />
          <Field label={t("fields.whiteBalance")} value={cam.whiteBalance} />
          <Field label={t("fields.exposureProgram")} value={cam.exposureProgram} />
          <Field label={t("fields.meteringMode")} value={cam.meteringMode} />
          <Field label={t("fields.dateTaken")} value={cam.dateTaken} />
          <Field label={t("fields.software")} value={cam.software} />
        </Section>
      ) : (
        <Section id={`${formId}-cam`} title={t("sections.camera")}>
          <p className="text-sm text-[var(--muted-foreground)]">{t("cameraUnavailable")}</p>
        </Section>
      )}

      <Section id={`${formId}-gps`} title={t("sections.gps")} notice={t("gps.sensitive")}>
        {!result.gps.present ? (
          <p className="text-sm text-[var(--muted-foreground)]">{t("gps.absent")}</p>
        ) : !result.gps.readable ? (
          <p className="text-sm text-[var(--muted-foreground)]">{t("gps.unreadable")}</p>
        ) : (
          <>
            <p className="text-sm">{t("gps.present")}</p>
            <Field label={t("fields.latitude")} value={result.gps.latitude} />
            <Field label={t("fields.longitude")} value={result.gps.longitude} />
            <Field label={t("fields.altitude")} value={result.gps.altitudeMeters} />
          </>
        )}
      </Section>

      <Section id={`${formId}-privacy`} title={t("sections.privacy")}>
        <p className="text-sm text-[var(--muted-foreground)]">{t("privacyNotice")}</p>
        {expiresAt ? (
          <Field label={t("fields.expiresAt")} value={expiresAt} />
        ) : null}
      </Section>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap" role="group" aria-label={t("copyGroupAria")}>
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium"
          onClick={() => void onCopy("dims", copyDimensionsText(result))}
        >
          {t("actions.copyDimensions")}
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium"
          onClick={() =>
            void onCopy(
              "all",
              formatSafeMetadataTxt(result, exportLabels(), {expiresAt}),
            )
          }
        >
          {t("actions.copyAll")}
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium"
          onClick={() => void onCopy("gps", copyGpsText(result, t("gps.sensitive")))}
        >
          {t("actions.copyGps")}
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium"
          onClick={onTxt}
        >
          {t("actions.downloadTxt")}
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium"
          onClick={onJson}
        >
          {t("actions.downloadJson")}
        </button>
      </div>
      <p className="text-sm text-[var(--muted-foreground)]" role="status" aria-live="polite">
        {status}
      </p>
    </div>
  );
}

export const metadataToolConfig: GuestToolConfig<GuestMetadataOptions> = {
  toolCode: "image-metadata",
  operation: "metadata.inspect",
  titleKey: "metadata",
  messageNamespace: "metadata",
  processingPhase: "reading_metadata",
  hideImageDownload: true,
  allowReprocess: true,
  showOptionsWhenDone: true,
  defaultOptions: defaultGuestMetadataOptions(),
  OptionsPanel: MetadataOptionsPanel,
  CustomResultPanel: MetadataResultPanel,
  buildJobOptions: () => ({
    schemaVersion: "guest-image-metadata-v2",
  }),
  mapResultSummary: (summary, {formatBytes, tTool}) => {
    if (!isSafeMetadataResult(summary)) {
      return {rows: [], savedLabel: null, afterMeta: null};
    }
    return {
      savedLabel: tTool("inspectComplete"),
      afterMeta: {
        width: summary.image.width,
        height: summary.image.height,
        bytes: summary.file.byteSize,
        format: summary.file.format,
      },
      rows: [
        {
          label: tTool("fields.dimensions"),
          value: `${summary.image.width}×${summary.image.height}`,
        },
        {
          label: tTool("fields.byteSize"),
          value: formatBytes(summary.file.byteSize),
        },
        {
          label: tTool("fields.format"),
          value: summary.file.format.toUpperCase(),
        },
      ],
    };
  },
};
