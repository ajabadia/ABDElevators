import { EntitySchema, IndustryType } from '../schemas';
import { getTenantCollection } from '../db-tenant';
import { analyzeEntityWithGemini } from '../llm';
import { performTechnicalSearch } from '../rag-service';
import { RiskService } from '../risk-service';
import { FederatedKnowledgeService } from '../federated-knowledge-service';
import { logEvento } from '../logger';
import crypto from 'crypto';

/**
 * TechnicalEntityService: Orchestrates the analysis of technical entities (Phase 105 Hygiene)
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
        const detectedPatterns = await analyzeEntityWithGemini('entity', entityText, tenantId, correlationId);

        // 2. RAG: For each pattern, search relevant context
        const resultsWithContext = await Promise.all(
            detectedPatterns.map(async (m: { type: string; model: string }) => {
                const query = `${m.type} model ${m.model}`;
                const context = await performTechnicalSearch(query, tenantId, correlationId, 2, industry);
                return {
                    ...m,
                    ragContext: context
                };
            })
        );

        // 3. Federated Discovery
        const federatedInsights = await FederatedKnowledgeService.searchGlobalPatterns(
            detectedPatterns.map((m: any) => `${m.type} ${m.model}`).join(' '),
            tenantId,
            correlationId,
            3
        );

        // 4. Risk Detection
        const consolidatedContext = resultsWithContext
            .map(r => `Component ${r.model}: ${r.ragContext.map((c: any) => c.text).join(' ')}`)
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
    static async findExistingByHash(md5Hash: string, tenantId: string) {
        const entitiesCollection = await getTenantCollection('entities');
        return await entitiesCollection.findOne({
            md5Hash,
            tenantId
        });
    }
}
