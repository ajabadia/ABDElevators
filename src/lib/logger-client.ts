"use client";

/**
 * ⚡ Client-Safe Logger
 * Sends logs to the server via API to avoid bundling DB/Node dependencies.
 */
export async function logEventoClient(event: any) {
    if (typeof window === 'undefined') return;

    try {
        await fetch('/api/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event),
            // Use keepalive to ensure the log is sent even if the page is closing
            keepalive: true,
        });
    } catch (error) {
        // Silent fail in client to avoid infinite loops or intrusive errors
        console.warn('Logging failed:', error);
    }
}

// Alias for components using the legacy or alternative naming convention
export const logClientEvent = logEventoClient;
