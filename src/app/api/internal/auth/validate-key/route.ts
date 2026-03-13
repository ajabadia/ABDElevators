import { NextResponse } from 'next/server';
import { ApiKeyService } from '@/lib/services/ApiKeyService';
import { logEvento } from '@/lib/logger';

/**
 * 🛡️ [INTERNAL] API Key Validation Route
 * Used by Middleware to validate keys in a Serverless environment (supports MongoDB).
 */
export async function POST(request: Request) {
    const internalSecret = request.headers.get("x-internal-secret");
    if (internalSecret !== process.env.INTERNAL_API_SECRET) {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    try {
        const { rawKey, tenantId, resourceIds } = await request.json();

        const apiKey = await ApiKeyService.validateKey(rawKey, tenantId);

        if (!apiKey) {
            return NextResponse.json({ success: false, message: 'Invalid or expired key' }, { status: 401 });
        }

        // Check Permissions & Scopes
        // Note: For now we just validate existence and basic scope. 
        // Granular check can happen here or in the specific API Route.
        const isAuthorized = await ApiKeyService.checkPermissions(apiKey, '*', resourceIds);

        if (!isAuthorized) {
            return NextResponse.json({ success: false, message: 'Scope restriction violation' }, { status: 403 });
        }

        return NextResponse.json({
            success: true,
            apiKey: {
                id: (apiKey as any)._id,
                tenantId: apiKey.tenantId,
                permissions: apiKey.permissions,
                scopes: apiKey.scopes
            }
        });

    } catch (error: any) {
        await logEvento({
            level: 'ERROR',
            source: 'INTERNAL_AUTH',
            action: 'VALIDATE_KEY_ERROR',
            message: 'Internal error during API key validation',
            details: { errorType: error?.constructor?.name }
        });
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
