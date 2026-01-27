import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UsageService } from '@/lib/usage-service';
import { AppError, handleApiError } from '@/lib/errors';
import { v4 as uuidv4 } from 'uuid';

/**
 * Endpoint para obtener métricas personales del usuario.
 * Fase 24.2: User View (Personal Insights)
 */
export async function GET(request: Request) {
    const correlacion_id = uuidv4();
    try {
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const stats = await UsageService.getUserMetrics(session.user.id, session.user.tenantId);

        return NextResponse.json({
            success: true,
            stats
        });

    } catch (error) {
        return handleApiError(error, 'API_USER_STATS', correlacion_id);
    }
}
