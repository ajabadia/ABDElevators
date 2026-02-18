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
