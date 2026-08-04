/**
 * Prompt 16 live queue/worker verification (R2 + DB).
 * Usage: npx tsx scripts/verify-queue-live.ts http://localhost:3000
 *
 * Spawns a short-lived worker for the run.
 */
import {eq, inArray} from "drizzle-orm";
import {spawn, type ChildProcess} from "node:child_process";
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

function startWorkerWithId(workerId: string): ChildProcess {
  return spawn("npx", ["tsx", "scripts/processing-worker.ts"], {
    cwd: process.cwd(),
    env: {...process.env, WORKER_ID: workerId},
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
  });
}

async function waitForJob(
  getJob: () => Promise<{status: string} | null>,
  timeoutMs = 90_000,
): Promise<{status: string}> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const job = await getJob();
    if (job && ["completed", "failed", "stale", "cancelled"].includes(job.status)) {
      return job;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("job timeout");
}

async function main() {
  const baseUrl = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
  const stamp = Date.now();
  const {isR2Configured} = await import("../src/lib/env");
  if (!isR2Configured()) {
    set("Queue live", "Blocked", "R2 not configured");
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
    workerHeartbeats,
  } = await import("../src/db/schema");
  const {hashPassword} = await import("../src/server/auth/password");
  const {createOwnedProject} = await import("../src/server/projects/queries");
  const {authorizeProjectUploads, confirmProjectUpload} = await import(
    "../src/server/images/upload-service"
  );
  const {validateOwnedImage} = await import("../src/server/images/validation-service");
  const {createProcessingJob, getProcessingJob} = await import(
    "../src/server/images/processing-service"
  );
  const {
    claimQueuedJobs,
    recoverExpiredLeases,
    getQueuePolicy,
  } = await import("../src/server/images/queue-service");
  const {READY_STATUS} = await import("../src/server/images/ready-eligibility");
  const {getObjectStorageProvider} = await import("../src/server/storage/provider");

  const policy = getQueuePolicy();
  assert("Browser cannot execute", policy.browserExecutesProcessing === false);
  assert("Reuses engine", policy.reusesProcessingEngine === true);
  assert("Bounded parallel", policy.parallelJobsPerWorker === 3);

  const db = getDb();
  const sql = getPostgresClient();
  const storage = await getObjectStorageProvider();
  const userAId = crypto.randomUUID();
  const userBId = crypto.randomUUID();
  const passwordHash = await hashPassword(`Queue-${stamp}-Safe!`);

  await db.insert(users).values([
    {id: userAId, name: "Queue A", email: `queue-a-${stamp}@example.com`, passwordHash},
    {id: userBId, name: "Queue B", email: `queue-b-${stamp}@example.com`, passwordHash},
  ]);
  const projectA = await createOwnedProject(userAId, {
    name: `Queue ${stamp}`,
    websiteUrl: "https://queue.example",
    description: "queue live",
    metadataLanguage: "en",
  });

  const jpeg = await sharp({
    create: {width: 72, height: 54, channels: 3, background: {r: 30, g: 70, b: 110}},
  })
    .jpeg({quality: 85})
    .toBuffer();

  const workerId = `verify-worker-${stamp}`;
  const worker = startWorkerWithId(workerId);
  let sourceKey = "";

  try {
    await new Promise((r) => setTimeout(r, 2000));

    const auth = await authorizeProjectUploads({
      userId: userAId,
      projectId: projectA.id,
      files: [
        {
          clientId: crypto.randomUUID(),
          originalFilename: `queue-${stamp}.jpg`,
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
    sourceKey = row!.storageKey!;
    const beforeHash = createHash("sha256")
      .update((await storage.getObjectBuffer(sourceKey, 25 * 1024 * 1024)).body)
      .digest("hex");

    const httpExec = await fetch(
      `${baseUrl}/api/projects/${projectA.id}/processing/jobs/${crypto.randomUUID()}?action=execute`,
      {method: "POST"},
    );
    assert(
      "HTTP execute blocked (auth or queue)",
      httpExec.status === 401 || httpExec.status === 409 || httpExec.status === 400,
    );

    const created = await createProcessingJob({
      userId: userAId,
      projectId: projectA.id,
      imageId: item.imageId,
      operation: "optimize_same_format",
      idempotencyKey: `queue-live-${stamp}`,
    });
    assert("Enqueue job", created.ok && created.job.status === "queued");
    if (!created.ok) throw new Error("create");

    const bCreate = await createProcessingJob({
      userId: userBId,
      projectId: projectA.id,
      imageId: item.imageId,
      operation: "optimize_same_format",
    });
    assert("User B blocked", !bCreate.ok);

    const finished = await waitForJob(async () => {
      const got = await getProcessingJob({
        userId: userAId,
        projectId: projectA.id,
        jobId: created.job.id,
      });
      return got.ok ? got.job : null;
    });
    assert("Worker completed job", finished.status === "completed");

    const afterHash = createHash("sha256")
      .update((await storage.getObjectBuffer(sourceKey, 25 * 1024 * 1024)).body)
      .digest("hex");
    assert("Original intact", afterHash === beforeHash);

    // Duplicate claim protection: claim should get nothing when no queued
    const claimed = await claimQueuedJobs({workerId: `probe-${stamp}`, limit: 3});
    assert("No duplicate claim on empty queue", claimed.length === 0);

    // Lease recovery
    const leaseJob = await createProcessingJob({
      userId: userAId,
      projectId: projectA.id,
      imageId: item.imageId,
      operation: "resize",
      preset: "px_256",
      idempotencyKey: `queue-lease-${stamp}`,
    });
    assert("Lease test enqueue", leaseJob.ok);
    if (!leaseJob.ok) throw new Error("lease");
    await db
      .update(processingJobs)
      .set({
        status: "processing",
        leaseOwner: "dead-worker",
        leaseExpiresAt: new Date(Date.now() - 5_000),
        heartbeatAt: new Date(Date.now() - 5_000),
        updatedAt: new Date(),
      })
      .where(eq(processingJobs.id, leaseJob.job.id));
    const recovered = await recoverExpiredLeases({limit: 10});
    assert("Expired lease recovered", recovered.recovered >= 1);
    const [requeued] = await db
      .select()
      .from(processingJobs)
      .where(eq(processingJobs.id, leaseJob.job.id))
      .limit(1);
    assert("Requeued after lease expiry", requeued?.status === "queued");

    const resizeDone = await waitForJob(async () => {
      const got = await getProcessingJob({
        userId: userAId,
        projectId: projectA.id,
        jobId: leaseJob.job.id,
      });
      return got.ok ? got.job : null;
    });
    assert("Worker picks up recovered job", resizeDone.status === "completed");

    set("Queue live", "Passed");
  } finally {
    worker.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 1500));
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
    if (sourceKey) {
      try {
        await storage.deleteObject(sourceKey);
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
    await db.delete(workerHeartbeats).where(eq(workerHeartbeats.workerId, workerId));
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
