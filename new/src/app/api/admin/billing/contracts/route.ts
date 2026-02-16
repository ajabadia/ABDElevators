
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { BillingAdminService } from '@/core/application/billing/BillingAdminService';
import { z } from 'zod';
import { AppError, ValidationError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { UserRole } from '@/types/roles';

// Schema Validation for POST
const UpdateContractSchema = z.object({
    tenantId: z.string().min(1),
    tier: z.enum(['FREE', 'BASIC', 'PRO', 'ENTERPRISE']).optional(),
    customLimits: z.object({
        llm_tokens_per_month: z.number().optional(),
        storage_bytes: z.number().optional(),
        vector_searches_per_month: z.number().optional(),
        api_requests_per_month: z.number().optional(),
        users: z.number().optional(),
        spaces_per_tenant: z.number().optional(),
        spaces_per_user: z.number().optional(),
    }).optional(),
});

/**
 * GET /api/admin/billing/contracts
 * List all tenants with billing status.
 */
export async function GET(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await auth();

        // 1. Security Check: ONLY SUPER_ADMIN
        if (!session?.user || session.user.role !== UserRole.SUPER_ADMIN) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || undefined;

        const result = await BillingAdminService.getTenantContracts(page, limit, search);

        return NextResponse.json({ success: true, ...result });
    } catch (error: any) {
        await logEvento({
            level: 'ERROR',
            source: 'API_BILLING',
            action: 'GET_CONTRACTS_ERROR',
            correlationId,
            message: error.message,
            stack: error.stack
        });

        return NextResponse.json(
            { success: false, error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/billing/contracts
 * Update a tenant's contract (Tier / Custom Limits).
 */
export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await auth();

        // 1. Security Check: ONLY SUPER_ADMIN
        if (!session?.user || session.user.role !== UserRole.SUPER_ADMIN) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
        }

        const body = await req.json();

        // 2. Validation
        const validated = UpdateContractSchema.parse(body);

        // 3. Execution
        await BillingAdminService.updateContract(validated.tenantId, {
            tier: validated.tier as any,
            customLimits: validated.customLimits
        });

        await logEvento({
            level: 'INFO',
            source: 'API_BILLING',
            action: 'CONTRACT_UPDATED',
            correlationId,
            message: `Contract updated for tenant ${validated.tenantId}`,
            details: { performedBy: session.user.email, updates: validated }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: 'Validation Error', details: error.issues }, { status: 400 });
        }

        await logEvento({
            level: 'ERROR',
            source: 'API_BILLING',
            action: 'CONTRACT_UPDATE_ERROR',
            correlationId,
            message: error.message,
            stack: error.stack
        });

        const status = error instanceof AppError ? error.status : 500;
        return NextResponse.json(
            { success: false, error: error.message || 'Internal Server Error' },
            { status }
        );
    }
}
