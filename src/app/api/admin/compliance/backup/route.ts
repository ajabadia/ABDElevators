
import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { BackupService } from '@/lib/services/backup-compliance-service';
import { AppError } from '@/lib/errors';

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        // Strict Role Check - Only Admin/SuperAdmin
        if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const tenantId = (session.user as any).tenantId;
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
