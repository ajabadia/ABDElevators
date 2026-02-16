import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { auth } from '@/lib/auth';
import { DocumentTypeSchema } from '@/lib/schemas';
import { logEvento } from '@/lib/logger';
import { AppError, ValidationError } from '@/lib/errors';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';

/**
 * GET /api/admin/document-types
 * Lists all configured document types.
 * SLA: P95 < 200ms
 */
export async function GET() {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        const db = await connectDB();
        const types = await db.collection('document_types').find({}).toArray();
        return NextResponse.json(types);
    } catch (error: any) {
        await logEvento({
            level: 'ERROR',
            source: 'API_DOC_TYPES',
            action: 'GET_TYPES_ERROR',
            message: error.message,
            correlationId,
            stack: error.stack
        });
        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error retrieving document types').toJSON(),
            { status: 500 }
        );
    } finally {
        const duration = Date.now() - start;
        if (duration > 200) {
            await logEvento({
                level: 'WARN',
                source: 'API_DOC_TYPES',
                action: 'PERFORMANCE_SLA_VIOLATION',
                message: `GET /api/admin/document-types took ${duration}ms`,
                correlationId,
                details: { durationMs: duration }
            });
        }
    }
}

/**
 * POST /api/admin/document-types
 * Creates a new document type (ADMIN only).
 * SLA: P95 < 400ms
 */
export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'Unauthorized');
        }

        const body = await req.json();

        // RULE #2: Zod Validation BEFORE Processing
        const validated = DocumentTypeSchema.parse(body);

        const db = await connectDB();
        const result = await db.collection('document_types').insertOne({
            ...validated,
            createdAt: new Date()
        });

        await logEvento({
            level: 'INFO',
            source: 'API_DOC_TYPES',
            action: 'CREATE_TYPE',
            message: `Document type created: ${validated.name}`,
            correlationId,
            details: { name: validated.name }
        });

        return NextResponse.json({ success: true, id: result.insertedId });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json(
                new ValidationError('Invalid document type data', error.errors).toJSON(),
                { status: 400 }
            );
        }
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        await logEvento({
            level: 'ERROR',
            source: 'API_DOC_TYPES',
            action: 'CREATE_TYPE_ERROR',
            message: error.message,
            correlationId,
            stack: error.stack
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error creating document type').toJSON(),
            { status: 500 }
        );
    } finally {
        const duration = Date.now() - start;
        if (duration > 400) {
            await logEvento({
                level: 'WARN',
                source: 'API_DOC_TYPES',
                action: 'PERFORMANCE_SLA_VIOLATION',
                message: `POST /api/admin/document-types took ${duration}ms`,
                correlationId,
                details: { durationMs: duration }
            });
        }
    }
}

/**
 * PATCH /api/admin/document-types
 * Updates a document type.
 */
export async function PATCH(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'Unauthorized');
        }

        const body = await req.json();
        const { id, ...data } = body;

        if (!id) throw new ValidationError('ID is required');

        // RULE #2: Zod Validation (Partial)
        const validatedData = DocumentTypeSchema.partial().parse(data);

        const db = await connectDB();
        const objectId = typeof id === 'string' ? new ObjectId(id) : id;

        await db.collection('document_types').updateOne(
            { _id: objectId },
            { $set: { ...validatedData, updatedAt: new Date() } }
        );

        await logEvento({
            level: 'INFO',
            source: 'API_DOC_TYPES',
            action: 'UPDATE_TYPE',
            message: `Document type updated: ${id}`,
            correlationId,
            details: { id, updates: Object.keys(validatedData) }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return await handleApiError(error, 'API_DOC_TYPES_PATCH', correlationId);
    }
}

/**
 * DELETE /api/admin/document-types
 * Deletes a document type if not in use.
 */
export async function DELETE(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'Unauthorized');
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) throw new ValidationError('ID is required');

        const db = await connectDB();
        const objectId = new ObjectId(id);

        // Usage check against knowledge_assets
        const inUse = await db.collection('knowledge_assets').findOne({
            $or: [
                { componentType: id },
                { componentType: objectId }
            ]
        });

        if (inUse) {
            throw new AppError('CONFLICT', 409, 'Cannot delete: Document type is in use.');
        }

        await db.collection('document_types').deleteOne({ _id: objectId });

        await logEvento({
            level: 'INFO',
            source: 'API_DOC_TYPES',
            action: 'DELETE_TYPE',
            message: `Document type deleted: ${id}`,
            correlationId,
            details: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return await handleApiError(error, 'API_DOC_TYPES_DELETE', correlationId);
    }
}

async function handleApiError(error: any, source: string, correlationId: string) {
    if (error.name === 'ZodError') {
        return NextResponse.json(
            new ValidationError('Invalid data', error.errors).toJSON(),
            { status: 400 }
        );
    }
    if (error instanceof AppError) {
        return NextResponse.json(error.toJSON(), { status: error.status });
    }

    await logEvento({
        level: 'ERROR',
        source: source,
        action: 'INTERNAL_ERROR',
        message: error.message || 'Unknown error',
        correlationId,
        stack: error.stack
    });

    return NextResponse.json(
        new AppError('INTERNAL_ERROR', 500, 'Internal Server Error').toJSON(),
        { status: 500 }
    );
}
