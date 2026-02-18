import { NextRequest, NextResponse } from 'next/server';
import { CollectionService } from '@/services/collection-service';
import { z } from 'zod';
import { AppError } from '@/lib/errors';
import { enforcePermission } from '@/lib/guardian-guard';
import crypto from 'crypto';

const AddAssetsSchema = z.object({
    assetIds: z.array(z.string()).min(1),
});

/**
 * 📚 Add Assets to Collection API
 * POST: /api/collections/[id]/assets
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Node 20+ App Router params
) {
    const start = Date.now();
    const correlationId = crypto.randomUUID();
    const { id } = await params;

    try {
        const user = await enforcePermission('knowledge', 'manage_collections');

        const body = await req.json();
        const { assetIds } = AddAssetsSchema.parse(body);

        const { auth } = await import('@/auth');
        const session = await auth();

        // user is actually the session object returned by enforcePermission
        const success = await CollectionService.addAssetsToCollection(id, assetIds, user.user.id, session as any);

        return NextResponse.json({ success });

    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json({ success: false, code: error.code, message: error.message }, { status: error.status });
        }
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: 'Validación fallida' }, { status: 400 });
        }
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
