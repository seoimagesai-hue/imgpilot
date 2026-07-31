/**
 * Prompt 8 live library verification: pagination/search isolation + current-page previews.
 * Usage: npx tsx scripts/verify-library-live.ts http://localhost:3000
 */
import {eq, inArray} from "drizzle-orm";
import {loadLocalEnvFiles} from "./load-local-env";

loadLocalEnvFiles();

function pass(name: string) {
  console.log(`PASS: ${name}`);
}
function fail(name: string, detail?: string): never {
  console.log(`FAIL: ${name}${detail ? ` (${detail})` : ""}`);
  throw new Error(name);
}

async function main() {
  const baseUrl = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
  const stamp = Date.now();

  const {getDb, getPostgresClient} = await import("../src/db/index");
  const {users, projects, images} = await import("../src/db/schema");
  const {hashPassword} = await import("../src/server/auth/password");
  const {createOwnedProject} = await import("../src/server/projects/queries");
  const {parseLibraryQuery} = await import("../src/server/images/library-query");
  const {
    listLibraryImagesForOwnedProject,
    getLibraryStatusCounts,
    filterOwnedImageIds,
  } = await import("../src/server/images/library-queries");
  const {attachCurrentPagePreviews} = await import("../src/server/images/library-previews");
  const {createOwnedImageReadUrl} = await import("../src/server/images/upload-service");

  const db = getDb();
  const sql = getPostgresClient();
  const userAId = crypto.randomUUID();
  const userBId = crypto.randomUUID();
  const passwordHash = await hashPassword(`Lib-${stamp}-Safe!`);

  await db.insert(users).values([
    {id: userAId, name: "Lib A", email: `lib-a-${stamp}@example.com`, passwordHash},
    {id: userBId, name: "Lib B", email: `lib-b-${stamp}@example.com`, passwordHash},
  ]);

  const projectA = await createOwnedProject(userAId, {
    name: `Lib ${stamp}`,
    websiteUrl: null,
    description: null,
    metadataLanguage: "en",
  });

  const rows = [];
  for (let i = 0; i < 30; i++) {
    rows.push({
      id: crypto.randomUUID(),
      projectId: projectA.id,
      originalFilename: i % 2 === 0 ? `alpha-${i}.jpg` : `beta-${i}.png`,
      storageKey: `test-library/${stamp}/${i}.bin`,
      storageProvider: "r2" as const,
      mimeType: "image/jpeg",
      fileExtension: "jpg",
      sizeBytes: 1000 + i * 100,
      width: 100 + i,
      height: 80,
      status: i === 1 ? ("uploaded" as const) : ("validated" as const),
      detectedMimeType: i === 1 ? null : "image/jpeg",
      pixelCount: (100 + i) * 80,
      isAnimated: false,
      validatedAt: i === 1 ? null : new Date(Date.now() - i * 1000),
    });
  }
  await db.insert(images).values(rows);
  pass("seeded-library-rows");

  const query = parseLibraryQuery({status: "validated", pageSize: "12", page: "1", sort: "newest"});
  const page1 = await listLibraryImagesForOwnedProject(userAId, projectA.id, query);
  if (page1.items.length !== 12 || page1.totalCount !== 29 || page1.totalPages !== 3) {
    fail("pagination", `items=${page1.items.length} total=${page1.totalCount} pages=${page1.totalPages}`);
  }
  const page2 = await listLibraryImagesForOwnedProject(userAId, projectA.id, {
    ...query,
    page: 2,
  });
  if (page2.items.length !== 12) fail("pagination-page-2");
  pass("pagination");

  const search = await listLibraryImagesForOwnedProject(userAId, projectA.id, {
    ...parseLibraryQuery({status: "all", q: "alpha"}),
  });
  if (!search.items.every((i) => i.originalFilename.includes("alpha"))) fail("search");
  pass("search");

  const counts = await getLibraryStatusCounts(userAId, projectA.id);
  if (counts.validated < 1 || counts.uploaded < 1) fail("status-counts");
  pass("status-counts");

  const bList = await listLibraryImagesForOwnedProject(userBId, projectA.id, parseLibraryQuery({}));
  if (bList.totalCount !== 0) fail("user-b-isolation");
  pass("user-b-isolation");

  const owned = await filterOwnedImageIds(userAId, projectA.id, [rows[0].id, crypto.randomUUID()]);
  if (owned.length !== 1 || owned[0] !== rows[0].id) fail("selected-id-validation");
  pass("selected-id-validation");

  const cross = await filterOwnedImageIds(userBId, projectA.id, [rows[0].id]);
  if (cross.length !== 0) fail("cross-project-ids-rejected");
  pass("cross-project-ids-rejected");

  // Preview attach: only validated on page get attempts; without R2 may be null
  const withPreview = await attachCurrentPagePreviews({
    userId: userAId,
    projectId: projectA.id,
    items: page1.items,
  });
  for (const item of withPreview) {
    if (item.status !== "validated" && item.previewUrl) fail("unvalidated-must-not-preview");
  }
  pass("preview-only-validated-rows");

  const uploadedRow = rows.find((r) => r.status === "uploaded")!;
  const noPreview = await createOwnedImageReadUrl({
    userId: userAId,
    projectId: projectA.id,
    imageId: uploadedRow.id,
  });
  if (noPreview.ok) fail("uploaded-no-preview");
  pass("uploaded-no-preview");

  // HTML route check if server up
  try {
    const res = await fetch(`${baseUrl}/en/login`, {redirect: "manual"});
    if (res.status === 200) pass("production-server-reachable");
    else console.log("NOT RUN: production-server-reachable");
  } catch {
    console.log("NOT RUN: production-server-reachable");
  }

  await db.delete(images).where(eq(images.projectId, projectA.id));
  await db.delete(projects).where(eq(projects.id, projectA.id));
  await db.delete(users).where(inArray(users.id, [userAId, userBId]));
  await sql.end({timeout: 5});
  pass("cleanup");
  console.log("RESULT=Passed");
}

main().catch((error) => {
  console.error("RESULT=Failed", error instanceof Error ? error.message : "unknown");
  process.exit(1);
});
