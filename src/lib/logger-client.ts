/**
 * Client-side logger utility.
 * Used by "use client" components to log events without importing server-side MongoDB logic.
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface ClientLogEntry {
    nivel: LogLevel;
    origen: string;
    accion: string;
    mensaje: string;
    correlacion_id?: string;
    detalles?: Record<string, unknown>;
    stack?: string;
}

export async function logEventoCliente(entry: ClientLogEntry): Promise<void> {
    // Console output for immediate developer feedback
    if (entry.nivel === 'ERROR') {
        console.error(`[CLIENT] [${entry.origen}] [${entry.accion}] ${entry.mensaje}`, entry.detalles || '');
    } else {
        console.log(`[CLIENT] [${entry.origen}] [${entry.accion}] ${entry.mensaje}`);
    }

    try {
        // Send to server-side ingestion API
        await fetch('/api/logs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...entry,
                correlacion_id: entry.correlacion_id || crypto.randomUUID()
            }),
        });
    } catch (error) {
        // Fail silently on the client to avoid breaking the UI
        console.error('Failed to send log to server:', error);
    }
}
