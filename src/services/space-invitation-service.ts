import { getTenantCollection } from "@/lib/db-tenant";
import { SpaceInvitation, SpaceInvitationSchema } from "@/lib/schemas/spaces";
import { generateUUID } from "@/lib/utils";
import { AppError } from "@/lib/errors";
import { ClientSession, ObjectId } from "mongodb";

export class SpaceInvitationService {
    /**
     * Crea una nueva invitación para un espacio.
     */
    static async createInvitation(data: {
        spaceId: string;
        email: string;
        invitedBy: string;
        tenantId: string;
        role?: 'VIEWER' | 'EDITOR' | 'ADMIN';
        expiresInDays?: number;
    }, session?: ClientSession): Promise<SpaceInvitation> {
        const collection = await getTenantCollection<SpaceInvitation>('space_invitations', session);

        const token = generateUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (data.expiresInDays || 7));

        const invitation: SpaceInvitation = {
            spaceId: data.spaceId,
            email: data.email,
            token,
            invitedBy: data.invitedBy,
            status: 'PENDING',
            role: data.role || 'VIEWER',
            expiresAt,
            tenantId: data.tenantId,
            createdAt: new Date()
        };

        const validated = SpaceInvitationSchema.parse(invitation);
        await collection.insertOne(validated as any);

        return validated;
    }

    /**
     * Valida un token de invitación y devuelve la invitación si es válida.
     */
    static async validateToken(token: string): Promise<SpaceInvitation> {
        const collection = await getTenantCollection<SpaceInvitation>('space_invitations');

        const invitation = await collection.findOne({
            token,
            status: 'PENDING',
            expiresAt: { $gt: new Date() }
        });

        if (!invitation) {
            throw new AppError('INVITATION_NOT_FOUND', 404, 'La invitación no es válida o ha expirado');
        }

        return invitation;
    }

    /**
     * Marca una invitación como aceptada y otorga el acceso.
     */
    static async acceptInvitation(token: string, userId: string, session?: ClientSession): Promise<void> {
        const collection = await getTenantCollection<SpaceInvitation>('space_invitations', session);

        const invitation = await collection.findOne({ token, status: 'PENDING' }, { session });
        if (!invitation) {
            throw new AppError('INVITATION_NOT_FOUND', 404, 'Invitación no válida');
        }

        // 1. Mark invitation as accepted
        await collection.updateOne(
            { token, status: 'PENDING' },
            { $set: { status: 'ACCEPTED' } },
            { session }
        );

        // 2. Grant access to the space
        const spacesCol = await getTenantCollection('spaces', session);
        await spacesCol.updateOne(
            { _id: new ObjectId(invitation.spaceId) },
            {
                $addToSet: {
                    collaborators: {
                        userId,
                        role: invitation.role,
                        joinedAt: new Date()
                    }
                }
            },
            { session }
        );
    }
}
