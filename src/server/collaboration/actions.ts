"use server";

/**
 * Prompt 32 — server actions for team activity + collaborative comments.
 */
import {revalidatePath} from "next/cache";
import {auth} from "@/auth";
import {CollaborationError} from "@/server/collaboration/errors";
import {
  addComment,
  listMyMentions,
  listThreadWithComments,
  reopenThread,
  resolveThread,
  softDeleteComment,
} from "@/server/collaboration/comments";
import {listProjectActivity} from "@/server/collaboration/activity";
import {isAppLocale} from "@/server/auth/validation";
import {isCommentSubjectType} from "@/server/collaboration/policy";

export type CollaborationActionState = {
  ok: boolean;
  error?: string;
};

function localeFrom(formData: FormData): string {
  const raw = String(formData.get("locale") ?? "en");
  return isAppLocale(raw) ? raw : "en";
}

function collaborationErrorCode(error: unknown): string {
  if (error instanceof CollaborationError) return error.code;
  return "INVALID_REQUEST";
}

function revalidateCollaborationPaths(locale: string, projectId: string) {
  revalidatePath(`/${locale}/dashboard/projects/${projectId}/activity`);
  revalidatePath(`/${locale}/dashboard/projects/${projectId}/metadata`);
}

async function requireSessionUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

export async function addCommentAction(
  _prev: CollaborationActionState,
  formData: FormData,
): Promise<CollaborationActionState> {
  const user = await requireSessionUser();
  if (!user) return {ok: false, error: "UNAUTHORIZED"};

  const locale = localeFrom(formData);
  const projectId = String(formData.get("projectId") ?? "").trim();
  const subjectType = String(formData.get("subjectType") ?? "").trim();
  const subjectId = String(formData.get("subjectId") ?? "").trim();
  const body = String(formData.get("body") ?? "");

  if (!projectId || !subjectId || !isCommentSubjectType(subjectType)) {
    return {ok: false, error: "INVALID_REQUEST"};
  }

  try {
    await addComment({userId: user.id, projectId, subjectType, subjectId, body});
    revalidateCollaborationPaths(locale, projectId);
    return {ok: true};
  } catch (error) {
    return {ok: false, error: collaborationErrorCode(error)};
  }
}

export async function deleteCommentAction(
  _prev: CollaborationActionState,
  formData: FormData,
): Promise<CollaborationActionState> {
  const user = await requireSessionUser();
  if (!user) return {ok: false, error: "UNAUTHORIZED"};

  const locale = localeFrom(formData);
  const projectId = String(formData.get("projectId") ?? "").trim();
  const commentId = String(formData.get("commentId") ?? "").trim();
  if (!projectId || !commentId) return {ok: false, error: "INVALID_REQUEST"};

  try {
    await softDeleteComment({userId: user.id, projectId, commentId});
    revalidateCollaborationPaths(locale, projectId);
    return {ok: true};
  } catch (error) {
    return {ok: false, error: collaborationErrorCode(error)};
  }
}

export async function resolveThreadAction(
  _prev: CollaborationActionState,
  formData: FormData,
): Promise<CollaborationActionState> {
  const user = await requireSessionUser();
  if (!user) return {ok: false, error: "UNAUTHORIZED"};

  const locale = localeFrom(formData);
  const projectId = String(formData.get("projectId") ?? "").trim();
  const subjectType = String(formData.get("subjectType") ?? "").trim();
  const subjectId = String(formData.get("subjectId") ?? "").trim();
  if (!projectId || !subjectId || !isCommentSubjectType(subjectType)) {
    return {ok: false, error: "INVALID_REQUEST"};
  }

  try {
    await resolveThread({userId: user.id, projectId, subjectType, subjectId});
    revalidateCollaborationPaths(locale, projectId);
    return {ok: true};
  } catch (error) {
    return {ok: false, error: collaborationErrorCode(error)};
  }
}

export async function reopenThreadAction(
  _prev: CollaborationActionState,
  formData: FormData,
): Promise<CollaborationActionState> {
  const user = await requireSessionUser();
  if (!user) return {ok: false, error: "UNAUTHORIZED"};

  const locale = localeFrom(formData);
  const projectId = String(formData.get("projectId") ?? "").trim();
  const subjectType = String(formData.get("subjectType") ?? "").trim();
  const subjectId = String(formData.get("subjectId") ?? "").trim();
  if (!projectId || !subjectId || !isCommentSubjectType(subjectType)) {
    return {ok: false, error: "INVALID_REQUEST"};
  }

  try {
    await reopenThread({userId: user.id, projectId, subjectType, subjectId});
    revalidateCollaborationPaths(locale, projectId);
    return {ok: true};
  } catch (error) {
    return {ok: false, error: collaborationErrorCode(error)};
  }
}

export async function fetchProjectActivityAction(params: {
  projectId: string;
  cursor?: string;
  limit?: number;
}) {
  const user = await requireSessionUser();
  if (!user) return {ok: false as const, error: "UNAUTHORIZED"};
  try {
    const feed = await listProjectActivity({
      userId: user.id,
      projectId: params.projectId,
      cursor: params.cursor,
      limit: params.limit,
    });
    return {ok: true as const, ...feed};
  } catch (error) {
    return {ok: false as const, error: collaborationErrorCode(error)};
  }
}

export async function fetchThreadAction(params: {
  projectId: string;
  subjectType: string;
  subjectId: string;
}) {
  const user = await requireSessionUser();
  if (!user) return {ok: false as const, error: "UNAUTHORIZED"};
  if (!isCommentSubjectType(params.subjectType)) {
    return {ok: false as const, error: "SUBJECT_INVALID"};
  }
  try {
    const thread = await listThreadWithComments({
      userId: user.id,
      projectId: params.projectId,
      subjectType: params.subjectType,
      subjectId: params.subjectId,
    });
    return {ok: true as const, thread};
  } catch (error) {
    return {ok: false as const, error: collaborationErrorCode(error)};
  }
}

export async function fetchMyMentionsAction(limit?: number) {
  const user = await requireSessionUser();
  if (!user) return {ok: false as const, error: "UNAUTHORIZED"};
  const mentions = await listMyMentions({userId: user.id, limit});
  return {ok: true as const, mentions};
}
