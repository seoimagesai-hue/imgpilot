export class WorkflowError extends Error {
  readonly code: string;
  constructor(code: string, message?: string) {
    super(message ?? code);
    this.name = "WorkflowError";
    this.code = code;
  }
}
