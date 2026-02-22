
import { NextResponse } from 'next/server';
import { resetGeminiCircuitBreaker, geminiResilience } from '@/lib/resilience';
import { logEvento } from '@/lib/logger';
import { connectDB } from '@/lib/db';
import { AI_MODEL_IDS } from '@/lib/constants/ai-models';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Endpoint de EMERGENCIA para resetear el Circuit Breaker y diagnosticar RAG.
 * POST /api/admin/system/reset-rag
 */
export async function POST(req: Request) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        console.log("♻️  [ADMIN] Iniciando reset de emergencia del sistema RAG...");

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
                durationMs: Date.now() - start
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

    } catch (error: any) {
        console.error("❌ [ADMIN] Error en reset de RAG:", error);

        await logEvento({
            level: 'ERROR',
            source: 'ADMIN_SYSTEM',
            action: 'RESET_RAG_FAILURE',
            message: `Fallo en el reset de emergencia: ${error.message}`,
            correlationId,
            details: { error: error.message, stack: error.stack }
        });

        return NextResponse.json({
            success: false,
            error: error.message,
            status: "RECOVERY_FAILED"
        }, { status: 500 });
    }
}
