import { NextResponse } from 'next/server';
import { logEvento } from './logger';

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

/**
 * Manejador centralizado de errores para API Routes.
 */
export async function handleApiError(error: unknown, origen: string, correlacion_id: string) {
  if (error instanceof AppError) {
    await logEvento({
      nivel: 'WARN',
      origen,
      accion: 'API_ERROR',
      mensaje: error.message,
      correlacion_id,
      detalles: error.details
    });
    return NextResponse.json(error.toJSON(), { status: error.status });
  }

  // Error inesperado
  const message = error instanceof Error ? error.message : 'Error desconocido';
  const stack = error instanceof Error ? error.stack : undefined;

  await logEvento({
    nivel: 'ERROR',
    origen,
    accion: 'INTERNAL_SERVER_ERROR',
    mensaje: message,
    correlacion_id,
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
