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
    modificado?: Date;
    createdAt?: Date;
}

/**
 * Servicio para la gestión de usuarios y perfiles.
 * Fase 171.2: Encapsulación de lógica de perfil.
 */
export class UserService {
    private static COLLECTION = 'users';

    /**
     * Lista usuarios filtrando por tenant, rol o estado.
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
     * Actualiza la foto de perfil de un usuario.
     * @param rawUserId ID del usuario
     * @param secureUrl URL segura de Cloudinary
     * @param publicId ID público de Cloudinary
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
                    modificado: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            throw new NotFoundError('Usuario no encontrado');
        }

        return { success: true };
    }
}
