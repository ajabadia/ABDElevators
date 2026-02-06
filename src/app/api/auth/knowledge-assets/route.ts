import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB, connectAuthDB } from '@/lib/db';
import { uploadUserDocument } from '@/lib/cloudinary';
import { UserDocumentSchema } from '@/lib/schemas';
import { logEvento } from '@/lib/logger';
import { AppError, ValidationError, NotFoundError } from '@/lib/errors';
import crypto from 'crypto';

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
        if (!session?.user?.email) {
            throw new AppError('UNAUTHORIZED', 401, 'Unauthorized');
        }

        const authDb = await connectAuthDB();
        const user = await authDb.collection('users').findOne({ email: session.user.email });
        if (!user) throw new NotFoundError('User not found');

        const db = await connectDB();

        // 1. Fetch personal documents
        const personalDocs = await db.collection('user_documents')
            .find({ userId: user._id.toString() })
            .sort({ createdAt: -1 })
            .toArray();

        // 2. For Admin/Engineering, also include technical assets
        let knowledgeAssets: any[] = [];
        const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'ENGINEERING'].includes(session.user.role || '');

        if (isAdmin) {
            const assets = await db.collection('knowledge_assets')
                .find({ status: 'active' })
                .sort({ createdAt: -1 })
                .toArray();

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
        const documents = [...personalDocs, ...knowledgeAssets].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return NextResponse.json(documents);
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
        if (!session?.user?.email) {
            throw new AppError('UNAUTHORIZED', 401, 'Unauthorized');
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const description = formData.get('descripcion') as string || formData.get('description') as string;

        if (!file) {
            throw new ValidationError('No file uploaded');
        }

        const authDb = await connectAuthDB();
        const user = await authDb.collection('users').findOne({ email: session.user.email });
        if (!user) throw new NotFoundError('User not found');

        const db = await connectDB();
        const buffer = Buffer.from(await file.arrayBuffer());
        const tenantId = user.tenantId;

        if (!tenantId) {
            throw new AppError('TENANT_CONFIG_ERROR', 500, 'User has no associated tenantId');
        }
        const uploadResult = await uploadUserDocument(buffer, file.name, tenantId, user._id.toString());

        const docData = {
            userId: user._id.toString(),
            originalName: file.name,
            savedName: uploadResult.publicId,
            cloudinaryUrl: uploadResult.secureUrl,
            cloudinaryPublicId: uploadResult.publicId,
            mimeType: file.type,
            sizeBytes: file.size,
            description: description || '',
            createdAt: new Date(),
        };

        // Rule #2: Zod Validation BEFORE Processing
        const validated = UserDocumentSchema.parse(docData);
        await db.collection('user_documents').insertOne(validated);

        await logEvento({
            level: 'INFO',
            source: 'API_USER_DOCS',
            action: 'UPLOAD_DOC',
            message: `Document uploaded by ${user.email}: ${file.name}`,
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
