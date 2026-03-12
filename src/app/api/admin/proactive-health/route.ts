import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { UserRole } from '@/types/roles';
import { ProactiveAlertService } from '@/services/observability/ProactiveAlertService';

/**
 * 🛰️ API Proactive Health Check
 * Era 15: Returns current system alerts based on P95 and security anomalies.
 */
export async function GET() {
    try {
        await requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]);
        
        const alerts = await ProactiveAlertService.checkSystemHealth();
        
        // 📧 Phase 440.2: Trigger email for critical anomalies
        if (alerts.some(a => a.severity === 'CRITICAL')) {
            await ProactiveAlertService.notifyCriticalAlerts(alerts);
        }

        return NextResponse.json({ 
            success: true, 
            timestamp: new Date().toISOString(),
            alerts 
        });
    } catch (error) {
        return NextResponse.json({ error: 'Unauthorized or Internal Error' }, { status: 500 });
    }
}
