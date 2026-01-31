
import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { ComplianceService } from '@/lib/services/backup-compliance-service';
import { AppError } from '@/lib/errors';

// POST implies "Generate and Download Certificate"
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        // Strict Role Check - Only Admin/SuperAdmin
        if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const tenantId = (session.user as any).tenantId;
        const body = await req.json();
        const reason = body.reason || "GDPR User Request";

        const pdfBuffer = await ComplianceService.generateDeletionCertificate(
            tenantId,
            session.user.email || 'unknown',
            reason
        );
        const uint8Array = new Uint8Array(pdfBuffer);

        // Return as download
        return new NextResponse(uint8Array, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="data_destruction_certificate_${tenantId}.pdf"`
            }
        });

    } catch (error) {
        console.error('Compliance Cert Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
