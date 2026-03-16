import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { runQuery } from '@/lib/neo4j';
import { handleApiError } from '@/lib/errors';
import neo4j from 'neo4j-driver';
import { withCorrelation } from '@/lib/logger/with-correlation';

export const dynamic = 'force-dynamic';

async function GET_internal (req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_GRAPH', action: 'EXPLORE' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('knowledge:graph', 'read');
                const tenantId = session.user.tenantId;
                const { searchParams } = new URL(req.url);
                const search = searchParams.get('search')?.toLowerCase() || '';
                const limitStr = searchParams.get('limit') || '300';
                const limit = parseInt(limitStr);

                const relTypes = searchParams.get('relTypes')?.split(',').filter(Boolean) || [];
                const minWeight = parseFloat(searchParams.get('minWeight') || '0');

                await log({
                    message: `Exploring graph: search="${search}", limit=${limit}`,
                    details: { search, limit, minWeight },
                    tenantId
                });

                const params: any = {
                    tenantId,
                    limit: neo4j.int(Math.min(limit, 500)),
                    relTypes,
                    minWeight
                };

                let cypher = '';
                if (search) {
                    cypher = `
                        MATCH (n)
                        WHERE n.tenantId = $tenantId AND (toLower(n.name) CONTAINS $search OR toLower(n.id) CONTAINS $search)
                        WITH n
                        LIMIT 50
                        OPTIONAL MATCH (n)-[r]-(m)
                        WHERE m.tenantId = $tenantId
                        AND (size($relTypes) = 0 OR type(r) IN $relTypes)
                        AND (r.weight >= $minWeight OR r.weight IS NULL)
                        RETURN n, r, m
                        LIMIT $limit
                    `;
                    params.search = search;
                } else {
                    cypher = `
                        MATCH (n)
                        WHERE n.tenantId = $tenantId
                        WITH n, rand() as r_rand
                        ORDER BY r_rand
                        LIMIT 50
                        OPTIONAL MATCH (n)-[r_rel]-(m)
                        WHERE m.tenantId = $tenantId
                        AND (size($relTypes) = 0 OR type(r_rel) IN $relTypes)
                        AND (r_rel.weight >= $minWeight OR r_rel.weight IS NULL)
                        RETURN n, r_rel as r, m
                        LIMIT $limit
                    `;
                }

                const result = await runQuery(cypher, params);
                const nodesMap = new Map<string, any>();
                const links: any[] = [];

                result.records.forEach(record => {
                    const n = record.get('n');
                    const r = record.get('r');
                    const m = record.get('m');

                    if (n) {
                        nodesMap.set(n.properties.id, { id: n.properties.id, label: n.labels[0] || 'Unknown', ...n.properties });
                    }
                    if (m) {
                        nodesMap.set(m.properties.id, { id: m.properties.id, label: m.labels[0] || 'Unknown', ...m.properties });
                    }
                    if (r && n && m) {
                        links.push({ source: n.properties.id, target: m.properties.id, type: r.type, weight: r.properties.weight || 0.5 });
                    }
                });

                const nodes = Array.from(nodesMap.values());

                await log({
                    message: 'Graph exploration successful',
                    details: { nodes: nodes.length, links: links.length },
                    tenantId
                });

                return NextResponse.json({
                    success: true,
                    data: { nodes, links },
                    meta: { nodeCount: nodes.length, linkCount: links.length },
                    correlationId
                });

            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_GRAPH_EXPLORE_GET', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/graph/explore', thresholdMs: 5000 });
