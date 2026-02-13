import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { AppError, handleApiError } from '@/lib/errors';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { UserRole } from '@/types/roles';

/**
 * GET /api/admin/cases/[id]
 * Recupera el detalle de un caso (entidad).
 */
async function getHandler(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    // Correlation ID manual si no viene del middleware (aunque debería)
    const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();

    try {
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        // Permitir acceso a Admin, Soporte, Técnico, Ingeniería...
        const allowedRoles = [
            UserRole.ADMIN,
            UserRole.SUPER_ADMIN,
            UserRole.TECHNICAL,
            UserRole.ENGINEERING,
            UserRole.SUPPORT
        ];

        if (!allowedRoles.includes(session.user.role as UserRole)) {
            throw new AppError('FORBIDDEN', 403, 'Rol no permitido para ver detalles de caso');
        }

        const tenantId = session.user.tenantId;
        const db = await connectDB();

        // Buscar en colección 'entities' (que unifica Pedidos/Casos)
        const entity = await db.collection('entities').findOne({
            _id: new ObjectId(id),
            tenantId
        });

        if (!entity) {
            throw new AppError('NOT_FOUND', 404, 'Caso no encontrado');
        }

        return NextResponse.json({
            success: true,
            data: entity
        });

    } catch (error) {
        return handleApiError(error, 'API_GET_CASE_DETAIL', correlationId);
    }
}

export const GET = withPerformanceSLA(getHandler, {
    endpoint: 'GET_CASE_DETAIL',
    thresholdMs: 300,
    source: 'API_ADMIN'
});
