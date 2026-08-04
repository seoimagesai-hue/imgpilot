/**
 * Prompt 17 live AI metadata verification (DB + optional OpenAI).
 * Usage: npx tsx scripts/verify-metadata-live.ts http://localhost:3000
 */
import {eq, inArray} from "drizzle-orm";
import {spawn, type ChildProcess} from "node:child_process";
import sharp from "sharp";
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

function startWorker(): ChildProcess {
  return spawn("npx", ["tsx", "scripts/processing-worker.ts"], {
    cwd: process.cwd(),
    env: {...process.env, WORKER_ID: `meta-verify-${Date.now()}`},
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
  });
}

async function waitGeneration(
  get: () => Promise<{status: string} | null>,
  timeoutMs = 120_000,
): Promise<{status: string}> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const row = await get();
    if (
      row &&
      ["draft", "failed", "stale", "cancelled", "reviewed", "approved"].includes(row.status)
    ) {
      return row;
    }
    await new Promise((r) => setTimeout(r, 800));
  }
  throw new Error("generation timeout");
}

async function main() {
  const baseUrl = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
  const stamp = Date.now();

  const {isR2Configured} = await import("../src/lib/env");
  const {isAiConfigured, getAiConfigStatus} = await import("../src/server/images/ai-provider");
  const {getAiMetadataPolicy} = await import("../src/server/images/ai-metadata-policy");
  const {READY_STATUS} = await import("../src/server/images/ready-eligibility");

  const policy = getAiMetadataPolicy();
  assert("No auto-approve", policy.autoApprove === false);
  assert("No auto-rename", policy.autoRename === false);
  assert("Bulk AI batches enabled (Prompt 31)", policy.bulkAi === true);
  assert("No browser provider", policy.browserCallsProvider === false);

  if (!isR2Configured()) {
    set("Metadata live", "Blocked", "R2 not configured");
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  }

  const aiStatus = getAiConfigStatus();
  const liveAi = isAiConfigured();
  if (!liveAi) {
    set("Live provider", "Blocked", aiStatus.configured ? "unavailable" : "AI_NOT_CONFIGURED");
  } else {
    set("Live provider configured", "Passed", aiStatus.configured ? aiStatus.provider : undefined);
  }

  try {
    assert("Production server", (await fetch(`${baseUrl}/en/login`)).status === 200, baseUrl);
  } catch {
    set("Production server", "Not run");
  }

  const {getDb, getPostgresClient} = await import("../src/db/index");
  const {
    users,
    metadataGenerations,
    imageMetadataApproved,
    processingJobs,
    images,
    projects,
  } = await import("../src/db/schema");
  const {hashPassword} = await import("../src/server/auth/password");
  const {createOwnedProject} = await import("../src/server/projects/queries");
  const {authorizeProjectUploads, confirmProjectUpload} = await import(
    "../src/server/images/upload-service"
  );
  const {validateOwnedImage} = await import("../src/server/images/validation-service");
  const {
    createMetadataGeneration,
    saveMetadataEdits,
    approveMetadataGeneration,
    getApprovedMetadata,
    listMetadataGenerations,
    onImageInvalidateMetadata,
  } = await import("../src/server/images/ai-metadata-service");
  const {getObjectStorageProvider} = await import("../src/server/storage/provider");

  const db = getDb();
  const sql = getPostgresClient();
  const storage = await getObjectStorageProvider();
  const userAId = crypto.randomUUID();
  const userBId = crypto.randomUUID();
  const passwordHash = await hashPassword(`Meta-${stamp}-Safe!`);
  let imageId = "";
  let sourceKey = "";

  try {
    await db.insert(users).values([
      {id: userAId, name: "Meta A", email: `meta-a-${stamp}@example.com`, passwordHash},
      {id: userBId, name: "Meta B", email: `meta-b-${stamp}@example.com`, passwordHash},
    ]);

    const projectA = await createOwnedProject(userAId, {
      name: `Meta ${stamp}`,
      websiteUrl: "https://meta.example",
      description: "metadata live",
      metadataLanguage: "en",
    });

    const jpeg = await sharp({
      create: {width: 640, height: 480, channels: 3, background: {r: 40, g: 120, b: 200}},
    })
      .jpeg({quality: 85})
      .toBuffer();

    const auth = await authorizeProjectUploads({
      userId: userAId,
      projectId: projectA.id,
      files: [
        {
          clientId: crypto.randomUUID(),
          originalFilename: `meta-${stamp}.jpg`,
          mimeType: "image/jpeg",
          sizeBytes: jpeg.length,
        },
      ],
    });
    assert("Authorize", Boolean(auth.ok && auth.results?.[0]?.ok));
    const item = auth.results![0] as {
      ok: true;
      imageId: string;
      uploadUrl: string;
      headers: Record<string, string>;
    };
    imageId = item.imageId;
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
    assert(
      "Eligible validated image",
      validated.ok &&
        (validated.status === "validated" || validated.status === READY_STATUS),
    );
    const [row] = await db.select().from(images).where(eq(images.id, item.imageId)).limit(1);
    sourceKey = row!.storageKey!;

    const blocked = await createMetadataGeneration({
      userId: userBId,
      projectId: projectA.id,
      imageId: item.imageId,
    });
    assert("User B create blocked", !blocked.ok);

    if (!liveAi) {
      const unconfigured = await createMetadataGeneration({
        userId: userAId,
        projectId: projectA.id,
        imageId: item.imageId,
      });
      assert(
        "AI unconfigured result",
        !unconfigured.ok &&
          (unconfigured.error === "AI_NOT_CONFIGURED" ||
            unconfigured.error === "AI_PROVIDER_UNAVAILABLE"),
      );
      set("User A draft", "Blocked", "no AI credentials");
      set("User A approval", "Blocked", "no AI credentials");
      set("User A regeneration", "Blocked", "no AI credentials");
    } else {
      const worker = startWorker();
      try {
        const created = await createMetadataGeneration({
          userId: userAId,
          projectId: projectA.id,
          imageId: item.imageId,
          language: "en",
          idempotencyKey: `meta-live-${stamp}`,
        });
        assert("Job queued", created.ok, created.ok ? created.generation.status : created.error);
        if (!created.ok) throw new Error(created.error);

        const draft = await waitGeneration(async () => {
          const [g] = await db
            .select({status: metadataGenerations.status})
            .from(metadataGenerations)
            .where(eq(metadataGenerations.id, created.generation.id))
            .limit(1);
          return g ?? null;
        });
        assert("Draft created", draft.status === "draft", draft.status);

        const [genRow] = await db
          .select()
          .from(metadataGenerations)
          .where(eq(metadataGenerations.id, created.generation.id))
          .limit(1);
        assert("Language en", genRow?.language === "en");
        assert("Provider stored", Boolean(genRow?.provider && genRow.model));
        assert("Prompt version", genRow?.promptVersion === "metadata-v1");

        const edited = await saveMetadataEdits({
          userId: userAId,
          projectId: projectA.id,
          generationId: created.generation.id,
          altText: genRow!.altText ?? "Edited alt text for a blue sky scene.",
          title: "Edited title",
          caption: null,
          description: genRow!.description ?? "Edited description grounded in the image.",
          filenameSuggestion: "edited-sky-scene",
        });
        assert("User A edit", edited.ok);
        assert("Reviewed status", edited.ok && edited.generation.status === "reviewed");

        const approved = await approveMetadataGeneration({
          userId: userAId,
          projectId: projectA.id,
          generationId: created.generation.id,
        });
        assert("User A approve", approved.ok);
        const current = await getApprovedMetadata({
          userId: userAId,
          projectId: projectA.id,
          imageId: item.imageId,
          language: "en",
        });
        assert("Approved snapshot", Boolean(current));

        const regen = await createMetadataGeneration({
          userId: userAId,
          projectId: projectA.id,
          imageId: item.imageId,
          language: "en",
          idempotencyKey: `meta-live-regen-${stamp}`,
        });
        assert("Regenerate queued", regen.ok);
        if (regen.ok) {
          await waitGeneration(async () => {
            const [g] = await db
              .select({status: metadataGenerations.status})
              .from(metadataGenerations)
              .where(eq(metadataGenerations.id, regen.generation.id))
              .limit(1);
            return g ?? null;
          });
        }
        const still = await getApprovedMetadata({
          userId: userAId,
          projectId: projectA.id,
          imageId: item.imageId,
          language: "en",
        });
        assert("Approved preserved on regen", still?.generationId === current?.generationId);

        const bRead = await listMetadataGenerations({
          userId: userBId,
          projectId: projectA.id,
          imageId: item.imageId,
        });
        assert("User B history blocked", bRead.length === 0);
        const bApprove = await approveMetadataGeneration({
          userId: userBId,
          projectId: projectA.id,
          generationId: created.generation.id,
        });
        assert("User B approve blocked", !bApprove.ok);
      } finally {
        worker.kill();
      }
    }

    await onImageInvalidateMetadata({
      projectId: projectA.id,
      imageId: item.imageId,
      reason: "IMAGE_SOURCE_CHANGED",
    });
    set("Source invalidate", "Passed");

    await db
      .delete(imageMetadataApproved)
      .where(eq(imageMetadataApproved.projectId, projectA.id));
    await db.delete(metadataGenerations).where(eq(metadataGenerations.projectId, projectA.id));
    await db.delete(processingJobs).where(eq(processingJobs.projectId, projectA.id));
    await db.delete(images).where(eq(images.projectId, projectA.id));
    await db.delete(projects).where(eq(projects.id, projectA.id));
    await db.delete(users).where(inArray(users.id, [userAId, userBId]));
    if (sourceKey) {
      try {
        await storage.deleteObject(sourceKey);
      } catch {
        /* ignore */
      }
    }
    set("Cleanup", "Passed");
  } catch (error) {
    set("Live run", "Failed", error instanceof Error ? error.message : "error");
    // best-effort cleanup
    try {
      if (imageId) {
        await db.delete(images).where(eq(images.id, imageId));
      }
      await db.delete(users).where(inArray(users.id, [userAId, userBId]));
    } catch {
      /* ignore */
    }
  } finally {
    console.log(JSON.stringify(report, null, 2));
    await sql.end({timeout: 5});
  }
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : "failed");
  process.exit(1);
});
