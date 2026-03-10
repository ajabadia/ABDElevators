import { z } from 'zod';
import { IndustryTypeSchema } from './core';
import { EntityIdSchema, TenantIdSchema, TenantScopedSchema } from './common';

/**
 * 🌌 SPACE SCHEMA (Phase 125.2)
 * Handles hierarchical organization of knowledge assets.
 */
export const SpaceTypeSchema = z.enum(['GLOBAL', 'INDUSTRY', 'TENANT', 'TEAM', 'PERSONAL']);
export type SpaceType = z.infer<typeof SpaceTypeSchema>;

export const SpaceVisibilitySchema = z.enum(['PUBLIC', 'INTERNAL', 'PRIVATE', 'RESTRICTED']);
export type SpaceVisibility = z.infer<typeof SpaceVisibilitySchema>;

export const SpaceSchema = TenantScopedSchema.extend({
    _id: EntityIdSchema.optional(),
    name: z.string().min(1, 'El nombre es obligatorio'),
    slug: z.string().min(1, 'El slug es obligatorio'),
    description: z.string().optional(),

    type: SpaceTypeSchema.default('TENANT'),

    // Ownership & Segregation (tenantId is in TenantScopedSchema)
    industry: IndustryTypeSchema.optional(), // Obligatorio para INDUSTRY
    ownerUserId: EntityIdSchema.optional(), // Obligatorio para PERSONAL
    collaborators: z.array(z.object({
        userId: EntityIdSchema,
        role: z.enum(['VIEWER', 'EDITOR', 'ADMIN']).default('VIEWER'),
        joinedAt: z.date().default(() => new Date()),
    })).default([]),

    // Hierarchy (Materialized Path)
    parentSpaceId: EntityIdSchema.optional(),
    materializedPath: z.string().optional(), // e.g., "/global/legal"

    visibility: SpaceVisibilitySchema.default('INTERNAL'),

    // Monetization & Quotas
    monetized: z.boolean().default(false),
    subscriptionRequired: z.string().optional(), // Slug del plan (e.g., 'GOLD')

    config: z.object({
        icon: z.string().optional(),
        color: z.string().optional(),
        isDefault: z.boolean().default(false),
        allowQuickQA: z.boolean().default(true)
    }).optional().default({
        isDefault: false,
        allowQuickQA: true
    }),

    isActive: z.boolean().default(true),
});

export type Space = z.infer<typeof SpaceSchema>;

export const SpaceInvitationSchema = z.object({
    _id: EntityIdSchema.optional(),
    spaceId: EntityIdSchema, // ID of the space to join
    email: z.string().email(),
    token: z.string(), // Unique secret token
    invitedBy: EntityIdSchema, // User ID
    status: z.enum(['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED']).default('PENDING'),
    role: z.enum(['VIEWER', 'EDITOR', 'ADMIN']).default('VIEWER'),
    expiresAt: z.date(),
    tenantId: TenantIdSchema, // Owner tenant
    createdAt: z.date().default(() => new Date()),
});

export type SpaceInvitation = z.infer<typeof SpaceInvitationSchema>;
