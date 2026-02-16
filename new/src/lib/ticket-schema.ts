
import { z } from "zod";

export const TicketStatus = ["OPEN", "IN_PROGRESS", "WAITING_USER", "RESOLVED", "CLOSED"] as const;
export const TicketPriority = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export const TicketCategory = ["TECHNICAL", "BILLING", "ACCESS", "FEATURE_REQUEST", "OTHER"] as const;

export const TicketSchema = z.object({
    tenantId: z.string().min(1, "Tenant ID es requerido"),
    subject: z.string().min(5, "El asunto debe tener al menos 5 caracteres").max(100),
    description: z.string().min(20, "Por favor, detalle más el problema (min 20 carácteres)"),
    priority: z.enum(TicketPriority).default("MEDIUM"),
    category: z.enum(TicketCategory).default("TECHNICAL"),
    status: z.enum(TicketStatus).default("OPEN"),
    assignedTo: z.string().optional(), // ID del técnico/admin
    createdBy: z.string(), // ID del usuario reportador
    userEmail: z.string().email(),

    // SLA Tracking
    createdAt: z.date(),
    updatedAt: z.date(),
    resolvedAt: z.date().optional(),

    // Public Conversation (Visible to User)
    messages: z.array(z.object({
        id: z.string(),
        author: z.string(), // "System" | "User" | "Support"
        authorName: z.string().optional(),
        content: z.string(),
        timestamp: z.date(),
        isInternal: z.boolean().default(false)
    })).default([]),

    // Internal Notes (Admins only)
    internalNotes: z.array(z.object({
        author: z.string(),
        content: z.string(),
        timestamp: z.date()
    })).optional(),
});

export type Ticket = z.infer<typeof TicketSchema> & { _id?: string, ticketNumber: string };

export const CreateTicketSchema = TicketSchema.pick({
    subject: true,
    description: true,
    category: true,
    priority: true,
});
