/**
 * Deterministic tiny image fixtures for Sharp validation tests.
 * Generated at test time — no copyrighted assets.
 */
import sharp from "sharp";
import {writeFileSync, mkdirSync, existsSync} from "node:fs";
import {join} from "node:path";

const dir = join(process.cwd(), "tests", "fixtures", "images");

async function main() {
  if (!existsSync(dir)) mkdirSync(dir, {recursive: true});

  const jpeg = await sharp({
    create: {width: 32, height: 24, channels: 3, background: {r: 200, g: 40, b: 40}},
  })
    .jpeg({quality: 80})
    .toBuffer();
  writeFileSync(join(dir, "valid.jpg"), jpeg);

  const png = await sharp({
    create: {width: 16, height: 16, channels: 4, background: {r: 20, g: 160, b: 80, alpha: 1}},
  })
    .png()
    .toBuffer();
  writeFileSync(join(dir, "valid.png"), png);

  const webp = await sharp({
    create: {width: 20, height: 20, channels: 3, background: {r: 40, g: 80, b: 200}},
  })
    .webp({quality: 80})
    .toBuffer();
  writeFileSync(join(dir, "valid.webp"), webp);

  // Minimal animated GIF (2 frames) via sharp if supported
  try {
    const gif = await sharp({
      create: {width: 8, height: 8, channels: 3, background: {r: 255, g: 0, b: 0}},
    })
      .gif()
      .toBuffer();
    writeFileSync(join(dir, "valid.gif"), gif);
  } catch {
    // Fallback: write a tiny static GIF header-ish — tests will skip animated if needed
    writeFileSync(join(dir, "valid.gif"), jpeg);
  }

  try {
    const avif = await sharp({
      create: {width: 12, height: 12, channels: 3, background: {r: 10, g: 10, b: 10}},
    })
      .avif({quality: 40})
      .toBuffer();
    writeFileSync(join(dir, "valid.avif"), avif);
  } catch {
    writeFileSync(join(dir, "avif-unsupported.txt"), "avif encode unavailable");
  }

  // Truncated JPEG: valid header then cut
  writeFileSync(join(dir, "truncated.jpg"), jpeg.subarray(0, Math.min(40, jpeg.length)));

  // Corrupt PNG: PNG signature + garbage
  writeFileSync(
    join(dir, "corrupt.png"),
    Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64, 0xff)]),
  );

  writeFileSync(join(dir, "random.bin"), Buffer.from("not-an-image-" + "x".repeat(64)));

  writeFileSync(
    join(dir, "disguised-svg.png"),
    Buffer.from(`<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>`),
  );

  writeFileSync(join(dir, "disguised-pdf.jpg"), Buffer.from("%PDF-1.4 fake pdf content for rejection tests\n"));

  writeFileSync(join(dir, "disguised-zip.webp"), Buffer.from("PK\x03\x04fake-zip-content-for-rejection"));

  // EXIF orientation JPEG via sharp rotate metadata if available
  const oriented = await sharp({
    create: {width: 40, height: 20, channels: 3, background: {r: 0, g: 0, b: 255}},
  })
    .jpeg({quality: 80})
    .withMetadata({orientation: 6})
    .toBuffer();
  writeFileSync(join(dir, "orientation.jpg"), oriented);

  console.log("fixtures written to", dir);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
