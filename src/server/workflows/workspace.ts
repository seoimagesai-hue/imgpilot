import type {ApiWorkspaceType, Project} from "@/db/schema";

export function workspaceFromProject(project: Pick<Project, "workspaceType" | "userId" | "organizationId">): {
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
} {
  if (project.workspaceType === "organization" && project.organizationId) {
    return {workspaceType: "organization", workspaceId: project.organizationId};
  }
  return {workspaceType: "personal", workspaceId: project.userId};
}
