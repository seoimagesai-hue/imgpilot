/**
 * Prompt 12 live processing verification (R2 + DB).
 * Usage: npx tsx scripts/verify-processing-live.ts http://localhost:3000
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
    set("Processing live", "Blocked", "R2 not configured");
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
  const {createProcessingJob, executeProcessingJob} = await import(
    "../src/server/images/processing-service"
  );
  const {getObjectStorageProvider} = await import("../src/server/storage/provider");
  const {READY_STATUS} = await import("../src/server/images/ready-eligibility");

  const db = getDb();
  const sql = getPostgresClient();
  const storage = await getObjectStorageProvider();

  const userAId = crypto.randomUUID();
  const userBId = crypto.randomUUID();
  const emailA = `proc-a-${stamp}@example.com`;
  const password = `Proc-${stamp}-Safe!`;
  const passwordHash = await hashPassword(password);

  await db.insert(users).values([
    {id: userAId, name: "Proc A", email: emailA, passwordHash},
    {id: userBId, name: "Proc B", email: `proc-b-${stamp}@example.com`, passwordHash},
  ]);

  const projectA = await createOwnedProject(userAId, {
    name: `Proc ${stamp}`,
    websiteUrl: "https://proc.example",
    description: "processing live",
    metadataLanguage: "en",
  });

  const jpeg = await sharp({
    create: {width: 64, height: 48, channels: 3, background: {r: 40, g: 80, b: 120}},
  })
    .jpeg({quality: 90})
    .toBuffer();

  const auth = await authorizeProjectUploads({
    userId: userAId,
    projectId: projectA.id,
    files: [
      {
        clientId: crypto.randomUUID(),
        originalFilename: "proc.jpg",
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

  const [imageRow] = await db.select().from(images).where(eq(images.id, item.imageId)).limit(1);
  const sourceKey = imageRow!.storageKey;
  const sourceMetaBefore = await storage.readObjectMetadata(sourceKey);
  const sourceBytesBefore = await storage.getObjectBuffer(sourceKey, 25 * 1024 * 1024);
  const sourceHashBefore = createHash("sha256").update(sourceBytesBefore.body).digest("hex");

  const created = await createProcessingJob({
    userId: userAId,
    projectId: projectA.id,
    imageId: item.imageId,
    idempotencyKey: `live-${stamp}`,
  });
  assert("Create job", created.ok);
  if (!created.ok) throw new Error("create");

  const replay = await createProcessingJob({
    userId: userAId,
    projectId: projectA.id,
    imageId: item.imageId,
    idempotencyKey: `live-${stamp}`,
  });
  assert("Idempotent create", replay.ok && replay.ok && replay.job.id === created.job.id);

  const bCreate = await createProcessingJob({
    userId: userBId,
    projectId: projectA.id,
    imageId: item.imageId,
  });
  assert("User B create blocked", !bCreate.ok);

  const executed = await executeProcessingJob({
    userId: userAId,
    projectId: projectA.id,
    jobId: created.job.id,
  });
  assert("Execute completed", executed.ok && executed.job.status === "completed");

  const sourceMetaAfter = await storage.readObjectMetadata(sourceKey);
  const sourceBytesAfter = await storage.getObjectBuffer(sourceKey, 25 * 1024 * 1024);
  const sourceHashAfter = createHash("sha256").update(sourceBytesAfter.body).digest("hex");

  assert(
    "Source key unchanged",
    sourceMetaBefore?.sizeBytes === sourceMetaAfter?.sizeBytes &&
      sourceHashBefore === sourceHashAfter,
  );

  const [jobRow] = await db
    .select()
    .from(processingJobs)
    .where(eq(processingJobs.id, created.job.id))
    .limit(1);
  assert(
    "Derivative key distinct",
    Boolean(jobRow?.outputStorageKey && jobRow.outputStorageKey !== sourceKey),
  );
  assert(
    "Dimensions unchanged",
    jobRow?.outputWidth === jobRow?.sourceWidth && jobRow?.outputHeight === jobRow?.sourceHeight,
  );
  assert("Format unchanged", jobRow?.outputDetectedFormat === "jpeg");

  const {reconcileProjectProcessing} = await import(
    "../src/server/images/processing-reconcile"
  );
  const dry = await reconcileProjectProcessing({projectId: projectA.id, dryRun: true});
  assert("Reconcile dry-run", dry.dryRun === true && dry.changed === false);

  const preview = await (
    await import("../src/server/images/processing-service")
  ).createDerivativePreviewUrl({
    userId: userAId,
    projectId: projectA.id,
    jobId: created.job.id,
  });
  assert("Owner preview", preview.ok === true);
  const bPreview = await (
    await import("../src/server/images/processing-service")
  ).createDerivativePreviewUrl({
    userId: userBId,
    projectId: projectA.id,
    jobId: created.job.id,
  });
  assert("User B preview blocked", bPreview.ok === false);

  if (jobRow?.outputStorageKey) {
    try {
      await storage.deleteObject(jobRow.outputStorageKey);
    } catch {
      /* best effort */
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

  set("Processing live", "Passed");
  await sql.end({timeout: 5});
  console.log("\n=== REPORT ===");
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error("FATAL:", error instanceof Error ? error.message : "unknown");
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
});
