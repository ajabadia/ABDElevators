import { z } from 'zod';
import { EntityIdSchema, TenantIdSchema } from './common';

/**
 * 📝 Collaboration & Communication Schemas (Phase 82)
 */

export const CollaborationCommentSchema = z.object({
    _id: EntityIdSchema.optional(),
    entityId: EntityIdSchema,
    tenantId: TenantIdSchema,
    userId: EntityIdSchema,
    userName: z.string(),
    userImage: z.string().optional(),
    content: z.string().min(1),
    parentId: EntityIdSchema.optional(), // Para hilos de respuestas
    isResolved: z.boolean().default(false),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
});

export type CollaborationComment = z.infer<typeof CollaborationCommentSchema>;

export const CollaborationThreadSchema = z.object({
    _id: EntityIdSchema.optional(),
    entityId: EntityIdSchema,
    tenantId: TenantIdSchema,
    title: z.string().optional(),
    comments: z.array(CollaborationCommentSchema).default([]),
    status: z.enum(['OPEN', 'RESOLVED']).default('OPEN'),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
});

export type CollaborationThread = z.infer<typeof CollaborationThreadSchema>;
