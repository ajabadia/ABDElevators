import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { resetGeminiCircuitBreaker } from '@/lib/resilience';
import { logEvento } from '@/lib/logger';
import { connectDB } from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { handleApiError } from '@/lib/errors';

/**
 * Endpoint de EMERGENCIA para resetear el Circuit Breaker y diagnosticar RAG.
 * POST /api/admin/system/reset-rag
 */
async function POST_internal (req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        // 🔐 [SECURITY] Restrict to authorized personnel (was SUPER_ADMIN)
        await requirePermission('system:rag', 'manage');

        await logEvento({
            level: 'INFO',
            source: 'ADMIN_SYSTEM',
            action: 'RESET_RAG_START',
            message: 'Iniciando reset de emergencia del sistema RAG...',
            correlationId
        });

        // 1. Reset Circuit Breaker (In-memory)
        resetGeminiCircuitBreaker();

        // 2. Connectivity Test with v1beta
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }, { apiVersion: 'v1beta' });
        const testResult = await model.generateContent("Hola, responde con 'OK' si me escuchas.");
        const connectivity = testResult.response.text();

        // 3. Database & Chunks check
        const db = await connectDB();
        const chunkCount = await db.collection('document_chunks').countDocuments({});
        const promptCount = await db.collection('prompts').countDocuments({});

        await logEvento({
            level: 'INFO',
            source: 'ADMIN_SYSTEM',
            action: 'RESET_RAG_SUCCESS',
            message: 'Sistema RAG reseteado y verificado exitosamente.',
            correlationId,
            details: {
                connectivity,
                chunkCount,
                promptCount,
                duration_ms: Date.now() - start
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
        return handleApiError(error, 'ADMIN_SYSTEM_RESET_RAG', correlationId);
    }
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/system/reset-rag', thresholdMs: 1000 });
