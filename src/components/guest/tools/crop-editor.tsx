"use client";

/**
 * Lightweight custom crop editor — no third-party crop library.
 * Emits advisory normalized crops (0–1); server trusts its own dims.
 * Stage uses object-contain letterboxing so the crop box tracks the image.
 */
import {useCallback, useEffect, useId, useRef, useState} from "react";
import {useTranslations} from "next-intl";
import {
  aspectRatioValue,
  defaultGuestCropOptions,
  type GuestCropAspectRatio,
  type GuestCropOptions,
  type NormalizedCropRect,
} from "@/lib/guest/crop-policy";

const ASPECTS: GuestCropAspectRatio[] = ["free", "1:1", "4:3", "3:4", "16:9", "9:16"];

type Props = {
  imageUrl: string | null;
  options: GuestCropOptions;
  onChange: (next: GuestCropOptions) => void;
  disabled?: boolean;
};

type ImageBox = {left: number; top: number; width: number; height: number};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function containBox(
  stageW: number,
  stageH: number,
  naturalW: number,
  naturalH: number,
): ImageBox {
  const scale = Math.min(stageW / naturalW, stageH / naturalH);
  const width = naturalW * scale;
  const height = naturalH * scale;
  return {
    left: (stageW - width) / 2,
    top: (stageH - height) / 2,
    width,
    height,
  };
}

function fitAspect(
  rect: NormalizedCropRect,
  aspect: GuestCropAspectRatio,
): NormalizedCropRect {
  const ratio = aspectRatioValue(aspect);
  if (ratio == null) return rect;

  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  let width = rect.width;
  let height = width / ratio;
  if (height > 1) {
    height = 1;
    width = height * ratio;
  }
  if (width > 1) {
    width = 1;
    height = width / ratio;
  }
  let x = cx - width / 2;
  let y = cy - height / 2;
  x = clamp(x, 0, 1 - width);
  y = clamp(y, 0, 1 - height);
  return {x, y, width, height};
}

