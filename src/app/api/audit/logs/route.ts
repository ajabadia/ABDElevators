import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectLogsDB } from '@/lib/db';
import { AppError, handleApiError } from '@/lib/errors';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: Request) {
    const correlationId = uuidv4();
    try {
        const session = await auth();
        if (!session) throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        // Only Admin/SuperAdmin
        if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
            throw new AppError('FORBIDDEN', 403, 'Requiere privilegios de administrador');
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const search = searchParams.get('search') || '';
        const level = searchParams.get('level') || 'ALL';
        const source = searchParams.get('source') || 'ALL';

        const db = await connectLogsDB();
        const collection = db.collection('application_logs');

        const query: any = { tenantId: session.user.tenantId };

        if (level !== 'ALL') query.level = level;
        if (source !== 'ALL') query.source = source;

        if (search) {
            query.$or = [
                { message: { $regex: search, $options: 'i' } },
                { action: { $regex: search, $options: 'i' } },
                { userEmail: { $regex: search, $options: 'i' } }
            ];
        }

        const logs = await collection.find(query)
            .sort({ timestamp: -1 })
            .limit(limit)
            .toArray();

        return NextResponse.json({
            success: true,
            data: logs
        });

    } catch (error) {
        return handleApiError(error, 'API_AUDIT_LOGS', correlationId);
    }
}
