import { RagResult } from '@abd/rag-engine';
import { VerticalRegistryService } from './vertical-registry';
import { IndustryType, TenantId } from '@/lib/schemas';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * RagService (FASE 222: Consolidation)
 * Entry point for RAG operations, wrapping the low-level rag-engine package.
 */
export class RagService {
    /**
     * Unified search entry point (ERA 15 Standard)
     * Automatically applies vertical-specific presets.
     */
    static async search(
        query: string,
        tenantId: TenantId,
        correlationId?: string,
        industry: IndustryType = 'GENERIC',
        options?: { 
            limit?: number;
            type?: 'TECHNICAL' | 'HYBRID' | 'HIERARCHICAL';
            spaceId?: string;
            filename?: string;
            [key: string]: unknown 
        }
    ): Promise<RagResult[]> {
        const { performTechnicalSearch, hybridSearch, hierarchicalSearch } = await import('@abd/rag-engine/server');
        return await withCorrelation(
            { level: 'INFO', source: 'RAG_SERVICE', action: 'SEARCH', correlationId, tenantId },
            async ({ log, correlationId: activeCorrelationId }) => {
                const config = VerticalRegistryService.getConfig(industry);
                const presets = config.ragPresets;
                
                const limit = options?.limit || presets.topK || 5;
                const searchType = options?.type || 'TECHNICAL';

                await log({
                    message: `Executing ${searchType} search for industry: ${industry}`,
                    details: { query, industry, limit, searchType, presets }
                });

                let results: RagResult[] = [];

                switch (searchType) {
                    case 'HYBRID':
                        results = await hybridSearch(query, tenantId, activeCorrelationId, industry, options);
                        break;
                    case 'HIERARCHICAL':
                        const hResult = await hierarchicalSearch(query, tenantId, activeCorrelationId, options);
                        results = (hResult as any).sources || [];
                        break;
                    case 'TECHNICAL':
                    default:
                        results = await performTechnicalSearch(
                            query, 
                            tenantId, 
                            activeCorrelationId, 
                            limit, 
                            industry, 
                            undefined, // environment
                            options?.spaceId as string, 
                            options?.filename as string
                        );
                }

                return results;
            }
        );
    }

    /**
     * Perform a technical search across chunks.
     * @deprecated Use RagService.search() with type: 'TECHNICAL'
     */
    static async performTechnicalSearch(
        query: string,
        tenantId: TenantId,
        correlationId?: string,
        limit: number = 5,
        industry: IndustryType = 'GENERIC',
        options?: { environment?: string; spaceId?: string; filename?: string;[key: string]: unknown }
    ) {
        return this.search(query, tenantId, correlationId, industry, { ...options, limit, type: 'TECHNICAL' });
    }

    /**
     * Get relevant documents for a query.
     */
    static async getRelevantDocuments(query: string, tenantId: TenantId, correlationId?: string, limit: number = 5) {
        return withCorrelation({ level: 'INFO', source: 'RAG_SERVICE', action: 'GET_RELEVANT', correlationId, tenantId }, async ({ correlationId: activeCorrelationId }) => {
             const { getRelevantDocuments } = await import('@abd/rag-engine/server');
             return await getRelevantDocuments(query, tenantId, { topK: limit, correlationId: activeCorrelationId });
        });
    }

    /**
     * Hybrid search across chunks.
     * @deprecated Use RagService.search() with type: 'HYBRID'
     */
    static async hybridSearch(query: string, tenantId: TenantId, correlationId?: string, industry: IndustryType = 'GENERIC', options?: Record<string, unknown>) {
        return this.search(query, tenantId, correlationId, industry, { ...options, type: 'HYBRID' });
    }

    /**
     * Hierarchical tiered search (Phase 306).
     * @deprecated Use RagService.search() with type: 'HIERARCHICAL'
     */
    static async hierarchicalSearch(query: string, tenantId: TenantId, correlationId?: string, options?: Record<string, any>) {
        return this.search(query, tenantId, correlationId, 'GENERIC', { ...options, type: 'HIERARCHICAL' });
    }
}

export type { RagResult };
