import { NextRequest, NextResponse } from 'next/server';
import { hybridSearch, performTechnicalSearch, MultilingualSearchService } from '@abd/rag-engine/server';
import { RagResult } from '@abd/rag-engine';
import { RagService } from '@/services/core/RagService';
import { publicApiHandler } from '@/lib/api-handler';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { z } from 'zod';

const QuerySchema = z.object({
    query: z.string().min(1, "Query cannot be empty"),
    limit: z.number().int().min(1).max(20).default(5),
    strategy: z.enum(['standard', 'hybrid', 'multilingual', 'hierarchical']).default('standard')
});

export const POST = withPerformanceSLA(
    publicApiHandler(
        'rag:query',
        async (req, { tenantId, correlationId, spaceId }) => {
            const body = await req.json();
            const { query, limit, strategy } = QuerySchema.parse(body);

            let results;

            switch (strategy) {
                case 'hybrid':
                    results = await hybridSearch(query, tenantId, correlationId, 'ELEVATORS', {
                        limit,
                        environment: 'PRODUCTION',
                        spaceId
                    });
                    break;
                case 'multilingual':
                    results = await MultilingualSearchService.performMultilingualSearch(query, tenantId, correlationId, limit, 'ELEVATORS', 'PRODUCTION', spaceId);
                    break;
                case 'hierarchical':
                    const hResult = await RagService.hierarchicalSearch(query, tenantId, correlationId, {
                        limit,
                        spaceId,
                        onTrace: (m: string) => console.log(`[HierarchicalV1] ${m}`)
                    });
                    results = hResult.sources;
                    // Note: Here we might want to return the full context too, but keeping API consistent with RagResult[] for now
                    break;
                case 'standard':
                default:
                    results = await performTechnicalSearch(query, tenantId, correlationId, limit, 'ELEVATORS', 'PRODUCTION', spaceId);
                    break;
            }

            return NextResponse.json({
                success: true,
                meta: {
                    correlationId,
                    strategy,
                    count: results.length
                },
                data: results
            });
        }
    ),
    { endpoint: 'V1_RAG_QUERY', thresholdMs: 2000, source: 'API_V1' }
);
