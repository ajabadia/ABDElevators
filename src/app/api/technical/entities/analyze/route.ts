import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logEvento } from '@/lib/logger';
import { getTenantCollection, getCaseCollection } from '@/lib/db-tenant';
import { extractTextFromPDF } from '@/lib/pdf-utils';
import { analyzeEntityWithGemini } from '@/lib/llm';
import { performTechnicalSearch } from '@/lib/rag-service';
import { AppError, ValidationError } from '@/lib/errors';
import { EntitySchema, GenericCaseSchema } from '@/lib/schemas';
import { mapEntityToCase } from '@/lib/mappers';
import { RiskService } from '@/lib/risk-service';
import { FederatedKnowledgeService } from '@/lib/federated-knowledge-service';
import crypto from 'crypto';

/**
 * POST /api/technical/entities/analyze
 * RAG Orchestrator for technicians.
 * SLA: P95 < 10000ms
 */
export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        // Rule #9: Security Check
        const session = await auth();
        if (!session?.user?.email) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const user = session.user as any;
        const tenantId = user.tenantId;
        if (!tenantId) {
            throw new AppError('FORBIDDEN', 403, 'Tenant ID no encontrado en la sesión');
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;

        // Rule #2: Zod First (or immediate manual validation)
        if (!file) {
            throw new ValidationError('Entidad no proporcionada');
        }

        await logEvento({
            level: 'INFO',
            source: 'TECHNICAL_ENTITIES_ANALYZE_API',
            action: 'START',
            message: `Starting entity analysis: ${file.name}`,
            correlationId
        });

        // 1. Extract text from entity
        const textBuffer = Buffer.from(await file.arrayBuffer());

        // 0. MD5 De-duplication (Token Savings)
        const fileHash = crypto.createHash('md5').update(textBuffer).digest('hex');
        const { TechnicalEntityService } = await import('@/lib/services/technical-entity-service');
        const entitiesCollection = await getTenantCollection('entities');
        const existingEntity = await TechnicalEntityService.findExistingByHash(fileHash, tenantId);

        if (existingEntity) {
            await logEvento({
                level: 'INFO',
                source: 'TECHNICAL_ENTITIES_ANALYZE_API',
                action: 'DEDUPLICATION',
                message: `Identical entity detected for tenant ${tenantId}. Returning previous analysis.`,
                correlationId,
                details: { entityId: existingEntity._id, filename: file.name }
            });

            return NextResponse.json({
                success: true,
                entityId: existingEntity._id,
                patterns: existingEntity.ragContextFull || existingEntity.detectedPatterns,
                risks: (existingEntity.metadata as any)?.risks || [],
                correlationId,
                isDuplicate: true
            });
        }

        const entityText = await extractTextFromPDF(textBuffer);
        const industry = session.user.industry || 'ELEVATORS';
        const ingestOnly = formData.get('ingestOnly') === 'true';

        if (ingestOnly) {
            // 🛡️ MIGRACIÓN A BULLMQ (Fase 31: Async Jobs)
            const insertResult = await entitiesCollection.insertOne({
                identifier: file.name.split('.')[0],
                filename: file.name,
                md5Hash: fileHash,
                originalText: entityText,
                analysisDate: new Date(),
                status: 'received',
                tenantId,
                createdAt: new Date(),
                correlationId
            });

            const { queueService } = await import('@/lib/queue-service');
            const job = await queueService.addJob('PDF_ANALYSIS', {
                tenantId: tenantId!,
                userId: user.id || 'unknown',
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

        // 2. Full Analysis via Service (Phase 105 Hygiene)
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
            status: 'analyzed' as const,
            tenantId,
            fileMd5: fileHash,
            createdAt: new Date(),
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
        });

        // 5. Vision 2.0: Save as Generic Case
        try {
            const caseCollection = await getCaseCollection();
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

    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        await logEvento({
            level: 'ERROR',
            source: 'TECHNICAL_ENTITIES_ANALYZE_API',
            action: 'FATAL_ERROR',
            message: error.message,
            correlationId,
            stack: error.stack
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error procesando la entidad RAG').toJSON(),
            { status: 500 }
        );
    } finally {
        const durationMs = Date.now() - start;
        if (durationMs > 10000) {
            await logEvento({
                level: 'WARN',
                source: 'TECHNICAL_ENTITIES_ANALYZE_API',
                action: 'SLA_VIOLATION',
                message: `Slow RAG analysis: ${durationMs}ms`,
                correlationId,
                details: { durationMs }
            });
        }
    }
}
