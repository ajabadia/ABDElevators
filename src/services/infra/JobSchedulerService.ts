import { queueService, JobType } from '@/services/ops/queue-service';

/**
 * JobSchedulerService (Phase 255 Consolidated)
 * Bridge service to provide consolidated job statistics to the platform.
 */
export class JobSchedulerService {
    /**
     * Get all currently active or waiting jobs across all queues.
     * Used for SuperAdmin health monitoring.
     */
    static async getDueJobs(): Promise<any[]> {
        const jobTypes: JobType[] = ['PDF_ANALYSIS', 'REPORT_GENERATION', 'EMAIL_BATCH', 'MAINTENANCE_CLEANUP'];

        try {
            const allJobs = await Promise.all(
                jobTypes.map(type => queueService.listJobs(type, ['active', 'waiting', 'delayed'] as any))
            );

            return allJobs.flat();
        } catch (error) {
            console.error('Failed to fetch due jobs from QueueService:', error);
            return [];
        }
    }

    /**
     * Get failed jobs for health alerts.
     */
    static async getFailedJobs(): Promise<any[]> {
        const jobTypes: JobType[] = ['PDF_ANALYSIS', 'REPORT_GENERATION', 'EMAIL_BATCH', 'MAINTENANCE_CLEANUP'];

        try {
            const allFailed = await Promise.all(
                jobTypes.map(type => queueService.listJobs(type, ['failed'] as any))
            );

            return allFailed.flat();
        } catch (error) {
            console.error('Failed to fetch failed jobs from QueueService:', error);
            return [];
        }
    }
}
