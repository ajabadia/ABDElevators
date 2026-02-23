import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { AppError, ValidationError, handleApiError } from '@/lib/errors';
import { getTenantCollection } from '@/lib/db-tenant';
import { performTechnicalSearch } from '@abd/rag-engine/server';
import { CursorPaginationSchema, getCursorFilter } from '@/lib/schemas/pagination';
import { ObjectId } from 'mongodb';

/**
 * GET /api/admin/knowledge-base/chunks
 * Lista y filtra fragmentos del RAG para inspección administrativa.
 */
export async function GET(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await auth() as any;
        if (!['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '')) {
            throw new AppError('UNAUTHORIZED', 401, 'Unauthorized');
        }

        const { searchParams } = new URL(req.url);

        // Validar paginación con el nuevo esquema
        let pagination;
        try {
            pagination = CursorPaginationSchema.parse({
                cursor: searchParams.get('cursor') || undefined,
                limit: searchParams.get('limit') || undefined,
                sortOrder: searchParams.get('sortOrder') || undefined,
            });
        } catch (zodError: any) {
            throw new ValidationError('Paginación inválida', zodError.errors);
        }

        const query = searchParams.get('query') || '';
        const skip = parseInt(searchParams.get('skip') || '0');
        const language = searchParams.get('language');
        const environment = searchParams.get('environment') || 'PRODUCTION';
        const sourceDoc = searchParams.get('sourceDoc');

        const collection = await getTenantCollection('document_chunks', session);

        const type = searchParams.get('type');
        const searchType = searchParams.get('searchType'); // 'regex' | 'semantic'

        let chunks = [];
        let total = 0;

        if (searchType === 'semantic' && query) {
            const { hybridSearch } = await import('@abd/rag-engine/server');
            chunks = await hybridSearch(
                query,
                session?.user?.tenantId || 'abd_global',
                correlationId,
                'ELEVATORS', // Industry
                {
                    limit: pagination.limit,
                    environment,
                    filename: sourceDoc || undefined
                }
            );
            total = chunks.length;
        } else {
            // Build filter for traditional search (Regex)
            const filter: any = {};
            filter.environment = environment;

            if (sourceDoc) {
                filter.sourceDoc = sourceDoc;
            }

            if (query) {
                filter.$or = [
                    { chunkText: { $regex: query, $options: 'i' } },
                    { model: { $regex: query, $options: 'i' } },
                    { sourceDoc: { $regex: query, $options: 'i' } }
                ];
            }
            if (language) {
                filter.language = language;
            }

            if (type === 'shadow') {
                filter.isShadow = true;
            } else if (type === 'original') {
                filter.isShadow = { $ne: true };
            }

            // Aplicar filtro de cursor si existe
            if (pagination.cursor) {
                try {
                    filter._id = pagination.sortOrder === 'desc'
                        ? { $lt: new ObjectId(pagination.cursor) }
                        : { $gt: new ObjectId(pagination.cursor) };
                } catch (e) {
                    console.warn("Invalid cursor ID", pagination.cursor);
                }
            }

            chunks = await collection.find(filter, {
                projection: { embedding: 0, embedding_multilingual: 0 },
                sort: { _id: pagination.sortOrder === 'desc' ? -1 : 1 },
                skip: pagination.cursor ? 0 : skip,
                limit: pagination.limit
            } as any);

            total = await collection.countDocuments(filter);
        }

        const lastChunk = chunks[chunks.length - 1];
        const nextCursor = (chunks.length === pagination.limit && lastChunk && (lastChunk as any)._id)
            ? (lastChunk as any)._id.toString()
            : null;

        return NextResponse.json({
            success: true,
            chunks,
            pagination: {
                total,
                limit: pagination.limit,
                skip: pagination.cursor ? undefined : skip,
                nextCursor
            }
        });

    } catch (error) {
        return handleApiError(error, 'API_KB_CHUNKS', correlationId);
    }
}
