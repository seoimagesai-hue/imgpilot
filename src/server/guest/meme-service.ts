import sharp from "sharp";
import type {GuestJob, GuestSession, GuestUpload} from "@/db/schema";
import type {GuestMemeOptions} from "@/server/guest/meme-policy";
import {
  escapeSvgText,
  executeSameFormatGuestTransform,
} from "@/server/guest/same-format-transform";

function wrapLines(text: string, maxChars: number): string[] {
  const words = text.toUpperCase().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) current = next;
    else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

export async function executeGuestMemeJob(params: {
  session: GuestSession;
  job: GuestJob;
  upload: GuestUpload;
  options: GuestMemeOptions;
}): Promise<GuestJob> {
  const {options} = params;
  return executeSameFormatGuestTransform({
    session: params.session,
    job: params.job,
    upload: params.upload,
    filenamePrefix: "meme",
    transform: async ({pipeline, width, height}) => {
      const fontSize = Math.max(22, Math.round(Math.min(width, height) * 0.07));
      const maxChars = Math.max(8, Math.floor(width / (fontSize * 0.55)));
      const topLines = options.topText ? wrapLines(options.topText, maxChars) : [];
      const bottomLines = options.bottomText ? wrapLines(options.bottomText, maxChars) : [];
      const lineH = Math.round(fontSize * 1.15);
      const topStart = Math.round(fontSize * 1.2);
      const bottomStart = height - Math.round(fontSize * 0.6) - (bottomLines.length - 1) * lineH;

      const texts = [
        ...topLines.map(
          (line, i) =>
            `<text x="50%" y="${topStart + i * lineH}" text-anchor="middle" class="meme">${escapeSvgText(line)}</text>`,
        ),
        ...bottomLines.map(
          (line, i) =>
            `<text x="50%" y="${bottomStart + i * lineH}" text-anchor="middle" class="meme">${escapeSvgText(line)}</text>`,
        ),
      ].join("");

      const svg = Buffer.from(
        `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <style>
            .meme {
              fill: #fff;
              font: ${fontSize}px Impact, Arial Black, sans-serif;
              paint-order: stroke;
              stroke: #000;
              stroke-width: ${Math.max(2, Math.round(fontSize * 0.12))}px;
            }
          </style>
          ${texts}
        </svg>`,
      );

      return pipeline.composite([{input: await sharp(svg).png().toBuffer(), gravity: "northwest"}]);
    },
    buildSummary: (base) => ({
      ...base,
      topTextLength: options.topText.length,
      bottomTextLength: options.bottomText.length,
      metadataStripped: true,
    }),
  });
}
