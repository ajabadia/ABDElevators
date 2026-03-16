import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { resetGeminiCircuitBreaker } from '@/lib/resilience';
import { connectDB } from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_MODEL_IDS } from '@/lib/constants/ai-models';
import { handleApiError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * Endpoint de EMERGENCIA para resetear el Circuit Breaker y diagnosticar RAG.
 * POST /api/admin/system/reset-rag
 */
async function POST_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'WARN', source: 'ADMIN_SYSTEM', action: 'RESET_RAG' },
        async ({ log, correlationId }) => {
            try {
                // 🔐 [SECURITY] Restrict to authorized personnel
                await requirePermission('system:rag', 'manage');

                await log({
                    level: 'WARN',
                    message: 'Iniciando reset de emergencia del sistema RAG...',
                    details: { performedBy: (req as any).user?.email }
                });

                // 1. Reset Circuit Breaker (In-memory)
                resetGeminiCircuitBreaker();

                // 2. Connectivity Test with v1beta
                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
                const model = genAI.getGenerativeModel({ model: AI_MODEL_IDS.GEMINI_2_5_FLASH }, { apiVersion: 'v1beta' });
                const testResult = await model.generateContent("Hola, responde con 'OK' si me escuchas.");
                const connectivity = testResult.response.text();

                // 3. Database & Chunks check
                const db = await connectDB();
                const { connectConfigDB } = await import('@/lib/db');
                const configDb = await connectConfigDB();
                
                const chunkCount = await db.collection('document_chunks').countDocuments({});
                const promptCount = await configDb.collection('prompts').countDocuments({});

                await log({
                    level: 'INFO',
                    message: 'Sistema RAG reseteado y verificado exitosamente.',
                    details: {
                        connectivity,
                        chunkCount,
                        promptCount,
                        circuitBreaker: "RESET_SUCCESSFUL"
                    }
                });

                return NextResponse.json({
                    success: true,
                    status: "RECOVERY_COMPLETED",
                    diagnostics: {
                        connectivity,
                        chunkCount,
                        promptCount,
                        circuitBreaker: "RESET_REQUESTED",
                        apiVersion: "v1beta"
                    }
                });

            } catch (error: unknown) {
                return handleApiError(error, 'ADMIN_SYSTEM_RESET_RAG_POST', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/system/reset-rag', thresholdMs: 1000 });
