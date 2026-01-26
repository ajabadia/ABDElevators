
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { AppError, handleApiError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * GET /api/admin/knowledge-base/chunks
 * Lista y filtra fragmentos del RAG para inspección administrativa.
 */
export async function GET(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    try {
        const session = await auth();
        if (!['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '')) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const { searchParams } = new URL(req.url);
        const query = searchParams.get('query') || '';
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
        const skip = parseInt(searchParams.get('skip') || '0');
        const language = searchParams.get('language');

        const db = await connectDB();
        const collection = db.collection('document_chunks');

        // Construir filtro
        const filter: any = {};
        if (query) {
            filter.$or = [
                { texto_chunk: { $regex: query, $options: 'i' } },
                { modelo: { $regex: query, $options: 'i' } },
                { origen_doc: { $regex: query, $options: 'i' } }
            ];
        }
        if (language) {
            filter.language = language;
        }

        const chunks = await collection
            .find(filter)
            .sort({ creado: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        const total = await collection.countDocuments(filter);

        return NextResponse.json({
            success: true,
            chunks,
            pagination: {
                total,
                limit,
                skip
            }
        });

    } catch (error) {
        return handleApiError(error, 'API_KB_CHUNKS', correlacion_id);
    }
}
