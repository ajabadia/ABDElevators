import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { AppError, handleApiError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { callGemini } from '@/lib/llm';
import { generateServerPDF } from '@/lib/server-pdf-utils';
import { uploadLLMReport } from '@/lib/cloudinary';
import { PromptService } from '@/lib/prompt-service';
import { UsageService } from '@/lib/usage-service';

/**
 * POST /api/entities/[id]/generate-report
 * Generates a professional report using LLM based on approved human validation
 * SLA: P95 < 5s (includes Gemini call)
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const start = Date.now();
    const correlationId = crypto.randomUUID();

    try {
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const { id: entityId } = await params;
        const tenantId = (session.user as any).tenantId;

        const db = await connectDB();

        // 1. Verify entity exists and is validated
        const entity = await db.collection('entities').findOne({
            _id: new ObjectId(entityId),
            tenantId
        });

        if (!entity) {
            throw new AppError('NOT_FOUND', 404, 'Entidad no encontrada');
        }

        if (!entity.isValidated) {
            throw new AppError('VALIDATION_ERROR', 400, 'La entidad debe estar validada antes de generar el informe');
        }

        // 2. Get the latest approved human validation
        const validation = await db.collection('human_validations')
            .findOne(
                { entityId, tenantId, generalStatus: 'APROBADO' },
                { sort: { timestamp: -1 } }
            );

        if (!validation) {
            throw new AppError('NOT_FOUND', 404, 'No se encontró una validación aprobada para esta entidad');
        }

        // 3. Get vector search results (sources)
        const searchResults = await db.collection('search_results')
            .find({ entityId })
            .limit(10)
            .toArray();

        // 4. Build variables for the prompt
        const validatedItems = validation.items
            .map((item: any) => `- ${item.field}: ${item.correctedValue || item.originalValue} (${item.status})`)
            .join('\n');

        const sources = searchResults
            .map((r: any, idx: number) => `[${idx + 1}] ${r.source} - Score: ${r.score?.toFixed(2)}`)
            .join('\n');

        // Render dynamic prompt (Phase 7.6)
        const renderedPrompt = await PromptService.renderPrompt(
            'REPORT_GENERATOR',
            {
                identifier: entity.identifier,
                client: entity.client || 'No especificado',
                receivedAt: entity.receivedAt || 'No especificada',
                validatedItems,
                observations: validation.observations || 'Sin observaciones adicionales',
                sources
            },
            tenantId
        );

        // 5. Generate report with Gemini
        const reportText = await callGemini(renderedPrompt, tenantId, correlationId, {
            temperature: 0.3, // Low for precision
            maxTokens: 2000
        });

        // 6. Generate Server PDF (Vision 2.0 - Phase 6.6.1)
        const pdfBuffer = await generateServerPDF({
            identifier: entity.identifier || 'N/A',
            client: entity.client || 'S/N',
            content: reportText,
            tenantId,
            date: new Date(),
            technician: session.user.name || 'Sistema'
        });

        // 7. Upload to Cloudinary
        const { secureUrl: pdfUrl, publicId } = await uploadLLMReport(
            pdfBuffer,
            `report_${entity.identifier}_${Date.now()}.pdf`,
            tenantId
        );

        // 8. Save report to database
        const reportDoc = {
            entityId,
            tenantId,
            validationId: validation._id,
            generatedBy: session.user.id,
            technicianName: session.user.name,
            content: reportText,
            pdfUrl,
            cloudinaryPublicId: publicId,
            metadata: {
                model: 'gemini-2.0-flash',
                tokensUsed: reportText.length / 4, // Approx
                temperature: 0.3,
            },
            timestamp: new Date(),
        };

        const result = await db.collection('llm_reports').insertOne(reportDoc);

        // Track report generation as metric usage (Phase 9.1)
        await UsageService.trackLLM(tenantId, 1, 'REPORT_GENERATION', correlationId);

        const durationMs = Date.now() - start;

        await logEvento({
            level: 'INFO',
            source: 'REPORT_ENDPOINT',
            action: 'REPORT_GENERATED',
            message: `Informe LLM generado para entidad ${entityId}`,
            correlationId,
            tenantId,
            details: {
                entityId,
                reportId: result.insertedId.toString(),
                durationMs,
                reportLength: reportText.length
            }
        });

        if (durationMs > 5000) {
            await logEvento({
                level: 'WARN',
                source: 'REPORT_ENDPOINT',
                action: 'SLA_EXCEEDED',
                message: `Generación de informe tardó ${durationMs}ms (SLA: 5000ms)`,
                correlationId,
                details: { durationMs }
            });
        }

        return NextResponse.json({
            success: true,
            reportId: result.insertedId.toString(),
            content: reportText,
            pdfUrl,
            metadata: reportDoc.metadata
        });

    } catch (error: any) {
        const durationMs = Date.now() - start;
        await logEvento({
            level: 'ERROR',
            source: 'REPORT_ENDPOINT',
            action: 'REPORT_ERROR',
            message: error.message,
            correlationId,
            details: { durationMs },
            stack: error.stack
        });

        return handleApiError(error, 'REPORT_ENDPOINT', correlationId);
    }
}


/**
 * GET /api/entities/[id]/generate-report
 * Gets the latest generated report for an entity
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = crypto.randomUUID();

    try {
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const { id: entityId } = await params;
        const tenantId = (session.user as any).tenantId;

        const db = await connectDB();

        // Get the latest report
        const report = await db.collection('llm_reports')
            .findOne(
                { entityId, tenantId },
                { sort: { timestamp: -1 } }
            );

        if (!report) {
            return NextResponse.json({
                success: true,
                report: null,
                message: 'No se ha generado ningún informe para esta entidad'
            });
        }

        await logEvento({
            level: 'DEBUG',
            source: 'REPORT_ENDPOINT',
            action: 'REPORT_ACCESSED',
            message: `Consultado informe para entidad ${entityId}`,
            correlationId,
            tenantId,
            details: { entityId, reportId: report._id.toString() }
        });

        return NextResponse.json({
            success: true,
            report: {
                id: report._id.toString(),
                content: report.content,
                pdfUrl: report.pdfUrl,
                generatedBy: report.technicianName,
                timestamp: report.timestamp,
                metadata: report.metadata
            }
        });

    } catch (error: any) {
        await logEvento({
            level: 'ERROR',
            source: 'REPORT_ENDPOINT',
            action: 'ACCESS_ERROR',
            message: error.message,
            correlationId,
            stack: error.stack
        });

        return handleApiError(error, 'REPORT_ENDPOINT', correlationId);
    }
}
