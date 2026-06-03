export class ApiError extends Error {
  public status: number;
  public errorName: string;
  public details?: unknown;
  public requestId?: string;

  constructor(
    message: string,
    status: number,
    errorName: string = 'ApiError',
    details?: unknown,
    requestId?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorName = errorName;
    this.details = details;
    this.requestId = requestId;
  }
}
