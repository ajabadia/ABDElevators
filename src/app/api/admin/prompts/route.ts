import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { PromptService } from '@/services/llm/prompt-service';
import { PromptSchema } from '@/lib/schemas';
import { handleApiError, AppError } from '@/lib/errors';
import { UserRole } from '@/types/roles';
import { withCorrelation } from '@/lib/logger/with-correlation';

const API_SOURCE = 'API_ADMIN_PROMPTS';

/**
 * GET /api/admin/prompts
 * Lists all tenant prompts (Phase 70 compliance)
 */
async function GET_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: API_SOURCE, action: 'LIST_PROMPTS' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('prompt', 'read');
                const isSuperAdmin = session.user.role === UserRole.SUPER_ADMIN;
                const tenantId = session.user.tenantId;

                const { searchParams } = new URL(req.url);
                const environment = searchParams.get('environment') || 'PRODUCTION';
                const limit = parseInt(searchParams.get('limit') || '50');
                const after = searchParams.get('after');

                // If SuperAdmin, list ALL. Otherwise, only their tenant.
                const prompts = await PromptService.listPrompts({
                    tenantId: isSuperAdmin ? null : tenantId,
                    activeOnly: false,
                    environment,
                    limit,
                    after
                });

                const nextCursor = (prompts as any).nextCursor;

                // Enrich with tenant info (only if SuperAdmin)
                if (isSuperAdmin) {
                    const { TenantService } = await import('@/services/tenant/tenant-service');
                    const tenants = await TenantService.getAllTenants();
                    const tenantMap = new Map(tenants.map(t => [t.tenantId, t]));

                    const enrichedPrompts = prompts.map(p => ({
                        ...p,
                        tenantInfo: tenantMap.get(p.tenantId) || {
                            name: (p.tenantId as string) === 'platform_master' ? 'Platform Master' : 'Unknown Tenant',
                            branding: { logo: { url: null } }
                        }
                    }));

                    return NextResponse.json({ success: true, prompts: enrichedPrompts, nextCursor, correlationId });
                }

                return NextResponse.json({ success: true, prompts, nextCursor, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, API_SOURCE, correlationId);
            }
        }
    );
}

/**
 * POST /api/admin/prompts
 * Creates a new prompt (Phase 70 compliance)
 */
async function POST_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: API_SOURCE, action: 'CREATE_PROMPT' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('prompt', 'manage');
                const tenantId = session.user.tenantId;

                const body = await req.json();

                // 🛡️ SECURITY: Prevent Parameter Pollution
                const promptData = {
                    key: body.key,
                    name: body.name,
                    description: body.description,
                    category: body.category,
                    model: body.model,
                    template: body.template,
                    variables: body.variables || [],
                    active: body.active ?? true,
                    industry: body.industry || 'GENERIC',
                    maxLength: body.maxLength,

                    // Protected/System fields
                    tenantId,
                    version: 1,
                    createdBy: session.user.email || 'system',
                    updatedBy: session.user.email || 'system',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    environment: body.environment || 'PRODUCTION'
                };

                const validated = PromptSchema.parse(promptData);

                const { getTenantCollection } = await import('@/lib/db-tenant');
                const collection = await getTenantCollection<any>('prompts');

                // Check duplication by key AND environment
                const existing = await collection.findOne({
                    key: validated.key,
                    tenantId,
                    industry: validated.industry,
                    environment: validated.environment
                });
                if (existing) {
                    throw new AppError('CONFLICT', 409, `Prompt key '${validated.key}' already exists in ${validated.environment} `);
                }

                await collection.insertOne(validated);

                await log({
                    message: `New prompt created: ${validated.key} by ${session.user.email}`,
                    details: { promptKey: validated.key, category: validated.category }
                });

                return NextResponse.json({ success: true, prompt: validated, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, API_SOURCE, correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/prompts', thresholdMs: 1000 });

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/prompts', thresholdMs: 1000 });
