import { z } from 'zod';
import { EntityIdSchema as BaseEntityIdSchema, TenantIdSchema as BaseTenantIdSchema } from "@abd/platform-core";

/**
 * 🌊 ERA 12: RELATIONAL INTEGRITY
 * Redefining core schemas with branded types for strict identification.
 */
export const EntityIdSchema = BaseEntityIdSchema.brand<'EntityId'>();
export type EntityId = z.infer<typeof EntityIdSchema>;

export const TenantIdSchema = BaseTenantIdSchema.brand<'TenantId'>();
export type TenantId = z.infer<typeof TenantIdSchema>;

export const JobPayloadSchema = z.object({
    tenantId: TenantIdSchema,
    userId: EntityIdSchema,
    correlationId: z.string().uuid(),
    data: z.record(z.string(), z.any()),
});
export type JobPayload = z.infer<typeof JobPayloadSchema>;

/**
 * 🔍 ERA 12: ANALYSIS JOB PAYLOAD
 * Specific schema for technical analysis jobs.
 */
export const AnalysisJobPayloadSchema = JobPayloadSchema.extend({
    data: z.object({
        entityId: EntityIdSchema,
        fileBuffer: z.string().optional(),
        filename: z.string(),
        industry: z.string().optional(),
        fileMd5: z.string().optional(),
    })
});
export type AnalysisJobPayload = z.infer<typeof AnalysisJobPayloadSchema>;

export * from "@abd/platform-core";
