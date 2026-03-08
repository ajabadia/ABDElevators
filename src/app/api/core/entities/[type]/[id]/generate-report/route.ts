import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { AppError, handleApiError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { callGemini } from '@/services/llm/llm-service';
import { generateServerPDF } from '@/lib/server-pdf-utils';
import { uploadLLMReport } from '@/lib/cloudinary';
import { PromptService } from '@/services/llm/prompt-service';
import { UsageService } from '@/services/ops/usage-service';
import { AIMODELIDS } from '@/lib/ai-models';

async function POST_internal(
    req: NextRequest,
    context: { params: { id: string } }
) {
    const start = Date.now();
    const correlationId = crypto.randomUUID();

    try {
        const session = await requirePermission('technical:analysis', 'write');
        const { id: entityId } = context.params;

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
            identifier: entity.identifier || 'N/A', client: entity.client || 'S/N', content: reportText, tenantId, technician: session.user.name || 'Sistema', locale: 'es',
            date: new Date()
        });

        const { secureUrl: pdfUrl, publicId } = await uploadLLMReport(pdfBuffer, `report_${entity.identifier}.pdf`, tenantId);
        const reportDoc = { entityId, tenantId, generatedBy: session.user.id, technicianName: session.user.name, content: reportText, pdfUrl, timestamp: new Date() };
        const result = await db.collection('llm_reports').insertOne(reportDoc);

        await UsageService.trackLLM(tenantId, 1, 'REPORT_GENERATION', correlationId);

        return NextResponse.json({ success: true, reportId: result.insertedId.toString(), content: reportText, pdfUrl });

    } catch (error: unknown) {
        return handleApiError(error, 'REPORT_ENDPOINT', correlationId);
    }
}

async function GET_internal(
    req: NextRequest,
    context: { params: { id: string } }
) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await requirePermission('technical:analysis', 'read');
        const { id: entityId } = context.params;
        const tenantId = session.user.tenantId;

        const db = await connectDB();
        const report = await db.collection('llm_reports').findOne({ entityId, tenantId }, { sort: { timestamp: -1 } });

        if (!report) return NextResponse.json({ success: true, report: null });

        return NextResponse.json({ success: true, report: { id: report._id.toString(), content: report.content, pdfUrl: report.pdfUrl } });
    } catch (error: unknown) {
        return handleApiError(error, 'REPORT_ENDPOINT', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/technical/entities/[id]/generate-report', thresholdMs: 1000 });
export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/technical/entities/[id]/generate-report', thresholdMs: 1000 });
