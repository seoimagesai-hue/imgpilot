/** Minimal export-service stub for Phase 1 typecheck. */

export type ExportJobDto = {
  id: string;
  projectId: string;
  status: string;
  packageKind: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type ExportJobRecord = {
  id: string;
  projectId: string;
  status: string;
  packageKind: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
};

export async function createExportJob(_params: {
  userId: string;
  projectId: string;
  packageKind: string;
  sourceFilter?: string;
  language?: string;
  imageIds?: string[];
  includeImages?: boolean;
  includeCsv?: boolean;
  includeJson?: boolean;
  includeTxt?: boolean;
  includeHtmlReport?: boolean;
  includeSidecars?: boolean;
  format?: string | null;
  idempotencyKey?: string;
}): Promise<{ok: true; job: ExportJobRecord} | {ok: false; error: string}> {
  return {ok: false, error: "EXPORTS_UNAVAILABLE"};
}

export async function getOwnedExportJob(
  _userId: string,
  _projectId: string,
  _exportId: string,
): Promise<ExportJobRecord | null> {
  return null;
}

export function exportJobToDto(job: ExportJobRecord): ExportJobDto {
  return {
    id: job.id,
    projectId: job.projectId,
    status: job.status,
    packageKind: job.packageKind,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    completedAt: job.completedAt?.toISOString() ?? null,
  };
}

export async function createExportDownloadUrl(_params: {
  userId: string;
  projectId: string;
  exportId: string;
}): Promise<
  | {ok: true; url: string; expiresInSeconds: number; contentType: string}
  | {ok: false; error: string}
> {
  return {ok: false, error: "EXPORTS_UNAVAILABLE"};
}

export async function createExportPackage(_params: unknown): Promise<{id: string}> {
  throw new Error("EXPORTS_UNAVAILABLE");
}
