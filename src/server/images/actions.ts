"use server";

import {auth} from "@/auth";
import {isR2Configured} from "@/lib/env";

/** Lightweight probe used by forms that need a storage availability signal. */
export async function getStorageAvailabilityAction(): Promise<{configured: boolean}> {
  const session = await auth();
  if (!session?.user?.id) return {configured: false};
  return {configured: isR2Configured()};
}
