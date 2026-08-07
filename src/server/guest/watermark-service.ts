import sharp from "sharp";
import type {GuestJob, GuestSession, GuestUpload} from "@/db/schema";
import type {GuestWatermarkOptions, GuestWatermarkPosition} from "@/server/guest/watermark-policy";
import {
  escapeSvgText,
  executeSameFormatGuestTransform,
} from "@/server/guest/same-format-transform";

function anchor(position: GuestWatermarkPosition): "start" | "middle" | "end" {
  if (position.includes("left")) return "start";
  if (position.includes("right")) return "end";
  return "middle";
}

function positionX(position: GuestWatermarkPosition, width: number, pad: number): number {
  if (position.includes("left")) return pad;
  if (position.includes("right")) return width - pad;
  return Math.round(width / 2);
}

function positionY(
  position: GuestWatermarkPosition,
  height: number,
  pad: number,
  fontSize: number,
): number {
  if (position.includes("top")) return pad + fontSize;
  if (position.includes("bottom")) return height - pad;
  return Math.round(height / 2 + fontSize / 3);
}

export async function executeGuestWatermarkJob(params: {
  session: GuestSession;
  job: GuestJob;
  upload: GuestUpload;
  options: GuestWatermarkOptions;
}): Promise<GuestJob> {
  const {options} = params;
  return executeSameFormatGuestTransform({
    session: params.session,
    job: params.job,
    upload: params.upload,
    filenamePrefix: "watermarked",
    transform: async ({pipeline, width, height}) => {
      const fontSize = Math.max(18, Math.round(Math.min(width, height) * 0.045));
      const pad = Math.round(fontSize * 0.8);
      const svg = Buffer.from(
        `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <style>
            .wm {
              fill: rgba(255,255,255,${Math.min(0.95, options.opacity + 0.25)});
              font: ${fontSize}px Arial, Helvetica, sans-serif;
              font-weight: 700;
              paint-order: stroke;
              stroke: rgba(15,23,42,${options.opacity});
              stroke-width: ${Math.max(2, Math.round(fontSize * 0.08))}px;
            }
          </style>
          <text x="${positionX(options.position, width, pad)}" y="${positionY(options.position, height, pad, fontSize)}" class="wm" text-anchor="${anchor(options.position)}">${escapeSvgText(options.text)}</text>
        </svg>`,
      );
      return pipeline.composite([{input: await sharp(svg).png().toBuffer()}]);
    },
    buildSummary: (base) => ({
      ...base,
      textLength: options.text.length,
      position: options.position,
      opacity: options.opacity,
      metadataStripped: true,
    }),
  });
}
