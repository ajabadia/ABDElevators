import { NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';

export const dynamic = 'force-dynamic';

/**
 * Endpoint para servir la especificación OpenAPI.
 * Implementación Protegida con Guardian V3 y optimizada para Build Worker.
 */
export async function GET() {
    try {
        // 1. 🛡️ SEGURIDAD: Solo usuarios con permiso de lectura de documentación técnica
        // Usamos enforcePermission que integra auth() y GuardianEngine
        await enforcePermission('technical-docs', 'read');

        // Importaciones dinámicas dentro del handler para evitar ejecución en build worker
        const {
            OpenAPIRegistry,
            OpenApiGeneratorV3,
            extendZodWithOpenApi
        } = await import('@asteasolutions/zod-to-openapi');
        const { z: zOriginal } = await import('zod');
        const z = zOriginal as any;
        const schemas = await import('@/lib/schemas') as any;

        // Extender Zod (side effect local al handler)
        extendZodWithOpenApi(zOriginal);

        const registry = new OpenAPIRegistry();

        // --- 🛡️ Esquemas de Seguridad ---
        registry.registerComponent('securitySchemes', 'ApiKeyAuth', {
            type: 'apiKey',
            in: 'header',
            name: 'x-api-key',
            description: 'API Key para acceso programático'
        });

        // --- 🏗️ Registro de Modelos ---
        registry.register('Industry', schemas.IndustryTypeSchema.openapi({
            description: 'Tipo de industria/vertical del sistema',
            example: 'ELEVATORS'
        }));

        registry.register('Entity', schemas.EntitySchema.openapi({
            description: 'Entidad técnica analizada (Pedido, Contrato, etc.)',
        }));

        // Registrar Esquemas de Respuesta Comunes
        registry.register('SuccessResponse', z.object({
            success: z.boolean().openapi({ example: true }),
            message: z.string().optional().openapi({ example: 'Operación realizada con éxito' }),
        }));

        registry.register('ErrorResponse', z.object({
            success: z.boolean().openapi({ example: false }),
            error: z.string().openapi({ example: 'VALIDATION_ERROR' }),
            message: z.string().openapi({ example: 'Datos inválidos' }),
            details: z.any().optional(),
        }));

        const generator = new OpenApiGeneratorV3(registry.definitions);

        const spec = generator.generateDocument({
            openapi: '3.0.0',
            info: {
                version: '1.4.0',
                title: 'ABD RAG Platform API',
                description: 'Documentación técnica interactiva de la plataforma RAG.',
                contact: {
                    name: 'Soporte Técnico ABD',
                    email: 'soporte@abd.com'
                }
            },
            servers: [
                { url: '/api', description: 'Servidor Actual' }
            ],
            security: [{ ApiKeyAuth: [] }]
        });

        return NextResponse.json(spec, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY'
            }
        });
    } catch (error: any) {
        console.error('🔥 [SWAGGER_spec_ERROR]', error);

        // Manejo estandarizado de errores (compatibilidad con AppError)
        const status = error.status || 500;
        const code = error.code || 'SPEC_GENERATION_FAILED';

        return NextResponse.json(
            { success: false, error: code, message: error.message },
            { status }
        );
    }
}
