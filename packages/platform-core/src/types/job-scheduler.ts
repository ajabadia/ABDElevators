import { z } from 'zod';
// Decoupled from mongodb to prevent client bundle leaks (Phase 184 Fix)

/**
 * Platform Job Types
 */
export const JOB_TYPES = [
    'REPORT_GENERATION',
    'RAG_REINDEX',
    'DATA_CLEANUP',
    'AUDIT_AUTO_HEAL',
    'TENANT_BILLING_SYNC',
    'CUSTOM_WEBHOOK'
] as const;

export type JobType = typeof JOB_TYPES[number];

/**
 * Zod Schema for Platform Jobs
 */
export const JobScheduleSchema = z.object({
    _id: z.any().optional(), // ObjectId serialized as string on client, object on server
    tenantId: z.string(),
    createdBy: z.string(),
    name: z.string().min(3),
    jobType: z.enum(JOB_TYPES),

    // Cron expression for recurring execution
    cronExpression: z.string(),

    // Job-specific configuration
    payload: z.record(z.string(), z.any()).optional(),

    enabled: z.boolean().default(true),

    // Traceability & Observability
    lastRunAt: z.date().optional(),
    nextRunAt: z.date().optional(),
    lastStatus: z.enum(['SUCCESS', 'FAILED', 'PENDING']).optional(),
    lastError: z.string().optional(),

    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date())
});

export type JobSchedule = z.infer<typeof JobScheduleSchema>;

export const CreateJobScheduleSchema = JobScheduleSchema.omit({
    _id: true,
    tenantId: true,
    createdBy: true,
    lastRunAt: true,
    nextRunAt: true,
    lastStatus: true,
    lastError: true,
    createdAt: true,
    updatedAt: true
});
