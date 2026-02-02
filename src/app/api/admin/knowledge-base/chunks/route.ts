
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
    const correlationId = crypto.randomUUID();
    try {
        const session = await auth();
        if (!['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '')) {
            throw new AppError('UNAUTHORIZED', 401, 'Unauthorized');
        }

        const { searchParams } = new URL(req.url);
        const query = searchParams.get('query') || '';
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
        const skip = parseInt(searchParams.get('skip') || '0');
        const language = searchParams.get('language');
        const environment = searchParams.get('environment') || 'PRODUCTION';

        const db = await connectDB();
        const collection = db.collection('document_chunks');

        const type = searchParams.get('type');
        const searchType = searchParams.get('searchType'); // 'regex' | 'semantic'

        let chunks = [];
        let total = 0;

        if (searchType === 'semantic' && query) {
            const { hybridSearch } = await import('@/lib/rag-service');
            // hybridSearch already takes environment or filters by tenant (we should update it if needed)
            // For now, RAG service should be environment-aware.
            chunks = await hybridSearch(query, session?.user?.tenantId || 'global', correlationId, limit, environment);
            total = chunks.length;
        } else {
            // Build filter for traditional search (Regex)
            const filter: any = {};
            filter.environment = environment;
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

            chunks = await collection
                .find(filter)
                .sort({ createdAt: -1 })
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
        return handleApiError(error, 'API_KB_CHUNKS', correlationId);
    }
}
