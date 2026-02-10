import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logEvento } from '@/lib/logger';
import { DocumentChunkSchema, IngestAuditSchema, KnowledgeAssetSchema } from '@/lib/schemas';
import { ValidationError, AppError } from '@/lib/errors';
import { IngestService } from '@/services/ingest-service';
import { IngestGuardian, type IngestScope } from '@/services/ingest/security/GuardianAuthz';
import { IngestTracer } from '@/services/ingest/observability/IngestTracer';
import crypto from 'crypto';
import { z } from 'zod';

/**
 * POST /api/admin/ingest
 * Processes a PDF file using the IngestService.
 * SLA: P95 < 20000ms
 * 
 * Phase 1 Improvements:
 * - Guardian V3 authorization (4-level scope: USER, TENANT, INDUSTRY, GLOBAL)
 * - OpenTelemetry distributed tracing
 * - Banking-grade immutable audit trail
 */
export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const rootSpan = IngestTracer.startIngestSpan({ correlationId, tenantId: 'pending', fileName: 'pending' });

    try {
        // Authentication (Rule #9: Security Check)
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
        }

        // Audit headers for banking-grade traceability
        const ipAddress = req.headers.get('x-forwarded-for') || '0.0.0.0';
        const userAgent = req.headers.get('user-agent') || 'Unknown';
        const userEmail = session.user.email;

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const metadataRaw = {
            type: formData.get('type') || formData.get('tipo'),
            version: formData.get('version'),
            documentTypeId: formData.get('documentTypeId'),
            scope: formData.get('scope') || 'TENANT',
            industry: formData.get('industry') || 'ELEVATORS',
            ownerUserId: formData.get('ownerUserId'), // For USER scope
        };

        // Rule #2: Zod First
        if (!file) {
            throw new ValidationError('No file provided');
        }

        const LocalIngestMetadataSchema = z.object({
            type: z.string().min(1),
            version: z.string().min(1),
            documentTypeId: z.string().optional(),
            scope: z.enum(['USER', 'TENANT', 'INDUSTRY', 'GLOBAL']).default('TENANT'),
            industry: z.string().default('ELEVATORS'),
            ownerUserId: z.string().optional(),
        });
        const metadata = LocalIngestMetadataSchema.parse(metadataRaw);

        // Guardian V3 Authorization (4-level scope hierarchy)
        const tenantId = session.user.tenantId;
        if (!tenantId) {
            throw new AppError('FORBIDDEN', 403, 'Tenant ID not found in session');
        }

        // Validate ownership for USER scope
        const ownerUserId = metadata.scope === 'USER'
            ? (metadata.ownerUserId || session.user.id)
            : undefined;

        await IngestGuardian.authorize(session, {
            scope: metadata.scope as IngestScope,
            ownerUserId,
            industry: metadata.industry,
            tenantId,
            correlationId,
            ipAddress,
            userAgent,
        });

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
            ip: ipAddress,
            userAgent,
            correlationId,
            maskPii,
            session
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

            await IngestTracer.endSpanSuccess(rootSpan, { correlationId, tenantId, userId: session.user.id }, {
                jobId: job.id,
                docId: prep.docId,
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

            await IngestTracer.endSpanSuccess(rootSpan, { correlationId, tenantId, userId: session.user.id }, {
                fallbackMode: true,
                docId: prep.docId,
            });

            return NextResponse.json({
                success: true,
                message: 'Ingestion enqueued (Fallback).',
                docId: prep.docId,
                correlationId
            });
        }

    } catch (error: any) {
        await IngestTracer.endSpanError(rootSpan, { correlationId, tenantId: 'unknown' }, error);
        console.error(`[INGEST ERROR] Correlation: ${correlationId}`, error);

        if (error instanceof z.ZodError) {
            await logEvento({
                level: 'ERROR',
                source: 'API_INGEST',
                action: 'VALIDATION_ERROR',
                message: 'Zod validation failed',
                correlationId,
                details: { errors: error.issues }
            });
            return NextResponse.json(
                new ValidationError('Invalid ingest metadata', error.issues).toJSON(),
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
