import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { UserRole } from '@/types/roles';
import { ExportParamsSchema } from '@/lib/schemas/export';
import { ExportService } from '@/services/ops/export-service';
import { handleApiError, ValidationError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * GET /api/admin/export
 * Universal Data Export Endpoint.
 * Supports CSV/JSON streaming for Logs, Assets, and Tenants.
 */
export async function GET(req: NextRequest) {
    const correlationId = crypto.randomUUID();

    try {
        // 1. Authorize: Only Admins can export data
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

        // 2. Validate Parameters
        const { searchParams } = new URL(req.url);
        const paramsMap = Object.fromEntries(searchParams.entries());

        const result = ExportParamsSchema.safeParse(paramsMap);
        if (!result.success) {
            throw new ValidationError('Parámetros de exportación inválidos', result.error.format());
        }
        const params = result.data;

        // 3. Prepare Stream
        const encoder = new TextEncoder();
        const dataStream = ExportService.getExportStream(params, session);

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of dataStream) {
                        controller.enqueue(encoder.encode(chunk));
                    }
                    controller.close();
                } catch (error) {
                    controller.error(error);
                }
            }
        });

        // 4. Return Response with correct headers
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `export-${params.type}-${timestamp}.${params.format}`;
        const contentType = params.format === 'csv' ? 'text/csv' : 'application/json';

        return new NextResponse(stream, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${filename}"`,
                'X-Content-Type-Options': 'nosniff',
            }
        });

    } catch (error) {
        return handleApiError(error, 'API_ADMIN_EXPORT', correlationId);
    }
}
