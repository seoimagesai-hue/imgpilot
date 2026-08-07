"use client";

/**
 * Legacy wrapper — account + app-grid controls now live in public-chrome.
 * Kept so older imports do not break.
 */
import type {UserAccessContext} from "@/server/account/access-context";

export function AccountHeaderControls(_props: {access: UserAccessContext}) {
  void _props;
  return null;
}
