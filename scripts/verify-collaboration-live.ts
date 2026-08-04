/**
 * Prompt 32 — collaboration live DB verification.
 */
import {eq, like} from "drizzle-orm";
import {loadLocalEnvFiles} from "./load-local-env";

loadLocalEnvFiles();

const PREFIX = "p32-live-";

async function main() {
  const {getDb, getPostgresClient} = await import("../src/db/index");
  const {
    users,
    projects,
    activityEvents,
    commentThreads,
    comments,
    commentMentions,
  } = await import("../src/db/schema");
  const {hashPassword} = await import("../src/server/auth/password");
  const {recordActivityEvent, listProjectActivity} = await import("../src/server/collaboration/activity");
  const {addComment, listThreadWithComments, resolveThread} =
    await import("../src/server/collaboration/comments");
  const {sanitizeCommentBody, extractMentionTokens} = await import(
    "../src/server/collaboration/policy"
  );

  const db = getDb();
  const sql = getPostgresClient();
  const passwordHash = await hashPassword("VerifyCollabLive32!");

  const leftover = await db.select({id: users.id}).from(users).where(like(users.email, `${PREFIX}%`));
  for (const u of leftover) {
    await db.delete(commentMentions).where(eq(commentMentions.mentionedUserId, u.id)).catch(() => undefined);
    await db.delete(comments).where(eq(comments.authorUserId, u.id)).catch(() => undefined);
    await db.delete(commentThreads).where(eq(commentThreads.createdByUserId, u.id)).catch(() => undefined);
    await db.delete(activityEvents).where(eq(activityEvents.actorUserId, u.id)).catch(() => undefined);
    await db.delete(projects).where(eq(projects.userId, u.id));
    await db.delete(users).where(eq(users.id, u.id));
  }

  const userId = crypto.randomUUID();
  await db.insert(users).values({
    id: userId,
    name: "P32 Live",
    email: `${PREFIX}owner@example.com`,
    passwordHash,
  });
  console.log("PASS: created-user");

  const projectId = crypto.randomUUID();
  await db.insert(projects).values({
    id: projectId,
    userId,
    createdByUserId: userId,
    name: "P32 Project",
    metadataLanguage: "en",
    workspaceType: "personal",
  });
  console.log("PASS: project-created");

  {
    const body = sanitizeCommentBody("  @owner@example.com hi  ");
    if (!body.includes("@owner@example.com")) throw new Error("sanitize failed");
    const tokens = extractMentionTokens(body);
    if (!tokens.includes("owner@example.com")) throw new Error("mention extract failed");
  }
  console.log("PASS: policy-pure");

  const activity = await recordActivityEvent({
    workspaceType: "personal",
    workspaceId: userId,
    projectId,
    actorUserId: userId,
    verb: "comment.created",
    entityType: "comment",
    entityId: crypto.randomUUID(),
    summarySafe: "Test activity",
    idempotencyKey: `p32-test-${Date.now()}`,
  });
  if (!activity.ok) throw new Error("recordActivityEvent failed");
  console.log("PASS: record-activity");

  const feed = await listProjectActivity({userId, projectId, limit: 10});
  if (feed.items.length < 1) throw new Error("activity feed empty");
  console.log("PASS: list-activity");

  const result = await addComment({
    userId,
    projectId,
    subjectType: "project",
    subjectId: projectId,
    body: "Hello team @p32-live-owner@example.com",
  });
  if (!result.comment.body) throw new Error("comment not created");
  console.log("PASS: add-comment");

  const listed = await listThreadWithComments({
    userId,
    projectId,
    subjectType: "project",
    subjectId: projectId,
  });
  if (listed.comments.length !== 1) throw new Error("list thread failed");
  console.log("PASS: list-thread");

  await resolveThread({
    userId,
    projectId,
    subjectType: "project",
    subjectId: projectId,
  });
  const afterResolve = await listThreadWithComments({
    userId,
    projectId,
    subjectType: "project",
    subjectId: projectId,
  });
  if (afterResolve.thread.status !== "resolved") throw new Error("resolve failed");
  console.log("PASS: resolve-thread");

  await db.delete(commentMentions).where(eq(commentMentions.mentionedUserId, userId)).catch(() => undefined);
  await db.delete(comments).where(eq(comments.projectId, projectId));
  await db.delete(commentThreads).where(eq(commentThreads.projectId, projectId));
  await db.delete(activityEvents).where(eq(activityEvents.projectId, projectId));
  await db.delete(projects).where(eq(projects.id, projectId));
  await db.delete(users).where(eq(users.id, userId));

  await sql.end({timeout: 5}).catch(() => undefined);
  console.log("PASS: cleanup");
  console.log("All collaboration live checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
