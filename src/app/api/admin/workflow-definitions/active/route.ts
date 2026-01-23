import { NextResponse } from 'next/server';
import { WorkflowService } from '@/lib/workflow-service';
import { auth } from '@/lib/auth';
import { AppError, handleApiError } from '@/lib/errors';
import { v4 as uuidv4 } from 'uuid';

/**
 * API para obtener la definición de workflow activa.
 * Fase 7.2: Motor de Workflows Multinivel.
 */
export async function GET(request: Request) {
    const correlacion_id = uuidv4();
    const { searchParams } = new URL(request.url);
    const entity_type = (searchParams.get('entity_type') as 'PEDIDO' | 'EQUIPO' | 'USUARIO') || 'PEDIDO';

    try {
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const definition = await WorkflowService.getActiveWorkflow(session.user.tenantId, entity_type);

        if (!definition) {
            // Si no hay definición propia, intentamos devolver la default (seeding rápido si es admin)
            // Por ahora solo lanzamos error si no existe, el admin debería haber inicializado.
            throw new AppError('NOT_FOUND', 404, `No hay un workflow activo para ${entity_type}`);
        }

        return NextResponse.json({ definition });

    } catch (error) {
        return handleApiError(error, 'API_GET_ACTIVE_WORKFLOW', correlacion_id);
    }
}
