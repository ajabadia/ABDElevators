import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCaseCollection } from '@/lib/db-tenant';
import { GenericCaseSchema } from '@/lib/schemas';
import { AppError, ValidationError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import crypto from 'crypto';

/**
 * GET /api/casos
 * Lista casos del tenant actual.
 */
export async function GET(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    const inicio = Date.now();

    try {
        const session = await auth();
        if (!session) throw new AppError('UNAUTHORIZED', 401, 'No autorizado');

        const collection = await getCaseCollection(session.user as any);
        const casos = await collection.find({}, { sort: { actualizado: -1 } });

        return NextResponse.json({ success: true, casos });
    } catch (error: any) {
        if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
        return NextResponse.json(new AppError('INTERNAL_ERROR', 500, error.message).toJSON(), { status: 500 });
    }
}

/**
 * POST /api/casos
 * Crea un nuevo caso genérico.
 */
export async function POST(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();

    try {
        const session = await auth();
        if (!session) throw new AppError('UNAUTHORIZED', 401, 'No autorizado');

        const body = await req.json();
        const collection = await getCaseCollection(session.user as any);

        // No es necesario inyectar tenantId o fechas aquí,
        // SecureCollection.insertOne lo hace automáticamente.
        const validated = GenericCaseSchema.parse(body);
        const result = await collection.insertOne(validated);

        await logEvento({
            level: 'INFO',
            source: 'API_CASOS',
            action: 'CREATE_CASE',
            message: `Nuevo caso creado: ${result.insertedId}`, correlationId: correlacion_id,
            details: { industry: validated.industry, type: validated.type }
        });

        return NextResponse.json({ success: true, case_id: result.insertedId });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json(new ValidationError('Datos de caso inválidos', error.errors).toJSON(), { status: 400 });
        }
        if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
        return NextResponse.json(new AppError('INTERNAL_ERROR', 500, error.message).toJSON(), { status: 500 });
    }
}
