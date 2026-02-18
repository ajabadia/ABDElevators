import { NextRequest, NextResponse } from 'next/server';
import { SelfHealingService } from '@/lib/self-healing-service';
import { logEvento } from '@/lib/logger';
import crypto from 'crypto';

/**
 * ⏰ Cron Job: Self-Healing Knowledge Assets (Phase 110)
 * Triggered periodically to audit and heal the knowledge base.
 * Security: CRON_SECRET header validation.
 */
export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const cronSecret = req.headers.get('x-cron-secret');

    // Security check - Allow local dev or secret header
    if (process.env.NODE_ENV === 'production' && cronSecret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await logEvento({
            level: 'INFO',
            source: 'CRON_SELF_HEALING',
            action: 'START',
            message: 'Starting scheduled self-healing audit',
            correlationId
        });

        const result = await SelfHealingService.auditExpiredAssets(correlationId);

        return NextResponse.json({
            success: true,
            processed: result.processed,
            updated: result.updated,
            correlationId
        });
    } catch (error: any) {
        await logEvento({
            level: 'ERROR',
            source: 'CRON_SELF_HEALING',
            action: 'FAILED',
            message: `Cron job failed: ${error.message}`,
            correlationId,
            details: { stack: error.stack }
        });

        return NextResponse.json({
            success: false,
            error: error.message,
            correlationId
        }, { status: 500 });
    }
}
