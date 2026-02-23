import { z } from 'zod';

/**
 * 📊 Event Schema (Application Logs)
 * Standardized structure for mechanical/technical logging across the platform.
 */

export const LogLevel = ['DEBUG', 'INFO', 'WARN', 'ERROR'] as const;

export const EventSchema = z.object({
    _id: z.any().optional(),
    level: z.enum(LogLevel),
    source: z.string().min(1),      // e.g. "API_TICKETS", "INGEST_WORKER"
    action: z.string().min(1),      // e.g. "CREATE", "SCAN", "FAILURE"
    message: z.string().min(1),
    correlationId: z.string(),      // UUID or TicketNumber

    tenantId: z.string().optional(),
    userId: z.string().optional(),
    userEmail: z.string().optional(),

    details: z.any().optional(),
    stack: z.string().optional(),
    durationMs: z.number().optional(), // For performance logging
    tokenUsage: z.object({
        input: z.number(),
        output: z.number(),
        total: z.number(),
    }).optional(),

    timestamp: z.date().default(() => new Date()),
});

export type AppEvent = z.infer<typeof EventSchema>;
