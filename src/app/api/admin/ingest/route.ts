import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logEvento } from '@/lib/logger';
import { DocumentChunkSchema, IngestAuditSchema, KnowledgeAssetSchema } from '@/lib/schemas';
import { ValidationError, AppError } from '@/lib/errors';
import { IngestService } from '@/services/ingest-service';
import crypto from 'crypto';
import { z } from 'zod';

/**
 * POST /api/admin/ingest
 * Processes a PDF file using the IngestService.
 * SLA: P95 < 20000ms
 */
export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();

    try {
        // Rule #9: Security Check
        const session = await auth();
        if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'Unauthorized');
        }

        // Rule #9: Headers for Audit
        const ip = req.headers.get('x-forwarded-for') || '0.0.0.0';
        const userAgent = req.headers.get('user-agent') || 'Unknown';
        const userEmail = session.user?.email || 'unknown';

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const metadataRaw = {
            type: formData.get('type') || formData.get('tipo'),
            version: formData.get('version'),
        };

        // Rule #2: Zod First
        if (!file) {
            throw new ValidationError('No file provided');
        }
        // Validate metadata using the schema from global location or redefine if local was intended
        // Re-using local definition for now as it was in original file, ideally move to schemas.ts
        const LocalIngestMetadataSchema = z.object({
            type: z.string().min(1),
            version: z.string().min(1),
        });
        const metadata = LocalIngestMetadataSchema.parse(metadataRaw);

        const tenantId = (session.user as any).tenantId;
        if (!tenantId) {
            throw new AppError('FORBIDDEN', 403, 'Tenant ID not found in session');
        }

        // Environment detection: priority header > body > PRODUCTION
        const environment = req.headers.get('x-environment') || (formData.get('environment') as string) || 'PRODUCTION';
        const maskPii = formData.get('maskPii') !== 'false'; // Default to true if not explicitly 'false'

        // DELEGATE TO SERVICE
        const result = await IngestService.processDocument({
            file,
            metadata,
            tenantId,
            environment,
            userEmail,
            ip,
            userAgent,
            correlationId,
            maskPii
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error(`[INGEST ERROR] Correlation: ${correlationId}`, error);

        if (error.name === 'ZodError') {
            return NextResponse.json(
                new ValidationError('Invalid ingest metadata', error.errors).toJSON(),
                { status: 400 }
            );
        }

        if (error instanceof AppError || error?.name === 'AppError') {
            const appError = error instanceof AppError ? error : new AppError(error.code, error.status, error.message, error.details);
            return NextResponse.json(appError.toJSON(), { status: appError.status });
        }

        await logEvento({
            level: 'ERROR',
            source: 'API_INGEST',
            action: 'FATAL_ERROR',
            message: error.message || 'Unknown error',
            correlationId,
            stack: error.stack
        });

        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Critical ingest error',
                    details: error.message
                }
            },
            { status: 500 }
        );
    }
}

