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
            documentTypeId: formData.get('documentTypeId'),
            scope: formData.get('scope') || 'TENANT',
            industry: formData.get('industry') || 'ELEVATORS',
        };

        // Rule #2: Zod First
        if (!file) {
            throw new ValidationError('No file provided');
        }

        const LocalIngestMetadataSchema = z.object({
            type: z.string().min(1),
            version: z.string().min(1),
            documentTypeId: z.string().optional(),
            scope: z.enum(['GLOBAL', 'INDUSTRY', 'TENANT']).default('TENANT'),
            industry: z.string().default('ELEVATORS'),
        });
        const metadata = LocalIngestMetadataSchema.parse(metadataRaw);

        // Permissions Check based on Scope
        if (metadata.scope === 'GLOBAL' && session.user.role !== 'SUPER_ADMIN') {
            throw new AppError('FORBIDDEN', 403, 'Global scope requires SuperAdmin permissions');
        }
        if (metadata.scope === 'INDUSTRY' && session.user.role !== 'SUPER_ADMIN') {
            // Future: Allow specific Industry Managers
            throw new AppError('FORBIDDEN', 403, 'Industry scope requires SuperAdmin permissions');
        }

        const tenantId = session.user.tenantId;
        if (!tenantId) {
            throw new AppError('FORBIDDEN', 403, 'Tenant ID not found in session');
        }

        // Environment detection: priority header > body > PRODUCTION
        const environment = req.headers.get('x-environment') || (formData.get('environment') as string) || 'PRODUCTION';
        const maskPii = formData.get('maskPii') !== 'false'; // Default to true if not explicitly 'false'

        // 5. DELEGATE TO SERVICE (PHASE 1: PREP)
        const prep = await IngestService.prepareIngest({
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

        if (prep.status === 'DUPLICATE') {
            return NextResponse.json({
                success: true,
                message: 'Document already indexed.',
                docId: prep.docId,
                isDuplicate: true
            });
        }

        // 6. ENQUEUE HEAVY ANALYSIS (PHASE 2: ASYNC)
        try {
            const { queueService } = await import('@/lib/queue-service');
            const job = await queueService.addJob('PDF_ANALYSIS', {
                tenantId,
                userId: session.user.id as string,
                correlationId,
                data: {
                    docId: prep.docId,
                    options: {
                        maskPii,
                        userEmail,
                        environment
                    }
                }
            });

            return NextResponse.json({
                success: true,
                message: 'Ingestion started in background (Queue).',
                docId: prep.docId,
                jobId: job.id,
                correlationId
            });
        } catch (queueError) {
            console.error('[QUEUE ERROR] Falling back to background-promise ingestion', queueError);

            // Fallback: Fire and forget (Not ideal for production, but ensures processing if Redis/Queue is down in Dev)
            // No await here
            IngestService.executeAnalysis(prep.docId, {
                maskPii,
                userEmail,
                environment,
                correlationId
            }).catch(e => console.error('[BACKGROUND FALLBACK ERROR]', e));

            return NextResponse.json({
                success: true,
                message: 'Ingestion enqueued (Fallback).',
                docId: prep.docId,
                correlationId
            });
        }

    } catch (error: any) {
        console.error(`[INGEST ERROR] Correlation: ${correlationId}`, error);

        if (error.name === 'ZodError') {
            await logEvento({
                level: 'ERROR',
                source: 'API_INGEST',
                action: 'VALIDATION_ERROR',
                message: 'Zod validation failed',
                correlationId,
                details: { errors: error.errors }
            });
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

