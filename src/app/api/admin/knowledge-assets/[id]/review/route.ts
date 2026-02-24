import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';
import { enforcePermission } from '@/lib/guardian-guard';
import { KnowledgeReviewService } from '@/services/ingest/knowledge-review-service';
import { z } from 'zod';

const ReviewSchema = z.object({
    nextReviewDate: z.coerce.date(),
    notes: z.string().optional()
});

/**
 * Handle Manual Review of Knowledge Assets
 * POST /api/admin/knowledge-assets/[id]/review
 */
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const assetId = params.id;

    try {
        const session = await enforcePermission('knowledge', 'update');
        const body = await req.json();
        const { nextReviewDate, notes } = ReviewSchema.parse(body);

        await KnowledgeReviewService.markAsReviewed(
            assetId,
            nextReviewDate,
            session.user.email || session.user.id,
            notes
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ code: 'VALIDATION_ERROR', message: 'Datos de revisión inválidos', details: error.issues }, { status: 400 });
        }
        if (error instanceof AppError) {
            return NextResponse.json({ success: false, code: error.code, message: error.message }, { status: error.status });
        }

        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
