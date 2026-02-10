import { z } from 'zod';

/**
 * 🎫 FASE 20: Enterprise Ticketing System Schemas
 */

export const TicketPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const TicketCategorySchema = z.enum(['TECHNICAL', 'BILLING', 'SECURITY', 'FEATURE_REQUEST', 'OTHER']);
export const TicketStatusSchema = z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_USER', 'ESCALATED', 'RESOLVED', 'CLOSED']);

export const TicketSchema = z.object({
    _id: z.any().optional(),
    ticketNumber: z.string(), // TKT-2026-XXXXX
    tenantId: z.string(),
    createdBy: z.string(), // User ID
    assignedTo: z.string().optional(), // Admin ID
    subject: z.string().min(5),
    description: z.string().min(20),
    priority: TicketPrioritySchema.default('MEDIUM'),
    category: TicketCategorySchema.default('TECHNICAL'),
    status: TicketStatusSchema.default('OPEN'),

    // SLA Management
    sla: z.object({
        responseTimeTarget: z.date().optional(),
        resolutionTimeTarget: z.date().optional(),
        breached: z.boolean().default(false),
    }).optional(),

    escalationHistory: z.array(z.object({
        from: z.string(),
        to: z.string(),
        reason: z.string(),
        timestamp: z.date(),
    })).default([]),

    attachments: z.array(z.object({
        url: z.string(),
        cloudinaryId: z.string(),
        filename: z.string(),
    })).default([]),

    tags: z.array(z.string()).default([]),

    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
    resolvedAt: z.date().optional(),
    closedAt: z.date().optional(),
});
export type Ticket = z.infer<typeof TicketSchema>;
export type TicketPriority = z.infer<typeof TicketPrioritySchema>;
export type TicketCategory = z.infer<typeof TicketCategorySchema>;
export type TicketStatus = z.infer<typeof TicketStatusSchema>;
