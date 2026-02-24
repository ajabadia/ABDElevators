import { NextRequest, NextResponse } from "next/server"
import { enforcePermission } from "@/lib/guardian-guard"
import { hybridSearch } from '@abd/rag-engine/server';
import { UsageService } from "@/services/ops/usage-service"
import { AppError, handleApiError } from "@/lib/errors"
import { logEvento } from "@/lib/logger"
import { z } from "zod"
import { randomUUID } from "crypto"

const SearchRequestSchema = z.object({
    query: z.string().min(1).max(500),
    documentFilters: z.object({
        componentType: z.string().optional(),
        model: z.string().optional()
    }).optional(),
    limit: z.number().min(3).max(20).default(10)
})

export async function POST(req: NextRequest) {
    const correlationId = randomUUID()
    const startTime = Date.now()

    try {
        // AUTH & PERMISSIONS
        const userData = await enforcePermission("documents", "search")
        const tenantId = (userData as any).tenantId

        if (!tenantId) {
            throw new AppError("FORBIDDEN", 403, "Tenant ID not found")
        }

        // VALIDATION
        const body = await req.json()
        const validated = SearchRequestSchema.parse(body)

        // RAG SEARCH
        const ragResults = await hybridSearch(
            validated.query,
            tenantId,
            correlationId,
            'GENERIC', // Industry
            { limit: validated.limit }
        )

        if (ragResults.length === 0) {
            await logEvento({
                level: "WARN",
                source: "API_USER_SEARCH",
                action: "NO_RESULTS",
                message: `Search returned no results: "${validated.query}"`,
                correlationId,
                tenantId
            })

            return NextResponse.json({
                success: true,
                answer: "No encontré información específica en los manuales de tu organización. Intenta reformular la pregunta o incluye el modelo del ascensor.",
                sources: [],
                confidence: 0,
                durationMs: Date.now() - startTime,
                correlationId
            })
        }

        // AI SYNTHESIS
        const context = ragResults
            .slice(0, 5)
            .map((r, i) => `[${i + 1}] ${r.text}`)
            .join("\n\n")

        const synthesisPrompt = `Eres un asistente técnico experto en ascensores.
Pregunta: "${validated.query}"
Contexto de manuales técnicos:
${context}

Responde de forma clara y profesional en español. Máximo 3 oraciones. 
Cita tus fuentes si es posible usando [1], [2], etc. 
Si la información no es suficiente para responder con seguridad, indícalo.`

        let synthesisAnswer = ""
        try {
            const { getGenAI } = await import("@/lib/gemini-client")
            const genAI = getGenAI()
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
            const result = await model.generateContent(synthesisPrompt)
            synthesisAnswer = result.response.text()
        } catch (err) {
            // Fallback simple
            synthesisAnswer = ragResults[0].text.substring(0, 300) + "..."
        }

        // FORMAT RESPONSE
        const sources = ragResults.slice(0, 5).map(r => ({
            title: r.source,
            page: r.approxPage,
            snippet: r.text,
            type: r.type,
            cloudinaryUrl: r.cloudinaryUrl
        }))

        const confidence = ragResults.length > 0 ? (ragResults[0].score || 0.85) : 0

        // TRACK USAGE
        await UsageService.trackUsage(tenantId, {
            type: "VECTOR_SEARCH",
            value: 1,
            metadata: { queryLength: validated.query.length, resultsCount: ragResults.length }
        })

        // LOGGING
        await logEvento({
            level: "INFO",
            source: "API_USER_SEARCH",
            action: "SEARCH_SUCCESS",
            message: `Search completed: "${validated.query}"`,
            correlationId,
            tenantId,
            details: {
                resultsCount: ragResults.length,
                topScore: confidence,
                durationMs: Date.now() - startTime
            }
        })

        return NextResponse.json({
            success: true,
            answer: synthesisAnswer,
            sources,
            confidence: parseFloat(confidence.toFixed(2)),
            durationMs: Date.now() - startTime,
            correlationId
        })

    } catch (error) {
        return handleApiError(error, "API_USER_SEARCH_POST", correlationId)
    }
}
