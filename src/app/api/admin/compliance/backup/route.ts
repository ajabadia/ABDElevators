import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextResponse, NextRequest } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { BackupService } from '@/services/ops/backup-service';
import { handleApiError, AppError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/admin/compliance/backup
 * Crea y descarga paquete de conocimiento (Phase 70 compliance)
 */
async function GET_internal (req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_COMPLIANCE_BACKUP', action: 'CREATE_BACKUP' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('compliance', 'manage');
                const tenantId = session.user.tenantId;

                if (!tenantId) {
                    throw new AppError('VALIDATION_ERROR', 400, 'No tenant ID found in session');
                }

                const zipBuffer = await BackupService.createKnowledgePackage(tenantId);
                const uint8Array = new Uint8Array(zipBuffer);

                await log({
                    message: `Security backup created for tenant ${tenantId}`,
                    details: { tenantId, size: zipBuffer.byteLength }
                });

                // Return as download
                return new NextResponse(uint8Array, {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/zip',
                        'Content-Disposition': `attachment; filename="knowledge_backup_${tenantId}_${Date.now()}.zip"`
                    }
                });

            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_COMPLIANCE_BACKUP', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/compliance/backup', thresholdMs: 1000 });
