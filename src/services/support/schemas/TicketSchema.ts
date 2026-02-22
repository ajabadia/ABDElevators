import { z } from "zod";

/**
 * 🎫 Unified Ticket Schema
 * Combines legacy support-ticket needs with modern enterprise ticketing.
 */

export const TicketStatus = ["OPEN", "IN_PROGRESS", "WAITING_USER", "ESCALATED", "RESOLVED", "CLOSED"] as const;
export const TicketPriority = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export const TicketCategory = ["TECHNICAL", "BILLING", "SECURITY", "ACCESS", "FEATURE_REQUEST", "OTHER"] as const;

export const TicketMessageSchema = z.object({
    id: z.string(),
    author: z.enum(["User", "Support", "System"]),
    authorName: z.string().optional(),
    content: z.string().min(1),
    timestamp: z.date(),
    isInternal: z.boolean().default(false)
});

export const TicketSchema = z.object({
    _id: z.any().optional(),
    ticketNumber: z.string(), // TKT-2026-XXXXX
    tenantId: z.string().min(1),
    subject: z.string().min(5).max(120),
    description: z.string().min(20),
    priority: z.enum(TicketPriority).default("MEDIUM"),
    category: z.enum(TicketCategory).default("TECHNICAL"),
    status: z.enum(TicketStatus).default("OPEN"),

    assignedTo: z.string().optional(), // Admin/Support ID
    createdBy: z.string(), // User ID
    userEmail: z.string().email(),

    // SLA & Tracking
    createdAt: z.date(),
    updatedAt: z.date(),
    resolvedAt: z.date().optional(),
    closedAt: z.date().optional(),

    sla: z.object({
        responseTimeTarget: z.date().optional(),
        resolutionTimeTarget: z.date().optional(),
        breached: z.boolean().default(false),
    }).optional(),

    // Conversation
    messages: z.array(TicketMessageSchema).default([]),

    // Internal Log/Notes
    internalNotes: z.array(z.object({
        id: z.string(),
        author: z.string(),
        content: z.string(),
        timestamp: z.date()
    })).default([]),

    attachments: z.array(z.object({
        url: z.string(),
        cloudinaryId: z.string(),
        filename: z.string(),
    })).default([]),

    tags: z.array(z.string()).default([]),
});

export type Ticket = z.infer<typeof TicketSchema>;
export type TicketMessage = z.infer<typeof TicketMessageSchema>;

export const CreateTicketSchema = TicketSchema.pick({
    subject: true,
    description: true,
    category: true,
    priority: true,
});
