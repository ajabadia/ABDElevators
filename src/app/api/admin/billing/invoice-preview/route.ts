import { NextResponse } from 'next/server';
import { BillingService } from '@/services/admin/BillingService';
import { handleApiError } from '@/lib/errors';
import { enforcePermission } from '@/lib/guardian-guard';
import { withPerformanceSLA } from '@/lib/performance-sla';
import crypto from 'crypto';

/**
 * GET /api/admin/billing/invoice-preview
 * Genera preview de factura
 * SLA: P95 < 1000ms
 */
export const GET = withPerformanceSLA(async (req) => {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('billing:invoice', 'read');

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
}, { p95: 1000, max: 2000 });
