import { NextRequest, NextResponse } from "next/server"
import { enforcePermission } from "@/lib/guardian-guard"
import { hybridSearch } from '@abd/rag-engine/server';
import { UsageService } from "@/services/ops/usage-service"
import { AppError, handleApiError } from "@/lib/errors"
import { logEvento } from "@/lib/logger"
import { PromptRunner } from "@/lib/llm-core/PromptRunner"
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

        let synthesisAnswer = ""
        try {
            synthesisAnswer = await PromptRunner.runText({
                key: 'USER_SEARCH_SYNTHESIS',
                variables: { query: validated.query, context },
                tenantId,
                correlationId,
                temperature: 0.2
            });
        } catch (error: unknown) {
            // Fallback simple
            synthesisAnswer = ragResults[0].text.substring(0, 300) + "..."
            await logEvento({
                level: "WARN",
                source: "API_USER_SEARCH",
                action: "AI_SYNTHESIS_FAILED",
                message: `Synthesis failed, falling back to raw text`,
                correlationId,
                tenantId,
                details: { error: error instanceof Error ? error.message : String(error) }
            });
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

    } catch (error: unknown) {
        return handleApiError(error, "API_USER_SEARCH_POST", correlationId)
    }
}
