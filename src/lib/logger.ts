import { connectDB, connectLogsDB } from '@/lib/db';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
    level: LogLevel;
    source: string;
    action: string;
    message: string;
    correlationId: string;
    tenantId?: string;       // Contexto Multi-tenant
    userId?: string;         // Identificador de Usuario (Audit)
    userEmail?: string;      // Email para facilitar búsqueda humana
    details?: any;
    stack?: string;
    timestamp?: Date;
}

/**
 * Registra un evento de forma estructurada en la base de datos (colección application_logs).
 * Sigue la Regla de Oro #4.
 * 
 * UPDATE: Usamos connectLogsDB() para soportar aislamiento futuro de logs.
 */
export async function logEvento(entry: LogEntry): Promise<void> {
    const timestamp = new Date();
    const logData = { ...entry, timestamp };

    // Always log to console for development visibility
    if (entry.level === 'ERROR') {
        console.error(`[${timestamp.toISOString()}] [${entry.source}] [${entry.action}] ${entry.message}`, entry.details || '', entry.stack || '');
        // También logueamos la traza completa si existe
        if (entry.stack) {
            console.error(entry.stack);
        }
    } else {
        console.log(`[${timestamp.toISOString()}] [${entry.source}] [${entry.action}] ${entry.message}`);
    }

    try {
        // Usamos la conexión específica de Logs (puede ser la misma que Main o separada)
        const db = await connectLogsDB();
        await db.collection('application_logs').insertOne(logData);
    } catch (error) {
        // Fallback crítico: Si falla la DB de logs, intentar escribir en stderr para que al menos quede en Vercel Logs
        console.error('CRITICAL: Failed to write log to database. Entry was:', JSON.stringify(logData));
        console.error('DB Error:', error);
    }
}
