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
    durationMs?: number;     // Tiempo de ejecución para SLAs
}

/**
 * Interface para eventos de log estandarizados (Fase 130.3)
 */
export interface AppLogEvent extends LogEntry {
    source: 'INGESTSERVICE' | 'WORKFLOWENGINE' | 'AUTH' | 'API_CORE' | 'API_ADMIN' | 'LLM' | 'DB' | 'BILLING_SERVICE';
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'EXECUTE' | 'VALIDATE' | 'SLA_EXCEEDED' | 'ERROR';
}

import { createHash } from 'crypto';

/**
 * Registra un evento de forma estructurada en la base de datos (colección application_logs).
 * Sigue la Regla de Oro #4.
 * 
 * UPDATE: Usamos connectLogsDB() para soportar aislamiento futuro de logs.
 * UPDATE (Phase 35): Hashing automático de PII (Emails, IPs).
 */
export async function logEvento(entry: LogEntry): Promise<void> {
    const timestamp = new Date();

    // 🛡️ PII OBFUSCATION LOGIC
    // Hash sensitive fields (Email, IP) to preserve analytics without compromising privacy
    const safeEntry = { ...entry };

    if (safeEntry.userEmail) {
        // Guardamos el hash para búsquedas exactas (e.g. "buscar logs de este hash")
        const emailHash = createHash('sha256').update(safeEntry.userEmail.toLowerCase().trim()).digest('hex');
        (safeEntry as any).userEmailHash = emailHash;

        // Mask for readability: j***@gmail.com
        const [local, domain] = safeEntry.userEmail.split('@');
        safeEntry.userEmail = `${local.charAt(0)}***@${domain}`;
    }

    if (safeEntry.details && typeof safeEntry.details === 'object') {
        // Deep clone simple to avoid mutating original details reference if used elsewhere
        const safeDetails = { ...safeEntry.details };

        if (safeDetails.ip) {
            safeDetails.ipHash = createHash('sha256').update(safeDetails.ip).digest('hex');
            safeDetails.ip = '***.***.***.***'; // Redact
        }

        // Add more PII fields here if needed (phone, address, etc)
        safeEntry.details = safeDetails;
    }

    const logData = { ...safeEntry, timestamp };

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

/**
 * Helper para medir el tiempo de ejecución y validar SLAs (Fase 130.7)
 */
export async function withSla<T>(
    source: string,
    action: string,
    slaMs: number,
    correlationId: string,
    fn: () => Promise<T>,
    additionalDetails?: any
): Promise<T> {
    const start = Date.now();
    try {
        return await fn();
    } finally {
        const duration = Date.now() - start;
        if (duration > slaMs) {
            await logEvento({
                level: 'WARN',
                source,
                action: 'SLA_EXCEEDED',
                message: `SLA exceeded: ${duration}ms (target: ${slaMs}ms)`,
                correlationId,
                durationMs: duration,
                details: { ...additionalDetails, slaThreshold: slaMs }
            });
        }
    }
}
