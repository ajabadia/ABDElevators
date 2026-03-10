import { auth } from '@/lib/auth';
import crypto from 'node:crypto';
import { logEvento } from '@/lib/logger';
import { AppError, ValidationError } from '@/lib/errors';
import { IngestService } from './IngestService';
import { IngestGuardian, type IngestScope } from './security/GuardianAuthz';
import { IngestTracer } from './observability/IngestTracer';
import { z } from 'zod';
import { Span } from '@opentelemetry/api';
import type { Session } from 'next-auth';
import { IngestOptions } from './types';
import { IngestPreparer } from './IngestPreparer';

/**
 * 🛰️ Ingest API Service
 * Proposito: Orquestar la ingestión desde la capa de API (Auth, Tracing, Logging, Core).
 */
export class IngestApiService {
    static async handleEnrichRequest(req: Request, docId: string, session: Session) {
        let correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();
        let rootSpan: Span | undefined;
        const tenantId = session.user.tenantId;

        try {
            const body = await req.json();
            const { enableVision, enableTranslation, enableGraphRag, enableCognitive, enableHierarchicalRag } = body;

            // Guardian V3 Authorization
            const ipAddress = req.headers.get('x-forwarded-for') || '0.0.0.0';
            const userAgent = req.headers.get('user-agent') || 'Unknown';

            await IngestGuardian.authorize(session, {
                scope: 'TENANT', // Enriquecimiento opera a nivel de tenant por ahora
                tenantId,
                correlationId,
                ipAddress,
                userAgent,
            });

            rootSpan = IngestTracer.startIngestSpan({
                correlationId,
                tenantId,
                userId: session.user.id,
                fileName: `enrich_${docId}`
            });

            await logEvento({
                level: 'INFO',
                source: 'API_INGEST',
                action: 'ENRICH_REQUEST_RECEIVED',
                message: `Enriching document: ${docId}`,
                correlationId,
                tenantId,
                details: { docId, flags: { enableVision, enableTranslation, enableGraphRag, enableCognitive, enableHierarchicalRag }, user: session.user.email }
            });

            const options = {
                metadata: { type: 'DOCUMENT', version: '1.0' } as IngestOptions['metadata'],
                tenantId,
                environment: 'PRODUCTION',
                userEmail: session.user.email as string,
                ip: ipAddress,
                userAgent,
                correlationId,
                maskPii: true, // Default
                enableVision: !!enableVision,
                enableTranslation: !!enableTranslation,
                enableGraphRag: !!enableGraphRag,
                enableCognitive: !!enableCognitive,
                enableHierarchicalRag: !!enableHierarchicalRag,
                isEnrichment: true
            };

            const result = await IngestService.executeAnalysis(docId, options);

            if (rootSpan) {
                await IngestTracer.endSpanSuccess(rootSpan, { correlationId, tenantId, userId: session.user.id }, {
                    syncExecution: true,
                    docId,
                    totalChunks: result?.chunks ?? 0,
                });
            }

            return { success: true, message: 'Enrichment completed.', docId, totalChunks: result?.chunks ?? 0, correlationId };

        } catch (error: unknown) {
            if (rootSpan) await IngestTracer.endSpanError(rootSpan, { correlationId, tenantId: tenantId || 'unknown' }, error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    static async handleIngestRequest(req: Request, session: Session) {
        let correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();
        let rootSpan: Span | undefined;
        const tenantId = session.user.tenantId;

        try {
            const formData = await req.formData();
            const incomingId = formData.get('correlationId') as string;
            if (incomingId) correlationId = incomingId;

            const file = formData.get('file') as File;
            if (!file) throw new ValidationError('No file provided');

            const metadataRaw = this.extractMetadata(formData);
            const metadata = this.validateMetadata(metadataRaw);

            // Guardian V3 Authorization
            const ownerUserId = metadata.scope === 'USER' ? (metadata.ownerUserId || session.user.id) : undefined;
            const ipAddress = req.headers.get('x-forwarded-for') || '0.0.0.0';
            const userAgent = req.headers.get('user-agent') || 'Unknown';

            await IngestGuardian.authorize(session, {
                scope: metadata.scope as IngestScope,
                ownerUserId,
                industry: metadata.industry,
                tenantId,
                correlationId,
                ipAddress,
                userAgent,
            });

            // Start Trace
            const buffer = Buffer.from(await file.arrayBuffer());
            const fileHash = crypto.createHash('md5').update(buffer).digest('hex');

            rootSpan = IngestTracer.startIngestSpan({
                correlationId,
                tenantId,
                userId: session.user.id,
                fileName: file.name,
                fileHash
            });

            // Log Request Received
            await this.logRequest(file, metadata, session, correlationId, tenantId);

            // Execute Core Ingestion
            const options = this.extractOptions(formData, metadata, session, correlationId, ipAddress, userAgent);

            // 🚀 Phase 344: Inject SpacePath if spaceId is provided
            let spacePath: string | undefined;
            if (metadata.spaceId) {
                const space = await IngestService.getSpace(metadata.spaceId, tenantId);
                if (space) spacePath = space.materializedPath;
            }

            const prep = await IngestPreparer.prepare({
                file,
                ...options
            });

            if (prep.status === 'DUPLICATE') {
                return { success: true, message: 'Document already indexed.', docId: prep.docId, isDuplicate: true };
            }

            // Sync Execution (Simple strategy for now as per original route)
            const result = await IngestService.executeAnalysis(prep.docId, {
                ...options,
                ...metadata,
                spacePath, // Inject Phase 344
                isEnrichment: false
            } as any); // metadata fields are merged into EnrichmentOptions structure

            if (rootSpan) {
                await IngestTracer.endSpanSuccess(rootSpan, { correlationId, tenantId, userId: session.user.id }, {
                    syncExecution: true,
                    docId: prep.docId,
                    totalChunks: result?.chunks ?? 0,
                });
            }

            return {
                success: true,
                message: 'Ingestion completed.',
                docId: prep.docId,
                totalChunks: result?.chunks ?? 0,
                correlationId
            };

        } catch (error: unknown) {
            if (rootSpan) await IngestTracer.endSpanError(rootSpan, { correlationId, tenantId: tenantId || 'unknown' }, error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    private static extractMetadata(formData: FormData) {
        return {
            type: (formData.get('type') || formData.get('tipo')) as string || undefined,
            version: (formData.get('version') as string) || '1.0',
            documentTypeId: (formData.get('documentTypeId') as string) || undefined,
            scope: (formData.get('scope') as string) || 'TENANT',
            industry: (formData.get('industry') as string) || 'ELEVATORS',
            usage: (formData.get('usage') as string) || 'REFERENCE',
            skipIndexing: formData.get('skipIndexing') === 'true',
            ownerUserId: (formData.get('ownerUserId') as string) || undefined,
            chunkingLevel: (formData.get('chunkingLevel') as string) || 'bajo',
            spaceId: (formData.get('spaceId') as string) || undefined,
        };
    }

    private static validateMetadata(raw: unknown) {
        const Schema = z.object({
            type: z.string().min(1, "Tipo de activo es requerido").default('Documento'),
            version: z.string().min(1, "Versión es requerida").default('1.0'),
            documentTypeId: z.string().optional().nullable().transform(v => (!v || v === "") ? undefined : v),
            scope: z.preprocess(
                (val) => typeof val === 'string' ? val.toUpperCase() : val,
                z.enum(['USER', 'TENANT', 'INDUSTRY', 'GLOBAL']).default('TENANT')
            ),
            industry: z.string().default('ELEVATORS'),
            usage: z.enum(['REFERENCE', 'TRANSACTIONAL']).default('REFERENCE'),
            skipIndexing: z.boolean().default(false),
            ownerUserId: z.string().optional().nullable().transform(v => (!v || v === "") ? undefined : v),
            chunkingLevel: z.enum(['bajo', 'medio', 'alto', 'SIMPLE', 'SEMANTIC', 'LLM']).default('bajo').transform(v => {
                const map: Record<string, 'bajo' | 'medio' | 'alto'> = { 'SIMPLE': 'bajo', 'SEMANTIC': 'medio', 'LLM': 'alto' };
                return (map[v] || v) as 'bajo' | 'medio' | 'alto' | 'SIMPLE' | 'SEMANTIC' | 'LLM';
            }),
            spaceId: z.string().optional().nullable().transform(v => (!v || v === "") ? undefined : v),
        });
        return Schema.parse(raw);
    }

    private static extractOptions(formData: FormData, metadata: ReturnType<typeof IngestApiService.validateMetadata>, session: Session, correlationId: string, ip: string, userAgent: string) {
        return {
            metadata,
            tenantId: session.user.tenantId,
            environment: (formData.get('environment') as string) || 'PRODUCTION',
            userEmail: session.user.email || 'unknown@abd.com',
            ip,
            userAgent,
            correlationId,
            maskPii: formData.get('maskPii') !== 'false',
            enableVision: formData.get('enableVision') === 'true',
            enableTranslation: formData.get('enableTranslation') === 'true',
            enableGraphRag: formData.get('enableGraphRag') === 'true',
            enableCognitive: formData.get('enableCognitive') === 'true',
            enableHierarchicalRag: formData.get('enableHierarchicalRag') === 'true',
            chunkSize: formData.get('chunkSize') && formData.get('chunkSize') !== '' ? parseInt(formData.get('chunkSize') as string, 10) : undefined,
            chunkOverlap: formData.get('chunkOverlap') && formData.get('chunkOverlap') !== '' ? parseInt(formData.get('chunkOverlap') as string, 10) : undefined,
            chunkThreshold: formData.get('chunkThreshold') && formData.get('chunkThreshold') !== '' ? parseFloat(formData.get('chunkThreshold') as string) : undefined,
        };
    }

    private static async logRequest(file: File, metadata: ReturnType<typeof IngestApiService.validateMetadata>, session: Session, correlationId: string, tenantId: string) {
        await logEvento({
            level: 'INFO',
            source: 'API_INGEST',
            action: 'INGEST_REQUEST_RECEIVED',
            message: `Ingesting file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
            correlationId,
            tenantId,
            details: {
                fileName: file.name,
                fileSize: file.size,
                metadata,
                user: { email: session.user.email, role: session.user.role }
            }
        });
    }
}
