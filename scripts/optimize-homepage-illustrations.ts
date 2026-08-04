/**
 * Resize + optimize generated homepage illustration PNGs into public/illustrations.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const assetsRoot = path.resolve(
  "C:/Users/HUSSNAIN.COM/.cursor/projects/c-Users-HUSSNAIN-COM-Downloads-seoimages-milestone-0-seoimages/assets",
);
const outDir = path.resolve("public/illustrations");

const jobs: {file: string; width: number; height: number; maxKb: number}[] = [
  {file: "hero-image-optimization.png", width: 1600, height: 1100, maxKb: 500},
  {file: "unified-image-workspace.png", width: 1200, height: 900, maxKb: 450},
  {file: "before-after-comparison.png", width: 1400, height: 900, maxKb: 500},
  {file: "image-seo-toolkit.png", width: 1200, height: 900, maxKb: 450},
  {file: "bulk-image-processing.png", width: 1200, height: 900, maxKb: 450},
  {file: "privacy-protection.png", width: 1200, height: 900, maxKb: 450},
  {file: "how-it-works-upload.png", width: 600, height: 450, maxKb: 180},
  {file: "how-it-works-settings.png", width: 600, height: 450, maxKb: 180},
  {file: "how-it-works-process.png", width: 600, height: 450, maxKb: 180},
  {file: "how-it-works-download.png", width: 600, height: 450, maxKb: 180},
];

fs.mkdirSync(outDir, {recursive: true});

async function compressToBudget(input: Buffer, maxBytes: number): Promise<Buffer> {
  let quality = 86;
  let buf = await sharp(input).png({compressionLevel: 9, quality, effort: 10, palette: false}).toBuffer();
  while (buf.length > maxBytes && quality > 55) {
    quality -= 6;
    buf = await sharp(input)
      .png({compressionLevel: 9, quality, effort: 10, adaptiveFiltering: true})
      .toBuffer();
  }
  // If still too large, try palette PNG
  if (buf.length > maxBytes) {
    const pal = await sharp(input)
      .png({compressionLevel: 9, palette: true, quality: 80, colors: 180, effort: 10})
      .toBuffer();
    if (pal.length < buf.length) buf = pal;
  }
  return buf;
}

async function run() {
  for (const job of jobs) {
    const src = path.join(assetsRoot, job.file);
    if (!fs.existsSync(src)) throw new Error(`Missing ${src}`);
    const resized = await sharp(src)
      .resize(job.width, job.height, {fit: "cover", position: "centre"})
      .ensureAlpha()
      .toBuffer();
    const out = await compressToBudget(resized, job.maxKb * 1024);
    const dest = path.join(outDir, job.file);
    fs.writeFileSync(dest, out);
    const meta = await sharp(out).metadata();
    console.log(
      `${job.file}\t${meta.width}x${meta.height}\t${(out.length / 1024).toFixed(1)}KB\tq≈ok`,
    );
  }

  // Remove SVG placeholders
  for (const svg of fs.readdirSync(outDir).filter((f) => f.endsWith(".svg"))) {
    fs.unlinkSync(path.join(outDir, svg));
    console.log(`removed ${svg}`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
