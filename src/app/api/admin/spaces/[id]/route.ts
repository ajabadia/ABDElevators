import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { AppError, handleApiError } from '@/lib/errors';
import { enforcePermission } from '@/lib/guardian-guard';
import { Space, SpaceSchema } from '@/lib/schemas/spaces';
import { logEvento } from '@/lib/logger';
import { generateUUID } from '@/lib/utils';
import { ObjectId } from 'mongodb';

/**
 * [PHASE 125.2] Individual Space Management API
 * GET /api/admin/spaces/[id]
 * PATCH /api/admin/spaces/[id]
 * DELETE /api/admin/spaces/[id]
 */

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = generateUUID();
    try {
        const session = await enforcePermission('knowledge', 'read');
        const { id } = await params;
        const collection = await getTenantCollection<Space>('spaces', session);

        const item = await collection.findOne({ _id: new ObjectId(id) });
        if (!item) throw new AppError('NOT_FOUND', 404, 'Espacio no encontrado');

        return NextResponse.json({ success: true, item });
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_SPACES', correlationId);
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = generateUUID();
    try {
        const session = await enforcePermission('knowledge', 'manage_spaces');
        const { id } = await params;
        const body = await req.json();

        // Validation: Only allow partial updates, excluding critical fields if necessary
        const validatedData = SpaceSchema.partial().parse(body);
        delete (validatedData as any)._id; // Never update ID

        const collection = await getTenantCollection<Space>('spaces', session);

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    ...validatedData,
                    updatedAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            throw new AppError('NOT_FOUND', 404, 'Espacio no encontrado');
        }

        await logEvento({
            level: 'INFO',
            source: 'API_ADMIN_SPACES',
            action: 'UPDATE_SPACE',
            message: `Espacio ${id} actualizado`,
            correlationId,
            tenantId: session.user.tenantId,
            details: { spaceId: id, updates: Object.keys(validatedData) }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_SPACES', correlationId);
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = generateUUID();
    try {
        const session = await enforcePermission('knowledge', 'manage_spaces');
        const { id } = await params;
        const collection = await getTenantCollection<Space>('spaces', session);

        // Soft delete
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { deletedAt: new Date(), isActive: false } }
        );

        if (result.matchedCount === 0) {
            throw new AppError('NOT_FOUND', 404, 'Espacio no encontrado');
        }

        await logEvento({
            level: 'WARN',
            source: 'API_ADMIN_SPACES',
            action: 'DELETE_SPACE',
            message: `Espacio ${id} marcado como eliminado`,
            correlationId,
            tenantId: session.user.tenantId,
            details: { spaceId: id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_SPACES', correlationId);
    }
}
