import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UserDocumentSchema, IngestAuditSchema } from '@/lib/schemas';
import { logEvento } from '@/lib/logger';
import { AppError, ValidationError } from '@/lib/errors';
import crypto from 'crypto';
import { getTenantCollection } from '@/lib/db-tenant';
import { ZodError } from 'zod';

/**
 * GET /api/auth/knowledge-assets (users)
 * Lists all documents for the authenticated user.
 * SLA: P95 < 200ms
 */
export async function GET() {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        const session = await auth();
        if (!session?.user?.id) {
            throw new AppError('UNAUTHORIZED', 401, 'Unauthorized');
        }

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
            stack: error instanceof Error ? error.stack : undefined
        });
        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Failed to fetch documents').toJSON(),
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
export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        const session = await auth();
        if (!session?.user?.id) {
            throw new AppError('UNAUTHORIZED', 401, 'Unauthorized');
        }

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

        const uploadResult = {
            publicId: blob.providerId,
            secureUrl: blob.secureUrl || blob.url
        };
        const fileMd5 = blob._id;

        // 🛡️ Rule #11: Use SecureCollection for DB operations (Tenant Isolation)
        const userDocsCollection = await getTenantCollection('user_documents', session);

        const docData = {
            userId: session.user.id,
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
        const result = await userDocsCollection.insertOne(validated);

        // 🏦 Trazabilidad Bancaria: Auditoría de Ingesta Propia
        const auditCollection = await getTenantCollection('audit_ingestion', session);
        await auditCollection.insertOne(IngestAuditSchema.parse({
            tenantId,
            performedBy: session.user.email,
            filename: file.name,
            fileSize: file.size,
            md5: fileMd5,
            docId: result.insertedId,
            correlationId,
            status: 'SUCCESS',
            details: {
                source: 'USER_DOCS_UPLOAD',
                duration_ms: Date.now() - start
            }
        }));

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
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorName = error instanceof Error ? error.name : 'UnknownError';
        const errorStack = error instanceof Error ? error.stack : undefined;

        const errorDetails = {
            message: errorMessage,
            name: errorName,
            stack: errorStack,
            correlationId,
            timestamp: new Date().toISOString()
        };

        await logEvento({
            level: 'ERROR',
            source: 'API_USER_DOCS',
            action: 'CRITICAL_FAILURE',
            message: errorMessage,
            correlationId,
            details: errorDetails
        });

        // 🚨 EMERGENCY DEBUG: Write to disk because logs are truncated
        try {
            const fs = await import('fs');
            const path = await import('path');
            fs.appendFileSync(path.resolve(process.cwd(), 'API_CRASH.log'), JSON.stringify(errorDetails, null, 2) + '\n---\n');
        } catch (e) {
            console.error('Failed to write emergency log', e);
        }

        if (error instanceof ZodError) {
            await logEvento({
                level: 'WARN',
                source: 'API_USER_DOCS',
                action: 'ZOD_VALIDATION_ERROR',
                message: 'Invalid document metadata',
                correlationId,
                details: error.issues
            });
            return NextResponse.json(
                new ValidationError(`Invalid document metadata: ${error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`, error.issues).toJSON(),
                { status: 400 }
            );
        }

        // Handle AppError even if instanceof fails (bundler isolation)
        if (error instanceof AppError || errorName === 'AppError' || (error && typeof error === 'object' && 'status' in error)) {
            const errCode = (error as { code?: string }).code || 'UPLOAD_ERROR';
            const errStatus = (error as { status?: number }).status || 400;
            const errDetails = (error as { details?: unknown }).details;

            return NextResponse.json(
                {
                    code: errCode,
                    message: errorMessage,
                    details: errDetails
                },
                { status: errStatus }
            );
        }

        await logEvento({
            level: 'ERROR',
            source: 'API_USER_DOCS',
            action: 'UPLOAD_DOC_ERROR',
            message: errorMessage,
            correlationId,
            stack: errorStack
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Failed to upload document').toJSON(),
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
