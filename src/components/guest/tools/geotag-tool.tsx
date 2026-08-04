"use client";

import {useEffect, useId, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import {trackGuestEvent} from "@/lib/guest/analytics";
import {
  defaultGuestGeotagOptions,
  isGuestGeotagJpegMime,
  type GuestGeotagOptions,
  type SafeGpsSummary,
} from "@/lib/guest/geotag-policy";
import type {GuestToolConfig, GuestToolOptionsPanelProps} from "@/components/guest/tool-config";
import {inspectGuestGps} from "@/components/guest/guest-api-client";

function GeotagOptionsPanel({
  options,
  sourceMimeType,
  uploadId,
  onChange,
  onProcessGateChange,
  disabled,
}: GuestToolOptionsPanelProps<GuestGeotagOptions>) {
  const t = useTranslations("guest.geotag");
  const locale = useLocale();
  const formId = useId();
  const jpegOk = isGuestGeotagJpegMime(sourceMimeType);
  const [gps, setGps] = useState<SafeGpsSummary | null>(null);
  const [inspecting, setInspecting] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoPending, setGeoPending] = useState(false);

  useEffect(() => {
    if (!uploadId || !jpegOk) {
      setGps(null);
      return;
    }
    let cancelled = false;
    setInspecting(true);
    void inspectGuestGps(uploadId).then((res) => {
      if (cancelled) return;
      setInspecting(false);
      if (res.ok) {
        setGps(res.gps);
        if (res.gps.present) {
          trackGuestEvent({name: "guest_geotag_existing_gps", toolCode: "geotag-image"});
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [uploadId, jpegOk]);

  useEffect(() => {
    const needsReplace = Boolean(gps?.present);
    onProcessGateChange?.(
      !jpegOk || (needsReplace && !options.replaceExistingGps) || inspecting,
    );
  }, [jpegOk, gps?.present, options.replaceExistingGps, inspecting, onProcessGateChange]);

  function useCurrentLocation() {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError(t("geoUnavailable"));
      return;
    }
    setGeoPending(true);
    trackGuestEvent({name: "guest_geotag_browser_location", toolCode: "geotag-image"});
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoPending(false);
        onChange({
          ...options,
          latitude: Math.round(pos.coords.latitude * 1e6) / 1e6,
          longitude: Math.round(pos.coords.longitude * 1e6) / 1e6,
          altitudeMeters:
            typeof pos.coords.altitude === "number" && Number.isFinite(pos.coords.altitude)
              ? Math.round(pos.coords.altitude * 10) / 10
              : options.altitudeMeters,
        });
      },
      (err) => {
        setGeoPending(false);
        if (err.code === err.PERMISSION_DENIED) setGeoError(t("geoDenied"));
        else if (err.code === err.TIMEOUT) setGeoError(t("geoTimeout"));
        else setGeoError(t("geoUnavailable"));
      },
      {enableHighAccuracy: true, timeout: 15000, maximumAge: 0},
    );
  }

  const needsReplace = Boolean(gps?.present);

  return (
    <section
      className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5"
      aria-labelledby={`${formId}-title`}
    >
      <div>
        <h2 id={`${formId}-title`} className="text-sm font-semibold">
          {t("optionsTitle")}
        </h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t("optionsHint")}</p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">{t("jpegOnly")}</p>
      </div>

      {!jpegOk ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3" role="alert">
          <p className="text-sm font-medium">{t("formatUnsupportedTitle")}</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t("formatUnsupportedBody")}</p>
          <a href={`/${locale}/convert-image`} className="mt-2 inline-block text-sm underline">
            {t("openConvert")}
          </a>
        </div>
      ) : null}

      {jpegOk ? (
        <div className="space-y-1 text-sm" aria-live="polite">
          <p className="font-medium">{t("existingTitle")}</p>
          {inspecting ? (
            <p className="text-[var(--muted-foreground)]">{t("readingGps")}</p>
          ) : gps?.present && gps.readable ? (
            <p>
              {t("existingFound")}:{" "}
              <span className="font-mono" dir="ltr">
                {gps.latitude}, {gps.longitude}
                {gps.altitudeMeters != null ? ` · ${gps.altitudeMeters} m` : ""}
              </span>
            </p>
          ) : gps?.present && !gps.readable ? (
            <p className="text-[var(--muted-foreground)]">{t("existingUnreadable")}</p>
          ) : (
            <p className="text-[var(--muted-foreground)]">{t("existingNone")}</p>
          )}
        </div>
      ) : null}

      {needsReplace ? (
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={options.replaceExistingGps}
            disabled={disabled}
            onChange={(e) => onChange({...options, replaceExistingGps: e.target.checked})}
          />
          <span>
            <span className="font-medium">{t("replaceConfirm")}</span>
            <span className="mt-0.5 block text-[var(--muted-foreground)]">{t("replaceConfirmHint")}</span>
          </span>
        </label>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span className="font-medium">{t("latitude")}</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.000001"
            min={-90}
            max={90}
            dir="ltr"
            disabled={disabled || !jpegOk}
            value={options.latitude}
            onChange={(e) =>
              onChange({...options, latitude: e.target.value === "" ? 0 : Number(e.target.value)})
            }
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 font-mono"
            aria-describedby={`${formId}-lat-hint`}
          />
          <span id={`${formId}-lat-hint`} className="text-xs text-[var(--muted-foreground)]">
            {t("latitudeHint")}
          </span>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">{t("longitude")}</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.000001"
            min={-180}
            max={180}
            dir="ltr"
            disabled={disabled || !jpegOk}
            value={options.longitude}
            onChange={(e) =>
              onChange({...options, longitude: e.target.value === "" ? 0 : Number(e.target.value)})
            }
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 font-mono"
            aria-describedby={`${formId}-lon-hint`}
          />
          <span id={`${formId}-lon-hint`} className="text-xs text-[var(--muted-foreground)]">
            {t("longitudeHint")}
          </span>
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span className="font-medium">{t("altitude")}</span>
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          dir="ltr"
          disabled={disabled || !jpegOk}
          value={options.altitudeMeters ?? ""}
          onChange={(e) =>
            onChange({
              ...options,
              altitudeMeters: e.target.value === "" ? null : Number(e.target.value),
            })
          }
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 font-mono sm:max-w-xs"
        />
        <span className="text-xs text-[var(--muted-foreground)]">{t("altitudeHint")}</span>
      </label>

      <label className="block space-y-1 text-sm">
        <span className="font-medium">{t("locationLabel")}</span>
        <input
          type="text"
          maxLength={120}
          disabled={disabled || !jpegOk}
          value={options.locationLabel ?? ""}
          onChange={(e) =>
            onChange({...options, locationLabel: e.target.value === "" ? null : e.target.value})
          }
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2"
        />
        <span className="text-xs text-[var(--muted-foreground)]">{t("locationLabelHint")}</span>
      </label>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          disabled={disabled || !jpegOk || geoPending}
          onClick={useCurrentLocation}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium disabled:opacity-50"
          aria-describedby={`${formId}-geo-hint`}
        >
          {geoPending ? t("geoRequesting") : t("useCurrentLocation")}
        </button>
        <p id={`${formId}-geo-hint`} className="text-xs text-[var(--muted-foreground)]">
          {t("geoPermissionHint")}
        </p>
      </div>
      {geoError ? (
        <p className="text-sm text-red-700" role="alert">
          {geoError}
        </p>
      ) : null}

      {needsReplace && !options.replaceExistingGps ? (
        <p className="text-sm text-amber-800" role="status">
          {t("replaceRequired")}
        </p>
      ) : null}

      <p className="text-xs text-[var(--muted-foreground)]">{t("privacyNotice")}</p>
    </section>
  );
}

function buildGeotaggedFilename(originalFilename: string | null): string {
  const raw = (originalFilename || "image").replace(/[/\\]/g, "");
  const base = raw.replace(/\.[^.]+$/, "") || "image";
  const safe = base.replace(/[^\w.-]+/g, "_").slice(0, 80) || "image";
  return `geotagged-${safe}.jpg`;
}

export const geotagToolConfig: GuestToolConfig<GuestGeotagOptions> = {
  toolCode: "geotag-image",
  operation: "geotag.write_gps",
  titleKey: "geotag",
  messageNamespace: "geotag",
  processingPhase: "writing_gps",
  downloadFilenamePrefix: "geotagged",
  buildDownloadFilename: buildGeotaggedFilename,
  showOptionsWhenDone: true,
  allowReprocess: true,
  defaultOptions: defaultGuestGeotagOptions(),
  OptionsPanel: GeotagOptionsPanel,
  buildJobOptions: (options) => ({
    latitude: options.latitude,
    longitude: options.longitude,
    altitudeMeters: options.altitudeMeters,
    locationLabel: options.locationLabel,
    replaceExistingGps: options.replaceExistingGps,
    metadataPolicyVersion: options.metadataPolicyVersion,
  }),
  mapResultSummary: (summary, {tTool}) => {
    const lat = Number(summary?.latitude ?? 0);
    const lon = Number(summary?.longitude ?? 0);
    const alt = summary?.altitudeMeters == null ? null : Number(summary.altitudeMeters);
    const width = Number(summary?.width ?? 0);
    const height = Number(summary?.height ?? 0);
    const action = String(summary?.gpsAction ?? "added");
    const label = summary?.locationLabel == null ? null : String(summary.locationLabel);
    const durationMs = summary?.durationMs == null ? null : Number(summary.durationMs);

    return {
      savedLabel: tTool(action === "replaced" ? "gpsReplaced" : "gpsAdded"),
      afterMeta: {width, height, format: "jpeg"},
      rows: [
        {label: tTool("result.format"), value: "JPEG"},
        {label: tTool("result.dimensions"), value: `${width}×${height}`},
        {
          label: tTool("result.latitude"),
          value: String(lat),
        },
        {
          label: tTool("result.longitude"),
          value: String(lon),
        },
        {
          label: tTool("result.altitude"),
          value: alt == null ? "—" : `${alt} m`,
        },
        {
          label: tTool("result.locationLabel"),
          value: label || "—",
        },
        {
          label: tTool("result.gpsAction"),
          value: tTool(action === "replaced" ? "gpsReplaced" : "gpsAdded"),
        },
        {
          label: tTool("result.processingTime"),
          value:
            durationMs != null
              ? tTool("result.processingTimeValue", {seconds: (durationMs / 1000).toFixed(1)})
              : "—",
        },
        {label: tTool("result.metadata"), value: tTool("metadataPolicyNotice")},
      ],
    };
  },
};
