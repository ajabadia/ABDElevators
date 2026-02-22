import { z } from 'zod';

/**
 * ⚡ FASE 200: Base Workflow Schemas (Circular Dependency Isolation)
 * 
 * Este archivo contiene los esquemas base de workflow que son requeridos 
 * por las entidades de negocio (business.ts) para evitar ciclos de importación.
 */

export const WorkflowLogSchema = z.object({
    from: z.string(),
    to: z.string(),
    role: z.string(),
    comment: z.string().optional(),
    signature: z.string().optional(),
    correlationId: z.string().optional(),
    timestamp: z.date().default(() => new Date()),
});

export type WorkflowLog = z.infer<typeof WorkflowLogSchema>;