export function CropEditor({imageUrl, options, onChange, disabled}: Props) {
  const t = useTranslations("guest.crop");
  const labelId = useId();
  const stageRef = useRef<HTMLDivElement>(null);
  const [natural, setNatural] = useState<{w: number; h: number} | null>(null);
  const [stageSize, setStageSize] = useState({w: 0, h: 0});
  const dragRef = useRef<{
    mode: "move" | "resize";
    startX: number;
    startY: number;
    origin: NormalizedCropRect;
  } | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setNatural(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setNatural({w: img.naturalWidth, h: img.naturalHeight});
      }
    };
    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setStageSize({w: r.width, h: r.height});
    });
    ro.observe(el);
    const r = el.getBoundingClientRect();
    setStageSize({w: r.width, h: r.height});
    return () => ro.disconnect();
  }, []);

  const imageBox =
    natural && stageSize.w > 0 && stageSize.h > 0
      ? (() => {
          const base = containBox(stageSize.w, stageSize.h, natural.w, natural.h);
          const zoom = options.zoom;
          const width = base.width * zoom;
          const height = base.height * zoom;
          return {
            left: base.left - (width - base.width) / 2,
            top: base.top - (height - base.height) / 2,
            width,
            height,
          };
        })()
      : null;

  const updateCrop = useCallback(
    (next: NormalizedCropRect, aspect = options.aspectRatio) => {
      const fitted = fitAspect(next, aspect);
      onChange({...options, aspectRatio: aspect, normalizedCrop: fitted});
    },
    [onChange, options],
  );

  function onPointerDown(event: React.PointerEvent, mode: "move" | "resize") {
    if (disabled || !imageBox) return;
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    dragRef.current = {
      mode,
      startX: event.clientX,
      startY: event.clientY,
      origin: {...options.normalizedCrop},
    };
  }

  function onPointerMove(event: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag || !imageBox || disabled) return;

    const dx = (event.clientX - drag.startX) / imageBox.width;
    const dy = (event.clientY - drag.startY) / imageBox.height;
    const o = drag.origin;

    if (drag.mode === "move") {
      updateCrop({
        x: clamp(o.x + dx, 0, 1 - o.width),
        y: clamp(o.y + dy, 0, 1 - o.height),
        width: o.width,
        height: o.height,
      });
      return;
    }

    updateCrop({
      x: o.x,
      y: o.y,
      width: clamp(o.width + dx, 0.02, 1 - o.x),
      height: clamp(o.height + dy, 0.02, 1 - o.y),
    });
  }

  function onPointerUp(event: React.PointerEvent) {
    if (dragRef.current) {
      try {
        (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
      } catch {
        // ignore
      }
    }
    dragRef.current = null;
  }

  function nudge(dx: number, dy: number) {
    if (disabled) return;
    const c = options.normalizedCrop;
    updateCrop({
      x: clamp(c.x + dx, 0, 1 - c.width),
      y: clamp(c.y + dy, 0, 1 - c.height),
      width: c.width,
      height: c.height,
    });
  }

  function resizeBy(dw: number, dh: number) {
    if (disabled) return;
    const c = options.normalizedCrop;
    updateCrop({
      x: c.x,
      y: c.y,
      width: clamp(c.width + dw, 0.02, 1 - c.x),
      height: clamp(c.height + dh, 0.02, 1 - c.y),
    });
  }

  const crop = options.normalizedCrop;
  const pixelLabel =
    natural != null
      ? t("cropDimensionsValue", {
          width: Math.max(1, Math.round(crop.width * natural.w)),
          height: Math.max(1, Math.round(crop.height * natural.h)),
        })
      : t("cropDimensionsPending");

  const cropStyle =
    imageBox != null
      ? {
          left: imageBox.left + crop.x * imageBox.width,
          top: imageBox.top + crop.y * imageBox.height,
          width: crop.width * imageBox.width,
          height: crop.height * imageBox.height,
        }
      : null;

  return (
    <section className="space-y-4" aria-labelledby={labelId}>
      <div>
        <h2 id={labelId} className="text-sm font-semibold">
          {t("editorTitle")}
        </h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t("editorHint")}</p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label={t("aspectTitle")}>
        {ASPECTS.map((aspect) => {
          const selected = options.aspectRatio === aspect;
          return (
            <button
              key={aspect}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              onClick={() => updateCrop(options.normalizedCrop, aspect)}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                selected
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--muted)]/20 hover:bg-[var(--muted)]/35"
              } disabled:opacity-50`}
            >
              {t(`aspect.${aspect}`)}
            </button>
          );
        })}
      </div>

      <label className="block space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="font-medium">{t("zoom")}</span>
          <span className="text-[var(--muted-foreground)]">{options.zoom.toFixed(1)}×</span>
        </div>
        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={options.zoom}
          disabled={disabled}
          aria-valuetext={`${options.zoom.toFixed(1)}x`}
          onChange={(e) => onChange({...options, zoom: Number(e.target.value)})}
          className="w-full accent-[var(--accent)]"
        />
      </label>

      <div
        ref={stageRef}
        className="relative mx-auto aspect-[4/3] w-full max-w-xl overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--muted)]/20"
        dir="ltr"
        role="application"
        aria-label={t("workspaceAria")}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full object-contain motion-reduce:transition-none"
            style={{
              transform: `scale(${options.zoom})`,
              transformOrigin: "center center",
              transition: "transform 120ms ease-out",
            }}
          />
        ) : (
          <p className="flex h-full items-center justify-center text-sm text-[var(--muted-foreground)]">
            {t("waitingImage")}
          </p>
        )}

        {cropStyle ? (
          <div
            className="absolute cursor-move border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
            style={{
              left: cropStyle.left,
              top: cropStyle.top,
              width: cropStyle.width,
              height: cropStyle.height,
              touchAction: "none",
            }}
            onPointerDown={(e) => onPointerDown(e, "move")}
          >
            <span
              role="presentation"
              className="absolute bottom-0 right-0 h-4 w-4 translate-x-1/2 translate-y-1/2 rounded-sm bg-white"
              style={{touchAction: "none"}}
              onPointerDown={(e) => {
                e.stopPropagation();
                onPointerDown(e, "resize");
              }}
            />
          </div>
        ) : null}
      </div>

      <p className="text-sm" aria-live="polite">
        <span className="font-medium">{t("cropDimensions")}: </span>
        {pixelLabel}
      </p>

      <div className="flex flex-wrap gap-2" role="group" aria-label={t("keyboardFallbackAria")}>
        <button
          type="button"
          disabled={disabled}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          onClick={() => nudge(-0.02, 0)}
        >
          {t("nudgeLeft")}
        </button>
        <button
          type="button"
          disabled={disabled}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          onClick={() => nudge(0.02, 0)}
        >
          {t("nudgeRight")}
        </button>
        <button
          type="button"
          disabled={disabled}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          onClick={() => nudge(0, -0.02)}
        >
          {t("nudgeUp")}
        </button>
        <button
          type="button"
          disabled={disabled}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          onClick={() => nudge(0, 0.02)}
        >
          {t("nudgeDown")}
        </button>
        <button
          type="button"
          disabled={disabled}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          onClick={() => resizeBy(0.02, 0.02)}
        >
          {t("grow")}
        </button>
        <button
          type="button"
          disabled={disabled}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          onClick={() => resizeBy(-0.02, -0.02)}
        >
          {t("shrink")}
        </button>
        <button
          type="button"
          disabled={disabled}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium"
          onClick={() => onChange({...defaultGuestCropOptions(), aspectRatio: options.aspectRatio})}
        >
          {t("reset")}
        </button>
      </div>
    </section>
  );
}
