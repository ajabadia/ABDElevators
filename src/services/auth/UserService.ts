import { connectAuthDB } from '@/lib/db';
import { ObjectId, Filter } from 'mongodb';
import { NotFoundError } from '@/lib/errors';
import { EntityIdSchema, TenantIdSchema } from '@/lib/schemas/common';
import { type EntityId, type TenantId } from '@/lib/schemas/common';

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
    static async list(filter: { tenantId?: string; role?: string; isActive?: boolean }): Promise<{ users: User[] }> {
        const authDb = await connectAuthDB();
        const mongoFilter: Filter<User> = {};

        if (filter.tenantId) {
            mongoFilter.tenantId = TenantIdSchema.parse(filter.tenantId);
        }
        if (filter.role) mongoFilter.role = filter.role;
        if (filter.isActive !== undefined) mongoFilter.isActive = filter.isActive;

        const users = await authDb.collection<User>(this.COLLECTION)
            .find(mongoFilter)
            .project({ password: 0 })
            .toArray() as unknown as User[];

        return { users };
    }

    /**
     * Updates a user's profile photo.
     * @param rawUserId User ID
     * @param secureUrl Cloudinary secure URL
     * @param publicId Cloudinary public ID
     */
    static async updateProfilePhoto(rawUserId: string, secureUrl: string, publicId: string) {
        const userId = EntityIdSchema.parse(rawUserId);
        const authDb = await connectAuthDB();

        const result = await authDb.collection(this.COLLECTION).updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    foto_url: secureUrl,
                    foto_cloudinary_id: publicId,
                    updatedAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            throw new NotFoundError('User not found');
        }

        return { success: true };
    }
}
