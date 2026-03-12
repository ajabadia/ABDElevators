import { ObjectId, Filter } from 'mongodb';
import { NotFoundError } from '@/lib/errors';
import { EntityIdSchema, TenantIdSchema } from '@/lib/schemas/common';
import { type EntityId, type TenantId } from '@/lib/schemas/common';
import { getTenantCollection } from '@/lib/db-tenant';
import { UserRole } from '@/types/roles';

export interface User {
    _id: EntityId;
    tenantId: TenantId;
    role: string;
    isActive: boolean;
    email: string;
    foto_url?: string;
    foto_cloudinary_id?: string;
    updatedAt?: Date;
    createdAt?: Date;
}

/**
 * Service for user and profile management.
 * Phase 171.2: Profile logic encapsulation.
 */
export class UserService {
    private static COLLECTION = 'users';

    /**
     * Lists users filtering by tenant, role, or status.
     */
    static async list(filter: { tenantId: string; role?: string; isActive?: boolean }): Promise<{ users: User[] }> {
        const tenantId = TenantIdSchema.parse(filter.tenantId);
        
        // System context for user list retrieval
        const systemSession = {
            user: {
                id: '000000000000000000000000' as EntityId,
                tenantId,
                role: UserRole.SUPER_ADMIN
            }
        };

        const users = await getTenantCollection<User>('users', systemSession as any, 'AUTH');
        const mongoFilter: Filter<User> = {};

        if (filter.role) mongoFilter.role = filter.role;
        if (filter.isActive !== undefined) mongoFilter.isActive = filter.isActive;

        const docs = await users.unsecureRawCollection.find(mongoFilter as any)
            .project({ password: 0 } as any)
            .toArray();

        return { users: docs as unknown as User[] };
    }

    /**
     * Updates a user's profile photo.
     */
    static async updateProfilePhoto(rawUserId: string | EntityId, tenantId: string, secureUrl: string, publicId: string) {
        const userId = EntityIdSchema.parse(rawUserId);
        const tId = TenantIdSchema.parse(tenantId);

        const authContext = {
            user: {
                id: userId,
                tenantId: tId,
                role: UserRole.USER
            }
        };

        const users = await getTenantCollection<User>('users', authContext as any, 'AUTH');

        const result = await users.updateOne(
            { _id: new ObjectId(userId) as any },
            {
                $set: {
                    foto_url: secureUrl,
                    foto_cloudinary_id: publicId,
                    updatedAt: new Date()
                } as any
            } as any
        );

        if (result.matchedCount === 0) {
            throw new NotFoundError('User not found');
        }

        return { success: true };
    }
}
