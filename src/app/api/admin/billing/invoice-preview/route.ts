import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { BillingService } from '@/services/admin/BillingService';
import { handleApiError, AppError } from '@/lib/errors';
import crypto from 'crypto';
import { UserRole } from '@/types/roles';

/**
 * GET /api/admin/billing/invoice-preview
 * Genera preview de factura (Phase 70 compliance)
 */
export async function GET(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    try {
        // Enforce specific roles for billing
        const session = await requireRole([
            UserRole.ADMIN,
            UserRole.SUPER_ADMIN,
            UserRole.ADMINISTRATIVE
        ]);

        const tenantId = session.user.tenantId;
        const date = new Date();

        // Generar factura preview del mes actual
        const invoice = await BillingService.generateInvoicePreview(tenantId, date.getMonth() + 1, date.getFullYear());

        return NextResponse.json({ success: true, invoice });
    } catch (error: unknown) {
        return handleApiError(error, 'API_BILLING_INVOICE_PREVIEW', correlacion_id);
    }
}
