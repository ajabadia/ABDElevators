import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { z } from 'zod';

// Schema para validación de queries
const QuerySchema = z.object({
    limit: z.coerce.number().min(1).max(100).default(50),
    page: z.coerce.number().min(1).default(1),
    tenantId: z.string().optional(),
    performedBy: z.string().optional(),
});

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        // Regla #9: Security Headers & Auth
        if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const url = new URL(req.url);
        const query = QuerySchema.parse({
            limit: url.searchParams.get('limit'),
            page: url.searchParams.get('page'),
            tenantId: url.searchParams.get('tenantId'),
            performedBy: url.searchParams.get('performedBy'),
        });

        const db = await connectDB();
        const collection = db.collection('audit_ingestion');

        const filter: any = {};
        if (query.tenantId) filter.tenantId = query.tenantId;
        if (query.performedBy) filter.performedBy = { $regex: query.performedBy, $options: 'i' };

        // Restricción de tenant para no-superadmin
        if (session.user.role !== 'SUPER_ADMIN') {
            const userTenant = (session.user as any).tenantId;
            if (userTenant) {
                filter.tenantId = userTenant;
            }
        }

        const skip = (query.page - 1) * query.limit;

        const [data, total] = await Promise.all([
            collection.find(filter)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(query.limit)
                .toArray(),
            collection.countDocuments(filter)
        ]);

        return NextResponse.json({
            data,
            meta: {
                total,
                page: query.page,
                limit: query.limit,
                pages: Math.ceil(total / query.limit)
            }
        });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ code: 'VALIDATION_ERROR', errors: (error as any).errors }, { status: 400 });
        }
        return NextResponse.json(
            { code: 'INTERNAL_ERROR', message: error.message || 'Error al obtener auditoría de ingesta' },
            { status: 500 }
        );
    }
}
