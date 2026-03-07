import { Entity, IndustryType } from '@/lib/schemas';
import { technicalEntityRepository } from '@/lib/repositories/TechnicalEntityRepository';
import { callGeminiMini } from '@/services/llm/llm-service';
import { RagService } from '@/services/core/RagService';
import { RiskService } from '@/services/security/RiskService';
import { FederatedKnowledgeService } from '@/services/core/FederatedKnowledgeService';
import { LlmJsonParser } from '@/lib/llm-core/LlmJsonParser';
import { z } from 'zod';
import { AppError } from '@/lib/errors';

const DetectedPatternSchema = z.object({
    type: z.string(),
    model: z.string()
});

/**
 * 🏢 TechnicalEntityService
 * Orchestrates the analysis of technical entities.
 * Standardized for Era 8 (Zero any, explicit types, resilient parsing).
 */
export class TechnicalEntityService {
    /**
     * Performs a full RAG analysis of an entity text
     */
    static async performFullAnalysis(
        entityText: string,
        filename: string,
        tenantId: string,
        industry: IndustryType,
        correlationId: string,
        fileMd5: string
    ) {
        const { logEvento } = await import('@/lib/logger');
        const start = Date.now();

        await logEvento({
            level: 'INFO',
            source: 'TECHNICAL_ENTITY_SERVICE',
            action: 'ANALYSIS_START',
            message: `Starting analysis for file: ${filename}`,
            correlationId,
            tenantId,
            details: { filename, industry, fileMd5 }
        });

        // 🛡️ Rule #13: PII Masking (Placeholder for SecurityService integration)
        // In a real scenario, we would call SecurityService.maskPII(entityText)
        const sanitizedText = entityText.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_HIDDEN]');

        try {
            // 1. AI: Extract detected patterns
            const prompt = `Analiza el texto técnico y extrae modelos de componentes.\nTEXTO: ${sanitizedText}\nResponde SOLO con un array JSON de objetos {type: string, model: string}.`;
            const responseText = await callGeminiMini(prompt, tenantId, { correlationId });

            // Use LlmJsonParser for resilient parsing (Rule #4 Governance)
            const detectedPatterns = LlmJsonParser.parse({
                raw: responseText,
                schema: z.array(DetectedPatternSchema),
                source: 'TECHNICAL_ENTITY_SERVICE_PATTERNS',
                correlationId,
                tenantId
            });

            await logEvento({
                level: 'DEBUG',
                source: 'TECHNICAL_ENTITY_SERVICE',
                action: 'PATTERNS_EXTRACTED',
                message: `Extracted ${detectedPatterns.length} patterns from text`,
                correlationId,
                tenantId,
                details: { count: detectedPatterns.length }
            });

            // 2. RAG: For each pattern, search relevant context
            const resultsWithContext = await Promise.all(
                detectedPatterns.map(async (m) => {
                    const query = `${m.type} model ${m.model}`;
                    const context = await RagService.performTechnicalSearch(query, tenantId, correlationId, 2, industry);
                    return {
                        ...m,
                        ragContext: context
                    };
                })
            );

            // 3. Federated Discovery
            const federatedInsights = await FederatedKnowledgeService.searchGlobalPatterns(
                detectedPatterns.map((m) => `${m.type} ${m.model}`).join(' '),
                tenantId,
                correlationId,
                3
            );

            // 4. Risk Detection
            const consolidatedContext = resultsWithContext
                .map(r => `Component ${r.model}: ${r.ragContext.map((c) => c.text).join(' ')}`)
                .join('\n');

            const detectedRisks = await RiskService.analyzeRisks(
                sanitizedText,
                consolidatedContext,
                industry,
                tenantId,
                correlationId
            );

            const duration = Date.now() - start;
            await logEvento({
                level: 'INFO',
                source: 'TECHNICAL_ENTITY_SERVICE',
                action: 'ANALYSIS_COMPLETE',
                message: `Analysis completed successfully in ${duration}ms`,
                correlationId,
                tenantId,
                details: {
                    duration_ms: duration,
                    patternsCount: detectedPatterns.length,
                    risksCount: detectedRisks.length
                }
            });

            return {
                resultsWithContext,
                detectedRisks,
                federatedInsights,
                patternsForStorage: resultsWithContext.map(r => ({
                    type: r.type,
                    model: r.model
                }))
            };
        } catch (error: unknown) {
            await logEvento({
                level: 'ERROR',
                source: 'TECHNICAL_ENTITY_SERVICE',
                action: 'ANALYSIS_ERROR',
                message: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                correlationId,
                tenantId,
                details: { error: error instanceof Error ? error.message : String(error) }
            });
            throw error;
        }
    }

    /**
     * Checks if an entity already exists (Deduplication)
     */
    static async findExistingByHash(md5Hash: string, tenantId: string): Promise<Entity | null> {
        return await technicalEntityRepository.findByHash(md5Hash, tenantId);
    }
}
