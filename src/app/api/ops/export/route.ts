import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ExportService } from "@/services/ops/export-service";
import { AppError } from "@/lib/errors";
import { ExportType } from "@/lib/schemas/export";
import { logEvento } from "@/lib/logger";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') as ExportType;
    const format = (searchParams.get('format') || 'csv') as 'csv' | 'json';
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;
    const limit = parseInt(searchParams.get('limit') || '1000', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const targetTenantId = searchParams.get('tenantId') || undefined;

    if (!type) {
        return NextResponse.json({ error: "Export type is required" }, { status: 400 });
    }

    try {
        const stream = ExportService.getExportStream({
            type,
            format,
            from,
            to,
            limit,
            offset,
            tenantId: targetTenantId
        }, session);

        const iterator = stream[Symbol.asyncIterator]();

        const readableStream = new ReadableStream({
            async pull(controller) {
                const { value, done } = await iterator.next();
                if (done) {
                    controller.close();
                } else {
                    controller.enqueue(new TextEncoder().encode(value));
                }
            }
        });

        await logEvento({
            level: 'INFO',
            source: 'API_OPS',
            action: 'EXPORT',
            message: `Export triggered: ${type} (${format})`,
            tenantId: session.user.tenantId,
            correlationId: `export-${Date.now()}`,
            details: { type, format }
        } as any);

        const responseHeaders = new Headers();
        responseHeaders.set('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
        responseHeaders.set('Content-Disposition', `attachment; filename="export-${type}-${Date.now()}.${format}"`);

        return new NextResponse(readableStream, { headers: responseHeaders });

    } catch (error: any) {
        console.error("Export error:", error);
        if (error instanceof AppError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
