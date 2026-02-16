import {
    OpenAPIRegistry,
    OpenApiGeneratorV3,
    extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import * as schemas from './schemas';

// Extender Zod para soportar metadata de OpenAPI (.openapi())
extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

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

// Re-activamos EntitySchema ahora que estamos en Pages router estable
registry.register('Entity', schemas.EntitySchema.openapi({
    description: 'Entidad técnica analizada (Pedido, Contrato, etc.)',
}));

// Registrar Esquemas de Respuesta Comunes
export const SuccessResponseSchema = registry.register('SuccessResponse', z.object({
    success: z.boolean().openapi({ example: true }),
    message: z.string().optional().openapi({ example: 'Operación realizada con éxito' }),
}));

export const ErrorResponseSchema = registry.register('ErrorResponse', z.object({
    success: z.boolean().openapi({ example: false }),
    error: z.string().openapi({ example: 'VALIDATION_ERROR' }),
    message: z.string().openapi({ example: 'Datos inválidos' }),
    details: z.any().optional(),
}));

/**
 * Genera el documento OpenAPI final
 */
export function generateOpenApiSpec() {
    const generator = new OpenApiGeneratorV3(registry.definitions);

    return generator.generateDocument({
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
            { url: '/api', description: 'Servidor Local (v1)' },
            { url: 'https://rag.abd.com/api', description: 'Producción' }
        ],
        security: [{ ApiKeyAuth: [] }]
    });
}
