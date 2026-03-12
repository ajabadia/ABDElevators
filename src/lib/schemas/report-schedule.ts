import { z } from 'zod';
// import { ObjectId } from 'mongodb'; // ⚠️ FASE 182: Leaks to client bundles
import { ReportTemplateTypeSchema } from './report-template';
import { TenantIdSchema, EntityIdSchema } from './core';

/**
 * Report Schedule Schema (Phase 160.2)
 * Defines a recurring schedule for report generation and delivery.
 */
export const ReportScheduleSchema = z.object({
    _id: z.any().optional(),
    tenantId: TenantIdSchema,
    createdBy: EntityIdSchema, // User ID
    name: z.string().min(3, 'Name must be at least 3 characters'),
    templateType: ReportTemplateTypeSchema,

    // Cron expression (e.g., '0 8 * * 1' for Monday 8am)
    // We validate basic structure, service will use cron-parser for deep validation
    cronExpression: z.string().regex(/^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/, 'Invalid cron expression format'),

    recipients: z.array(z.string().email('Invalid email')).min(1, 'At least one recipient is required'),

    enabled: z.boolean().default(true),

    locale: z.string().default('es'),

    // Optional overrides for the template data
    dataFilters: z.record(z.string(), z.any()).optional(),

    // Machine-controlled fields
    lastRunAt: z.date().optional(),
    nextRunAt: z.date().optional(), // Calculated on save

    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date())
});

export type ReportSchedule = z.infer<typeof ReportScheduleSchema>;

export const CreateReportScheduleSchema = ReportScheduleSchema.omit({
    _id: true,
    tenantId: true,
    createdBy: true,
    lastRunAt: true,
    nextRunAt: true,
    createdAt: true,
    updatedAt: true
});

export const UpdateReportScheduleSchema = CreateReportScheduleSchema.partial();
