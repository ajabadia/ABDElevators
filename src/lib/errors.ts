import { NextResponse } from 'next/server';
import { logEvento } from '@/lib/logger';

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'DATABASE_ERROR'
  | 'EXTERNAL_SERVICE_ERROR'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'TENANT_CONFIG_ERROR'
  | 'STORAGE_QUOTA_EXCEEDED'
  | 'MISSING_VARIABLES'
  | 'INVITE_ALREADY_USED'
  | 'INVITE_EXPIRED'
  | 'INVITATION_NOT_FOUND'
  | 'CONFLICT'
  | 'INVALID_USER_ID'
  | 'USER_NOT_FOUND'
  | 'USER_UPDATE_FAILED'
  | 'MFA_ENABLE_FAILED'
  | 'MFA_DISABLE_FAILED'
  | 'LIMIT_EXCEEDED'
  | 'LLM_INVALID_RESPONSE'
  | 'LLM_INVALID_FORMAT'
  | 'PROMPT_NOT_FOUND'
  | 'TRANSITION_ERROR'
  | 'WORKFLOW_NOT_FOUND'
  | 'TENANT_MISMATCH'
  | 'RESOURCE_BUSY';

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
    const isInternalError = this.status >= 500;

    return {
      success: false,
      error: {
        code: this.code,
        message: isInternalError ? 'Error interno del servidor' : this.message,
        details: isInternalError
          ? null // No filtrar detalles en 5xx
          : (this.details instanceof Error
            ? { message: this.details.message, name: this.details.name }
            : (this.details || null)),
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

/**
 * Manejador centralizado de errores para API Routes.
 */
export async function handleApiError(error: unknown, source: string, correlationId: string) {
  if (error instanceof AppError) {
    await logEvento({
      level: 'WARN',
      source,
      action: 'API_ERROR',
      message: error.message, correlationId,
      details: error.details
    });
    return NextResponse.json(error.toJSON(), { status: error.status });
  }

  // Error inesperado
  const message = error instanceof Error ? error.message : 'Error desconocido';
  const stack = error instanceof Error ? error.stack : undefined;

  await logEvento({
    level: 'ERROR',
    source,
    action: 'INTERNAL_SERVER_ERROR',
    message: message, correlationId,
    stack
  });

  return NextResponse.json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Ocurrió un error inesperado al procesar su solicitud.'
    }
  }, { status: 500 });
}
