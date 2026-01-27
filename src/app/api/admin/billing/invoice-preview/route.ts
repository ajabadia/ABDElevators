import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { BillingService } from '@/lib/billing-service';
import { AppError, handleApiError } from '@/lib/errors';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    try {
        const session = await auth();
        if (!session?.user || !['ADMIN', 'SUPER_ADMIN', 'ADMINISTRATIVO'].includes(session.user.role)) {
            throw new AppError('UNAUTHORIZED', 403, 'Acceso denegado a facturación');
        }

        const tenantId = (session.user as any).tenantId || 'default_tenant';
        const date = new Date();

        // Generar factura preview del mes actual
        const invoice = await BillingService.generateInvoicePreview(tenantId, date.getMonth() + 1, date.getFullYear());

        return NextResponse.json({ success: true, invoice });
    } catch (error) {
        return handleApiError(error, 'API_BILLING_INVOICE_PREVIEW', correlacion_id);
    }
}
