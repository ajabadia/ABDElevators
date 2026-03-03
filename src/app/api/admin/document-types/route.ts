import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { DocumentTypeSchema } from '@/lib/schemas';
import { logEvento } from '@/lib/logger';
import { AppError, ValidationError, handleApiError } from '@/lib/errors';
import { ObjectId } from 'mongodb';
import { getTenantCollection } from '@/lib/db-tenant';
import { enforcePermission } from '@/lib/guardian-guard';

async function GET_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('platform:settings', 'read');
        const collection = await getTenantCollection('document_types', session);
        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category');
        const filter: any = { isActive: true };
        if (category) filter.category = category;

        const types = await collection.find(filter);
        const userIndustry = session.user.industry || 'ELEVATORS';
        const isSuperAdmin = session.user.role === 'SUPER_ADMIN';

        const filteredTypes = isSuperAdmin ? types : types.filter((t: any) => {
            if (t.scope === 'GLOBAL' || t.scope === 'TENANT') return true;
            if (t.scope === 'INDUSTRY') {
                const industries = t.industries || [];
                if (t.industry) industries.push(t.industry);
                return industries.includes(userIndustry);
            }
            return true;
        });

        return NextResponse.json({ success: true, items: filteredTypes });
    } catch (error: unknown) {
        return handleApiError(error, 'API_DOC_TYPES_GET', correlationId);
    }
}

async function POST_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('platform:settings', 'manage');
        const body = await req.json();
        const role = session.user.role;

        if (role !== 'SUPER_ADMIN') {
            if (body.scope && body.scope !== 'TENANT') throw new ValidationError('Admins can only create TENANT scoped types.');
            body.scope = 'TENANT'; body.industry = undefined; body.industries = [];
        }

        const validated = DocumentTypeSchema.parse(body);
        const collection = await getTenantCollection('document_types', session);
        let result;

        if (validated.scope === 'GLOBAL' || validated.scope === 'INDUSTRY') {
            result = await collection.unsecureRawCollection.insertOne({ ...validated, tenantId: 'abd_global', createdAt: new Date() } as any);
        } else {
            result = await collection.insertOne({ ...validated, createdAt: new Date() } as any);
        }

        await logEvento({ level: 'INFO', source: 'API_DOC_TYPES', action: 'CREATE_TYPE', message: `Doc type created: ${validated.name}`, correlationId });
        return NextResponse.json({ success: true, id: result.insertedId });
    } catch (error: unknown) {
        return handleApiError(error, 'API_DOC_TYPES_POST', correlationId);
    }
}

async function PATCH_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('platform:settings', 'manage');
        const { id, ...data } = await req.json();
        if (!id) throw new ValidationError('ID required');
        const validatedData = DocumentTypeSchema.partial().parse(data);
        const collection = await getTenantCollection('document_types', session);
        await collection.updateOne({ _id: new ObjectId(id) } as any, { $set: { ...validatedData, updatedAt: new Date() } });
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return handleApiError(error, 'API_DOC_TYPES_PATCH', correlationId);
    }
}

async function DELETE_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('platform:settings', 'manage');
        const id = new URL(req.url).searchParams.get('id');
        if (!id) throw new ValidationError('ID required');

        const collection = await getTenantCollection('document_types', session);
        const kaCol = await getTenantCollection('knowledge_assets', session);
        const [inUseKA] = await Promise.all([kaCol.findOne({ documentTypeId: id })]);
        if (inUseKA) throw new AppError('CONFLICT', 409, 'Doc type in use.');

        await collection.deleteOne({ _id: new ObjectId(id) } as any);
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return handleApiError(error, 'API_DOC_TYPES_DELETE', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/document-types', thresholdMs: 1000 });
export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/document-types', thresholdMs: 1000 });
export const PATCH = withPerformanceSLA(PATCH_internal, { endpoint: 'PATCH /api/admin/document-types', thresholdMs: 1000 });
export const DELETE = withPerformanceSLA(DELETE_internal, { endpoint: 'DELETE /api/admin/document-types', thresholdMs: 1000 });
