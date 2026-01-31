'use server';

import { auth } from '@/lib/auth';
import { ApiKeyService } from '@/lib/api-key-service';
import { ApiKeyPermission } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';
import { connectDB } from '@/lib/db';
import { ApiKeySchema } from '@/lib/schemas';

export async function createApiKey(name: string, permissions: ApiKeyPermission[], expiresInDays?: number) {
    const session = await auth();
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
        return { success: false, error: 'Unauthorized' };
    }

    const tenantId = (session.user as any).tenantId;

    try {
        const result = await ApiKeyService.createApiKey(
            tenantId,
            name,
            permissions,
            session.user.id,
            expiresInDays
        );

        revalidatePath('/admin/api-keys');
        return { success: true, data: result };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function revokeApiKey(keyId: string) {
    const session = await auth();
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
        return { success: false, error: 'Unauthorized' };
    }

    const tenantId = (session.user as any).tenantId;

    try {
        await ApiKeyService.revokeApiKey(keyId, tenantId);
        revalidatePath('/admin/api-keys');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getApiKeys() {
    const session = await auth();
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
        throw new Error('Unauthorized');
    }

    const tenantId = (session.user as any).tenantId;
    const db = await connectDB();

    const keys = await db.collection('api_keys')
        .find({ tenantId })
        .sort({ createdAt: -1 })
        .toArray();

    // Serialize ObjectIds and Dates
    return keys.map(k => ({
        ...k,
        _id: k._id.toString(),
        createdAt: k.createdAt,
        expiresAt: k.expiresAt,
        lastUsedAt: k.lastUsedAt
    }));
}
