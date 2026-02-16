import { z } from 'zod';

/**
 * 📝 Collaboration & Communication Schemas (Phase 82)
 */

export const CollaborationCommentSchema = z.object({
    _id: z.any().optional(),
    entityId: z.string(),
    tenantId: z.string(),
    userId: z.string(),
    userName: z.string(),
    userImage: z.string().optional(),
    content: z.string().min(1),
    parentId: z.string().optional(), // Para hilos de respuestas
    isResolved: z.boolean().default(false),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
});

export type CollaborationComment = z.infer<typeof CollaborationCommentSchema>;

export const CollaborationThreadSchema = z.object({
    _id: z.any().optional(),
    entityId: z.string(),
    tenantId: z.string(),
    title: z.string().optional(),
    comments: z.array(CollaborationCommentSchema).default([]),
    status: z.enum(['OPEN', 'RESOLVED']).default('OPEN'),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
});

export type CollaborationThread = z.infer<typeof CollaborationThreadSchema>;
