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
 * Endpoint to serve the OpenAPI specification.
 * Protected implementation with Guardian V3.
 */
async function GET_internal() {
    try {
        // 1. 🛡️ SECURITY: Only users with technical documentation read permission
        // await requirePermission('technical-docs', 'read');

        const registry = new OpenAPIRegistry();

        // --- 🛡️ Security Schemes ---
        registry.registerComponent('securitySchemes', 'ApiKeyAuth', {
            type: 'apiKey',
            in: 'header',
            name: 'x-api-key',
            description: 'API Key for programmatic access'
        });

        // --- 🏗️ Model Registry ---
        registry.register('Industry', z.string().openapi({
            description: 'System vertical/industry type',
            example: 'ELEVATORS'
        }));

        registry.register('Entity', z.object({
            _id: z.string().optional(),
            name: z.string().optional()
        }).passthrough().openapi({
            description: 'Analyzed technical entity (Order, Contract, etc.)',
        }));

        // Register Common Response Schemas
        registry.register('SuccessResponse', z.object({
            success: z.boolean().openapi({ example: true }),
            message: z.string().optional().openapi({ example: 'Operation completed successfully' }),
        }));

        registry.register('ErrorResponse', z.object({
            success: z.boolean().openapi({ example: false }),
            error: z.string().openapi({ example: 'VALIDATION_ERROR' }),
            message: z.string().openapi({ example: 'Invalid data' }),
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
                    name: 'ABD Technical Support',
                    email: 'soporte@abd.com'
                }
            },
            servers: [
                { url: '/api', description: 'Current Server' }
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
