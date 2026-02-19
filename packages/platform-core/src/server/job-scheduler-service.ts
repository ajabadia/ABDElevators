import { Document, ObjectId } from 'mongodb';
import cronParser from 'cron-parser';
import { getTenantCollection, TenantSession } from './db-tenant';
import { logEvento } from './logger';
import {
    JobSchedule,
    JobType,
    CreateJobScheduleSchema
} from '../types/job-scheduler';
import { AppError } from '../errors';

/**
 * JobSchedulerService
 * Universal "Cron-as-a-Service" for the ABD RAG Platform.
 */
export class JobSchedulerService {

    /**
     * Create a new job schedule.
     */
    static async createJob(session: TenantSession, data: any): Promise<string> {
        const validated = CreateJobScheduleSchema.parse(data);

        // 1. Validate Cron Expression
        try {
            (cronParser as any).parseExpression(validated.cronExpression);
        } catch (err) {
            throw new AppError('VALIDATION_ERROR', 400, 'Invalid cron expression');
        }

        const collection = await getTenantCollection<Document>('platform_jobs', session, 'LOGS');

        // 2. Calculate Next Run
        const interval = (cronParser as any).parseExpression(validated.cronExpression);
        const nextRunAt = interval.next().toDate();

        const job: JobSchedule = {
            ...validated,
            tenantId: session.user?.tenantId || 'platform_master',
            createdBy: session.user?.id || 'system',
            nextRunAt,
            createdAt: new Date(),
            updatedAt: new Date(),
            enabled: true
        };

        const result = await collection.insertOne(job as any);

        await logEvento({
            level: 'INFO',
            source: 'JOB_SCHEDULER',
            action: 'JOB_CREATED',
            message: `New job created: ${validated.name} (${validated.jobType})`,
            tenantId: session.user?.tenantId,
            correlationId: `job-create-${Date.now()}`,
            details: { jobId: result.insertedId.toString(), jobType: validated.jobType }
        });

        return result.insertedId.toString();
    }

    /**
     * Find all jobs due for execution.
     * SYSTEM-LEVEL: Bypasses tenant isolation to find all due jobs across the platform.
     */
    static async getDueJobs(): Promise<JobSchedule[]> {
        const { getMongoClient } = await import('./db');
        const client = await getMongoClient();
        const db = client.db(process.env.MONGODB_LOGS_URI ? 'ABDElevators-Logs' : 'ABDElevators');
        const collection = db.collection<JobSchedule>('platform_jobs');

        const now = new Date();
        return collection.find({
            enabled: true,
            nextRunAt: { $lte: now }
        }).toArray();
    }

    /**
     * Mark a job as COMPLETED and calculate next run.
     */
    static async markCompleted(jobId: string, status: 'SUCCESS' | 'FAILED', error?: string): Promise<void> {
        const { getMongoClient } = await import('./db');
        const client = await getMongoClient();
        const db = client.db(process.env.MONGODB_LOGS_URI ? 'ABDElevators-Logs' : 'ABDElevators');
        const collection = db.collection<JobSchedule>('platform_jobs');

        const job = await collection.findOne({ _id: new ObjectId(jobId) });
        if (!job) return;

        const interval = (cronParser as any).parseExpression(job.cronExpression);
        const nextRunAt = interval.next().toDate();

        await collection.updateOne(
            { _id: new ObjectId(jobId) },
            {
                $set: {
                    lastRunAt: new Date(),
                    nextRunAt,
                    lastStatus: status,
                    lastError: error,
                    updatedAt: new Date()
                }
            }
        );
    }

    /**
     * Helper to get all jobs for a tenant.
     */
    static async listTenantJobs(session: TenantSession, type?: JobType): Promise<JobSchedule[]> {
        const collection = await getTenantCollection<JobSchedule>('platform_jobs', session, 'LOGS');
        const filter: any = {};
        if (type) filter.jobType = type;

        return collection.find(filter);
    }
}
