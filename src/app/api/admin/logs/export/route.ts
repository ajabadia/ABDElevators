import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { connectLogsDB } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import crypto from 'crypto';
import { UserRole } from '@/types/roles';

/**
 * GET /api/admin/logs/export
 * Exporta logs masivamente para auditoría (CSV) (Phase 70 compliance).
 */
export async function GET(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    try {
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

        const { searchParams } = new URL(req.url);
        const nivel = searchParams.get('nivel');
        const search = searchParams.get('search');
        const tenantId = session.user.role === UserRole.SUPER_ADMIN
            ? searchParams.get('tenantId')
            : session.user.tenantId;

        const db = await connectLogsDB();
        const collection = db.collection('logs_aplicacion');

        // Construir Query
        const query: any = {};
        if (tenantId) query.tenantId = tenantId;
        if (nivel && nivel !== 'ALL') query.nivel = nivel;
        if (search) {
            query.$or = [
                { message: { $regex: search, $options: 'i' } },
                { action: { $regex: search, $options: 'i' } },
                { correlationId: { $regex: search, $options: 'i' } }
            ];
        }

        const logs = await collection
            .find(query)
            .sort({ timestamp: -1 })
            .limit(5000)
            .toArray();

        // Convertir a CSV
        const header = ['Timestamp', 'Nivel', 'Origen', 'Accion', 'Mensaje', 'TenantID', 'CorrelacionID', 'Stack'];
        const csvRows = [header.join(',')];

        for (const log of logs) {
            const row = [
                new Date(log.timestamp).toISOString(),
                log.nivel,
                log.origen,
                log.accion,
                `"${(log.mensaje || '').replace(/"/g, '""')}"`, // Escape quotes
                log.tenantId || '',
                log.correlacion_id || '',
                `"${(log.stack || '').replace(/"/g, '""').replace(/\n/g, ' ')}"` // Escape quotes & newlines
            ];
            csvRows.push(row.join(','));
        }

        const csvString = csvRows.join('\n');
        const filename = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;

        return new NextResponse(csvString, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });

    } catch (error) {
        return handleApiError(error, 'API_LOGS_EXPORT', correlacion_id);
    }
}
