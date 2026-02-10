import { PromptService } from "@/lib/prompt-service";
import { logEvento } from "@/lib/logger";
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { getGenAI, mapModelName } from "./gemini-client";
import { UsageService } from "./usage-service";

const tracer = trace.getTracer('abd-rag-platform');

export class VisionService {
    /**
     * Analiza un PDF de forma multimodal para extraer hallazgos visuales técnicos.
     * Usa Gemini 2.0/3 para "ver" el documento directamente.
     */
    static async analyzePDFVisuals(
        pdfBuffer: Buffer,
        tenantId: string,
        correlationId: string,
        session?: any
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

                // 1. Obtener prompt dinámico del Prompt Manager
                const { production } = await PromptService.getPromptWithShadow(
                    'VISUAL_ANALYZER',
                    {},
                    tenantId,
                    'GENERIC',
                    session
                );

                const modelName = mapModelName(production.model);
                span.setAttribute('genai.model', modelName);

                const model = genAI.getGenerativeModel({ model: modelName });

                // 2. Preparar input multimodal (Buffer -> Base64)
                const result = await model.generateContent([
                    { text: production.text },
                    {
                        inlineData: {
                            data: pdfBuffer.toString('base64'),
                            mimeType: 'application/pdf'
                        }
                    }
                ]);

                const responseText = result.response.text();
                const duration = Date.now() - start;
                span.setAttribute('genai.duration_ms', duration);

                // 3. Parsear JSON de la respuesta
                const jsonMatch = responseText.match(/\[[\s\S]*\]/);
                if (!jsonMatch) {
                    await logEvento({
                        level: 'WARN',
                        source: 'VISION_SERVICE',
                        action: 'NO_VISUAL_DATA',
                        message: "Gemini no detectó elementos visuales o no devolvió JSON.",
                        correlationId,
                        details: { responsePreview: responseText.substring(0, 200) }
                    });
                    return [];
                }

                const findings = JSON.parse(jsonMatch[0]);

                // Tracking de uso
                const usage = (result.response as any).usageMetadata;
                if (usage) {
                    span.setAttribute('genai.tokens', usage.totalTokenCount);
                    await UsageService.trackLLM(tenantId, usage.totalTokenCount, modelName, correlationId, session);
                }

                await logEvento({
                    level: 'INFO',
                    source: 'VISION_SERVICE',
                    action: 'ANALYSIS_COMPLETE',
                    message: `Análisis visual completado: ${findings.length} hallazgos.`,
                    correlationId,
                    details: { durationMs: duration, findingsCount: findings.length }
                });

                span.setStatus({ code: SpanStatusCode.OK });
                return findings;

            } catch (error: any) {
                span.recordException(error);
                span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });

                await logEvento({
                    level: 'ERROR',
                    source: 'VISION_SERVICE',
                    action: 'ANALYSIS_ERROR',
                    message: `Error en análisis visual: ${error.message}`,
                    correlationId,
                    stack: error.stack
                });
                return [];
            } finally {
                span.end();
            }
        });
    }
}
