import { NextRequest, NextResponse } from 'next/server';
import { isValidPDFMagicNumber } from '@/lib/pdf-utils';
import crypto from 'node:crypto';
import { getTenantCollection } from '@/lib/db-tenant';
import { handleApiError } from '@/lib/errors';
import { EntityIdSchema, IndustryType } from '@/lib/schemas';
import { TechnicalEntityService } from '@/services/core/TechnicalEntityService';
import { requirePermission } from '@/lib/auth';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

/**
 * 🛰️ ERA 12: ANALYZE API SCHEMA
 */
const AnalyzeInputSchema = z.object({
    ingestOnly: z.preprocess((v) => v === 'true', z.boolean()).default(false),
    industry: z.string().optional()
});

/**
 * POST /api/technical/entities/analyze
 * RAG Orchestrator for technicians.
 * SLA: P95 < 10s, MAX 30s
 */
export const POST = withPerformanceSLA(async (req: NextRequest) => {
    return withCorrelation(
        { level: 'INFO', source: 'TECHNICAL_ENTITIES_ANALYZE_API', action: 'ANALYZE_ENTITY' },
        async ({ log, correlationId }) => {
            try {
                // Rule #9: Security Check
                const session = await requirePermission('technical:entities', 'create');
                const tenantId = session.user.tenantId;

                const formData = await req.formData();
                const file = formData.get('file') as File;

                // 🛡️ Rule #2: Zod Validation BEFORE Processing
                const { ingestOnly, industry: requestedIndustry } = AnalyzeInputSchema.parse({
                    ingestOnly: formData.get('ingestOnly'),
                    industry: formData.get('industry')
                });

                if (!file) {
                    return NextResponse.json({ success: false, message: 'Archivo no proporcionado' }, { status: 400 });
                }

                await log({
                    action: 'START',
                    message: `Starting entity analysis: ${file.name} (ingestOnly: ${ingestOnly})`,
                    details: { filename: file.name, tenantId }
                });

                const textBuffer = Buffer.from(await file.arrayBuffer());

                // [SECURITY] Magic Number Validation
                if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
                    if (!(await isValidPDFMagicNumber(textBuffer))) {
                        await log({ level: 'ERROR', action: 'PDF_MAGIC_BYTES_FAILED', message: `Spoofed PDF blocked: ${file.name}` });
                        return NextResponse.json({ success: false, message: 'Invalid PDF format' }, { status: 415 });
                    }
                }

                const fileHash = crypto.createHash('md5').update(textBuffer).digest('hex');
                const existingEntity = await TechnicalEntityService.findExistingByHash(fileHash, tenantId);

                if (existingEntity) {
                    return NextResponse.json({
                        success: true,
                        entityId: existingEntity._id,
                        patterns: (existingEntity as any).ragContextFull || existingEntity.detectedPatterns,
                        risks: existingEntity.metadata?.risks || [],
                        correlationId,
                        isDuplicate: true
                    });
                }

                const industry = (requestedIndustry as IndustryType) || (session.user as any).industry || 'ELEVATORS';
                const entitiesCollection = await getTenantCollection('orders', { user: { tenantId } } as any);

                // Initial record creation (Era 12 requirement for tracking)
                const insertResult = await entitiesCollection.insertOne({
                    identifier: file.name.split('.')[0],
                    filename: file.name,
                    md5Hash: fileHash,
                    status: 'received',
                    tenantId,
                    createdAt: new Date(),
                    industry,
                    isValidated: false
                } as any);

                const entityId = insertResult.insertedId.toString();

                if (ingestOnly) {
                    const { queueService } = await import('@/services/ops/queue-service');
                    const job = await queueService.addJob('PDF_ANALYSIS', {
                        tenantId,
                        userId: session.user.id,
                        correlationId,
                        data: {
                            entityId,
                            filename: file.name,
                            industry,
                            fileBuffer: textBuffer.toString('base64'),
                            fileMd5: fileHash
                        }
                    });

                    return NextResponse.json({ success: true, entityId, jobId: job.id, correlationId });
                }

                // Synchronous path: Orchestrate via consolidated Domain Service
                const result = await TechnicalEntityService.processEntityAnalysis({
                    entityId,
                    fileBuffer: textBuffer.toString('base64'),
                    filename: file.name,
                    tenantId,
                    industry,
                    correlationId,
                    fileMd5: fileHash
                });

                // Fetching enriched record for response
                const finalDoc = await entitiesCollection.findOne({ _id: new ObjectId(entityId) });

                return NextResponse.json({
                    success: true,
                    entityId,
                    patterns: (finalDoc as any)?.ragContextFull || [],
                    risks: finalDoc?.metadata?.risks || [],
                    federatedInsights: finalDoc?.metadata?.federatedInsights || [],
                    correlationId,
                    durationMs: result.durationMs
                });

            } catch (error) {
                return handleApiError(error, 'API_TECHNICAL_ENTITIES_ANALYZE_POST', correlationId);
            }
        }
    );
}, { endpoint: 'POST /api/technical/entities/analyze', thresholdMs: 10000 });
