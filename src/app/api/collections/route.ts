import { NextRequest, NextResponse } from 'next/server';
import { CollectionService } from '@/services/core/collection-service';
import { CreateCollectionSchema } from '@/lib/schemas/collections';
import { AppError } from '@/lib/errors';
import { enforcePermission } from '@/lib/guardian-guard';
import { checkRateLimit, LIMITS } from '@/lib/rate-limit';
import crypto from 'crypto';

/**
 * 📚 User Collections API
 * GET: List user collections
 * POST: Create a new collection (Notebook)
 */
export async function GET(req: NextRequest) {
    const start = Date.now();
    const correlationId = crypto.randomUUID();

    try {
        const session = await enforcePermission('knowledge', 'read');

        const collections = await CollectionService.getUserCollections(
            session.user.tenantId,
            session.user.id,
            session
        );

        return NextResponse.json({ success: true, items: collections });

    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json({ success: false, code: error.code, message: error.message }, { status: error.status });
        }
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const start = Date.now();
    const correlationId = crypto.randomUUID();

    try {
        const session = await enforcePermission('knowledge', 'manage_collections');

        // Rate limiting
        const { success } = await checkRateLimit(session.user.id, LIMITS.CORE);
        if (!success) {
            throw new AppError('FORBIDDEN', 429, 'Demasiadas solicitudes.');
        }

        const body = await req.json();
        const validated = CreateCollectionSchema.parse(body);

        const collectionId = await CollectionService.createCollection(
            session.user.tenantId,
            session.user.id,
            validated,
            session
        );

        return NextResponse.json({ success: true, collectionId });

    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json({ success: false, code: error.code, message: error.message }, { status: error.status });
        }
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
