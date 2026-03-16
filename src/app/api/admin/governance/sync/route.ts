import { NextResponse } from 'next/server';
import { PromptSyncService } from '@/services/llm/PromptSyncService';
import { connectDB } from '@/lib/db';
import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';

/**
 * API Route: Sincronización de Prompts (Era 17)
 * POST /api/admin/governance/sync
 */
export async function POST(req: Request) {
    const correlationId = req.headers.get('x-correlation-id') || `sync-api-${Date.now()}`;
    const start = Date.now();

    try {
        // 1. Verificación de Security Token
        const authHeader = req.headers.get('Authorization');
        const syncSecret = process.env.GOVERNANCE_SYNC_SECRET;

        if (!syncSecret || authHeader !== `Bearer ${syncSecret}`) {
            await logEvento({
                level: 'WARN',
                source: 'API_GOVERNANCE',
                action: 'UNAUTHORIZED_SYNC_ATTEMPT',
                message: 'Intento de sincronización no autorizado',
                correlationId
            });
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        // 2. Ejecutar Sincronización
        const result = await PromptSyncService.syncAll('abd_global');

        const duration = Date.now() - start;

        await logEvento({
            level: result.errors > 0 ? 'WARN' : 'INFO',
            source: 'API_GOVERNANCE',
            action: 'SYNC_PROMPTS',
            message: `Sincronización via API completada en ${duration}ms`,
            correlationId,
            details: { ...result, duration_ms: duration }
        });

        return NextResponse.json({
            success: true,
            ...result,
            duration_ms: duration
        });

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[API_GOVERNANCE_SYNC] Error:', error);

        await logEvento({
            level: 'ERROR',
            source: 'API_GOVERNANCE',
            action: 'SYNC_PROMPTS_FAILURE',
            message: `Fallo en sincronización via API: ${message}`,
            correlationId
        });

        if (error instanceof AppError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }

        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
