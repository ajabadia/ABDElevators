import { NextResponse, NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth';
import { BackupService } from '@/services/ops/backup-service';
import { UserRole } from '@/types/roles';

/**
 * GET /api/admin/compliance/backup
 * Crea y descarga paquete de conocimiento (Phase 70 compliance)
 */
export async function GET(req: NextRequest) {
    try {
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
        const tenantId = session.user.tenantId;

        if (!tenantId) {
            return NextResponse.json({ error: 'No tenant ID' }, { status: 400 });
        }

        const zipBuffer = await BackupService.createKnowledgePackage(tenantId);
        const uint8Array = new Uint8Array(zipBuffer);

        // Return as download
        return new NextResponse(uint8Array, {
            status: 200,
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="knowledge_backup_${tenantId}_${Date.now()}.zip"`
            }
        });

    } catch (error) {
        console.error('Backup Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
