import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { AppError, handleApiError } from '@/lib/errors';
import { PromptService } from '@/services/llm/prompt-service';
import { callGeminiMini } from '@/services/llm/llm-service';
import { connectDB } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/admin/knowledge-assets/[id]/suggest-questions
 * Generates dynamic, proactive question suggestions for a specific asset.
 * Phase 216.3: Agentic Quick-Analysis
 */
async function GET_internal(
    req: NextRequest,
    paramsContext: { params: { id: string } }
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_SUGGEST_QUESTIONS', action: 'GENERATE' },
        async ({ log, correlationId }) => {
            const { id } = paramsContext.params;

            try {
                const session = await requirePermission('knowledge:asset', 'read');

                const tenantId = session.user.tenantId;
                if (!tenantId) {
                    throw new AppError('FORBIDDEN', 403, 'Tenant ID no encontrado');
                }

                const db = await connectDB();
                const asset = await db.collection('knowledge_assets').findOne({
                    _id: new ObjectId(id),
                    tenantId
                });

                if (!asset) {
                    throw new AppError('NOT_FOUND', 404, 'Activo de conocimiento no encontrado');
                }

                await log({
                    message: `Generating suggestions for asset: ${asset.filename}`,
                    details: { tenantId, assetId: id }
                });

                // Use PromptService to render the new AGENTIC_QUESTION_SUGGESTIONS prompt
                const { text: prompt, model } = await PromptService.getRenderedPrompt(
                    'AGENTIC_QUESTION_SUGGESTIONS',
                    {
                        filename: asset.filename,
                        componentType: asset.componentType || 'ELEVATOR_CORE',
                        model: asset.model || 'GENERIC_V1'
                    },
                    tenantId
                );

                const response = await callGeminiMini(prompt, tenantId, { correlationId, model });

                // Clean and parse the response
                let suggestions: string[] = [];
                try {
                    const cleanJson = response.replace(/```json|```/g, '').trim();
                    suggestions = JSON.parse(cleanJson);
                } catch (e) {
                    await log({
                        level: 'WARN',
                        message: 'Failed to parse AI suggestions, using fallback',
                        details: { response }
                    });
                    // Fallback suggestions
                    suggestions = [
                        "¿Cuáles son los pasos de montaje?",
                        "¿Cómo se resuelve el error más común?",
                        "Resume las especificaciones de seguridad"
                    ];
                }

                return NextResponse.json({
                    success: true,
                    suggestions
                });

            } catch (error: unknown) {
                return handleApiError(error, 'API_SUGGEST_QUESTIONS', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/knowledge-assets/[id]/suggest-questions', thresholdMs: 1000 });
