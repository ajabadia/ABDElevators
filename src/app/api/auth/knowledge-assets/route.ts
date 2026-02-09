import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadUserDocument } from '@/lib/cloudinary';
import { UserDocumentSchema, IngestAuditSchema } from '@/lib/schemas';
import { logEvento } from '@/lib/logger';
import { AppError, ValidationError } from '@/lib/errors';
import crypto from 'crypto';
import { getTenantCollection } from '@/lib/db-tenant';

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
    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }
        await logEvento({
            level: 'ERROR',
            source: 'API_USER_DOCS',
            action: 'GET_DOCS_ERROR',
            message: error.message,
            correlationId,
            stack: error.stack
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

        // 🔍 Deduplicación Smart (MD5) - Fase 100
        const fileMd5 = crypto.createHash('md5').update(buffer).digest('hex');

        // 🛡️ Rule #11: Use SecureCollection for DB operations
        const userDocsCollection = await getTenantCollection('user_documents', session);
        const kaCollection = await getTenantCollection('knowledge_assets', session);

        // Buscar si ya existe este archivo (checksum) en el tenant o globalmente
        // 1. Buscar en user_documents (mismo tenant)
        const existingUserDoc = await userDocsCollection.findOne({ fileMd5 });
        // 2. Buscar en knowledge_assets (quizás es un manual público o global)
        const existingKA = !existingUserDoc ? await kaCollection.findOne({ fileMd5 }) : null;

        let uploadResult;

        if (existingUserDoc) {
            // 1. Hit in tenant user docs
            console.log(`[SmartUpload] Deduplication HIT (UserDoc) for MD5 ${fileMd5}`);
            uploadResult = {
                publicId: existingUserDoc.cloudinaryPublicId || existingUserDoc.savedName,
                secureUrl: existingUserDoc.cloudinaryUrl
            };
            await logEvento({
                level: 'INFO',
                source: 'API_USER_DOCS',
                action: 'DEDUPLICATION_HIT',
                message: `File ${file.name} deduplicated (UserDoc Hit)`,
                correlationId,
                details: { originalId: existingUserDoc._id }
            });
        } else if (existingKA) {
            // 2. Hit in global knowledge assets
            console.log(`[SmartUpload] Deduplication HIT (KnowledgeAsset) for MD5 ${fileMd5}`);
            uploadResult = {
                publicId: existingKA.cloudinaryPublicId || existingKA.savedName || '', // Fallback for safety
                secureUrl: existingKA.cloudinaryUrl || ''
            };

            // Safety check: if missing critical info, force upload
            if (!uploadResult.publicId || !uploadResult.secureUrl) {
                console.warn(`[SmartUpload] Deduplication hit but missing data in KA ${existingKA._id}. Re-uploading.`);
                const cloudResult = await uploadUserDocument(buffer, file.name, tenantId, session.user.id);
                uploadResult = {
                    publicId: cloudResult.publicId,
                    secureUrl: cloudResult.secureUrl
                };
            }

            await logEvento({
                level: 'INFO',
                source: 'API_USER_DOCS',
                action: 'DEDUPLICATION_HIT',
                message: `File ${file.name} deduplicated (KA Hit)`,
                correlationId,
                details: { originalId: existingKA._id }
            });
        } else {
            // 3. MISS - Upload to Cloudinary
            try {
                const cloudResult = await uploadUserDocument(buffer, file.name, tenantId, session.user.id);
                uploadResult = {
                    publicId: cloudResult.publicId,
                    secureUrl: cloudResult.secureUrl
                };
            } catch (uploadErr: any) {
                console.error("Cloudinary Upload Error:", uploadErr);
                throw new AppError('EXTERNAL_SERVICE_ERROR', 502, 'Failed to upload file to storage provider');
            }
        }

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
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json(
                new ValidationError('Invalid document metadata', error.issues).toJSON(),
                { status: 400 }
            );
        }
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        await logEvento({
            level: 'ERROR',
            source: 'API_USER_DOCS',
            action: 'UPLOAD_DOC_ERROR',
            message: error.message,
            correlationId,
            stack: error.stack
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
