/**
 * Prompt 13 live resize verification (R2 + DB).
 * Usage: npx tsx scripts/verify-resize-live.ts http://localhost:3000
 */
import {eq, inArray} from "drizzle-orm";
import sharp from "sharp";
import {createHash} from "node:crypto";
import {loadLocalEnvFiles} from "./load-local-env";

loadLocalEnvFiles();

type Status = "Passed" | "Failed" | "Blocked" | "Not run";
const report: Record<string, Status> = {};

function set(name: string, status: Status, detail?: string) {
  report[name] = status;
  console.log(`${status.toUpperCase()}: ${name}${detail ? ` (${detail})` : ""}`);
}

function assert(name: string, ok: boolean, detail?: string): asserts ok {
  set(name, ok ? "Passed" : "Failed", detail);
  if (!ok) throw new Error(name);
}

async function main() {
  const baseUrl = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
  const stamp = Date.now();

  const {isR2Configured} = await import("../src/lib/env");
  if (!isR2Configured()) {
    set("Resize live", "Blocked", "R2 not configured");
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  }

  let serverOk = false;
  try {
    serverOk = (await fetch(`${baseUrl}/en/login`)).status === 200;
  } catch {
    serverOk = false;
  }
  if (serverOk) assert("Production server", true, baseUrl);
  else set("Production server", "Not run");

  const {getDb, getPostgresClient} = await import("../src/db/index");
  const {
    users,
    projects,
    images,
    imageReplacements,
    projectQuotaState,
    quotaReservations,
    processingJobs,
    imageDerivatives,
  } = await import("../src/db/schema");
  const {hashPassword} = await import("../src/server/auth/password");
  const {createOwnedProject} = await import("../src/server/projects/queries");
  const {authorizeProjectUploads, confirmProjectUpload} = await import(
    "../src/server/images/upload-service"
  );
  const {validateOwnedImage} = await import("../src/server/images/validation-service");
  const {createProcessingJob, executeProcessingJob, createDerivativePreviewUrl} = await import(
    "../src/server/images/processing-service"
  );
  const {getObjectStorageProvider} = await import("../src/server/storage/provider");
  const {READY_STATUS} = await import("../src/server/images/ready-eligibility");

  const db = getDb();
  const sql = getPostgresClient();
  const storage = await getObjectStorageProvider();

  const userAId = crypto.randomUUID();
  const userBId = crypto.randomUUID();
  const password = `Resize-${stamp}-Safe!`;
  const passwordHash = await hashPassword(password);

  await db.insert(users).values([
    {id: userAId, name: "Resize A", email: `resize-a-${stamp}@example.com`, passwordHash},
    {id: userBId, name: "Resize B", email: `resize-b-${stamp}@example.com`, passwordHash},
  ]);

  const projectA = await createOwnedProject(userAId, {
    name: `Resize ${stamp}`,
    websiteUrl: "https://resize.example",
    description: "resize live",
    metadataLanguage: "en",
  });

  // Large landscape for downscale + small for no-upscale check via second image
  const jpeg = await sharp({
    create: {width: 1600, height: 900, channels: 3, background: {r: 20, g: 90, b: 160}},
  })
    .jpeg({quality: 90})
    .toBuffer();

  const tiny = await sharp({
    create: {width: 400, height: 300, channels: 3, background: {r: 200, g: 100, b: 50}},
  })
    .jpeg({quality: 90})
    .toBuffer();

  async function uploadReady(buf: Buffer, name: string) {
    const auth = await authorizeProjectUploads({
      userId: userAId,
      projectId: projectA.id,
      files: [
        {
          clientId: crypto.randomUUID(),
          originalFilename: name,
          mimeType: "image/jpeg",
          sizeBytes: buf.length,
        },
      ],
    });
    assert(`Authorize ${name}`, Boolean(auth.ok && auth.results[0]?.ok));
    const item = auth.results[0] as {
      ok: true;
      imageId: string;
      uploadUrl: string;
      headers: Record<string, string>;
    };
    assert(
      `PUT ${name}`,
      (
        await fetch(item.uploadUrl, {
          method: "PUT",
          headers: item.headers,
          body: new Uint8Array(buf),
        })
      ).ok,
    );
    assert(
      `Confirm ${name}`,
      (
        await confirmProjectUpload({
          userId: userAId,
          projectId: projectA.id,
          imageId: item.imageId,
        })
      ).ok,
    );
    const validated = await validateOwnedImage({
      userId: userAId,
      projectId: projectA.id,
      imageId: item.imageId,
    });
    assert(`Ready ${name}`, validated.ok && validated.status === READY_STATUS);
    return item.imageId;
  }

  const largeId = await uploadReady(jpeg, "large.jpg");
  const tinyId = await uploadReady(tiny, "tiny.jpg");

  const [largeRow] = await db.select().from(images).where(eq(images.id, largeId)).limit(1);
  const sourceKey = largeRow!.storageKey!;
  const beforeMeta = await storage.readObjectMetadata(sourceKey);
  const beforeHash = createHash("sha256")
    .update((await storage.getObjectBuffer(sourceKey, 25 * 1024 * 1024)).body)
    .digest("hex");

  const created = await createProcessingJob({
    userId: userAId,
    projectId: projectA.id,
    imageId: largeId,
    operation: "resize",
    preset: "px_512",
    idempotencyKey: `resize-live-${stamp}`,
  });
  assert("Create resize job", created.ok);
  if (!created.ok) throw new Error("create");

  const bCreate = await createProcessingJob({
    userId: userBId,
    projectId: projectA.id,
    imageId: largeId,
    operation: "resize",
    preset: "px_512",
  });
  assert("User B blocked", !bCreate.ok);

  const executed = await executeProcessingJob({
    userId: userAId,
    projectId: projectA.id,
    jobId: created.job.id,
  });
  assert("Execute resize", executed.ok && executed.job.status === "completed");
  assert(
    "Downscale dims",
    executed.ok &&
      executed.job.outputWidth === 512 &&
      executed.job.outputHeight === 288,
  );
  assert("Checksum stored", Boolean(executed.ok && executed.job.outputChecksum));

  const afterHash = createHash("sha256")
    .update((await storage.getObjectBuffer(sourceKey, 25 * 1024 * 1024)).body)
    .digest("hex");
  assert(
    "Source immutable",
    beforeHash === afterHash && beforeMeta?.sizeBytes === (await storage.readObjectMetadata(sourceKey))?.sizeBytes,
  );

  const tinyJob = await createProcessingJob({
    userId: userAId,
    projectId: projectA.id,
    imageId: tinyId,
    operation: "resize",
    preset: "px_1024",
  });
  assert("Tiny create", tinyJob.ok);
  if (!tinyJob.ok) throw new Error("tiny");
  const tinyExec = await executeProcessingJob({
    userId: userAId,
    projectId: projectA.id,
    jobId: tinyJob.job.id,
  });
  assert(
    "No upscale",
    tinyExec.ok && tinyExec.job.outputWidth === 400 && tinyExec.job.outputHeight === 300,
  );

  const preview = await createDerivativePreviewUrl({
    userId: userAId,
    projectId: projectA.id,
    jobId: created.job.id,
  });
  assert("Owner preview", preview.ok);
  const bPreview = await createDerivativePreviewUrl({
    userId: userBId,
    projectId: projectA.id,
    jobId: created.job.id,
  });
  assert("User B preview blocked", !bPreview.ok);

  const dup = await createProcessingJob({
    userId: userAId,
    projectId: projectA.id,
    imageId: largeId,
    operation: "resize",
    preset: "px_512",
  });
  assert("Duplicate returns completed", dup.ok && dup.ok && dup.job.id === created.job.id);

  // cleanup R2
  const jobs = await db.select().from(processingJobs).where(eq(processingJobs.projectId, projectA.id));
  for (const j of jobs) {
    if (j.outputStorageKey) {
      try {
        await storage.deleteObject(j.outputStorageKey);
      } catch {
        /* best effort */
      }
    }
  }
  for (const img of await db.select().from(images).where(eq(images.projectId, projectA.id))) {
    if (img.storageKey) {
      try {
        await storage.deleteObject(img.storageKey);
      } catch {
        /* best effort */
      }
    }
  }

  await db.delete(imageDerivatives).where(eq(imageDerivatives.projectId, projectA.id));
  await db.delete(processingJobs).where(eq(processingJobs.projectId, projectA.id));
  await db.delete(quotaReservations).where(eq(quotaReservations.projectId, projectA.id));
  await db.delete(projectQuotaState).where(eq(projectQuotaState.projectId, projectA.id));
  await db.delete(imageReplacements).where(eq(imageReplacements.projectId, projectA.id));
  await db.delete(images).where(eq(images.projectId, projectA.id));
  await db.delete(projects).where(eq(projects.id, projectA.id));
  await db.delete(users).where(inArray(users.id, [userAId, userBId]));

  set("Resize live", "Passed");
  await sql.end({timeout: 5});
  console.log("\n=== REPORT ===");
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error("FATAL:", error instanceof Error ? error.message : "unknown");
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
});
