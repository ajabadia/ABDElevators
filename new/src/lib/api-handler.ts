import { NextRequest, NextResponse } from 'next/server';
import { ApiKeyService } from '@/lib/api-key-service';
import { ApiKeyPermission } from '@/lib/schemas';
import { AppError } from '@/lib/errors';
import crypto from 'crypto';

type ApiHandlerFunction = (
    req: NextRequest,
    context: { tenantId: string; apiKeyId: any; correlationId: string }
) => Promise<NextResponse>;

/**
 * Wrapper estándar para endpoints API V1 Públicos.
 * Maneja:
 * 1. Autenticación API Key (Header: x-api-key)
 * 2. Validación de Permisos (Scopes)
 * 3. Logging de Auditoría (ApiKeyLogs)
 * 4. Manejo de Errores (AppError -> JSON standard)
 * 5. Headers de Seguridad y Correlación
 */
export function publicApiHandler(
    requiredPermission: ApiKeyPermission,
    handler: ApiHandlerFunction
) {
    return async (req: NextRequest) => {
        const start = Date.now();
        const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();
        let apiKeyDetails: any = null;
        let tenantId = 'unknown';

        try {
            // 1. Validar Headers
            const apiKey = req.headers.get('x-api-key');
            if (!apiKey) {
                throw new AppError('UNAUTHORIZED', 401, 'Missing x-api-key header');
            }

            // 2. Validar Key y Permisos
            const validKey = await ApiKeyService.validateApiKey(apiKey, requiredPermission);
            apiKeyDetails = validKey;
            tenantId = validKey.tenantId;

            // 3. Ejecutar Lógica
            const response = await handler(req, {
                tenantId: validKey.tenantId,
                apiKeyId: validKey._id,
                correlationId
            });

            // 4. Log Success
            await ApiKeyService.logUsage({
                apiKeyId: validKey._id,
                tenantId: validKey.tenantId,
                endpoint: req.nextUrl.pathname,
                method: req.method,
                statusCode: response.status,
                durationMs: Date.now() - start,
                ip: req.headers.get('x-forwarded-for') || 'unknown',
                userAgent: req.headers.get('user-agent') || 'unknown'
            });

            // Inyectar headers de tracing
            response.headers.set('X-Correlation-ID', correlationId);
            return response;

        } catch (error: any) {
            // 5. Manejo de Errores
            const status = (error instanceof AppError || error?.name === 'AppError') ? (error.status || 500) : 500;
            const message = error.message || 'Internal Server Error';
            const code = (error instanceof AppError || error?.name === 'AppError') ? error.code : 'INTERNAL_ERROR';

            // Log de fallo si tenemos contexto de key
            if (apiKeyDetails) {
                await ApiKeyService.logUsage({
                    apiKeyId: apiKeyDetails._id,
                    tenantId: apiKeyDetails.tenantId,
                    endpoint: req.nextUrl.pathname,
                    method: req.method,
                    statusCode: status,
                    durationMs: Date.now() - start,
                    ip: req.headers.get('x-forwarded-for') || 'unknown',
                    userAgent: req.headers.get('user-agent') || 'unknown'
                });
            }

            console.error(`[API V1 ERROR] ${req.nextUrl.pathname}:`, error);

            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: code,
                        message: message,
                        correlationId
                    }
                },
                { status: typeof status === 'number' && status >= 100 && status < 600 ? status : 500 }
            );
        }
    };
}
