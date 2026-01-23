export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'DATABASE_ERROR'
  | 'EXTERNAL_SERVICE_ERROR'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR'
  | 'UNAUTHORIZED'
  | 'TENANT_CONFIG_ERROR'
  | 'STORAGE_QUOTA_EXCEEDED'
  | 'MISSING_VARIABLES';

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public status: number,
    public message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', 400, message, details);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: unknown) {
    super('DATABASE_ERROR', 500, message, details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string, details?: unknown) {
    super('EXTERNAL_SERVICE_ERROR', 503, message, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, details?: unknown) {
    super('NOT_FOUND', 404, message, details);
  }
}
