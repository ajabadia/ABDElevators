import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { logEvento } from "@/lib/logger";
import { AppError, handleApiError } from "@/lib/errors";
import { AuditoriaValidacionSchema } from "@/lib/schemas";
import { v4 as uuidv4 } from "uuid";

/**
 * POST /api/pedidos/[id]/validate
 * Guarda la validación final del empleado para un pedido.
 * Implementa Audit Trail completo (Fase 6.4).
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlacion_id = uuidv4();
    const { id: pedidoId } = await params;

    try {
        const session = await auth();
        if (!session?.user) {
            throw new AppError("UNAUTHORIZED", 401, "No autorizado");
        }

        const body = await req.json();

        // Validar el cuerpo de la petición con el esquema de auditoría
        const validatedData = AuditoriaValidacionSchema.parse({
            ...body,
            pedidoId,
            usuarioId: session.user.id,
            tenantId: session.user.tenantId,
        });

        const db = await connectDB();
        const collection = db.collection('validaciones_empleados');

        const result = await collection.insertOne(validatedData);

        // Actualizar el estado del pedido a 'analizado'
        await db.collection('pedidos').updateOne(
            { _id: new (await import("mongodb")).ObjectId(pedidoId) },
            { $set: { estado: 'analizado', validado: true, fecha_validacion: new Date() } }
        );

        await logEvento({
            nivel: 'INFO',
            origen: 'API_VALIDATE',
            accion: 'VALIDATION_SAVED',
            mensaje: `Validación guardada para pedido ${pedidoId}`,
            correlacion_id,
            tenantId: session.user.tenantId,
            materiaId: 'ELEVATORS',
            detalles: { validacion_id: result.insertedId, usuario: session.user.email }
        });

        return NextResponse.json({
            success: true,
            validacion_id: result.insertedId,
            correlacion_id
        });

    } catch (error) {
        return handleApiError(error, 'API_PEDIDO_VALIDATE', correlacion_id);
    }
}
