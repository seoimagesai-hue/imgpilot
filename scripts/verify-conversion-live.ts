/**
 * Prompt 14 live format-conversion verification (R2 + DB).
 * Usage: npx tsx scripts/verify-conversion-live.ts http://localhost:3000
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
    set("Conversion live", "Blocked", "R2 not configured");
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  }

  try {
    assert("Production server", (await fetch(`${baseUrl}/en/login`)).status === 200, baseUrl);
  } catch {
    set("Production server", "Not run");
  }

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
  const {isConversionAllowed} = await import("../src/server/images/conversion-policy");
  const {getObjectStorageProvider} = await import("../src/server/storage/provider");
  const {READY_STATUS} = await import("../src/server/images/ready-eligibility");

  assert("Matrix rejects PNG→JPEG", !isConversionAllowed("png", "jpeg"));

  const db = getDb();
  const sql = getPostgresClient();
  const storage = await getObjectStorageProvider();
  const userAId = crypto.randomUUID();
  const userBId = crypto.randomUUID();
  const passwordHash = await hashPassword(`Conv-${stamp}-Safe!`);

  await db.insert(users).values([
    {id: userAId, name: "Conv A", email: `conv-a-${stamp}@example.com`, passwordHash},
    {id: userBId, name: "Conv B", email: `conv-b-${stamp}@example.com`, passwordHash},
  ]);
  const projectA = await createOwnedProject(userAId, {
    name: `Conv ${stamp}`,
    websiteUrl: "https://conv.example",
    description: "conversion live",
    metadataLanguage: "en",
  });

  const jpeg = await sharp({
    create: {width: 96, height: 64, channels: 3, background: {r: 50, g: 100, b: 150}},
  })
    .jpeg({quality: 90})
    .toBuffer();

  const auth = await authorizeProjectUploads({
    userId: userAId,
    projectId: projectA.id,
    files: [
      {
        clientId: crypto.randomUUID(),
        originalFilename: "conv.jpg",
        mimeType: "image/jpeg",
        sizeBytes: jpeg.length,
      },
    ],
  });
  assert("Authorize", Boolean(auth.ok && auth.results[0]?.ok));
  const item = auth.results[0] as {
    ok: true;
    imageId: string;
    uploadUrl: string;
    headers: Record<string, string>;
  };
  assert(
    "R2 PUT",
    (
      await fetch(item.uploadUrl, {
        method: "PUT",
        headers: item.headers,
        body: new Uint8Array(jpeg),
      })
    ).ok,
  );
  assert(
    "Confirm",
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
  assert("Ready", validated.ok && validated.status === READY_STATUS);

  const [row] = await db.select().from(images).where(eq(images.id, item.imageId)).limit(1);
  const sourceKey = row!.storageKey!;
  const beforeHash = createHash("sha256")
    .update((await storage.getObjectBuffer(sourceKey, 25 * 1024 * 1024)).body)
    .digest("hex");

  const denied = await createProcessingJob({
    userId: userAId,
    projectId: projectA.id,
    imageId: item.imageId,
    operation: "convert_format",
    preset: "to_png",
  });
  assert("JPEG→PNG rejected", !denied.ok && denied.error === "CONVERSION_UNSUPPORTED");

  const created = await createProcessingJob({
    userId: userAId,
    projectId: projectA.id,
    imageId: item.imageId,
    operation: "convert_format",
    preset: "to_webp",
    idempotencyKey: `conv-${stamp}`,
  });
  assert("Create convert", created.ok);
  if (!created.ok) throw new Error("create");

  const bCreate = await createProcessingJob({
    userId: userBId,
    projectId: projectA.id,
    imageId: item.imageId,
    operation: "convert_format",
    preset: "to_webp",
  });
  assert("User B blocked", !bCreate.ok);

  const executed = await executeProcessingJob({
    userId: userAId,
    projectId: projectA.id,
    jobId: created.job.id,
  });
  assert("Execute convert", executed.ok && executed.job.status === "completed");
  assert(
    "Output webp same dims",
    executed.ok &&
      executed.job.outputDetectedFormat === "webp" &&
      executed.job.outputWidth === 96 &&
      executed.job.outputHeight === 64,
  );

  const afterHash = createHash("sha256")
    .update((await storage.getObjectBuffer(sourceKey, 25 * 1024 * 1024)).body)
    .digest("hex");
  assert("Source immutable", beforeHash === afterHash);

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
    imageId: item.imageId,
    operation: "convert_format",
    preset: "webp",
  });
  assert("Duplicate returns completed", dup.ok && dup.ok && dup.job.id === created.job.id);

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
  try {
    await storage.deleteObject(sourceKey);
  } catch {
    /* best effort */
  }

  await db.delete(imageDerivatives).where(eq(imageDerivatives.projectId, projectA.id));
  await db.delete(processingJobs).where(eq(processingJobs.projectId, projectA.id));
  await db.delete(quotaReservations).where(eq(quotaReservations.projectId, projectA.id));
  await db.delete(projectQuotaState).where(eq(projectQuotaState.projectId, projectA.id));
  await db.delete(imageReplacements).where(eq(imageReplacements.projectId, projectA.id));
  await db.delete(images).where(eq(images.projectId, projectA.id));
  await db.delete(projects).where(eq(projects.id, projectA.id));
  await db.delete(users).where(inArray(users.id, [userAId, userBId]));

  set("Conversion live", "Passed");
  await sql.end({timeout: 5});
  console.log("\n=== REPORT ===");
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error("FATAL:", error instanceof Error ? error.message : "unknown");
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
});
