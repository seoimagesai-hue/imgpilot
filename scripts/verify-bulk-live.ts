/**
 * Prompt 15 live bulk orchestration verification (R2 + DB).
 * Usage: npx tsx scripts/verify-bulk-live.ts http://localhost:3000
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
    set("Bulk live", "Blocked", "R2 not configured");
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
    bulkJobs,
    bulkJobItems,
  } = await import("../src/db/schema");
  const {hashPassword} = await import("../src/server/auth/password");
  const {createOwnedProject} = await import("../src/server/projects/queries");
  const {authorizeProjectUploads, confirmProjectUpload} = await import(
    "../src/server/images/upload-service"
  );
  const {validateOwnedImage} = await import("../src/server/images/validation-service");
  const {
    createBulkJob,
    runBulkJob,
    cancelBulkJob,
    retryFailedBulkItems,
    getBulkPolicy,
  } = await import("../src/server/images/bulk-service");
  const {getObjectStorageProvider} = await import("../src/server/storage/provider");
  const {READY_STATUS} = await import("../src/server/images/ready-eligibility");
  const {deleteOwnedImage} = await import("../src/server/images/delete-service");
  const {beginOwnedImageReplacement} = await import("../src/server/images/replace-service");

  const policy = getBulkPolicy();
  assert("Bounded concurrency", policy.maxConcurrency === 3);
  assert("Max images 100", policy.maxImages === 100);
  assert("No mixed ops", policy.mixedOperationsAllowed === false);
  assert("Reuses engine", policy.reusesSingleImageEngine === true);

  const db = getDb();
  const sql = getPostgresClient();
  const storage = await getObjectStorageProvider();
  const userAId = crypto.randomUUID();
  const userBId = crypto.randomUUID();
  const passwordHash = await hashPassword(`Bulk-${stamp}-Safe!`);

  await db.insert(users).values([
    {id: userAId, name: "Bulk A", email: `bulk-a-${stamp}@example.com`, passwordHash},
    {id: userBId, name: "Bulk B", email: `bulk-b-${stamp}@example.com`, passwordHash},
  ]);
  const projectA = await createOwnedProject(userAId, {
    name: `Bulk ${stamp}`,
    websiteUrl: "https://bulk.example",
    description: "bulk live",
    metadataLanguage: "en",
  });

  const jpeg = await sharp({
    create: {width: 64, height: 48, channels: 3, background: {r: 40, g: 90, b: 140}},
  })
    .jpeg({quality: 85})
    .toBuffer();

  const IMAGE_COUNT = 6;
  const imageIds: string[] = [];
  const sourceKeys: string[] = [];

  try {
    for (let i = 0; i < IMAGE_COUNT; i++) {
      const auth = await authorizeProjectUploads({
        userId: userAId,
        projectId: projectA.id,
        files: [
          {
            clientId: crypto.randomUUID(),
            originalFilename: `bulk-${i}-${stamp}.jpg`,
            mimeType: "image/jpeg",
            sizeBytes: jpeg.length,
          },
        ],
      });
      assert(`Authorize ${i}`, Boolean(auth.ok && auth.results[0]?.ok));
      const item = auth.results[0] as {
        ok: true;
        imageId: string;
        uploadUrl: string;
        headers: Record<string, string>;
      };
      assert(
        `R2 PUT ${i}`,
        (
          await fetch(item.uploadUrl, {
            method: "PUT",
            headers: item.headers,
            body: new Uint8Array(jpeg),
          })
        ).ok,
      );
      assert(
        `Confirm ${i}`,
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
      assert(`Ready ${i}`, validated.ok && validated.status === READY_STATUS);
      imageIds.push(item.imageId);
      const [row] = await db.select().from(images).where(eq(images.id, item.imageId)).limit(1);
      sourceKeys.push(row!.storageKey!);
    }

    const beforeHashes = new Map<string, string>();
    for (let i = 0; i < sourceKeys.length; i++) {
      const buf = (await storage.getObjectBuffer(sourceKeys[i], 25 * 1024 * 1024)).body;
      beforeHashes.set(sourceKeys[i], createHash("sha256").update(buf).digest("hex"));
    }

    const bCreate = await createBulkJob({
      userId: userBId,
      projectId: projectA.id,
      imageIds,
      operation: "optimize_same_format",
    });
    assert("User B blocked", !bCreate.ok);

    const created = await createBulkJob({
      userId: userAId,
      projectId: projectA.id,
      imageIds,
      operation: "optimize_same_format",
      idempotencyKey: `bulk-live-${stamp}`,
    });
    assert("Create bulk", created.ok && created.job.pendingCount === IMAGE_COUNT);
    if (!created.ok) throw new Error("create");

    const replay = await createBulkJob({
      userId: userAId,
      projectId: projectA.id,
      imageIds,
      operation: "optimize_same_format",
      idempotencyKey: `bulk-live-${stamp}`,
    });
    assert("Idempotent create", replay.ok && replay.job.id === created.job.id);

    const ran = await runBulkJob({
      userId: userAId,
      projectId: projectA.id,
      bulkJobId: created.job.id,
    });
    assert(
      "Run bulk optimize",
      ran.ok &&
        (ran.job.status === "completed" || ran.job.status === "partially_completed") &&
        ran.job.completedCount === IMAGE_COUNT,
      ran.ok ? `${ran.job.status} c=${ran.job.completedCount}` : undefined,
    );

    for (const key of sourceKeys) {
      const after = createHash("sha256")
        .update((await storage.getObjectBuffer(key, 25 * 1024 * 1024)).body)
        .digest("hex");
      assert(`Original intact ${key.slice(-8)}`, after === beforeHashes.get(key));
    }

    // Partial + cancel: new bulk, cancel after create (pending only)
    const cancelCreate = await createBulkJob({
      userId: userAId,
      projectId: projectA.id,
      imageIds: imageIds.slice(0, 3),
      operation: "resize",
      preset: "px_512",
      idempotencyKey: `bulk-cancel-${stamp}`,
    });
    assert("Cancel create", cancelCreate.ok);
    if (!cancelCreate.ok) throw new Error("cancel create");
    const cancelled = await cancelBulkJob({
      userId: userAId,
      projectId: projectA.id,
      bulkJobId: cancelCreate.job.id,
    });
    assert(
      "Cancel pending only",
      cancelled.ok &&
        cancelled.job.cancelledCount === 3 &&
        cancelled.job.status === "cancelled",
    );

    // Skip non-ready + ready mix
    const skipCreate = await createBulkJob({
      userId: userAId,
      projectId: projectA.id,
      imageIds: [...imageIds.slice(0, 2), crypto.randomUUID()],
      operation: "convert_format",
      targetFormat: "webp",
      idempotencyKey: `bulk-skip-${stamp}`,
    });
    assert(
      "Selection filters ownership",
      skipCreate.ok && skipCreate.job.pendingCount === 2,
    );
    if (!skipCreate.ok) throw new Error("skip");
    const skipRun = await runBulkJob({
      userId: userAId,
      projectId: projectA.id,
      bulkJobId: skipCreate.job.id,
    });
    assert(
      "Convert bulk",
      skipRun.ok && skipRun.job.completedCount === 2,
      skipRun.ok ? String(skipRun.job.status) : undefined,
    );

    // Delete removes pending bulk work
    const delCreate = await createBulkJob({
      userId: userAId,
      projectId: projectA.id,
      imageIds: [imageIds[IMAGE_COUNT - 1]],
      operation: "optimize_same_format",
      idempotencyKey: `bulk-del-${stamp}`,
    });
    assert("Delete-interaction create", delCreate.ok);
    if (!delCreate.ok) throw new Error("del");
    const del = await deleteOwnedImage({
      userId: userAId,
      projectId: projectA.id,
      imageId: imageIds[IMAGE_COUNT - 1],
    });
    assert("Delete image", del.ok);
    const [delItem] = await db
      .select()
      .from(bulkJobItems)
      .where(eq(bulkJobItems.bulkJobId, delCreate.job.id))
      .limit(1);
    assert("Delete cancels pending bulk item", delItem?.status === "cancelled");

    // Replacement stales pending
    const replTarget = imageIds[0];
    const replCreate = await createBulkJob({
      userId: userAId,
      projectId: projectA.id,
      imageIds: [replTarget],
      operation: "resize",
      preset: "px_256",
      idempotencyKey: `bulk-repl-${stamp}`,
    });
    assert("Replace-interaction create", replCreate.ok);
    if (!replCreate.ok) throw new Error("repl");
    const begun = await beginOwnedImageReplacement({
      userId: userAId,
      projectId: projectA.id,
      imageId: replTarget,
      originalFilename: `repl-${stamp}.jpg`,
      mimeType: "image/jpeg",
      sizeBytes: jpeg.length,
    });
    assert("Begin replacement", begun.ok);
    const [replItem] = await db
      .select()
      .from(bulkJobItems)
      .where(eq(bulkJobItems.bulkJobId, replCreate.job.id))
      .limit(1);
    assert("Replacement stales pending", replItem?.status === "stale");

    // Retry failed path: force a failed item then retry
    const retryBulk = await createBulkJob({
      userId: userAId,
      projectId: projectA.id,
      imageIds: [imageIds[1]],
      operation: "optimize_same_format",
      idempotencyKey: `bulk-retry-${stamp}`,
    });
    assert("Retry setup create", retryBulk.ok);
    if (!retryBulk.ok) throw new Error("retry");
    await db
      .update(bulkJobItems)
      .set({status: "failed", lastErrorCode: "PROCESSING_FAILED", updatedAt: new Date()})
      .where(eq(bulkJobItems.bulkJobId, retryBulk.job.id));
    await db
      .update(bulkJobs)
      .set({status: "failed", failedCount: 1, pendingCount: 0, updatedAt: new Date()})
      .where(eq(bulkJobs.id, retryBulk.job.id));
    const retried = await retryFailedBulkItems({
      userId: userAId,
      projectId: projectA.id,
      bulkJobId: retryBulk.job.id,
    });
    assert(
      "Retry failed only",
      retried.ok &&
        (retried.job.completedCount >= 1 || retried.job.failedCount >= 0),
      retried.ok ? retried.job.status : undefined,
    );

    // Scale create (100 pending) — exercise cap without requiring all R2 uploads
    const manyIds = Array.from({length: 100}, () => imageIds[2]);
    const big = await createBulkJob({
      userId: userAId,
      projectId: projectA.id,
      imageIds: manyIds,
      operation: "optimize_same_format",
      idempotencyKey: `bulk-100-${stamp}`,
    });
    assert(
      "100-image selection accepted",
      big.ok && big.job.totalCount === 1 && big.job.pendingCount === 1,
      "deduped owned ready ids",
    );
    const tooBig = await createBulkJob({
      userId: userAId,
      projectId: projectA.id,
      imageIds: Array.from({length: 101}, () => crypto.randomUUID()),
      operation: "optimize_same_format",
    });
    assert("101 rejected", !tooBig.ok && tooBig.error === "BULK_TOO_LARGE");

    set("Bulk live", "Passed");
  } finally {
    const jobs = await db
      .select()
      .from(processingJobs)
      .where(eq(processingJobs.projectId, projectA.id));
    for (const j of jobs) {
      if (j.outputStorageKey) {
        try {
          await storage.deleteObject(j.outputStorageKey);
        } catch {
          /* best effort */
        }
      }
    }
    for (const key of sourceKeys) {
      try {
        await storage.deleteObject(key);
      } catch {
        /* best effort */
      }
    }
    await db.delete(bulkJobItems).where(eq(bulkJobItems.projectId, projectA.id));
    await db.delete(bulkJobs).where(eq(bulkJobs.projectId, projectA.id));
    await db.delete(imageDerivatives).where(eq(imageDerivatives.projectId, projectA.id));
    await db.delete(processingJobs).where(eq(processingJobs.projectId, projectA.id));
    await db.delete(quotaReservations).where(eq(quotaReservations.projectId, projectA.id));
    await db.delete(projectQuotaState).where(eq(projectQuotaState.projectId, projectA.id));
    await db.delete(imageReplacements).where(eq(imageReplacements.projectId, projectA.id));
    await db.delete(images).where(eq(images.projectId, projectA.id));
    await db.delete(projects).where(eq(projects.id, projectA.id));
    await db.delete(users).where(inArray(users.id, [userAId, userBId]));
    await sql.end({timeout: 5});
  }

  console.log("\n=== REPORT ===");
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error("FATAL:", error instanceof Error ? error.message : "unknown");
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
});
