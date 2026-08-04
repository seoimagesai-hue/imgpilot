import type {OrganizationMemberRole} from "@/db/schema";

export type OrgPermission =
  | "organization.view"
  | "projects.view"
  | "projects.create"
  | "projects.edit"
  | "images.upload"
  | "images.delete"
  | "images.replace"
  | "processing.run"
  | "metadata.generate"
  | "metadata.edit"
  | "metadata.approve"
  | "exports.download"
  | "exports.create"
  | "analytics.view"
  | "workflows.view"
  | "workflows.manage"
  | "workflows.run"
  | "activity.view"
  | "comments.view"
  | "comments.create"
  | "comments.resolve"
  | "members.view"
  | "members.invite"
  | "members.change_role"
  | "members.remove"
  | "ownership.transfer"
  | "audit.view"
  | "billing.reassign"
  | "integrations.manage"
  | "integrations.view"
  | "cloudinary.view"
  | "cloudinary.publish"
  | "wordpress.view"
  | "wordpress.publish"
  | "shopify.view"
  | "shopify.publish"
  | "webflow.view"
  | "webflow.publish";

const ROLE_RANK: Record<OrganizationMemberRole, number> = {
  viewer: 1,
  editor: 2,
  admin: 3,
  owner: 4,
};

const PERMISSION_MIN_ROLE: Partial<Record<OrgPermission, OrganizationMemberRole>> = {
  "organization.view": "viewer",
  "projects.view": "viewer",
  "projects.create": "editor",
  "projects.edit": "editor",
  "images.upload": "editor",
  "images.delete": "editor",
  "images.replace": "editor",
  "processing.run": "editor",
  "metadata.generate": "editor",
  "metadata.edit": "editor",
  "metadata.approve": "editor",
  "exports.download": "viewer",
  "exports.create": "editor",
  "analytics.view": "viewer",
  "workflows.view": "viewer",
  "workflows.manage": "admin",
  "workflows.run": "editor",
  "activity.view": "viewer",
  "comments.view": "viewer",
  "comments.create": "editor",
  "comments.resolve": "editor",
  "members.view": "viewer",
  "members.invite": "admin",
  "members.change_role": "admin",
  "members.remove": "admin",
  "ownership.transfer": "owner",
  "audit.view": "admin",
  "billing.reassign": "owner",
  "integrations.manage": "admin",
  "integrations.view": "viewer",
  "cloudinary.view": "viewer",
  "cloudinary.publish": "editor",
  "wordpress.view": "viewer",
  "wordpress.publish": "editor",
  "shopify.view": "viewer",
  "shopify.publish": "editor",
  "webflow.view": "viewer",
  "webflow.publish": "editor",
};

export function hasOrgPermission(
  role: OrganizationMemberRole,
  permission: OrgPermission,
): boolean {
  const min = PERMISSION_MIN_ROLE[permission] ?? "owner";
  return ROLE_RANK[role] >= ROLE_RANK[min];
}

/** Personal workspace owners receive all permissions. */
export function personalOwnerHasPermission(_permission: OrgPermission): boolean {
  return true;
}
