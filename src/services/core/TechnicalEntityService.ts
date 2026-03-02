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
        // 1. AI: Extract detected patterns
        const prompt = `Analiza el texto técnico y extrae modelos de componentes.\nTEXTO: ${entityText}\nResponde SOLO con un array JSON de objetos {type: string, model: string}.`;
        const responseText = await callGeminiMini(prompt, tenantId, { correlationId });

        // Use LlmJsonParser for resilient parsing (Rule #4 Governance)
        const detectedPatterns = LlmJsonParser.parse({
            raw: responseText,
            schema: z.array(DetectedPatternSchema),
            source: 'TECHNICAL_ENTITY_SERVICE_PATTERNS',
            correlationId,
            tenantId
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
            entityText,
            consolidatedContext,
            industry,
            tenantId,
            correlationId
        );

        return {
            resultsWithContext,
            detectedRisks,
            federatedInsights,
            patternsForStorage: resultsWithContext.map(r => ({
                type: r.type,
                model: r.model
            }))
        };
    }

    /**
     * Checks if an entity already exists (Deduplication)
     */
    static async findExistingByHash(md5Hash: string, tenantId: string): Promise<Entity | null> {
        return await technicalEntityRepository.findByHash(md5Hash, tenantId);
    }
}
