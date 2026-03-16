import { NextResponse } from 'next/server';
import { ApiKeyService } from '@/lib/services/ApiKeyService';
import { handleApiError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * 🛡️ [INTERNAL] API Key Validation Route
 * Used by Middleware to validate keys in a Serverless environment.
 */
export async function POST(request: Request) {
    return withCorrelation(
        { level: 'INFO', source: 'SERVICE_AUTH_INTERNAL', action: 'VALIDATE_KEY' },
        async ({ log, correlationId }) => {
            try {
                const internalSecret = request.headers.get("x-internal-secret");
                if (internalSecret !== process.env.INTERNAL_API_SECRET) {
                    await log({ level: 'WARN', message: 'Forbidden internal access attempt' });
                    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
                }

                const { rawKey, tenantId, resourceIds } = await request.json();

                await log({
                    message: `Internal validation for key on tenant ${tenantId}`,
                    details: { tenantId }
                });

                const apiKey = await ApiKeyService.validateKey(rawKey, tenantId);

                if (!apiKey) {
                    await log({ level: 'WARN', message: 'Invalid or expired key attempt', tenantId });
                    return NextResponse.json({ success: false, message: 'Invalid or expired key' }, { status: 401 });
                }

                // Check Permissions & Scopes
                const isAuthorized = await ApiKeyService.checkPermissions(apiKey, '*', resourceIds);

                if (!isAuthorized) {
                    await log({ level: 'WARN', message: 'Scope restriction violation', tenantId });
                    return NextResponse.json({ success: false, message: 'Scope restriction violation' }, { status: 403 });
                }

                await log({
                    message: 'Internal key validation successful',
                    tenantId
                });

                return NextResponse.json({
                    success: true,
                    apiKey: {
                        id: (apiKey as any)._id,
                        tenantId: apiKey.tenantId,
                        permissions: apiKey.permissions,
                        scopes: apiKey.scopes
                    },
                    correlationId
                });

            } catch (error: unknown) {
                return handleApiError(error, 'INTERNAL_AUTH_VALIDATE_KEY_POST', correlationId);
            }
        }
    );
}
