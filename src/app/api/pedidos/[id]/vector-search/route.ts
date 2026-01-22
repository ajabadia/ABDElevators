import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logEvento } from "@/lib/logger";
import { AppError, ValidationError } from "@/lib/errors";
import { pureVectorSearch } from "@/lib/rag-service";
import { VectorSearchQuerySchema } from "@/lib/schemas";
import { v4 as uuidv4 } from "uuid";
import { ZodError } from "zod";

/**
 * GET /api/pedidos/[id]/vector-search
 * Búsqueda vectorial pura sin procesamiento LLM.
 * SLA: < 200ms
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlacion_id = uuidv4();
    const inicio = Date.now();
    const { id: pedidoId } = await params;

    const session = await auth();
    try {
        if (!session?.user) {
            throw new AppError("UNAUTHORIZED", 401, "No autorizado");
        }

        const tenantId = session.user.tenantId;

        // Validar query params
        const { searchParams } = new URL(req.url);
        const query = searchParams.get("query");
        const limitParam = searchParams.get("limit");
        const minScoreParam = searchParams.get("min_score");

        const validatedParams = VectorSearchQuerySchema.parse({
            query,
            limit: limitParam,
            min_score: minScoreParam
        });

        await logEvento({
            nivel: 'INFO',
            origen: 'API_VECTOR_SEARCH',
            accion: 'SEARCH_INIT',
            mensaje: `Iniciando búsqueda vectorial para pedido ${pedidoId}`,
            correlacion_id,
            tenantId,
            materiaId: 'ELEVATORS',
            detalles: { pedidoId, query: validatedParams.query }
        });

        const results = await pureVectorSearch(
            validatedParams.query,
            tenantId,
            correlacion_id,
            {
                limit: validatedParams.limit,
                min_score: validatedParams.min_score
            }
        );

        const duracion = Date.now() - inicio;

        return NextResponse.json({
            success: true,
            pedidoId,
            duracion_ms: duracion,
            correlacion_id,
            resultados: results
        });

    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                { success: false, error: "Parámetros inválidos", details: error.issues },
                { status: 400 }
            );
        }

        if (error instanceof ValidationError) {
            return NextResponse.json(
                { success: false, error: "Parámetros inválidos", details: error.message },
                { status: 400 }
            );
        }

        if (error instanceof AppError) {
            return NextResponse.json(
                { success: false, error: error.message, code: error.code },
                { status: error.status }
            );
        }

        const unknownError = error as Error;
        await logEvento({
            nivel: 'ERROR',
            origen: 'API_VECTOR_SEARCH',
            accion: 'SEARCH_ERROR',
            mensaje: unknownError.message,
            correlacion_id,
            tenantId: session?.user?.tenantId,
            materiaId: 'ELEVATORS',
            stack: unknownError.stack
        });

        return NextResponse.json(
            { success: false, error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
