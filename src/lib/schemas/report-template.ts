import { z } from 'zod';

export const ReportSectionTypeSchema = z.enum([
    'TEXT',
    'METRICS_GRID',
    'DATA_TABLE',
    'CHART_PLACEHOLDER',
    'SEVERITY_BADGES',
    'LIST'
]);

export type ReportSectionType = z.infer<typeof ReportSectionTypeSchema>;

export const ReportSectionSchema = z.object({
    id: z.string(), // Unique ID within the template
    key: z.string().optional(), // Legacy compat
    title: z.string(),
    type: ReportSectionTypeSchema,
    description: z.string().optional(),
    content: z.string().optional(), // Static content for TEXT
    dataKey: z.string().optional(), // Dynamic data mapping key
    dataSource: z.string().optional(), // Alternate naming for dataKey
    config: z.record(z.string(), z.any()).optional(), // For specific visualization config
    layout: z.object({
        columns: z.number().optional(), // For Grids
        colSpan: z.number().optional(),
        rowSpan: z.number().optional(),
        breakPageBefore: z.boolean().optional(),
        compact: z.boolean().optional()
    }).optional()
});

export const ReportTemplateTypeSchema = z.enum([
    'inspection',
    'ragQuality',
    'audit',
    'entityLlm',
    'workflow',
    'custom'
]);

export type ReportTemplateType = z.infer<typeof ReportTemplateTypeSchema>;

export const ReportTemplateSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: ReportTemplateTypeSchema.or(z.string()), // Allow extensibility
    description: z.string().optional(), // Added description
    version: z.string(),
    sections: z.array(ReportSectionSchema),
    defaultConfig: z.object({
        includeSources: z.boolean().optional(),
        primaryColor: z.string().optional(),
        orientation: z.enum(['p', 'l']).optional().default('p')
    }).optional()
});

export type ReportTemplate = z.infer<typeof ReportTemplateSchema>;

// Input data schema for the engine (Generic)
export const ReportDataSchema = z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    entityId: z.string().optional(),
    tenantId: z.string(),
    date: z.date(),
    technician: z.string(),
    branding: z.any().optional(),
    data: z.record(z.string(), z.any())
});

export type ReportData = z.infer<typeof ReportDataSchema>;
