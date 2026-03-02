import { NextResponse, NextRequest } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { ComplianceService } from '@/services/security/compliance-service';
import { handleApiError } from '@/lib/errors';
import crypto from 'crypto';
import { UserRole } from '@/types/roles';

/**
 * POST /api/admin/compliance/certificate
 * Genera y descarga certificado de destrucción de datos (Phase 70 compliance)
 */
export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('compliance', 'manage');
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

    } catch (error: unknown) {
        return handleApiError(error, 'API_ADMIN_COMPLIANCE_CERT', correlationId);
    }
}
