import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import crypto from 'crypto';

/**
 * GET /api/technical/entities
 * List of entities for the current tenant.
 * Supports pagination and basic search.
 */
export async function GET(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const { searchParams } = new URL(req.url);

    // Search and pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');

    try {
        const collection = await getTenantCollection('entities');

        // Build filter
        const filter: any = {};
        if (search) {
            filter.$or = [
                { identifier: { $regex: search, $options: 'i' } },
                { filename: { $regex: search, $options: 'i' } },
                { client: { $regex: search, $options: 'i' } }
            ];
        }
        if (status) {
            filter.status = status;
        }

        const skip = (page - 1) * limit;

        // Execute query
        const [entities, total] = await Promise.all([
            collection.find(filter, {
                sort: { createdAt: -1 },
                skip,
                limit
            }),
            collection.countDocuments(filter)
        ]);

        return NextResponse.json({
            success: true,
            entities,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            },
            correlationId
        });

    } catch (error: any) {
        console.error('[API_ENTITIES_LIST] Error:', error);

        await logEvento({
            level: 'ERROR',
            source: 'TECHNICAL_ENTITIES_LIST_API',
            action: 'GET_LIST',
            message: error.message,
            correlationId
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error recuperando lista de entidades').toJSON(),
            { status: 500 }
        );
    }
}
