import { connectLogsDB } from '@/lib/db';

export class SystemHealthService {
    /**
     * Reporte de Salud del Sistema (Snapshot)
     */
    static async getSystemHealth() {
        const db = await connectLogsDB();
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);

        const recentErrors = await db.collection('application_logs').countDocuments({
            level: 'ERROR',
            timestamp: { $gte: oneHourAgo }
        });

        const recentSLA = await db.collection('application_logs').countDocuments({
            action: 'SLA_VIOLATION',
            timestamp: { $gte: oneHourAgo }
        });

        return {
            status: recentErrors > 50 ? 'CRITICAL' : recentErrors > 10 ? 'WARNING' : 'HEALTHY',
            metrics: {
                errors_last_hour: recentErrors,
                sla_violations_last_hour: recentSLA
            }
        };
    }
}
