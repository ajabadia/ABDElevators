
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

        const type = searchParams.get('type');
        const searchType = searchParams.get('searchType'); // 'regex' | 'semantic'

        let chunks = [];
        let total = 0;

        if (searchType === 'semantic' && query) {
            const { hybridSearch } = await import('@/lib/rag-service');
            chunks = await hybridSearch(query, session?.user?.tenantId || 'global', correlacion_id, limit);
            total = chunks.length; // En búsqueda semántica el total es el del bloque devuelto
        } else {
            // Construir filtro para búsqueda tradicional (Regex)
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

            if (type === 'shadow') {
                filter.is_shadow = true;
            } else if (type === 'original') {
                filter.is_shadow = { $ne: true };
            }

            chunks = await collection
                .find(filter)
                .sort({ creado: -1 })
                .skip(skip)
                .limit(limit)
                .toArray();

            total = await collection.countDocuments(filter);
        }

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
