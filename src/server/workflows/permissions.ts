import type {OrgPermission} from "@/server/organizations/permissions";

export async function requireWorkflowPermission(
  _userId: string,
  _workspaceType: string,
  _workspaceId: string,
  _permission: OrgPermission | string,
): Promise<void> {
  // Phase 1 stub — always allow during typecheck restoration.
}

export async function canManageWorkflows(
  _userId: string,
  _workspaceType: string,
  _workspaceId: string,
): Promise<boolean> {
  return true;
}

export async function canViewWorkflows(
  _userId: string,
  _workspaceType: string,
  _workspaceId: string,
): Promise<boolean> {
  return true;
}

export async function canRunWorkflows(
  _userId: string,
  _workspaceType: string,
  _workspaceId: string,
): Promise<boolean> {
  return true;
}
