import { z } from 'zod';

export const IndustryTypeSchema = z.enum([
    'ELEVATORS',
    'LEGAL',
    'BANKING',
    'INSURANCE',
    'FINANCE',
    'RETAIL',
    'MANUFACTURING',
    'ENERGY',
    'HEALTHCARE',
    'GOVERNMENT',
    'EDUCATION',
    'REAL_ESTATE',
    'IT',
    'MEDICAL',
    'GENERIC'
]);

export type IndustryType = z.infer<typeof IndustryTypeSchema>;

export const AppEnvironmentEnum = z.enum([
    'DEVELOPMENT',
    'STAGING',
    'PRODUCTION',
    'SANDBOX'
]);

export type AppEnvironment = z.infer<typeof AppEnvironmentEnum>;

/**
 * 🆔 OBJECTID SCHEMA
 * Strict validation for MongoDB ObjectIDs.
 */
export const ObjectIdSchema = z.string()
    .length(24, "ID must be exactly 24 characters")
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

/**
 * 📦 ENTITY ID SCHEMA (Generic & Branded)
 * Use .brand<"EntityId">() to distinguish IDs from regular strings.
 */
export const EntityIdSchema = ObjectIdSchema.brand<"EntityId">();
export type EntityId = z.infer<typeof EntityIdSchema>;

/**
 * 🏢 TENANT ID SCHEMA
 */
export const TenantIdSchema = ObjectIdSchema.brand<"TenantId">();
export type TenantId = z.infer<typeof TenantIdSchema>;

/**
 * 🕒 METADATA SCHEMAS
 */
export const DateSchema = z.union([z.date(), z.string().datetime()]).nullish();

export const AuditMetadataSchema = z.object({
    createdAt: DateSchema,
    updatedAt: DateSchema,
    createdBy: EntityIdSchema.nullish(),
    updatedBy: EntityIdSchema.nullish(),
});

/**
 * 🔒 TENANT SCOPED SCHEMA
 * Base schema for every multi-tenant entity.
 */
export const TenantScopedSchema = AuditMetadataSchema.extend({
    tenantId: TenantIdSchema,
    isDeleted: z.boolean().default(false),
    deletedAt: DateSchema,
});

export type TenantScoped = z.infer<typeof TenantScopedSchema>;
