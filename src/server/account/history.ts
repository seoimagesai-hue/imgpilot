import {desc, eq} from "drizzle-orm";
import {getDb} from "@/db";
import {billingUsageLedger} from "@/db/schema";

export type AccountHistoryItem = {
  id: string;
  category: string;
  quantity: number;
  status: string;
  recordedAt: string;
};

export async function listAccountUsageHistory(
  userId: string,
  limit = 50,
): Promise<AccountHistoryItem[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: billingUsageLedger.id,
      category: billingUsageLedger.category,
      quantity: billingUsageLedger.quantity,
      status: billingUsageLedger.status,
      recordedAt: billingUsageLedger.recordedAt,
    })
    .from(billingUsageLedger)
    .where(eq(billingUsageLedger.userId, userId))
    .orderBy(desc(billingUsageLedger.recordedAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    category: row.category,
    quantity: row.quantity,
    status: row.status,
    recordedAt: row.recordedAt.toISOString(),
  }));
}
