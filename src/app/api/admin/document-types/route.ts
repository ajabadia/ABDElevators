import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { DocumentTypeSchema } from '@/lib/schemas';
import { AppError, ValidationError, handleApiError } from '@/lib/errors';
import { ObjectId } from 'mongodb';
import { getTenantCollection } from '@/lib/db-tenant';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

async function GET_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_DOC_TYPES', action: 'LIST' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('platform:settings', 'read');
                const collection = await getTenantCollection('document_types', session);
                const { searchParams } = new URL(req.url);
                const category = searchParams.get('category');
                const filter: any = { isActive: true };
                if (category) filter.category = category;

                const types = await (collection.find(filter) as any);
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

                const serializedItems = filteredTypes.map((item: any) => ({
                    ...item,
                    _id: item._id.toString()
                }));

                await log({
                    message: `Retrieved ${serializedItems.length} document types`,
                    details: { count: serializedItems.length, category }
                });

                return NextResponse.json({ success: true, items: serializedItems });
            } catch (error: unknown) {
                return handleApiError(error, 'API_DOC_TYPES_GET', correlationId);
            }
        }
    );
}

async function POST_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_DOC_TYPES', action: 'CREATE' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('platform:settings', 'manage');
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

                await log({ level: 'INFO', message: `Doc type created: ${validated.name}`, details: { id: result.insertedId, name: validated.name } });
                return NextResponse.json({ success: true, id: result.insertedId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_DOC_TYPES_POST', correlationId);
            }
        }
    );
}

async function PATCH_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_DOC_TYPES', action: 'UPDATE' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('platform:settings', 'manage');
                const { id, ...data } = await req.json();
                if (!id) throw new ValidationError('ID required');
                const validatedData = DocumentTypeSchema.partial().parse(data);
                const collection = await getTenantCollection('document_types', session);

                const existing = await collection.findOne({ _id: new ObjectId(id) } as any);
                if (!existing) throw new AppError('NOT_FOUND', 404, 'Document type not found');

                // Privilege Escalation Prevention
                if (session.user.role !== 'SUPER_ADMIN') {
                    if (existing.scope === 'GLOBAL' || existing.scope === 'INDUSTRY') {
                        throw new AppError('FORBIDDEN', 403, 'Tenant admins cannot modify global or industry document types');
                    }
                }

                await collection.updateOne({ _id: new ObjectId(id) } as any, { $set: { ...validatedData, updatedAt: new Date() } });
                
                await log({ message: `Doc type ${id} updated`, details: { id, updates: validatedData } });
                
                return NextResponse.json({ success: true });
            } catch (error: unknown) {
                return handleApiError(error, 'API_DOC_TYPES_PATCH', correlationId);
            }
        }
    );
}

async function DELETE_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_DOC_TYPES', action: 'DELETE' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('platform:settings', 'manage');
                const id = new URL(req.url).searchParams.get('id');
                if (!id) throw new ValidationError('ID required');

                const collection = await getTenantCollection('document_types', session);

                const existing = await collection.findOne({ _id: new ObjectId(id) } as any);
                if (!existing) throw new AppError('NOT_FOUND', 404, 'Document type not found');

                // Privilege Escalation Prevention
                if (session.user.role !== 'SUPER_ADMIN') {
                    if (existing.scope === 'GLOBAL' || existing.scope === 'INDUSTRY') {
                        throw new AppError('FORBIDDEN', 403, 'Tenant admins cannot delete global or industry document types');
                    }
                }

                const kaCol = await getTenantCollection('knowledge_assets', session);
                const inUseKA = await kaCol.findOne({ documentTypeId: id });
                if (inUseKA) throw new AppError('CONFLICT', 409, 'Doc type in use.');

                await collection.deleteOne({ _id: new ObjectId(id) } as any);
                
                await log({ message: `Doc type ${id} deleted`, details: { id, name: existing.name } });
                
                return NextResponse.json({ success: true });
            } catch (error: unknown) {
                return handleApiError(error, 'API_DOC_TYPES_DELETE', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/document-types', thresholdMs: 1000 });
export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/document-types', thresholdMs: 1000 });
export const PATCH = withPerformanceSLA(PATCH_internal, { endpoint: 'PATCH /api/admin/document-types', thresholdMs: 1000 });
export const DELETE = withPerformanceSLA(DELETE_internal, { endpoint: 'DELETE /api/admin/document-types', thresholdMs: 1000 });
