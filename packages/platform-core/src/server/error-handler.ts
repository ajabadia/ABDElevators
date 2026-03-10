import { NextResponse } from 'next/server';
import { logEvento } from './logger';
import { AppError } from '../errors';

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

    const message = error instanceof Error ? error.message : 'Error desconocido';
    const stack = error instanceof Error ? error.stack : undefined;
    const details = error instanceof Error ? undefined : error;

    // Determine status and code for logging/response when not an AppError
    const status = error instanceof AppError ? error.status : 500;
    const code = error instanceof AppError ? error.code : 'INTERNAL_ERROR';


    await logEvento({
        level: 'ERROR',
        source,
        action: 'INTERNAL_SERVER_ERROR',
        message: message,
        correlationId,
        stack,
        details: typeof details === 'object' ? JSON.stringify(details) : String(details)
    });

    return NextResponse.json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: 'Ocurrió un error inesperado al procesar su solicitud.'
        }
    }, { status: 500 });
}
