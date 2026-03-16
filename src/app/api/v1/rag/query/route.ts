import { NextRequest, NextResponse } from 'next/server';
import { hybridSearch, performTechnicalSearch, MultilingualSearchService } from '@abd/rag-engine/server';
import { RagService } from '@/services/core/RagService';
import { publicApiHandler } from '@/lib/api-handler';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { z } from 'zod';
import { withCorrelation } from '@/lib/logger/with-correlation';

const QuerySchema = z.object({
    query: z.string().min(1, "Query cannot be empty"),
    limit: z.number().int().min(1).max(20).default(5),
    strategy: z.enum(['standard', 'hybrid', 'multilingual', 'hierarchical']).default('standard')
});

export const POST = withPerformanceSLA(
    publicApiHandler(
        'rag:query',
        async (req, { tenantId, correlationId, spaceId }) => {
            return withCorrelation(
                { level: 'INFO', source: 'API_V1_RAG', action: 'QUERY', correlationId },
                async ({ log }) => {
                    const body = await req.json();
                    const { query, limit, strategy } = QuerySchema.parse(body);

                    await log({
                        message: `RAG Query started with strategy: ${strategy}`,
                        details: { query: query.substring(0, 50), limit, strategy, spaceId },
                        tenantId
                    });

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
                                onTrace: (m: string) => log({ level: 'DEBUG', message: `[Hierarchical] ${m}`, tenantId })
                            });
                            results = hResult.sources;
                            break;
                        case 'standard':
                        default:
                            results = await performTechnicalSearch(query, tenantId, correlationId, limit, 'ELEVATORS', 'PRODUCTION', spaceId);
                            break;
                    }

                    await log({
                        message: `RAG Query completed with ${results.length} results`,
                        details: { count: results.length, strategy },
                        tenantId
                    });

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
            );
        }
    ),
    { endpoint: 'V1_RAG_QUERY', thresholdMs: 2000, source: 'API_V1' }
);
