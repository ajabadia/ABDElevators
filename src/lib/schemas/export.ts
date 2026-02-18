import { z } from 'zod';

/**
 * Tipos de exportación disponibles.
 */
export const ExportTypeSchema = z.enum(['usage_logs', 'audit_logs', 'knowledge_assets', 'tenants']);

/**
 * Formatos de exportación disponibles.
 */
export const ExportFormatSchema = z.enum(['csv', 'json']);

/**
 * Schema para validar los parámetros de exportación de la API.
 */
export const ExportParamsSchema = z.object({
    type: ExportTypeSchema,
    format: ExportFormatSchema.default('csv'),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    tenantId: z.string().optional(),
    limit: z.coerce.number().min(1).max(50000).default(5000),
    offset: z.coerce.number().min(0).default(0),
});

export type ExportType = z.infer<typeof ExportTypeSchema>;
export type ExportFormat = z.infer<typeof ExportFormatSchema>;
export type ExportParams = z.infer<typeof ExportParamsSchema>;
