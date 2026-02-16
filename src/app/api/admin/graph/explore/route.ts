import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { runQuery } from '@/lib/neo4j';
import { AppError } from '@/lib/errors';
import { UserRole } from '@/types/roles';
import neo4j from 'neo4j-driver';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'AUTH_REQUIRED', code: 401 }, { status: 401 });
        }

        const userRole = session.user.role as UserRole;
        if (userRole !== UserRole.ADMIN && userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.TECHNICAL) {
            return NextResponse.json({ error: 'ACCESS_DENIED', code: 403 }, { status: 403 });
        }

        const tenantId = session.user.tenantId || 'default';
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search')?.toLowerCase() || '';
        const limitStr = searchParams.get('limit') || '300';
        const limit = parseInt(limitStr);

        let cypher = '';
        // Explicitly cast to Neo4j Integer to avoid '300.0' float error
        const params: any = { tenantId, limit: neo4j.int(Math.min(limit, 500)) };

        if (search) {
            // Search for specific nodes and their 1-hop neighborhood
            cypher = `
                MATCH (n)
                WHERE n.tenantId = $tenantId AND (toLower(n.name) CONTAINS $search OR toLower(n.id) CONTAINS $search)
                WITH n
                LIMIT 50
                OPTIONAL MATCH (n)-[r]-(m)
                WHERE m.tenantId = $tenantId
                RETURN n, r, m
                LIMIT $limit
             `;
            params.search = search;
        } else {
            // Return a random sample of the graph
            cypher = `
                MATCH (n)
                WHERE n.tenantId = $tenantId
                WITH n, rand() as r
                ORDER BY r
                LIMIT 50
                OPTIONAL MATCH (n)-[r_rel]-(m)
                WHERE m.tenantId = $tenantId
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
                const nodeData = {
                    id: n.properties.id,
                    label: n.labels[0] || 'Unknown',
                    ...n.properties
                };
                // Remove internal Neo4j properties if strictly needed, but ForceGraph can ignore them
                nodesMap.set(n.properties.id, nodeData);
            }

            if (m) {
                const mData = {
                    id: m.properties.id,
                    label: m.labels[0] || 'Unknown',
                    ...m.properties
                };
                nodesMap.set(m.properties.id, mData);
            }

            if (r && n && m) {
                links.push({
                    source: n.properties.id,
                    target: m.properties.id,
                    type: r.type,
                    // Force graph expects source/target as IDs initially
                });
            }
        });

        const nodes = Array.from(nodesMap.values());

        return NextResponse.json({
            data: { nodes, links },
            meta: { nodeCount: nodes.length, linkCount: links.length }
        });

    } catch (error: any) {
        console.error('[GRAPH_EXPLORE_API_ERROR]', error);
        if (error instanceof AppError) {
            return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
        }
        return NextResponse.json({ error: error.message || 'Internal Server Error', details: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined }, { status: 500 });
    }
}
