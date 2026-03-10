import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { UserDocumentSchema, IngestAuditSchema } from '@/lib/schemas';
import { logEvento } from '@/lib/logger';
import { AppError, ValidationError } from '@/lib/errors';
import { getTenantCollection } from '@/lib/db-tenant';
import { EntityIdSchema, TenantIdSchema } from '@abd/platform-core';
import { isValidPDFMagicNumber } from '@/lib/pdf-utils';
import { z } from 'zod';

/**
 * GET /api/auth/knowledge-assets (users)
 * Lists all documents for the authenticated user.
 * SLA: P95 < 200ms
 */
async function GET_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        const session = await requirePermission('knowledge:asset', 'read');

        // 🛡️ Rule #11: Multi-tenant Harmony via SecureCollection
        const userDocsCollection = await getTenantCollection('user_documents', session);
        const knowledgeAssetsCollection = await getTenantCollection('knowledge_assets', session);

        // 1. Fetch personal documents
        const personalDocs = await userDocsCollection.find({ userId: session.user.id });

        // Fetch document types to enrich labels
        const docTypesCol = await getTenantCollection('document_types', session);
        const docTypes = await docTypesCol.find({ category: 'USER_DOCUMENT' });
        const typeMap = new Map(docTypes.map(t => [t._id.toString(), t.name]));

        const enrichedPersonalDocs = personalDocs.map(doc => ({
            ...doc,
            documentTypeName: doc.documentTypeId ? typeMap.get(doc.documentTypeId) : undefined
        }));

        // 2. For Admin/Engineering, also include technical assets
        let knowledgeAssets: any[] = [];
        const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'ENGINEERING'].includes(session.user.role || '');

        if (isAdmin) {
            const assets = await knowledgeAssetsCollection.find({ status: 'active' });

            knowledgeAssets = assets.map(asset => ({
                _id: asset._id.toString(),
                userId: 'system',
                originalName: asset.filename,
                savedName: asset.filename,
                cloudinaryUrl: asset.cloudinaryUrl,
                cloudinaryPublicId: asset.cloudinaryPublicId || '',
                mimeType: 'application/pdf',
                sizeBytes: 0,
                description: `[CORPUS] ${asset.componentType} - ${asset.model}`,
                createdAt: asset.createdAt || asset.revisionDate || new Date(),
                isGlobal: true
            }));
        }

        // Merge and sort
        const documents = [...enrichedPersonalDocs, ...knowledgeAssets].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return NextResponse.json({ success: true, items: documents });
    } catch (error: unknown) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }
        await logEvento({
            level: 'ERROR',
            source: 'API_USER_DOCS',
            action: 'GET_DOCS_ERROR',
            message: error instanceof Error ? error.message : String(error),
            correlationId,
            details: { stack: error instanceof Error ? error.stack : undefined }
        });
        const message = error instanceof Error ? error.message : 'Failed to fetch documents';
        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, message).toJSON(),
            { status: 500 }
        );
    } finally {
        const duration = Date.now() - start;
        if (duration > 200) {
            await logEvento({
                level: 'WARN',
                source: 'API_USER_DOCS',
                action: 'PERFORMANCE_SLA_VIOLATION',
                message: `GET /api/auth/knowledge-assets took ${duration}ms`,
                correlationId,
                details: { durationMs: duration }
            });
        }
    }
}

/**
 * POST /api/auth/knowledge-assets
 * Uploads a new personal document for the user.
 * SLA: P95 < 2000ms
 */
async function POST_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
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

        const tenantId = session.user.tenantId;
        if (!tenantId) {
            throw new AppError('TENANT_CONFIG_ERROR', 500, 'User has no associated tenantId');
        }

        // Clean inputs
        const cleanDocTypeId = (documentTypeId === 'undefined' || documentTypeId === 'null' || !documentTypeId)
            ? undefined
            : documentTypeId;

        // Pre-validate metadata (Fail fast before upload)
        if (description && description.length > 500) {
            throw new ValidationError('Description too long (max 500 chars)');
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // [SECURITY] Magic Number Validation (Phase 295)
        if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
            const isGenuinePDF = await isValidPDFMagicNumber(buffer);
            if (!isGenuinePDF) {
                await logEvento({
                    level: 'ERROR',
                    source: 'API_USER_DOCS',
                    action: 'PDF_MAGIC_BYTES_FAILED',
                    message: `File ${file.name} spoofed as PDF. Blocking upload.`,
                    correlationId,
                    tenantId
                });
                throw new ValidationError('Invalid PDF format (Magic bytes mismatch)');
            }
        }

        // 🔍 Deduplicación Smart (Universal) - Fase 125.1
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

        await logEvento({
            level: 'INFO',
            source: 'API_USER_DOCS',
            action: 'STORAGE_RESULT',
            message: `Deduplicated: ${deduplicated}`,
            correlationId,
            details: {
                md5: blob._id,
                providerId: blob.providerId,
                url: blob.url
            }
        });

        const fileMd5 = blob._id;
        const uploadResult = {
            publicId: blob.providerId,
            secureUrl: blob.secureUrl || blob.url
        };

        // 🛡️ Rule #11: Use SecureCollection for DB operations (Tenant Isolation)
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
            documentTypeId: cleanDocTypeId,
            fileMd5: fileMd5, // Guardamos el hash para futuras deduplicaciones
            createdAt: new Date(),
        };

        // Rule #2: Zod Validation BEFORE Processing (Final check)
        const validated = UserDocumentSchema.parse(docData);

        // SecureCollection automatically handles tenantId injection and soft deletes
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

        await logEvento({
            level: 'INFO',
            source: 'API_USER_DOCS',
            action: 'UPLOAD_DOC',
            message: `Document uploaded by ${session.user.email}: ${file.name}`,
            correlationId,
            details: { filename: file.name, size: file.size }
        });

        return NextResponse.json({ success: true, url: uploadResult.secureUrl });
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                new ValidationError(`Invalid document metadata`, error.issues).toJSON(),
                { status: 400 }
            );
        }

        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        const message = error instanceof Error ? error.message : 'Failed to upload document';
        await logEvento({
            level: 'ERROR',
            source: 'API_USER_DOCS',
            action: 'UPLOAD_DOC_ERROR',
            message: message,
            correlationId,
            details: { stack: error instanceof Error ? error.stack : undefined }
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, message).toJSON(),
            { status: 500 }
        );
    } finally {
        const duration = Date.now() - start;
        if (duration > 2000) {
            await logEvento({
                level: 'WARN',
                source: 'API_USER_DOCS',
                action: 'PERFORMANCE_SLA_VIOLATION',
                message: `POST /api/auth/knowledge-assets took ${duration}ms`,
                correlationId,
                details: { durationMs: duration }
            });
        }
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/auth/knowledge-assets', thresholdMs: 1000 });

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/auth/knowledge-assets', thresholdMs: 1000 });
