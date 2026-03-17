import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { UserDocumentSchema, IngestAuditSchema } from '@/lib/schemas';
import { AppError, ValidationError, handleApiError } from '@/lib/errors';
import { getTenantCollection } from '@/lib/db-tenant';
import { EntityIdSchema, TenantIdSchema } from '@abd/platform-core';
import { isValidPDFMagicNumber } from '@/lib/pdf-utils';
import { z } from 'zod';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/auth/knowledge-assets (users)
 * Lists all documents for the authenticated user.
 * SLA: P95 < 200ms
 */
async function GET_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_USER_DOCS', action: 'LIST' },
        async ({ correlationId, log }) => {
            try {
                const session = await requirePermission('knowledge:asset', 'read');

                // 🛡️ Rule #11: Multi-tenant Harmony via SecureCollection
                const userDocsCollection = await getTenantCollection('user_documents', session);
                const knowledgeAssetsCollection = await getTenantCollection('knowledge_assets', session);

                // 1. Fetch personal documents
                const personalDocs = await userDocsCollection.find({ userId: session.user.id }).toArray();

                // Fetch document types
                const docTypesCol = await getTenantCollection('document_types', session);
                const docTypes = await docTypesCol.find({ category: 'USER_DOCUMENT' }).toArray();
                const typeMap = new Map(docTypes.map((t: any) => [t._id.toString(), t.name]));

                const enrichedPersonalDocs = personalDocs.map(doc => ({
                    ...doc,
                    documentTypeName: doc.documentTypeId ? typeMap.get(doc.documentTypeId) : undefined
                }));

                // 2. For Admin/Engineering, also include technical assets
                let knowledgeAssets: any[] = [];
                const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'ENGINEERING'].includes(session.user.role || '');

                if (isAdmin) {
                    const assets = await knowledgeAssetsCollection.find({ status: { $ne: 'DRAFT' } }).toArray();

                    knowledgeAssets = assets.map(asset => ({
                        _id: (asset._id ).toString(),
                        userId: 'system',
                        originalName: asset.source.originalName,
                        savedName: asset.source.storageKey,
                        cloudinaryUrl: asset.source.downloadUrl,
                        cloudinaryPublicId: asset.source.storageKey,
                        mimeType: asset.source.mimeType,
                        sizeBytes: asset.source.sizeBytes,
                        description: asset.description || `[CORPUS] ${asset.componentType} - ${asset.industry}`,
                        createdAt: asset.createdAt,
                        isGlobal: true,
                        ingestionStatus: asset.ingestionStatus,
                        attempts: (asset as any).attempts,
                        error: asset.error,
                        progress: asset.progress
                    }));
                }

                const documents = [...enrichedPersonalDocs, ...knowledgeAssets].sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );

                await log({
                    message: `User documents listed: ${documents.length}`,
                    details: { count: documents.length },
                    tenantId: session.user.tenantId
                });

                return NextResponse.json({ success: true, items: documents });
            } catch (error: unknown) {
                return handleApiError(error, 'API_USER_DOCS_GET', correlationId);
            }
        }
    );
}

/**
 * POST /api/auth/knowledge-assets
 * Uploads a new personal document for the user.
 * SLA: P95 < 2000ms
 */
async function POST_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_USER_DOCS', action: 'UPLOAD_DOC' },
        async ({ correlationId, log }) => {
            const start = Date.now();
            try {
                const session = await requirePermission('knowledge:asset', 'write');

                const formData = await req.formData();
                const file = formData.get('file') as File;
                const description = formData.get('descripcion') as string || formData.get('description') as string;
                const documentTypeId = formData.get('documentTypeId') as string;

                if (!file) {
                    throw new ValidationError('No file uploaded');
                }

                const MAX_FILE_SIZE_MB = 100;
                const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
                if (file.size > MAX_FILE_SIZE_BYTES) {
                    throw new ValidationError(`File too large. Max size allowed is ${MAX_FILE_SIZE_MB}MB`);
                }

                const tenantId = session.user.tenantId;
                if (!tenantId) {
                    throw new AppError('TENANT_CONFIG_ERROR', 500, 'User has no associated tenantId');
                }

                const cleanDocTypeId = (documentTypeId === 'undefined' || documentTypeId === 'null' || !documentTypeId)
                    ? undefined
                    : documentTypeId;

                if (description && description.length > 500) {
                    throw new ValidationError('Description too long (max 500 chars)');
                }

                const buffer = Buffer.from(await file.arrayBuffer());

                if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
                    const isGenuinePDF = await isValidPDFMagicNumber(buffer);
                    if (!isGenuinePDF) {
                        await log({
                            level: 'ERROR',
                            message: `File ${file.name} spoofed as PDF. Blocking upload.`,
                            tenantId
                        });
                        throw new ValidationError('Invalid PDF format (Magic bytes mismatch)');
                    }
                }

                const { BlobStorageService } = await import('@/services/storage/BlobStorageService');

                const { blob, deduplicated } = await BlobStorageService.getOrCreateBlob(
                    buffer,
                    { filename: file.name, mimeType: file.type },
                    {
                        tenantId,
                        userId: session.user.id,
                        correlationId,
                        source: 'USER_DOCS'
                    }
                );

                await log({
                    message: `Storage result - Deduplicated: ${deduplicated}`,
                    details: { md5: blob._id, providerId: blob.providerId },
                    tenantId
                });

                const fileMd5 = blob._id;
                const uploadResult = {
                    publicId: blob.providerId,
                    secureUrl: blob.secureUrl || blob.url
                };

                const userDocsCollection = await getTenantCollection('user_documents', session);

                const docData = {
                    userId: EntityIdSchema.parse(session.user.id),
                    originalName: file.name,
                    savedName: uploadResult.publicId,
                    cloudinaryUrl: uploadResult.secureUrl,
                    cloudinaryPublicId: uploadResult.publicId,
                    mimeType: file.type,
                    sizeBytes: file.size,
                    description: description || '',
                    documentTypeId: cleanDocTypeId as any,
                    fileMd5: fileMd5,
                    createdAt: new Date(),
                };

                const validated = UserDocumentSchema.parse(docData);
                const result = await userDocsCollection.insertOne(validated as any);

                const auditCollection = await getTenantCollection('audit_ingestion', session);
                await auditCollection.insertOne(IngestAuditSchema.parse({
                    tenantId: TenantIdSchema.parse(tenantId),
                    performedBy: EntityIdSchema.parse(session.user.id),
                    filename: file.name,
                    sizeBytes: file.size,
                    md5: fileMd5,
                    docId: EntityIdSchema.parse(result.insertedId.toString()),
                    correlationId,
                    status: 'SUCCESS',
                    details: {
                        source: 'USER_DOCS_UPLOAD',
                        duration_ms: Date.now() - start
                    }
                }) as any);

                await log({
                    message: `Document uploaded by ${session.user.email}: ${file.name}`,
                    details: { filename: file.name, size: file.size },
                    tenantId
                });

                return NextResponse.json({ success: true, url: uploadResult.secureUrl });
            } catch (error: unknown) {
                return handleApiError(error, 'API_USER_DOCS_POST', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/auth/knowledge-assets', thresholdMs: 1000 });
export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/auth/knowledge-assets', thresholdMs: 2000 });
