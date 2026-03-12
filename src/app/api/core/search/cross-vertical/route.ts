import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from '@/lib/auth';
import { CrossVerticalEngine } from "@/core/engine/CrossVerticalEngine";
import { AppError } from '@/lib/errors';

/**
 * POST /api/core/search/cross-vertical
 * Performs a semantic search across verticals (Horizontal Search).
 */
async function POST_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await requirePermission('rag:query', 'read');
        const { query } = await req.json();
        const tenantId = session.user.tenantId;

        if (!query) {
            return NextResponse.json({ error: "Query required" }, { status: 400 });
        }

        const data = await CrossVerticalEngine.getInstance().semanticHorizontalSearch(
            query,
            tenantId,
            correlationId
        );

        return NextResponse.json({
            success: true,
            ...data, correlationId
        });
    } catch (error: unknown) {
        if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
        return NextResponse.json({
            success: false,
            message: "Error in horizontal search",
            error: error instanceof Error ? error.message : 'Unknown error',
            correlationId
        }, { status: 500 });
    }
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/core/search/cross-vertical', thresholdMs: 1000 });
