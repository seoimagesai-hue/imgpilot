/**
 * Temporary bounded analysis image for AI — never persisted, never a derivative.
 */
import sharp from "sharp";
import {AI_ANALYSIS_MAX_EDGE} from "@/server/images/ai-metadata-policy";

export type AnalysisImage = {
  bytes: Buffer;
  mimeType: "image/jpeg";
  width: number;
  height: number;
  scaled: boolean;
};

export async function prepareAnalysisImage(source: Buffer): Promise<AnalysisImage> {
  const meta = await sharp(source, {animated: false, limitInputPixels: 100_000_000})
    .rotate()
    .metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width <= 0 || height <= 0) throw new Error("SOURCE_DECODE_FAILED");

  const longest = Math.max(width, height);
  const scaled = longest > AI_ANALYSIS_MAX_EDGE;
  const pipeline = sharp(source, {animated: false, limitInputPixels: 100_000_000}).rotate();
  if (scaled) {
    pipeline.resize({
      width: width >= height ? AI_ANALYSIS_MAX_EDGE : undefined,
      height: height > width ? AI_ANALYSIS_MAX_EDGE : undefined,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  const {data, info} = await pipeline.jpeg({quality: 82, mozjpeg: true}).toBuffer({
    resolveWithObject: true,
  });

  return {
    bytes: data,
    mimeType: "image/jpeg",
    width: info.width,
    height: info.height,
    scaled,
  };
}
