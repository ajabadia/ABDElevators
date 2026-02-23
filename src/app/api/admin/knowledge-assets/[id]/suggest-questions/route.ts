import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AppError, handleApiError } from '@/lib/errors';
import { PromptService } from '@/lib/prompt-service';
import { callGeminiMini } from '@/lib/llm';
import { connectDB } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { logEvento } from '@/lib/logger';
import crypto from 'crypto';

/**
 * GET /api/admin/knowledge-assets/[id]/suggest-questions
 * Generates dynamic, proactive question suggestions for a specific asset.
 * Phase 216.3: Agentic Quick-Analysis
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const correlationId = crypto.randomUUID();
    const { id } = params;

    try {
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

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

        await logEvento({
            level: 'INFO',
            source: 'API_SUGGEST_QUESTIONS',
            action: 'GENERATE_SUGGESTIONS',
            message: `Generating suggestions for asset: ${asset.filename}`,
            tenantId,
            correlationId
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
            console.error('[SUGGEST_QUESTIONS] Failed to parse suggestions:', response);
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

    } catch (error: any) {
        return handleApiError(error, 'API_SUGGEST_QUESTIONS', correlationId);
    }
}
