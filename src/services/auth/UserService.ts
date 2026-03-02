import { connectAuthDB } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { NotFoundError } from '@/lib/errors';

/**
 * Servicio para la gestión de usuarios y perfiles.
 * Fase 171.2: Encapsulación de lógica de perfil.
 */
export class UserService {
    private static COLLECTION = 'users';

    /**
     * Lista usuarios filtrando por tenant, rol o estado.
     */
    static async list(filter: { tenantId?: string; role?: string; isActive?: boolean }): Promise<{ users: any[] }> {
        const authDb = await connectAuthDB();
        const mongoFilter: any = {};
        if (filter.tenantId) mongoFilter.tenantId = filter.tenantId;
        if (filter.role) mongoFilter.role = filter.role;
        if (filter.isActive !== undefined) mongoFilter.isActive = filter.isActive;

        const users = await authDb.collection(this.COLLECTION)
            .find(mongoFilter)
            .project({ password: 0 })
            .toArray();

        return { users };
    }

    /**
     * Actualiza la foto de perfil de un usuario.
     * @param userId ID del usuario
     * @param secureUrl URL segura de Cloudinary
     * @param publicId ID público de Cloudinary
     */
    static async updateProfilePhoto(userId: string, secureUrl: string, publicId: string) {
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
