import { connectDB } from './db';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
    nivel: LogLevel;
    origen: string;
    accion: string;
    mensaje: string;
    correlacion_id: string;
    detalles?: any;
    stack?: string;
    timestamp?: Date;
}

/**
 * Registra un evento de forma estructurada en la base de datos (colección logs_aplicacion).
 * Sigue la Regla de Oro #4.
 */
export async function logEvento(entry: LogEntry): Promise<void> {
    const timestamp = new Date();
    const logData = { ...entry, timestamp };

    // Always log to console for development visibility
    if (entry.nivel === 'ERROR') {
        console.error(`[${timestamp.toISOString()}] [${entry.origen}] [${entry.accion}] ${entry.mensaje}`, entry.detalles || '', entry.stack || '');
    } else {
        console.log(`[${timestamp.toISOString()}] [${entry.origen}] [${entry.accion}] ${entry.mensaje}`);
    }

    try {
        const db = await connectDB();
        await db.collection('logs_aplicacion').insertOne(logData);
    } catch (error) {
        console.error('CRITICAL: Failed to write log to database', error);
    }
}
