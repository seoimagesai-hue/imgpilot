/**
 * Live R2 validation smoke (GetObject + Sharp full decode).
 * Requires complete R2 in .env.local.
 * Prefix only: test-validation/<run-id>/
 *
 * Run: npx tsx scripts/verify-image-validation-live.ts
 */
import {loadLocalEnvFiles} from "./load-local-env";

loadLocalEnvFiles();

async function main() {
  const {isR2Configured} = await import("../src/lib/env");
  if (!isR2Configured()) {
    console.log("RESULT=Blocked reason=R2_not_configured");
    process.exit(0);
  }

  const sharp = (await import("sharp")).default;
  const {inspectAndFullyDecodeImage} = await import("../src/server/images/image-inspector");
  const {getObjectStorageProvider} = await import("../src/server/storage/provider");
  const storage = await getObjectStorageProvider();
  const runId = crypto.randomUUID();

  const cases: Array<{name: string; mime: string; ext: string; buffer: Buffer}> = [
    {
      name: "jpeg",
      mime: "image/jpeg",
      ext: "jpg",
      buffer: await sharp({
        create: {width: 48, height: 32, channels: 3, background: {r: 12, g: 120, b: 200}},
      })
        .jpeg()
        .toBuffer(),
    },
    {
      name: "png",
      mime: "image/png",
      ext: "png",
      buffer: await sharp({
        create: {width: 24, height: 24, channels: 4, background: {r: 20, g: 160, b: 80, alpha: 1}},
      })
        .png()
        .toBuffer(),
    },
    {
      name: "webp",
      mime: "image/webp",
      ext: "webp",
      buffer: await sharp({
        create: {width: 20, height: 20, channels: 3, background: {r: 40, g: 80, b: 200}},
      })
        .webp()
        .toBuffer(),
    },
  ];

  const results: Array<Record<string, unknown>> = [];

  for (const item of cases) {
    const key = `test-validation/${runId}/${item.name}.${item.ext}`;
    const target = await storage.createUploadTarget({
      projectId: "test-project",
      userId: "test-user",
      imageId: runId,
      mimeType: item.mime,
      sizeBytes: item.buffer.length,
      originalFilename: `${item.name}.${item.ext}`,
      storageKey: key,
    });

    const putRes = await fetch(target.uploadUrl, {
      method: "PUT",
      headers: target.headers,
      body: new Uint8Array(item.buffer),
    });
    if (!putRes.ok) {
      console.log("RESULT=Failed reason=put_failed format=" + item.name + " status=" + putRes.status);
      process.exit(1);
    }

    const etagBefore = (await storage.readObjectMetadata(key))?.etag;
    const downloaded = await storage.getObjectBuffer(key, 25 * 1024 * 1024);
    const inspected = await inspectAndFullyDecodeImage(downloaded.body);
    const etagAfter = (await storage.readObjectMetadata(key))?.etag;
    await storage.deleteObject(key);

    if (!inspected.fullDecodePerformed || inspected.format !== item.name) {
      console.log("RESULT=Failed reason=decode format=" + item.name);
      process.exit(1);
    }

    results.push({
      format: item.name,
      fullDecodePerformed: true,
      width: inspected.width,
      height: inspected.height,
      etagUnchanged: etagBefore === etagAfter,
    });
  }

  // Corrupt object must fail decode after storage
  const corruptKey = `test-validation/${runId}/corrupt.jpg`;
  const corrupt = Buffer.from("not-a-real-jpeg-payload");
  const corruptTarget = await storage.createUploadTarget({
    projectId: "test-project",
    userId: "test-user",
    imageId: runId,
    mimeType: "image/jpeg",
    sizeBytes: corrupt.length,
    originalFilename: "corrupt.jpg",
    storageKey: corruptKey,
  });
  const corruptPut = await fetch(corruptTarget.uploadUrl, {
    method: "PUT",
    headers: corruptTarget.headers,
    body: new Uint8Array(corrupt),
  });
  if (!corruptPut.ok) {
    console.log("RESULT=Failed reason=corrupt_put");
    process.exit(1);
  }
  const corruptBytes = await storage.getObjectBuffer(corruptKey, 25 * 1024 * 1024);
  let corruptFailed = false;
  try {
    await inspectAndFullyDecodeImage(corruptBytes.body);
  } catch {
    corruptFailed = true;
  }
  await storage.deleteObject(corruptKey);
  if (!corruptFailed) {
    console.log("RESULT=Failed reason=corrupt_accepted");
    process.exit(1);
  }

  console.log(
    JSON.stringify({
      RESULT: "Passed",
      formats: results,
      corruptRejected: true,
      optimizedCopyCreated: false,
      note: "Full DB/UI two-user matrix Not run here",
    }),
  );
}

main().catch((error) => {
  console.error("RESULT=Failed");
  console.error(error instanceof Error ? error.message : "unknown");
  process.exit(1);
});
