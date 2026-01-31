/**
 * Client-side logger utility.
 * Used by "use client" components to log events without importing server-side MongoDB logic.
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface ClientLogEntry {
    level: LogLevel;
    source: string;
    action: string;
    message: string;
    correlationId?: string;
    details?: Record<string, unknown>;
    stack?: string;
}

export async function logClientEvent(entry: ClientLogEntry): Promise<void> {
    // Console output for immediate developer feedback
    if (entry.level === 'ERROR') {
        console.error(`[CLIENT] [${entry.source}] [${entry.action}] ${entry.message}`, entry.details || '');
    } else {
        console.log(`[CLIENT] [${entry.source}] [${entry.action}] ${entry.message}`);
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
                correlationId: entry.correlationId || crypto.randomUUID()
            }),
        });
    } catch (error) {
        // Fail silently on the client to avoid breaking the UI
        console.error('Failed to send log to server:', error);
    }
}
