import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { BillingAdminService } from '@/core/application/billing/BillingAdminService';
import { z } from 'zod';
import { handleApiError, AppError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { checkRateLimit, LIMITS } from '@/lib/rate-limit';

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
async function GET_internal (req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_BILLING_CONTRACTS', action: 'LIST' },
        async ({ log, correlationId }) => {
            try {
                await requirePermission('billing:contract', 'read');

                // 🛡️ [SECURITY] Layered Rate Limiting (Phase 451)
                const { success: rateLimitOk } = await checkRateLimit(session.user.id, LIMITS.ADMIN);
                if (!rateLimitOk) {
                    throw new AppError('FORBIDDEN', 429, 'Demasiadas consultas de contratos. Por favor, espera.');
                }

                const { searchParams } = new URL(req.url);
                const page = parseInt(searchParams.get('page') || '1');
                const limit = parseInt(searchParams.get('limit') || '10');
                const search = searchParams.get('search') || undefined;

                const result = await BillingAdminService.getTenantContracts(page, limit, search);

                await log({
                    message: `Successfully retrieved contracts (page ${page})`,
                    details: { page, limit, count: result.contracts?.length }
                });

                return NextResponse.json({ success: true, ...result });
            } catch (error: unknown) {
                return handleApiError(error, 'API_BILLING_CONTRACTS_GET', correlationId);
            }
        }
    );
}

/**
 * POST /api/admin/billing/contracts
 * Update a tenant's contract (Tier / Custom Limits).
 */
async function POST_internal (req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_BILLING_CONTRACTS', action: 'UPDATE' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('billing:contract', 'manage');
                
                // 🛡️ [SECURITY] Layered Rate Limiting (Phase 451)
                const { success: rateLimitOk } = await checkRateLimit(session.user.id, LIMITS.ADMIN);
                if (!rateLimitOk) {
                    throw new AppError('FORBIDDEN', 429, 'Demasiadas actualizaciones de contrato. Por favor, espera.');
                }

                const body = await req.json();

                // 2. Validation
                const validated = UpdateContractSchema.parse(body);

                // 3. Execution
                await BillingAdminService.updateContract(validated.tenantId, {
                    tier: validated.tier as any,
                    customLimits: validated.customLimits
                });

                await log({
                    message: `Contract updated for tenant ${validated.tenantId}`,
                    details: { performedBy: session.user.email, updates: validated }
                });

                return NextResponse.json({ success: true });

            } catch (error: unknown) {
                if (error instanceof z.ZodError) {
                    return handleApiError(error, 'API_BILLING_CONTRACTS_VAL', correlationId);
                }
                return handleApiError(error, 'API_BILLING_CONTRACTS_POST', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/billing/contracts', thresholdMs: 1000 });

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/billing/contracts', thresholdMs: 1000 });
