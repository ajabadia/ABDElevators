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
    }, dbSession?: ClientSession): Promise<SpaceInvitation> {
        // Obtenemos la colección usando el tenantId proporcionado para el aislamiento
        const collection = await getTenantCollection<SpaceInvitation>('space_invitations', { user: { id: data.invitedBy, role: 'ADMIN', tenantId: data.tenantId } });

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
        await collection.insertOne(validated as any, { session: dbSession });

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
    static async acceptInvitation(token: string, userId: string, dbSession?: ClientSession): Promise<void> {
        // Para buscar por token, usamos un contexto de sistema ya que no conocemos el tenantId aún
        const systemSession = { user: { id: 'system', tenantId: 'platform_master', role: 'SYSTEM' } };
        const collection = await getTenantCollection<SpaceInvitation>('space_invitations', systemSession);

        const invitation = await collection.findOne({ token, status: 'PENDING' }, { session: dbSession });
        if (!invitation) {
            throw new AppError('INVITATION_NOT_FOUND', 404, 'Invitación no válida');
        }

        // 1. Mark invitation as accepted
        await collection.updateOne(
            { token, status: 'PENDING' },
            { $set: { status: 'ACCEPTED' } },
            { session: dbSession }
        );

        // 2. Grant access to the space
        const targetSession = { user: { id: userId, tenantId: invitation.tenantId, role: 'USER' } };
        const spacesCol = await getTenantCollection('spaces', targetSession);
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
            { session: dbSession }
        );
    }

    /**
     * Lista invitaciones pendientes/expiradas para un tenant.
     */
    static async listInvitations(tenantId: string): Promise<SpaceInvitation[]> {
        const collection = await getTenantCollection<SpaceInvitation>('space_invitations');
        // SecureCollection.find ya devuelve un array. Ordenamos en memoria para simplicidad 
        // o si SecureCollection permitiera pasar opciones de sort.
        const results = await collection.find({ tenantId });
        return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    /**
     * Revoca una invitación.
     */
    static async revokeInvitation(token: string, dbSession?: ClientSession): Promise<void> {
        const systemSession = { user: { id: 'system', tenantId: 'platform_master', role: 'SYSTEM' } };
        const collection = await getTenantCollection<SpaceInvitation>('space_invitations', systemSession);
        const result = await collection.updateOne(
            { token, status: 'PENDING' },
            { $set: { status: 'REVOKED' } },
            { session: dbSession }
        );

        if (result.matchedCount === 0) {
            throw new AppError('INVITATION_NOT_FOUND', 404, 'Invitación no encontrada o ya procesada');
        }
    }
}
