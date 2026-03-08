import { NextResponse } from 'next/server';
import { BillingService } from '@/services/admin/BillingService';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';

/**
 * GET /api/admin/billing/invoice-preview
 * Genera preview de factura
 * SLA: P95 < 1000ms
 */
export const GET = withPerformanceSLA(async (req) => {
    const correlationId = crypto.randomUUID();
    try {
        const session = await requirePermission('billing:invoice', 'read');

        const tenantId = session.user.tenantId;
        const date = new Date();

        // Generar factura preview del mes actual
        const invoice = await BillingService.generateInvoicePreview(tenantId, date.getMonth() + 1, date.getFullYear());

        return NextResponse.json({
            success: true,
            invoice,
            correlationId
        });
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_BILLING_INVOICE_PREVIEW_GET', correlationId);
    }
}, { endpoint: 'GET /api/admin/billing/invoice-preview', thresholdMs: 1000 });
