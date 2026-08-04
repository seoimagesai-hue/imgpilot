/** Minimal analytics-service stub for Phase 1 typecheck. */

export type UserOverviewAnalytics = {
  images: {active: number};
  storage: {totalGeneratedBytes: number};
};

export async function getUserOverviewAnalytics(
  _userId: string,
  _period: "7d" | "30d" | "90d",
): Promise<UserOverviewAnalytics> {
  return {
    images: {active: 0},
    storage: {totalGeneratedBytes: 0},
  };
}
