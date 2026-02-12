import { z } from 'zod';

/**
 * 📚 User Collections (Notebooks) Schema
 * Scoped by Tenant and User for personal organization.
 */
export const UserCollectionSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    ownerUserId: z.string(),
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    assetIds: z.array(z.string()).default([]), // References to KnowledgeAssets
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
    deletedAt: z.date().optional(),
});

export type UserCollection = z.infer<typeof UserCollectionSchema>;

export const CreateCollectionSchema = UserCollectionSchema.omit({
    _id: true,
    tenantId: true,
    ownerUserId: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true
});
