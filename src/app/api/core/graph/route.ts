import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { GraphEngine } from "@/core/engine/GraphEngine";
import { logEvento } from "@/lib/logger";

/**
 * GET /api/core/graph
 * Obtiene el mapa semántico (nodos y relaciones) del tenant actual.
 */
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const tenantId = session.user.tenantId || process.env.SINGLE_TENANT_ID || 'default_tenant';
    const correlacion_id = crypto.randomUUID();

    try {
        const graph = await GraphEngine.getInstance().getTenantGraph(tenantId);

        await logEvento({
            nivel: 'INFO',
            origen: 'CORE_GRAPH',
            accion: 'GET_GRAPH',
            mensaje: 'Grafo obtenido correctamente',
            correlacion_id,
            detalles: { nodeCount: graph.nodes.length, linkCount: graph.links.length }
        });

        return NextResponse.json({
            success: true,
            graph,
            correlacion_id
        });
    } catch (error: any) {
        console.error('[CORE_GRAPH] Error:', error);
        return NextResponse.json({
            success: false,
            message: "Error al obtener el grafo semántico",
            error: error.message
        }, { status: 500 });
    }
}

/**
 * POST /api/core/graph/sync
 * Fuerza la sincronización de las entidades al grafo.
 */
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const tenantId = session.user.tenantId || process.env.SINGLE_TENANT_ID || 'default_tenant';

    try {
        const engine = GraphEngine.getInstance();

        // Sincronizar entidades clave
        await engine.syncEntityToGraph('pedido', tenantId);
        await engine.syncEntityToGraph('usuario', tenantId);

        return NextResponse.json({
            success: true,
            message: "Sincronización del grafo completada"
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            message: "Error en la sincronización del grafo",
            error: error.message
        }, { status: 500 });
    }
}
