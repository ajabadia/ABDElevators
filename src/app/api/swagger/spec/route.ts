import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
export const dynamic = 'force-dynamic';

import { OpenAPIRegistry, OpenApiGeneratorV3, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import * as schemas from '@/lib/schemas';

// Extender Zod estáticamente a nivel de módulo
extendZodWithOpenApi(z);

/**
 * Endpoint para servir la especificación OpenAPI.
 * Implementación Protegida con Guardian V3
 */
async function GET_internal() {
    try {
        // 1. 🛡️ SEGURIDAD: Solo usuarios con permiso de lectura de documentación técnica
        // await requirePermission('technical-docs', 'read');

        const registry = new OpenAPIRegistry();

        // --- 🛡️ Esquemas de Seguridad ---
        registry.registerComponent('securitySchemes', 'ApiKeyAuth', {
            type: 'apiKey',
            in: 'header',
            name: 'x-api-key',
            description: 'API Key para acceso programático'
        });

        // --- 🏗️ Registro de Modelos ---
        registry.register('Industry', z.string().openapi({
            description: 'Tipo de industria/vertical del sistema',
            example: 'ELEVATORS'
        }));

        registry.register('Entity', z.object({
            _id: z.string().optional(),
            name: z.string().optional()
        }).passthrough().openapi({
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

        // --- 🛣️ Registro de Rutas ---
        registry.registerPath({
            method: 'get',
            path: '/health',
            description: 'Obtener el estado de salud del sistema',
            responses: {
                200: {
                    description: 'Respuesta exitosa',
                    content: {
                        'application/json': {
                            schema: z.object({
                                status: z.string().openapi({ example: 'UP' }),
                                version: z.string().openapi({ example: '1.4.0' }),
                                uptime: z.number().openapi({ example: 3600 })
                            })
                        }
                    }
                }
            }
        });

        registry.registerPath({
            method: 'get',
            path: '/entities',
            description: 'Listar entidades técnicas analizadas',
            responses: {
                200: {
                    description: 'Lista de entidades',
                    content: {
                        'application/json': {
                            schema: z.array(z.object({
                                _id: z.string(),
                                name: z.string(),
                                type: z.string()
                            }))
                        }
                    }
                }
            }
        });

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

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/swagger/spec', thresholdMs: 1000 });
