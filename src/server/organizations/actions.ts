"use server";

/**
 * Minimal organization action stubs for Phase 1 typecheck.
 * Stateful actions use the useActionState signature; plain form actions use FormData only.
 */

export type OrgActionState = {
  ok: boolean;
  error?: string;
  inviteLink?: string;
};

type OrgFormAction = (prev: OrgActionState, formData: FormData) => Promise<OrgActionState>;
type PlainFormAction = (formData: FormData) => Promise<void>;

const stubState: OrgFormAction = async () => ({ok: false, error: "INVALID_REQUEST"});

const stubVoid: PlainFormAction = async () => {};

/** useActionState-compatible */
export const createOrganizationAction = stubState;
export const inviteMemberAction = stubState;

/** Plain `<form action>`-compatible */
export const setActiveWorkspaceAction = stubVoid;
export const changeMemberRoleAction = stubVoid;
export const removeMemberAction = stubVoid;
export const transferOwnershipAction = stubVoid;
export const revokeInvitationAction = stubVoid;
export const acceptInvitationAction = stubVoid;
export const declineInvitationAction = stubVoid;
export const reassignBillingOwnerAction = stubVoid;
export const transferProjectToOrgAction = stubVoid;
