import {
    OpenAPIRegistry,
    OpenApiGeneratorV3,
    extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import * as schemas from './schemas';

// Extend Zod to support OpenAPI metadata (.openapi())
extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

// --- 🛡️ Security Schemes ---
registry.registerComponent('securitySchemes', 'ApiKeyAuth', {
    type: 'apiKey',
    in: 'header',
    name: 'x-api-key',
    description: 'API Key for programmatic access'
});

// --- 🏗️ Model Registration ---

registry.register('Industry', schemas.IndustryTypeSchema.openapi({
    description: 'Industry type/vertical of the system',
    example: 'ELEVATORS'
}));

// Re-activate EntitySchema now that we are on stable Pages router
registry.register('Entity', schemas.EntitySchema.openapi({
    description: 'Analyzed technical entity (Order, Contract, etc.)',
}));

// Register Common Response Schemas
export const SuccessResponseSchema = registry.register('SuccessResponse', z.object({
    success: z.boolean().openapi({ example: true }),
    message: z.string().optional().openapi({ example: 'Operation completed successfully' }),
}));

export const ErrorResponseSchema = registry.register('ErrorResponse', z.object({
    success: z.boolean().openapi({ example: false }),
    error: z.string().openapi({ example: 'VALIDATION_ERROR' }),
    message: z.string().openapi({ example: 'Invalid data' }),
    details: z.any().optional(),
}));

/**
 * Generates the final OpenAPI document
 */
export function generateOpenApiSpec() {
    const generator = new OpenApiGeneratorV3(registry.definitions);

    return generator.generateDocument({
        openapi: '3.0.0',
        info: {
            version: '1.4.0',
            title: 'ABD RAG Platform API',
            description: 'Interactive technical documentation of the RAG platform.',
            contact: {
                name: 'ABD Technical Support',
                email: 'support@abd.com'
            }
        },
        servers: [
            { url: '/api', description: 'Local Server (v1)' },
            { url: 'https://rag.abd.com/api', description: 'Production' }
        ],
        security: [{ ApiKeyAuth: [] }]
    });
}
