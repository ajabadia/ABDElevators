import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { ReportTemplateRegistry } from '@/lib/report-templates/registry';
import { generateTemplatedReport } from '@/lib/server-pdf-utils';
import { ReportData } from '@/lib/schemas/report-template';
import { ReportTemplateTypeSchema } from '@/lib/schemas/report-template';
import { auth } from '@/lib/auth';

const GenerateReportSchema = z.object({
    templateType: ReportTemplateTypeSchema,
    entityId: z.string().optional(),
    dateRange: z.object({
        from: z.string().optional(),
        to: z.string().optional()
    }).optional(),
    locale: z.string().optional().default('es'),
    // For Phase 1, we accept 'data' payload directly if the caller aggregates it,
    // or we could fetch it here. To be robust, we'll accept a partial override.
    dataOverride: z.record(z.string(), z.any()).optional()
});

export async function POST(req: NextRequest) {
    const correlationId = `gen-rep-${Date.now()}`;
    const start = Date.now();

    try {
        const session = await auth();
        if (!session?.user?.id) {
            throw new AppError('UNAUTHORIZED', 401, 'User not authenticated');
        }

        const body = await req.json();
        const validated = GenerateReportSchema.parse(body);

        await logEvento({
            level: 'INFO',
            source: 'API_REPORTS',
            action: 'GENERATE_INIT',
            message: `Starting report generation: ${validated.templateType}`,
            correlationId,
            details: { user: session.user.email, ...validated }
        });

        const template = ReportTemplateRegistry.getTemplateByType(validated.templateType);
        if (!template) {
            throw new AppError('VALIDATION_ERROR', 400, `Template type ${validated.templateType} not found`);
        }

        // TODO: In a real implementation, this switch would call specific Data Services
        // to fetch data from DB based on EntityID/DateRange.
        // For Phase 160.1 scope, we will construct a mock/basic data object 
        // merging with provided overrides to demonstrate the engine.
        const reportData: ReportData = {
            title: template.name,
            subtitle: `Generated for ${session.user.email}`,
            tenantId: session.user.tenantId,
            date: new Date(),
            technician: session.user.name || session.user.email || 'System',
            branding: {},
            data: validated.dataOverride || {
                // Default stubs to prevent crashing if no data provided
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

        // 4. Guardar registro en DB (Phase 160.1)
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
            console.error('Error saving report record:', dbError);
            // Non-blocking error
        }

        await logEvento({
            level: 'INFO',
            source: 'API_REPORTS',
            action: 'GENERATE_SUCCESS',
            message: 'Report generated successfully',
            correlationId,
            details: { durationMs: Date.now() - start, size: pdfBuffer.length }
        });

        return new NextResponse(new Uint8Array(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${template.type.toLowerCase()}-${Date.now()}.pdf"`
            }
        });

    } catch (error: any) {
        await logEvento({
            level: 'ERROR',
            source: 'API_REPORTS',
            action: 'GENERATE_ERROR',
            message: error.message,
            correlationId,
            details: { stack: error.stack }
        });

        if (error instanceof z.ZodError) {
            return NextResponse.json({
                code: 'VALIDATION_ERROR',
                message: 'Invalid input parameters',
                details: error.issues
            }, { status: 400 });
        }

        if (error instanceof AppError) {
            return NextResponse.json({
                code: error.code,
                message: error.message
            }, { status: error.status });
        }

        return NextResponse.json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred'
        }, { status: 500 });
    }
}
