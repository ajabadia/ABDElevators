import { auth } from '@/lib/auth';
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
import { EntityIdSchema } from '@/lib/schemas';
import { withCorrelation } from '@/lib/logger/with-correlation';
import crypto from 'node:crypto';

/**
 * 🛰️ Ingest API Service
 * Proposito: Orquestar la ingestión desde la capa de API (Auth, Tracing, Logging, Core).
 */
export class IngestApiService {
    static async handleEnrichRequest(req: Request, docId: string, session: Session) {
        const incomingId = req.headers.get('x-correlation-id');
        let tenantId = session.user.tenantId;

        return withCorrelation(
            { 
                level: 'INFO', 
                source: 'API_INGEST', 
                action: 'ENRICH_REQUEST',
                correlationId: incomingId || undefined 
            },
            async ({ log, correlationId }) => {
                let rootSpan: Span | undefined;
                try {
                    const body = await req.json();
                    const { 
                        enableVision, 
                        enableTranslation, 
                        enableGraphRag, 
                        enableCognitive, 
                        enableHierarchicalRag,
                        tenantId: bodyTenantId 
                    } = body;

                    // Rule 11 & Rule #1 Harmony: Use body tenantId if provided, fallback to session
                    if (bodyTenantId) {
                        tenantId = bodyTenantId;
                    }
                    
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

                    await log({
                        action: 'ENRICH_REQUEST_RECEIVED',
                        message: `Enriching document: ${docId}`,
                        details: { docId, flags: { enableVision, enableTranslation, enableGraphRag, enableCognitive, enableHierarchicalRag }, user: session.user.email }
                    });

                    const options = {
                        session: session as any, // 🛡️ ERA 12: Preserve session for RBAC/Multi-tenant hygiene
                        metadata: { type: 'DOCUMENT', version: 1 } as IngestOptions['metadata'],
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

                    console.log(`[ENRICH_TRACE] 🚀 Calling IngestService.executeAnalysis for docId: ${docId}`);
                    const result = await IngestService.executeAnalysis(docId, options);
                    
                    if (!result || result.success === false) {
                        const errorResponse = {
                            success: false,
                            error: {
                                code: 'ANALYSIS_FAILED',
                                message: result?.message || 'Reprocessing failed.',
                                correlationId
                            },
                            docId
                        };
                        return errorResponse;
                    }

                    return { success: true, message: 'Enrichment completed.', docId, totalChunks: result?.chunks ?? 0, correlationId };

                } catch (error: unknown) {
                    if (rootSpan) await IngestTracer.endSpanError(rootSpan, { correlationId, tenantId: tenantId || 'unknown' }, error instanceof Error ? error : new Error(String(error)));
                    throw error;
                }
            }
        );
    }

    static async handleIngestRequest(req: Request, session: Session) {
        const incomingId = req.headers.get('x-correlation-id');
        
        if (!session?.user) {
            throw new ValidationError('Sesión inválida o expirada.');
        }

        const sessionTenantId = session.user.tenantId;
        let tenantId = sessionTenantId; // Start with session default

        return withCorrelation(
            { 
                level: 'INFO', 
                source: 'API_INGEST', 
                action: 'INGEST_REQUEST',
                correlationId: incomingId || undefined 
            },
            async ({ log, correlationId }) => {
                let rootSpan: Span | undefined;
                try {
                    const formData = await req.formData();

                    // 🚀 Phase 355: Support explicit tenantId for SuperAdmins
                    const targetTenantId = (formData.get('tenantId') as string);
                    if (targetTenantId) {
                        tenantId = targetTenantId;
                    }

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

                    await log({
                        action: 'INGEST_REQUEST_RECEIVED',
                        message: `Ingesting file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
                        details: {
                            fileName: file.name,
                            fileSize: file.size,
                            metadata,
                            user: { email: session.user.email, role: session.user.role }
                        }
                    });

                    // Execute Core Ingestion
                    const options = this.extractOptions(formData, metadata, session, correlationId, ipAddress, userAgent);
                    options.tenantId = tenantId; // Use effective tenantId

                    // 🚀 Phase 344: Inject SpacePath if spaceId is provided
                    let spacePath: string | undefined;
                    if (metadata.spaceId) {
                        const space = await IngestService.getSpace(metadata.spaceId, tenantId);
                        if (space) {
                            spacePath = space.materializedPath;
                        }
                    }

                    const prep = await IngestPreparer.prepare({
                        file,
                        ...options,
                        spacePath 
                    });

                    if (prep.status === 'DUPLICATE') {
                        return { success: true, message: 'Document already indexed.', docId: prep.docId, isDuplicate: true };
                    }

                    // Sync Execution (Simple strategy for now as per original route)
                    const result = await IngestService.executeAnalysis(prep.docId, {
                        ...options,
                        ...metadata,
                        spacePath, 
                        isEnrichment: false
                    } as any); 

                    if (rootSpan) {
                        await IngestTracer.endSpanSuccess(rootSpan, { correlationId, tenantId, userId: session.user.id }, {
                            syncExecution: true,
                            docId: prep.docId,
                            totalChunks: result?.chunks ?? 0,
                        });
                    }

                    if (!result || result.success === false) {
                        return {
                            success: false,
                            error: {
                                code: 'ANALYSIS_FAILED',
                                message: result?.message || 'Analysis failed.',
                                correlationId
                            },
                            docId: prep.docId
                        };
                    }

                    return {
                        success: true,
                        message: 'Ingestion completed successfully.',
                        docId: prep.docId,
                        totalChunks: result?.chunks ?? 0,
                        correlationId
                    };

                } catch (error: unknown) {
                    if (rootSpan) await IngestTracer.endSpanError(rootSpan, { correlationId, tenantId: tenantId || 'unknown' }, error instanceof Error ? error : new Error(String(error)));
                    throw error;
                }
            }
        );
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
            chunkingLevel: (formData.get('chunkingLevel') as string) || 'SIMPLE',
            spaceId: (formData.get('spaceId') as string) || undefined,
        };
    }

    private static validateMetadata(raw: unknown) {
        const Schema = z.object({
            type: z.string().min(1, "Tipo de activo es requerido").default('Documento'),
            version: z.coerce.number().default(1),
            documentTypeId: EntityIdSchema.optional().nullable().transform(v => (!v || v === "") ? undefined : v),
            scope: z.preprocess(
                (val) => typeof val === 'string' ? val.toUpperCase() : val,
                z.enum(['USER', 'TENANT', 'INDUSTRY', 'GLOBAL']).default('TENANT')
            ),
            industry: z.string().default('ELEVATORS'),
            usage: z.enum(['REFERENCE', 'TRANSACTIONAL']).default('REFERENCE'),
            skipIndexing: z.boolean().default(false),
            ownerUserId: z.string().optional().nullable().transform(v => (!v || v === "") ? undefined : v),
            chunkingLevel: z.enum(['SIMPLE', 'SEMANTIC', 'LLM', 'bajo', 'medio', 'alto']).default('SIMPLE').transform(v => {
                const map: Record<string, 'SIMPLE' | 'SEMANTIC' | 'LLM'> = { 
                    'bajo': 'SIMPLE', 
                    'medio': 'SEMANTIC', 
                    'alto': 'LLM' 
                };
                return (map[v] || v) as 'SIMPLE' | 'SEMANTIC' | 'LLM';
            }),
            spaceId: EntityIdSchema.optional().nullable().transform(v => (!v || v === "") ? undefined : v),
        });
        return Schema.parse(raw);
    }

    private static extractOptions(formData: FormData, metadata: ReturnType<typeof IngestApiService.validateMetadata>, session: Session, correlationId: string, ip: string, userAgent: string) {
        return {
            metadata,
            tenantId: session.user.tenantId,
            environment: (formData.get('environment') as string) || 'PRODUCTION',
            userEmail: session.user.email || 'unknown@abd.com',
            session: session as any,
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
}
