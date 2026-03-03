import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from "next/server";
import { ExportService } from "@/services/ops/export-service";
import { ExportType } from "@/lib/schemas/export";
import { logEvento } from "@/lib/logger";
import { enforcePermission } from '@/lib/guardian-guard';
import { handleApiError } from '@/lib/errors';

async function GET_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('platform:settings', 'manage');
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type') as ExportType;
        const format = (searchParams.get('format') || 'csv') as 'csv' | 'json';

        if (!type) return NextResponse.json({ error: "Type required" }, { status: 400 });

        const stream = ExportService.getExportStream({ type, format, tenantId: session.user.tenantId, limit: 1000, offset: 0 }, session);
        const iterator = stream[Symbol.asyncIterator]();
        const readableStream = new ReadableStream({
            async pull(controller) {
                const { value, done } = await iterator.next();
                if (done) controller.close();
                else controller.enqueue(new TextEncoder().encode(value));
            }
        });

        await logEvento({ level: 'INFO', source: 'API_OPS', action: 'EXPORT', message: `Export: ${type}`, tenantId: session.user.tenantId, correlationId });
        return new NextResponse(readableStream, { headers: { 'Content-Type': format === 'csv' ? 'text/csv' : 'application/json', 'Content-Disposition': `attachment; filename="export-${type}.${format}"` } });
    } catch (error: unknown) {
        return handleApiError(error, 'API_EXPORT', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/ops/export', thresholdMs: 5000 });
