import { connectLogsDB } from './db';
import { createHash } from 'crypto';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
    level: LogLevel;
    source: string;
    action: string;
    message: string;
    correlationId: string;
    tenantId?: string;
    userId?: string;
    userEmail?: string;
    details?: any;
    stack?: string;
    timestamp?: Date;
    durationMs?: number;
}

export async function logEvento(entry: LogEntry): Promise<void> {
    const timestamp = new Date();
    const safeEntry = { ...entry };

    if (safeEntry.userEmail) {
        const emailHash = createHash('sha256').update(safeEntry.userEmail.toLowerCase().trim()).digest('hex');
        (safeEntry as any).userEmailHash = emailHash;
        const [local, domain] = safeEntry.userEmail.split('@');
        safeEntry.userEmail = `${local.charAt(0)}***@${domain}`;
    }

    if (safeEntry.details && typeof safeEntry.details === 'object') {
        const safeDetails = { ...safeEntry.details };
        if (safeDetails.ip) {
            safeDetails.ipHash = createHash('sha256').update(safeDetails.ip).digest('hex');
            safeDetails.ip = '***.***.***.***';
        }
        safeEntry.details = safeDetails;
    }

    const logData = { ...safeEntry, timestamp };

    if (entry.level === 'ERROR') {
        console.error(`[${timestamp.toISOString()}] [${entry.source}] [${entry.action}] ${entry.message}`, entry.details || '', entry.stack || '');
        if (entry.stack) console.error(entry.stack);
    } else {
        console.log(`[${timestamp.toISOString()}] [${entry.source}] [${entry.action}] ${entry.message}`);
    }

    try {
        const db = await connectLogsDB();
        await db.collection('application_logs').insertOne(logData);
    } catch (error) {
        console.error('CRITICAL: Failed to write log to database.', error);
    }
}

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
