"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {auth} from "@/auth";
import {isAppLocale} from "@/server/auth/validation";
import {
  archiveOwnedProject,
  createOwnedProject,
  restoreOwnedProject,
  updateOwnedProject,
} from "./queries";
import {createProjectSchema, projectIdSchema, updateProjectSchema} from "./validation";

export type ProjectActionState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

function firstIssueMessage(issues: {path: PropertyKey[]; message: string}[]): ProjectActionState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return {
    ok: false,
    error: issues[0]?.message ?? "genericFailure",
    fieldErrors,
  };
}

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

function revalidateProjectPaths(locale: string, projectId?: string) {
  revalidatePath(`/${locale}/dashboard`);
  revalidatePath(`/${locale}/dashboard/projects`);
  if (projectId) {
    revalidatePath(`/${locale}/dashboard/projects/${projectId}`);
    revalidatePath(`/${locale}/dashboard/projects/${projectId}/edit`);
  }
}

export async function createProjectAction(
  _prev: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const userId = await requireUserId();
  if (!userId) return {ok: false, error: "unauthorized"};

  const localeRaw = String(formData.get("locale") ?? "en");
  const locale = isAppLocale(localeRaw) ? localeRaw : "en";

  const parsed = createProjectSchema.safeParse({
    name: formData.get("name"),
    websiteUrl: formData.get("websiteUrl") ?? "",
    description: formData.get("description") ?? "",
    metadataLanguage: formData.get("metadataLanguage"),
  });
  if (!parsed.success) return firstIssueMessage(parsed.error.issues);

  try {
    const created = await createOwnedProject(userId, parsed.data);
    revalidateProjectPaths(locale, created.id);
    redirect(`/${locale}/dashboard/projects/${created.id}`);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    console.error("[projects] create failed");
    return {ok: false, error: "genericFailure"};
  }
}

export async function updateProjectAction(
  _prev: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const userId = await requireUserId();
  if (!userId) return {ok: false, error: "unauthorized"};

  const localeRaw = String(formData.get("locale") ?? "en");
  const locale = isAppLocale(localeRaw) ? localeRaw : "en";
  const idParsed = projectIdSchema.safeParse(String(formData.get("projectId") ?? ""));
  if (!idParsed.success) return {ok: false, error: "notFound"};

  const parsed = updateProjectSchema.safeParse({
    name: formData.get("name"),
    websiteUrl: formData.get("websiteUrl") ?? "",
    description: formData.get("description") ?? "",
    metadataLanguage: formData.get("metadataLanguage"),
  });
  if (!parsed.success) return firstIssueMessage(parsed.error.issues);

  try {
    const updated = await updateOwnedProject(userId, idParsed.data, parsed.data);
    if (!updated) return {ok: false, error: "notFound"};
    revalidateProjectPaths(locale, updated.id);
    redirect(`/${locale}/dashboard/projects/${updated.id}`);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    console.error("[projects] update failed");
    return {ok: false, error: "genericFailure"};
  }
}

export async function archiveProjectAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const localeRaw = String(formData.get("locale") ?? "en");
  const locale = isAppLocale(localeRaw) ? localeRaw : "en";
  if (!userId) redirect(`/${locale}/login`);

  const idParsed = projectIdSchema.safeParse(String(formData.get("projectId") ?? ""));
  if (!idParsed.success) redirect(`/${locale}/dashboard/projects`);

  const updated = await archiveOwnedProject(userId, idParsed.data);
  revalidateProjectPaths(locale, idParsed.data);
  if (!updated) redirect(`/${locale}/dashboard/projects`);
  redirect(`/${locale}/dashboard/projects?status=archived`);
}

export async function restoreProjectAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const localeRaw = String(formData.get("locale") ?? "en");
  const locale = isAppLocale(localeRaw) ? localeRaw : "en";
  if (!userId) redirect(`/${locale}/login`);

  const idParsed = projectIdSchema.safeParse(String(formData.get("projectId") ?? ""));
  if (!idParsed.success) redirect(`/${locale}/dashboard/projects`);

  const updated = await restoreOwnedProject(userId, idParsed.data);
  revalidateProjectPaths(locale, idParsed.data);
  if (!updated) redirect(`/${locale}/dashboard/projects`);
  redirect(`/${locale}/dashboard/projects?status=active`);
}
