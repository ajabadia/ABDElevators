import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { ValidacionSchema } from '@/lib/schemas';
import { AppError, handleApiError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';

/**
 * POST /api/pedidos/[id]/validate
 * Guarda la validación humana de un pedido (Fase 6.4)
 * SLA: P95 < 300ms
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const inicio = Date.now();
    const correlacion_id = crypto.randomUUID();

    try {
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const { id: pedidoId } = await params;
        const body = await req.json();

        // Validar con Zod (Regla de Oro #2)
        const validated = ValidacionSchema.parse({
            ...body,
            pedidoId,
            tenantId: (session.user as any).tenantId,
            validadoPor: session.user.id,
            nombreTecnico: session.user.name,
        });

        const db = await connectDB();

        // Verificar que el pedido existe y pertenece al tenant
        const pedido = await db.collection('pedidos').findOne({
            _id: new ObjectId(pedidoId),
            tenantId: validated.tenantId
        });

        if (!pedido) {
            throw new AppError('NOT_FOUND', 404, 'Pedido no encontrado');
        }

        // Guardar validación en audit trail
        const result = await db.collection('validaciones_empleados').insertOne({
            ...validated,
            timestamp: new Date(),
        });

        // Actualizar estado del pedido si fue aprobado completamente
        if (validated.estadoGeneral === 'APROBADO') {
            await db.collection('pedidos').updateOne(
                { _id: new ObjectId(pedidoId) },
                {
                    $set: {
                        validado: true,
                        validadoPor: session.user.id,
                        validadoAt: new Date(),
                    }
                }
            );
        }

        const duracion = Date.now() - inicio;

        await logEvento({
            nivel: 'INFO',
            origen: 'API_VALIDACION',
            accion: 'VALIDACION_GUARDADA',
            mensaje: `Validación ${validated.estadoGeneral} para pedido ${pedidoId}`,
            correlacion_id,
            tenantId: validated.tenantId,
            detalles: {
                pedidoId,
                estadoGeneral: validated.estadoGeneral,
                itemsValidados: validated.items.length,
                tiempoValidacion: validated.tiempoValidacion,
                duracion_ms: duracion
            }
        });

        if (duracion > 300) {
            await logEvento({
                nivel: 'WARN',
                origen: 'API_VALIDACION',
                accion: 'SLA_EXCEEDED',
                mensaje: `Validación tardó ${duracion}ms (SLA: 300ms)`,
                correlacion_id,
                detalles: { duracion_ms: duracion }
            });
        }

        return NextResponse.json({
            success: true,
            validacionId: result.insertedId.toString(),
            estadoGeneral: validated.estadoGeneral,
            itemsValidados: validated.items.length
        });

    } catch (error: any) {
        const duracion = Date.now() - inicio;
        await logEvento({
            nivel: 'ERROR',
            origen: 'API_VALIDACION',
            accion: 'VALIDACION_ERROR',
            mensaje: error.message,
            correlacion_id,
            detalles: { duracion_ms: duracion },
            stack: error.stack
        });

        return handleApiError(error, 'API_VALIDACION', correlacion_id);
    }
}

/**
 * GET /api/pedidos/[id]/validate
 * Obtiene el historial de validaciones de un pedido
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlacion_id = crypto.randomUUID();

    try {
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const { id: pedidoId } = await params;
        const tenantId = (session.user as any).tenantId;

        const db = await connectDB();

        // Obtener todas las validaciones del pedido
        const validaciones = await db.collection('validaciones_empleados')
            .find({ pedidoId, tenantId })
            .sort({ timestamp: -1 })
            .toArray();

        await logEvento({
            nivel: 'DEBUG',
            origen: 'API_VALIDACION',
            accion: 'HISTORIAL_CONSULTADO',
            mensaje: `Consultado historial de validaciones para pedido ${pedidoId}`,
            correlacion_id,
            tenantId,
            detalles: { pedidoId, validacionesEncontradas: validaciones.length }
        });

        return NextResponse.json({
            success: true,
            validaciones,
            total: validaciones.length
        });

    } catch (error: any) {
        await logEvento({
            nivel: 'ERROR',
            origen: 'API_VALIDACION',
            accion: 'HISTORIAL_ERROR',
            mensaje: error.message,
            correlacion_id,
            stack: error.stack
        });

        return handleApiError(error, 'API_VALIDACION', correlacion_id);
    }
}
