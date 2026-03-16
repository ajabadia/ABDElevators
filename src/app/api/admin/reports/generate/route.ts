import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AppError, handleApiError } from '@/lib/errors';
import { ReportTemplateRegistry } from '@/lib/report-templates/registry';
import { generateTemplatedReport } from '@/lib/server-pdf-utils';
import { ReportData } from '@/lib/schemas/report-template';
import { ReportTemplateTypeSchema } from '@/lib/schemas/report-template';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

const GenerateReportSchema = z.object({
    templateType: ReportTemplateTypeSchema,
    entityId: z.string().optional(),
    dateRange: z.object({
        from: z.string().optional(),
        to: z.string().optional()
    }).optional(),
    locale: z.string().optional().default('es'),
    dataOverride: z.record(z.string(), z.any()).optional()
});

async function POST_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_REPORTS', action: 'GENERATE' },
        async ({ log, correlationId }) => {
            const start = Date.now();
            try {
                const session = await requirePermission('reports', 'write');
                const body = await req.json();
                const validated = GenerateReportSchema.parse(body);

                await log({
                    message: `Starting report generation: ${validated.templateType}`,
                    details: { user: session.user.email, params: validated },
                    tenantId: session.user.tenantId
                });

                const template = ReportTemplateRegistry.getTemplateByType(validated.templateType);
                if (!template) {
                    throw new AppError('VALIDATION_ERROR', 400, `Template type ${validated.templateType} not found`);
                }

                const reportData: ReportData = {
                    title: template.name,
                    subtitle: `Generated for ${session.user.email}`,
                    tenantId: session.user.tenantId,
                    date: new Date(),
                    technician: session.user.name || session.user.email || 'System',
                    branding: {},
                    data: validated.dataOverride || {
                        metrics: [],
                        equipment: [],
                        findings: [],
                        riskText: 'No risk assessment provided.',
                        recommendations: 'No recommendations provided.'
                    }
                };

                const pdfBuffer = await generateTemplatedReport(template, reportData, {
                    locale: validated.locale
                });

                // Guardar registro en DB (Phase 160.1)
                try {
                    const { getTenantCollection } = await import('@/lib/db-tenant');
                    const reports = await getTenantCollection('reports', session);

                    await reports.insertOne({
                        type: validated.templateType,
                        title: body.config?.title || template.name,
                        filters: body.filters,
                        generatedBy: session.user.id,
                        tenantId: session.user.tenantId,
                        status: 'COMPLETED',
                        metadata: {
                            sectionsCount: template.sections.length,
                            generatedAt: new Date(),
                            format: 'pdf',
                            sizeBytes: pdfBuffer.length
                        }
                    });
                } catch (dbError) {
                    await log({ level: 'ERROR', message: 'Error saving report record to DB', details: { dbError } });
                }

                await log({
                    message: 'Report generated successfully',
                    details: { durationMs: Date.now() - start, size: pdfBuffer.length },
                    tenantId: session.user.tenantId
                });

                return new NextResponse(new Uint8Array(pdfBuffer), {
                    headers: {
                        'Content-Type': 'application/pdf',
                        'Content-Disposition': `attachment; filename="${template.type.toLowerCase()}-${Date.now()}.pdf"`
                    }
                });

            } catch (error: unknown) {
                return handleApiError(error, 'API_REPORTS_GENERATE_POST', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/reports/generate', thresholdMs: 1000 });
