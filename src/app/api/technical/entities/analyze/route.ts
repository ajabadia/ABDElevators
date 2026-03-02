import { NextResponse } from 'next/server';
import { logEvento } from '@/lib/logger';
import { getTenantCollection, getCaseCollection } from '@/lib/db-tenant';
import { PDFIngestionPipeline } from '@/services/infra/pdf/PDFIngestionPipeline';
import { handleApiError } from '@/lib/errors';
import { EntitySchema, GenericCaseSchema, IndustryType } from '@/lib/schemas';
import { mapEntityToCase } from '@/lib/mappers';
import { TechnicalEntityService } from '@/services/core/TechnicalEntityService';
import { enforcePermission } from '@/lib/guardian-guard';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';

/**
 * POST /api/technical/entities/analyze
 * RAG Orchestrator for technicians.
 * SLA: P95 < 10s, MAX 30s
 */
export const POST = withPerformanceSLA(async (req) => {
    const correlationId = crypto.randomUUID();

    try {
        // Rule #9: Security Check
        const session = await enforcePermission('technical:entities', 'create');
        const tenantId = session.user.tenantId;

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ success: false, message: 'Archivo no proporcionado' }, { status: 400 });
        }

        await logEvento({
            level: 'INFO',
            source: 'TECHNICAL_ENTITIES_ANALYZE_API',
            action: 'START',
            message: `Starting entity analysis: ${file.name}`,
            correlationId,
            tenantId
        });

        // 1. Extract text from entity
        const textBuffer = Buffer.from(await file.arrayBuffer());

        // 0. MD5 De-duplication (Token Savings)
        const fileHash = crypto.createHash('md5').update(textBuffer).digest('hex');
        const existingEntity = await TechnicalEntityService.findExistingByHash(fileHash, tenantId);

        if (existingEntity) {
            await logEvento({
                level: 'INFO',
                source: 'TECHNICAL_ENTITIES_ANALYZE_API',
                action: 'DEDUPLICATION',
                message: `Identical entity detected for tenant ${tenantId}. Returning previous analysis.`,
                correlationId,
                tenantId,
                details: { entityId: existingEntity._id, filename: file.name }
            });

            return NextResponse.json({
                success: true,
                entityId: existingEntity._id,
                patterns: (existingEntity as any).ragContextFull || existingEntity.detectedPatterns,
                risks: existingEntity.metadata?.risks || [],
                correlationId,
                isDuplicate: true
            });
        }

        const industry = (session.user as any).industry as IndustryType || 'ELEVATORS';
        const pipelineResult = await PDFIngestionPipeline.runPipeline(textBuffer, {
            tenantId,
            correlationId,
            industry,
            strategy: 'ADVANCED',
            pii: { enabled: true }
        });
        const entityText = pipelineResult.maskedText || pipelineResult.cleanedText;
        const ingestOnly = formData.get('ingestOnly') === 'true';

        const entitiesCollection = await getTenantCollection('entities');

        if (ingestOnly) {
            const insertResult = await entitiesCollection.insertOne({
                identifier: file.name.split('.')[0],
                filename: file.name,
                md5Hash: fileHash,
                originalText: entityText,
                analysisDate: new Date(),
                status: 'received',
                tenantId,
                createdAt: new Date(),
                industry,
                detectedPatterns: [],
                isValidated: false
            } as any);

            const { queueService } = await import('@/services/ops/queue-service');
            const job = await queueService.addJob('PDF_ANALYSIS', {
                tenantId,
                userId: session.user.id,
                correlationId,
                data: {
                    entityId: insertResult.insertedId.toString(),
                    filename: file.name,
                    industry,
                    fileBuffer: textBuffer.toString('base64'),
                }
            });

            return NextResponse.json({
                success: true,
                entityId: insertResult.insertedId,
                jobId: job.id,
                correlationId
            });
        }

        const {
            resultsWithContext,
            detectedRisks,
            federatedInsights,
            patternsForStorage
        } = await TechnicalEntityService.performFullAnalysis(
            entityText,
            file.name,
            tenantId,
            industry,
            correlationId,
            fileHash
        );

        // 4. Save result in DB with Tenant Isolation
        const entityData = {
            identifier: file.name.split('.')[0],
            filename: file.name,
            originalText: entityText,
            detectedPatterns: patternsForStorage,
            analysisDate: new Date(),
            status: 'analyzed',
            tenantId,
            fileMd5: fileHash,
            createdAt: new Date(),
            industry,
            isValidated: false,
            metadata: {
                risks: detectedRisks,
                federatedInsights: federatedInsights
            }
        };

        const validatedEntity = EntitySchema.parse(entityData);
        const insertResult = await entitiesCollection.insertOne({
            ...validatedEntity,
            ragContextFull: resultsWithContext,
            correlationId
        } as any);

        // 5. Vision 2.0: Save as Generic Case
        try {
            const caseCollection = await getCaseCollection(session.user as any);
            const genericCase = mapEntityToCase({ ...validatedEntity, _id: insertResult.insertedId }, tenantId);

            genericCase.metadata = {
                ...genericCase.metadata,
                risks: detectedRisks,
                federatedInsights: federatedInsights
            };

            const validatedCase = GenericCaseSchema.parse(genericCase);
            await caseCollection.insertOne(validatedCase);
        } catch (caseErr) {
            console.error("[Vision 2.0 ERROR] Failed to save in generic cases collection:", caseErr);
        }

        return NextResponse.json({
            success: true,
            entityId: insertResult.insertedId,
            patterns: resultsWithContext,
            risks: detectedRisks,
            federatedInsights: federatedInsights,
            correlationId,
        });

    } catch (error) {
        return handleApiError(error, 'API_TECHNICAL_ENTITIES_ANALYZE_POST', correlationId);
    }
}, { endpoint: 'POST /api/technical/entities/analyze', thresholdMs: 10000 });
