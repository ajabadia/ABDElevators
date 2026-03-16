import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from "next/server";
import { ExportService } from "@/services/ops/export-service";
import { ExportType } from "@/lib/schemas/export";
import { requirePermission } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';

async function GET_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_OPS_EXPORT', action: 'STREAM_DATA' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('platform:settings', 'manage');
                const tenantId = session.user.tenantId;
                const { searchParams } = new URL(req.url);
                const type = searchParams.get('type') as ExportType;
                const format = (searchParams.get('format') || 'csv') as 'csv' | 'json';

                if (!type) {
                    await log({ level: 'WARN', message: 'Export attempt without type', tenantId });
                    return NextResponse.json({ error: "Type required" }, { status: 400 });
                }

                await log({
                    message: `Starting export streaming: ${type} as ${format}`,
                    details: { type, format },
                    tenantId
                });

                const stream = ExportService.getExportStream(
                    { type, format, tenantId, limit: 1000, offset: 0 }, 
                    session
                );
                
                const iterator = stream[Symbol.asyncIterator]();
                const readableStream = new ReadableStream({
                    async pull(controller) {
                        const { value, done } = await iterator.next();
                        if (done) controller.close();
                        else controller.enqueue(new TextEncoder().encode(value));
                    }
                });

                await log({
                    message: `Export stream initiated for ${type}`,
                    tenantId
                });

                return new NextResponse(readableStream, { 
                    headers: { 
                        'Content-Type': format === 'csv' ? 'text/csv' : 'application/json', 
                        'Content-Disposition': `attachment; filename="export-${type}.${format}"` 
                    } 
                });

            } catch (error: unknown) {
                return handleApiError(error, 'API_EXPORT_GET', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/ops/export', thresholdMs: 5000 });
