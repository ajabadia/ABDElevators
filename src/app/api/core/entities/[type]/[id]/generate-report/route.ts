import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { AppError, handleApiError } from '@/lib/errors';
import { callGemini } from '@/services/llm/llm-service';
import { generateServerPDF } from '@/lib/server-pdf-utils';
import { uploadLLMReport } from '@/lib/cloudinary';
import { PromptService } from '@/services/llm/prompt-service';
import { UsageService } from '@/services/ops/usage-service';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * POST /api/core/entities/[type]/[id]/generate-report
 * Generates a technical report using LLM.
 */
async function POST_internal(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'APICORE_ENTITIES_REPORT', action: 'GENERATEREPORT' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('technical:analysis', 'write');
                const { id: entityId } = await context.params;

                // 🛡️ SECURITY: Validate format before ObjectId constructor
                const { ObjectIdSchema } = await import('@/lib/schemas/common');
                ObjectIdSchema.parse(entityId);

                const tenantId = session.user.tenantId;

                const db = await connectDB();
                const entity = await db.collection('entities').findOne({ _id: new ObjectId(entityId), tenantId });

                if (!entity) throw new AppError('NOT_FOUND', 404, 'Entidad no encontrada');
                if (!entity.isValidated) throw new AppError('VALIDATION_ERROR', 400, 'La entidad debe estar validada antes de generar el informe');

                const validation = await db.collection('human_validations').findOne(
                    { entityId, tenantId, generalStatus: 'APROBADO' },
                    { sort: { timestamp: -1 } }
                );

                if (!validation) throw new AppError('NOT_FOUND', 404, 'No se encontró una validación aprobada');

                const searchResults = await db.collection('search_results').find({ entityId }).limit(10).toArray();
                const validatedItems = validation.items.map((item: any) => `- ${item.field}: ${item.correctedValue || item.originalValue}`).join('\n');
                const sources = searchResults.map((r: any, idx: number) => `[${idx + 1}] ${r.source}`).join('\n');

                const { text: renderedPrompt } = await PromptService.getRenderedPrompt(
                    'REPORT_GENERATOR',
                    { identifier: entity.identifier, client: entity.client || 'No especificado', validatedItems, observations: validation.observations || '', sources },
                    tenantId
                );

                const reportText = await callGemini(renderedPrompt, tenantId, correlationId, { temperature: 0.3 });
                const pdfBuffer = await generateServerPDF({
                    identifier: entity.identifier || 'N/A',
                    client: entity.client || 'S/N',
                    content: reportText,
                    tenantId,
                    technician: session.user.name || 'Sistema',
                    locale: 'es',
                    date: new Date()
                });

                const { secureUrl: pdfUrl } = await uploadLLMReport(pdfBuffer, `report_${entity.identifier}.pdf`, tenantId);
                const reportDoc = { entityId, tenantId, generatedBy: session.user.id, technicianName: session.user.name, content: reportText, pdfUrl, timestamp: new Date() };
                const result = await db.collection('llm_reports').insertOne(reportDoc);

                await UsageService.trackLLM(tenantId, 1, 'REPORT_GENERATION', correlationId);

                await log({
                    message: 'Technical report generated',
                    details: {
                        entityId,
                        reportId: result.insertedId,
                        pdfUrl
                    }
                });

                return NextResponse.json({ success: true, reportId: result.insertedId.toString(), content: reportText, pdfUrl });

            } catch (error: unknown) {
                return handleApiError(error, 'APICORE_ENTITIES_REPORT', correlationId);
            }
        }
    );
}

/**
 * GET /api/core/entities/[type]/[id]/generate-report
 * Retrieves the latest generated report.
 */
async function GET_internal(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'APICORE_ENTITIES_REPORT', action: 'GETREPORT' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('technical:analysis', 'read');
                const { id: entityId } = await context.params;
                const tenantId = session.user.tenantId;

                const db = await connectDB();
                const report = await db.collection('llm_reports').findOne({ entityId, tenantId }, { sort: { timestamp: -1 } });

                if (!report) return NextResponse.json({ success: true, report: null });

                await log({
                    message: 'Technical report retrieved',
                    details: { entityId, reportId: report._id }
                });

                return NextResponse.json({ success: true, report: { id: report._id.toString(), content: report.content, pdfUrl: report.pdfUrl } });
            } catch (error: unknown) {
                return handleApiError(error, 'APICORE_ENTITIES_REPORT', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/technical/entities/[id]/generate-report', thresholdMs: 1000 });
export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/technical/entities/[id]/generate-report', thresholdMs: 1000 });
