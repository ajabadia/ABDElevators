import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DocumentTypeSchema } from '@/lib/schemas';
import { z } from 'zod';
import { logEvento } from '@/lib/logger';
import { AppError, ValidationError } from '@/lib/errors';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { getTenantCollection } from '@/lib/db-tenant';

/**
 * GET /api/admin/document-types
 * Lists all configured document types for the tenant.
 * SLA: P95 < 200ms
 */
export async function GET(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        const session = await auth();
        // 🛡️ Rule #11: SecureCollection for multi-tenant harmony
        const collection = await getTenantCollection('document_types', session);

        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category');

        const filter: any = { isActive: true };
        if (category) {
            filter.category = category;
        }

        const types = await collection.find(filter);

        // 🛡️ 3-Tier Hierarchy Filtering
        // SecureCollection already returns [MyTenant + abd_global]
        // We need to filter 'INDUSTRY' scope for wrong industries
        const userIndustry = session?.user?.industry || 'ELEVATORS'; // Default fallback
        const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

        const filteredTypes = isSuperAdmin ? types : types.filter((t: any) => {
            if (t.scope === 'GLOBAL') return true;
            if (t.scope === 'TENANT') return true; // Already filtered by tenantId in SecureCollection
            if (t.scope === 'INDUSTRY') {
                // Multi-industry check
                const allowedIndustries = t.industries || [];
                // Fallback to legacy single value
                if (t.industry) allowedIndustries.push(t.industry);

                return allowedIndustries.includes(userIndustry);
            }
            return true; // Fallback for legacy types (assumed Tenant or Global)
        });

        return NextResponse.json({ success: true, items: filteredTypes });
    } catch (error: any) {
        return await handleApiError(error, 'API_DOC_TYPES_GET', correlationId);
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
        const role = session?.user?.role;
        if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'Unauthorized');
        }

        const body = await req.json();

        // Admin cannot create GLOBAL or INDUSTRY types
        if (role !== 'SUPER_ADMIN') {
            if (body.scope && body.scope !== 'TENANT') {
                throw new ValidationError('Admins can only create TENANT scoped types.');
            }
            // Force Tenant Scope for non-SuperAdmins
            body.scope = 'TENANT';
            body.industry = undefined;
            body.industries = [];
        }

        // RULE #2: Zod Validation BEFORE Processing
        const validated = DocumentTypeSchema.parse(body);

        const collection = await getTenantCollection('document_types', session);
        let result;

        if (validated.scope === 'GLOBAL' || validated.scope === 'INDUSTRY') {
            // 🛡️ SuperAdmin Privilege: Create in 'abd_global' tenant
            // Access raw collection to bypass tenant injection
            const rawCol = collection.unsecureRawCollection;
            result = await rawCol.insertOne({
                ...validated,
                tenantId: 'abd_global',
                createdAt: new Date()
            } as any);
        } else {
            // Standard Tenant Creation
            result = await collection.insertOne({
                ...validated,
                createdAt: new Date()
            } as any);
        }

        await logEvento({
            level: 'INFO',
            source: 'API_DOC_TYPES',
            action: 'CREATE_TYPE',
            message: `Document type created: ${validated.name}`,
            correlationId,
            details: { name: validated.name, scope: validated.scope, industries: validated.industries }
        });

        return NextResponse.json({ success: true, id: result.insertedId });
    } catch (error: any) {
        return await handleApiError(error, 'API_DOC_TYPES_POST', correlationId);
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
    const start = Date.now();
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

        const collection = await getTenantCollection('document_types', session);
        const objectId = typeof id === 'string' ? new ObjectId(id) : id;

        await collection.updateOne(
            { _id: objectId } as any,
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
    } finally {
        const duration = Date.now() - start;
        if (duration > 400) {
            await logEvento({
                level: 'WARN',
                source: 'API_DOC_TYPES',
                action: 'PERFORMANCE_SLA_VIOLATION',
                message: `PATCH /api/admin/document-types took ${duration}ms`,
                correlationId,
                details: { durationMs: duration }
            });
        }
    }
}

/**
 * DELETE /api/admin/document-types
 * Deletes a document type if not in use.
 */
export async function DELETE(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();
    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'Unauthorized');
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) throw new ValidationError('ID is required');

        const collection = await getTenantCollection('document_types', session);
        const objectId = new ObjectId(id);

        // Usage check (across both collections potentially)
        const kaCol = await getTenantCollection('knowledge_assets', session);
        const udCol = await getTenantCollection('user_documents', session);

        const [inUseKA, inUseUD] = await Promise.all([
            kaCol.findOne({ documentTypeId: id }),
            udCol.findOne({ documentTypeId: id })
        ]);

        if (inUseKA || inUseUD) {
            throw new AppError('CONFLICT', 409, 'Cannot delete: Document type is in use.');
        }

        await collection.deleteOne({ _id: objectId } as any);

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
    } finally {
        const duration = Date.now() - start;
        if (duration > 400) {
            await logEvento({
                level: 'WARN',
                source: 'API_DOC_TYPES',
                action: 'PERFORMANCE_SLA_VIOLATION',
                message: `DELETE /api/admin/document-types took ${duration}ms`,
                correlationId,
                details: { durationMs: duration }
            });
        }
    }
}

async function handleApiError(error: any, source: string, correlationId: string) {
    if (error instanceof z.ZodError) {
        return NextResponse.json(
            new ValidationError('Invalid data', error.issues).toJSON(),
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
