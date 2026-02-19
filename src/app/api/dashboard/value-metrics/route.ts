import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTenantCollection } from '@/lib/db';
import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';
import { UserRole } from '@/types/roles';

/**
 * API Route: GET /api/dashboard/value-metrics
 * Calculates business-oriented metrics for the dashboard.
 * FASE 195.1
 */
export async function GET(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'Debes estar autenticado');
        }

        // Get collections
        const pedidosCollection = await getTenantCollection('pedidos', {
            tenantId: session.user.tenantId,
            role: session.user.role
        } as any);

        const feedbackCollection = await getTenantCollection('rag_feedback', {
            tenantId: session.user.tenantId,
            role: session.user.role
        } as any);

        // 1. Calculate total documents/orders analyzed
        const totalAnalyzed = await pedidosCollection.countDocuments({});

        // 2. Estimate time saved (30 mins per order)
        const totalMinutesSaved = totalAnalyzed * 30;
        const hoursSaved = Math.round(totalMinutesSaved / 60);

        // 3. Calculate high-confidence ratio (placeholder logic for now, using feedback aggregates)
        const positiveFeedback = await feedbackCollection.countDocuments({ type: 'thumbs_up' });
        const totalFeedback = await feedbackCollection.countDocuments({});

        // Default confidence if no feedback yet
        let trustRatio = 85;
        if (totalFeedback > 0) {
            trustRatio = Math.round((positiveFeedback / totalFeedback) * 100);
        }

        // 4. Attention items (simulated counts for now)
        const attentionItems = [];

        // Check for pending items (e.g., status: 'PENDING')
        const pendingDocs = await pedidosCollection.countDocuments({ status: { $in: ['PENDING', 'UPLOADING'] } });
        if (pendingDocs > 0) {
            attentionItems.push({
                id: 'pending_docs',
                label: `${pendingDocs} documentos sin indexar`,
                estimate: '~2min',
                href: '/admin/knowledge/ingest'
            });
        }

        const response = {
            success: true,
            metrics: {
                analyzed: totalAnalyzed,
                timeSavedHours: hoursSaved,
                trustRatio: `${trustRatio}%`,
                weeklyGrowth: '+12%', // Simulated
            },
            attentionItems
        };

        const duration = Date.now() - start;
        if (duration > 300) {
            await logEvento({
                level: 'WARN',
                source: 'API_DASHBOARD',
                action: 'PERFORMANCE_SLA_VIOLATION',
                correlationId,
                message: `Value metrics calculation took ${duration}ms`,
                details: { duration_ms: duration },
            });
        }

        return NextResponse.json(response);
    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        console.error(`[API_DASHBOARD] Error:`, error);
        return NextResponse.json({
            code: 'INTERNAL_ERROR',
            message: 'Error al calcular métricas de valor',
        }, { status: 500 });
    }
}
