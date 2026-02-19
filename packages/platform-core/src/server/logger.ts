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

const SENSITIVE_KEYS = [
    'password', 'token', 'secret', 'key', 'apiKey', 'api_key',
    'auth', 'authorization', 'credential', 'cookie', 'sessionId'
];

function sanitizeObject(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sanitizeObject);

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
        if (SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
            sanitized[key] = '[REDACTED]';
        } else if (typeof value === 'object') {
            sanitized[key] = sanitizeObject(value);
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
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

    if (safeEntry.details) {
        safeEntry.details = sanitizeObject(safeEntry.details);

        if (safeEntry.details.ip) {
            safeEntry.details.ipHash = createHash('sha256').update(safeEntry.details.ip).digest('hex');
            safeEntry.details.ip = '***.***.***.***';
        }
    }

    const logData = { ...safeEntry, timestamp };

    if (entry.level === 'ERROR') {
        console.error(`[${timestamp.toISOString()}] [${entry.source}] [${entry.action}] ${entry.message}`, entry.details || '', entry.stack || '');
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
