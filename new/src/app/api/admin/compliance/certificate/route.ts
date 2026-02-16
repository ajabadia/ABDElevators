import { NextResponse, NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth';
import { ComplianceService } from '@/lib/services/backup-compliance-service';
import { UserRole } from '@/types/roles';

/**
 * POST /api/admin/compliance/certificate
 * Genera y descarga certificado de destrucción de datos (Phase 70 compliance)
 */
export async function POST(req: NextRequest) {
    try {
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
        const tenantId = session.user.tenantId;

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
