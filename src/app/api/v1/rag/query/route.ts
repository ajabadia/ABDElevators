import { NextRequest, NextResponse } from 'next/server';
import { hybridSearch, performTechnicalSearch, MultilingualSearchService } from '@abd/rag-engine/server';
import { RagResult } from '@abd/rag-engine';
import { publicApiHandler } from '@/lib/api-handler';
import { z } from 'zod';

const QuerySchema = z.object({
    query: z.string().min(1, "Query cannot be empty"),
    limit: z.number().int().min(1).max(20).default(5),
    strategy: z.enum(['standard', 'hybrid', 'multilingual']).default('standard')
});

export const POST = publicApiHandler(
    'rag:query',
    async (req, { tenantId, correlationId, spaceId }) => {
        const body = await req.json();
        const { query, limit, strategy } = QuerySchema.parse(body);

        let results;

        switch (strategy) {
            case 'hybrid':
                results = await hybridSearch(query, tenantId, correlationId, limit, 'PRODUCTION', 'ELEVATORS', spaceId);
                break;
            case 'multilingual':
                results = await MultilingualSearchService.performMultilingualSearch(query, tenantId, correlationId, limit, 'ELEVATORS', 'PRODUCTION'); // Still needs spaceId update if needed
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
);
