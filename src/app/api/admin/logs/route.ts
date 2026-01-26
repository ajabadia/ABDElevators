import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectLogsDB } from "@/lib/db";
import { AppError, ValidationError } from "@/lib/errors";
import { logEvento } from "@/lib/logger";

/**
 * API para consultar logs de la aplicación.
 * Solo accesible por SUPER_ADMIN o ADMIN.
 * Regla de Oro #4 y #8.
 */
export async function GET(request: NextRequest) {
    const inicio = Date.now();
    const correlacion_id = crypto.randomUUID();

    try {
        const session = await auth();

        // 🛡️ Verificación de roles (Seguridad Grado Bancario)
        if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
            throw new AppError("UNAUTHORIZED", 401, "No tiene permisos para ver los logs");
        }

        const { searchParams } = new URL(request.url);

        // Parámetros de filtrado y paginación
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");
        const nivel = searchParams.get("nivel");
        const origen = searchParams.get("origen");
        const search = searchParams.get("search");

        const db = await connectLogsDB();
        const query: any = {};

        if (nivel) query.nivel = nivel;
        if (origen) query.origen = origen;
        if (search) {
            query.$or = [
                { mensaje: { $regex: search, $options: "i" } },
                { accion: { $regex: search, $options: "i" } },
                { correlacion_id: search }
            ];
        }

        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            db.collection("logs_aplicacion")
                .find(query)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .toArray(),
            db.collection("logs_aplicacion").countDocuments(query)
        ]);

        const duracion = Date.now() - inicio;

        // SLA: P95 < 200ms, sugerido en las reglas.
        if (duracion > 500) {
            await logEvento({
                nivel: 'WARN',
                origen: 'API_ADMIN_LOGS',
                accion: 'PERFORMANCE_ALERT',
                mensaje: `Consulta de logs lenta: ${duracion}ms`,
                correlacion_id,
                detalles: { duracion, total, query }
            });
        }

        return NextResponse.json({
            success: true,
            data: logs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        console.error("Error fetching logs:", error);
        if (error instanceof AppError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        return NextResponse.json({ error: "Error interno al recuperar logs" }, { status: 500 });
    }
}
