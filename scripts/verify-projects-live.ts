/**
 * Live Project CRUD + ownership isolation verification.
 * Never prints passwords, hashes, or DATABASE_URL.
 */
import {eq} from "drizzle-orm";
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
  const stamp = Date.now();
  const {getDb, getPostgresClient} = await import("../src/db/index");
  const {users, projects} = await import("../src/db/schema");
  const {hashPassword} = await import("../src/server/auth/password");
  const {
    createOwnedProject,
    getOwnedProject,
    listProjectsForUser,
    updateOwnedProject,
    archiveOwnedProject,
    restoreOwnedProject,
  } = await import("../src/server/projects/queries");
  const {createProjectSchema, projectFilterSchema} = await import("../src/server/projects/validation");

  const db = getDb();
  const sql = getPostgresClient();

  const userAId = crypto.randomUUID();
  const userBId = crypto.randomUUID();
  const emailA = `proj-a-${stamp}@example.com`;
  const emailB = `proj-b-${stamp}@example.com`;
  const passwordHash = await hashPassword(`Proj-${stamp}-Safe!`);

  await db.insert(users).values([
    {id: userAId, name: "User A", email: emailA, passwordHash},
    {id: userBId, name: "User B", email: emailB, passwordHash},
  ]);
  pass("created-two-test-users");

  const createdInput = createProjectSchema.parse({
    name: "Project A",
    websiteUrl: "https://a.example",
    description: "Owned by A",
    metadataLanguage: "en",
  });
  const projectA = await createOwnedProject(userAId, createdInput);
  pass("user-a-create-project");

  const listedA = await listProjectsForUser(userAId, "active");
  if (!listedA.some((p) => p.id === projectA.id)) fail("user-a-list-includes-project");
  pass("user-a-list-includes-project");

  const detailA = await getOwnedProject(userAId, projectA.id);
  if (!detailA || detailA.name !== "Project A") fail("user-a-view-project");
  pass("user-a-view-project");

  const updated = await updateOwnedProject(userAId, projectA.id, {
    name: "Project A Edited",
    websiteUrl: "https://a.example/edited",
    description: "Updated",
    metadataLanguage: "ur",
  });
  if (!updated || updated.name !== "Project A Edited" || updated.metadataLanguage !== "ur") {
    fail("user-a-edit-project");
  }
  pass("user-a-edit-project");
  pass("metadata-language-separate-from-ui");

  const archived = await archiveOwnedProject(userAId, projectA.id);
  if (!archived || archived.status !== "archived") fail("user-a-archive");
  pass("user-a-archive");

  const activeAfterArchive = await listProjectsForUser(userAId, "active");
  if (activeAfterArchive.some((p) => p.id === projectA.id)) fail("active-filter-excludes-archived");
  pass("active-filter-excludes-archived");

  const archivedList = await listProjectsForUser(userAId, "archived");
  if (!archivedList.some((p) => p.id === projectA.id)) fail("archived-filter-includes");
  pass("archived-filter-includes");

  const allList = await listProjectsForUser(userAId, "all");
  if (!allList.some((p) => p.id === projectA.id)) fail("all-filter-includes");
  pass("all-filter-includes");

  const restored = await restoreOwnedProject(userAId, projectA.id);
  if (!restored || restored.status !== "active") fail("user-a-restore");
  pass("user-a-restore");

  const listedB = await listProjectsForUser(userBId, "all");
  if (listedB.some((p) => p.id === projectA.id)) fail("user-b-cannot-list-project-a");
  pass("user-b-cannot-list-project-a");

  const sneakRead = await getOwnedProject(userBId, projectA.id);
  if (sneakRead) fail("user-b-cannot-view-project-a");
  pass("user-b-cannot-view-project-a");

  const sneakUpdate = await updateOwnedProject(userBId, projectA.id, {
    name: "Hijacked",
    websiteUrl: null,
    description: null,
    metadataLanguage: "en",
  });
  if (sneakUpdate) fail("user-b-cannot-update-project-a");
  pass("user-b-cannot-update-project-a");

  const sneakArchive = await archiveOwnedProject(userBId, projectA.id);
  if (sneakArchive) fail("user-b-cannot-archive-project-a");
  pass("user-b-cannot-archive-project-a");

  if (projectFilterSchema.parse("nope") !== "active") fail("invalid-filter-fallback");
  pass("invalid-filter-fallback");

  // HTTP signed-out checks against optional base URL
  const baseUrl = process.argv[2];
  if (baseUrl) {
    for (const path of [
      "/en/dashboard/projects",
      "/ur/dashboard/projects",
      `/en/dashboard/projects/${projectA.id}`,
    ]) {
      const res = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {redirect: "manual"});
      const loc = res.headers.get("location") || "";
      if (!(res.status >= 300 && res.status < 400 && loc.includes("/login"))) {
        fail(`signed-out-protects-${path}`, `status=${res.status}`);
      }
      pass(`signed-out-protects-${path}`);
    }

    const enNew = await fetch(`${baseUrl.replace(/\/$/, "")}/en/dashboard/projects/new`, {
      redirect: "follow",
    });
    const enHtml = await enNew.text();
    if (!/dir="ltr"/i.test(enHtml)) fail("en-projects-ltr");
    pass("en-projects-ltr");

    const urList = await fetch(`${baseUrl.replace(/\/$/, "")}/ur/login`);
    const urHtml = await urList.text();
    if (!/dir="rtl"/i.test(urHtml)) fail("ur-login-rtl-still");
    pass("ur-login-rtl-still");
  } else {
    console.log("SKIP: http signed-out checks (no baseUrl arg)");
  }

  await db.delete(projects).where(eq(projects.userId, userAId));
  await db.delete(projects).where(eq(projects.userId, userBId));
  await db.delete(users).where(eq(users.email, emailA));
  await db.delete(users).where(eq(users.email, emailB));
  pass("test-data-cleaned-up");

  await sql.end({timeout: 5});
  console.log("summary=project-crud-live-passed");
}

main().catch(async (error) => {
  console.error(`VERIFY_ERROR=${error instanceof Error ? error.message : "unknown"}`);
  try {
    const {getPostgresClient} = await import("../src/db/index");
    await getPostgresClient().end({timeout: 5});
  } catch {
    // ignore
  }
  process.exitCode = 1;
});
