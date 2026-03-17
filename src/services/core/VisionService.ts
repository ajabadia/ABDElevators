import { PromptService } from "@/services/llm/prompt-service";
import { logEvento } from "@/lib/logger";
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { getGenAI, mapModelName } from "@/lib/gemini-client";
import { UsageService } from "@/services/ops/usage-service";
import { executeWithResilience, geminiResilience } from "@/lib/resilience";
import { AppError, ExternalServiceError } from "@/lib/errors";
import { Session } from 'next-auth';

const tracer = trace.getTracer('abd-rag-platform');

export class VisionService {
    /**
     * Analyzes a PDF multimodally to extract technical visual findings.
     * Uses Gemini 2.0/3 to "see" the document directly.
     */
    static async analyzePDFVisuals(
        pdfBuffer: Buffer,
        tenantId: string,
        correlationId: string,
        session?: Session | null
    ): Promise<Array<{ page: number; type: string; technical_description: string }>> {
        return tracer.startActiveSpan('gemini.analyze_pdf_visuals', {
            attributes: {
                'tenant.id': tenantId,
                'correlation.id': correlationId,
            }
        }, async (span) => {
            try {
                const start = Date.now();
                const genAI = getGenAI();

                // 1. Get dynamic prompt from Prompt Manager
                const { production } = await PromptService.getPromptWithShadow(
                    'VISUAL_ANALYZER',
                    {},
                    tenantId,
                    'GENERIC',
                    session || undefined
                );

                const modelName = mapModelName(production.model);
                const model = genAI.getGenerativeModel({ model: modelName });
                span.setAttribute('genai.model', modelName);

                // 2. Preparar input multimodal (Buffer -> Base64)
                const result = await executeWithResilience(
                    'VISION_SERVICE',
                    'ANALYZE_PDF_VISUALS',
                    () => model.generateContent([
                        { text: production.text },
                        {
                            inlineData: {
                                data: pdfBuffer.toString('base64'),
                                mimeType: 'application/pdf'
                            }
                        }
                    ]),
                    correlationId,
                    tenantId,
                    geminiResilience
                );

                const responseText = result.response.text();
                const duration = Date.now() - start;
                span.setAttribute('genai.duration_ms', duration);

                // 3. Parse JSON from response (Resilience Phase 192)
                const cleanJson = responseText
                    .replace(/```json/g, '')
                    .replace(/```/g, '')
                    .trim();

                const jsonMatch = cleanJson.match(/\[[\s\S]*\]/);
                if (!jsonMatch) {
                    await logEvento({
                        level: 'WARN',
                        source: 'VISION_SERVICE',
                        action: 'NO_VISUAL_DATA',
                        message: "Gemini did not detect visual elements or did not return JSON.",
                        correlationId,
                        details: { responsePreview: responseText.substring(0, 200) }
                    });
                    return [];
                }

                const findings = JSON.parse(jsonMatch[0]);

                // Tracking de uso (Fase 192 - Type safe cast)
                const usage = (result.response as unknown as { usageMetadata?: { totalTokenCount: number } }).usageMetadata;
                if (usage) {
                    span.setAttribute('genai.tokens', usage.totalTokenCount);
                    await UsageService.trackLLM(tenantId, usage.totalTokenCount, modelName, correlationId, session || undefined);
                }

                await logEvento({
                    level: 'INFO',
                    source: 'VISION_SERVICE',
                    action: 'ANALYSIS_COMPLETE',
                    message: `Visual analysis completed: ${findings.length} findings.`,
                    correlationId,
                    details: { durationMs: duration, findingsCount: findings.length }
                });

                span.setStatus({ code: SpanStatusCode.OK });
                return findings;

            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : String(error);
                const finalError = error instanceof AppError ? error : new ExternalServiceError(`Vision Analysis failed: ${message}`, error);
                
                span.recordException(error instanceof Error ? error : new Error(message));
                span.setStatus({ code: SpanStatusCode.ERROR, message });

                await logEvento({
                    level: 'ERROR',
                    source: 'VISION_SERVICE',
                    action: 'ANALYSIS_ERROR',
                    message: `Error in visual analysis: ${message}`,
                    correlationId,
                    stack: error instanceof Error ? error.stack : undefined
                });
                return [];
            } finally {
                span.end();
            }
        });
    }
}
