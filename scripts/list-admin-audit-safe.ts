import {desc} from "drizzle-orm";
import {loadLocalEnvFiles} from "./load-local-env";

loadLocalEnvFiles();

async function main() {
  const {getDb} = await import("../src/db");
  const {adminAuditLogs} = await import("../src/db/schema");
  const db = getDb();
  const rows = await db
    .select({
      action: adminAuditLogs.action,
      id: adminAuditLogs.id,
      targetEntityId: adminAuditLogs.targetEntityId,
    })
    .from(adminAuditLogs)
    .orderBy(desc(adminAuditLogs.createdAt))
    .limit(12);
  for (const row of rows) {
    console.log(`${row.action} ${row.id}`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
