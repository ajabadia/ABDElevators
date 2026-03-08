import { NextRequest, NextResponse } from "next/server";
import { GraphEngine } from "@/core/engine/GraphEngine";
import { logEvento } from "@/lib/logger";
import { requirePermission } from '@/lib/auth';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { handleApiError } from "@/lib/errors";

/**
 * GET /api/core/graph
 * Obtiene el mapa semántico (nodos y relaciones) del tenant actual.
 * SLA: P95 < 500ms
 */
export const GET = withPerformanceSLA(async (req: NextRequest) => {
    const correlationId = crypto.randomUUID();

    try {
        const session = await requirePermission('technical:graph', 'read');
        const tenantId = session.user.tenantId || process.env.SINGLE_TENANT_ID || 'default_tenant';

        const graph = await GraphEngine.getInstance().getTenantGraph(tenantId);

        await logEvento({
            level: 'INFO',
            source: 'CORE_GRAPH',
            action: 'GET_GRAPH',
            message: 'Grafo obtenido correctamente',
            correlationId,
            details: { nodeCount: graph.nodes.length, linkCount: graph.links.length, tenantId }
        });

        return NextResponse.json({
            success: true,
            graph,
            correlationId
        });
    } catch (error: unknown) {
        return handleApiError(error, 'API_CORE_GRAPH_GET', correlationId);
    }
}, { endpoint: 'GET /api/core/graph', thresholdMs: 500 });

/**
 * POST /api/core/graph/sync
 * Fuerza la sincronización de las entidades al grafo.
 * SLA: P95 < 2000ms
 */
export const POST = withPerformanceSLA(async (req: NextRequest) => {
    const correlationId = crypto.randomUUID();

    try {
        const session = await requirePermission('technical:graph', 'update');
        const tenantId = session.user.tenantId || process.env.SINGLE_TENANT_ID || 'default_tenant';

        const engine = GraphEngine.getInstance();

        // Sincronizar entidades clave
        await engine.syncEntityToGraph('pedido', tenantId);
        await engine.syncEntityToGraph('usuario', tenantId);

        await logEvento({
            level: 'INFO',
            source: 'CORE_GRAPH',
            action: 'SYNC_GRAPH',
            message: 'Sincronización del grafo completada',
            correlationId,
            details: { tenantId }
        });

        return NextResponse.json({
            success: true,
            message: "Sincronización del grafo completada",
            correlationId
        });
    } catch (error: unknown) {
        return handleApiError(error, 'API_CORE_GRAPH_SYNC_POST', correlationId);
    }
}, { endpoint: 'POST /api/core/graph', thresholdMs: 2000 });
