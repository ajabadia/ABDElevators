import {
    PermissionPolicy,
    PermissionGroup
} from '@/lib/schemas';
import { getTenantCollection } from '@/lib/db-tenant';
import { ObjectId } from 'mongodb';
import { logEvento } from '@/lib/logger';
import { AuditTrailService } from '../observability/AuditTrailService';
import { CorrelationIdService } from '../observability/CorrelationIdService';

/**
 * 🛡️ GuardianService: Gestión de políticas y grupos de permisos (Phase 120.2)
 * Parte del sistema central de seguridad Guardian V3.
 */
export class GuardianService {

    // --- POLICIES ---

    static async listPolicies(tenantId: string): Promise<PermissionPolicy[]> {
        const collection = await getTenantCollection('policies');
        const docs = await collection.find({ tenantId });
        return docs as unknown as PermissionPolicy[];
    }

    static async createPolicy(tenantId: string, data: Omit<PermissionPolicy, '_id' | 'tenantId' | 'createdAt' | 'updatedAt'>, userId: string): Promise<string> {
        const collection = await getTenantCollection('policies');

        const newPolicy = {
            ...data,
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const correlationId = CorrelationIdService.generate('GUARDIAN');
        const result = await collection.insertOne(newGroup);

        await AuditTrailService.logSecurityEvent({
            actorType: 'USER',
            actorId: userId,
            tenantId,
            action: 'CREATE_POLICY',
            entityType: 'SECURITY_POLICY',
            entityId: result.insertedId.toString(),
            changes: { after: data },
            reason: `Policy created: ${data.name}`,
            correlationId
        });

        await logEvento({
            level: 'INFO',
            source: 'GUARDIAN',
            action: 'CREATE_POLICY',
            message: `Policy '${data.name}' created by ${userId}`,
            correlationId,
            tenantId
        });

        return result.insertedId.toString();
    }

    static async updatePolicy(tenantId: string, policyId: string, updates: Partial<PermissionPolicy>, userId: string): Promise<void> {
        const collection = await getTenantCollection('policies');

        const correlationId = CorrelationIdService.generate('GUARDIAN');
        await collection.updateOne(
            { _id: new ObjectId(policyId), tenantId },
            {
                $set: {
                    ...updates,
                    updatedAt: new Date()
                }
            }
        );

        await AuditTrailService.logSecurityEvent({
            actorType: 'USER',
            actorId: userId,
            tenantId,
            action: 'UPDATE_POLICY',
            entityType: 'SECURITY_POLICY',
            entityId: policyId,
            changes: { updates },
            reason: `Policy updated: ${policyId}`,
            correlationId
        });

        await logEvento({
            level: 'INFO',
            source: 'GUARDIAN',
            action: 'UPDATE_POLICY',
            message: `Policy '${policyId}' updated by ${userId}`,
            correlationId,
            tenantId
        });
    }

    static async deletePolicy(tenantId: string, policyId: string, userId: string): Promise<void> {
        const collection = await getTenantCollection('policies');
        await collection.deleteOne({ _id: new ObjectId(policyId), tenantId });

        await logEvento({
            level: 'WARN',
            source: 'GUARDIAN',
            action: 'DELETE_POLICY',
            message: `Policy '${policyId}' deleted by ${userId}`,
            correlationId: policyId,
            tenantId
        });
    }

    // --- GROUPS ---

    static async listGroups(tenantId: string): Promise<PermissionGroup[]> {
        const collection = await getTenantCollection('permission_groups', undefined, 'AUTH');
        const docs = await collection.find({ tenantId });
        return docs as unknown as PermissionGroup[];
    }

    static async createGroup(tenantId: string, data: Omit<PermissionGroup, '_id' | 'tenantId' | 'createdAt' | 'updatedAt'>, userId: string): Promise<string> {
        const collection = await getTenantCollection('permission_groups', undefined, 'AUTH');

        const newGroup = {
            ...data,
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await collection.insertOne(newGroup);

        await logEvento({
            level: 'INFO',
            source: 'GUARDIAN',
            action: 'CREATE_GROUP',
            message: `Group '${data.name}' created by ${userId}`,
            correlationId: result.insertedId.toString(),
            tenantId
        });

        return result.insertedId.toString();
    }

    static async updateGroup(tenantId: string, groupId: string, updates: Partial<PermissionGroup>, userId: string): Promise<void> {
        const collection = await getTenantCollection('permission_groups', undefined, 'AUTH');

        await collection.updateOne(
            { _id: new ObjectId(groupId), tenantId },
            {
                $set: {
                    ...updates,
                    updatedAt: new Date()
                }
            }
        );

        await logEvento({
            level: 'INFO',
            source: 'GUARDIAN',
            action: 'UPDATE_GROUP',
            message: `Group '${groupId}' updated by ${userId}`,
            correlationId: groupId,
            tenantId
        });
    }

    static async addUserToGroup(tenantId: string, userId: string, groupId: string, actorId: string): Promise<void> {
        const correlationId = CorrelationIdService.generate('GUARDIAN');
        const users = await getTenantCollection('users', undefined);

        await users.updateOne(
            { _id: new ObjectId(userId), tenantId },
            { $addToSet: { permissionGroups: groupId } }
        );

        await AuditTrailService.logSecurityEvent({
            actorType: 'USER',
            actorId,
            tenantId,
            action: 'ASSIGN_GROUP',
            entityType: 'USER_PERMISSION',
            entityId: userId,
            changes: { addedGroup: groupId },
            reason: `User assigned to permission group: ${groupId}`,
            correlationId
        });

        await logEvento({
            level: 'INFO',
            source: 'GUARDIAN',
            action: 'ASSIGN_GROUP',
            message: `User ${userId} added to Group ${groupId} by ${actorId}`,
            correlationId,
            tenantId
        });
    }

    static async removeUserFromGroup(tenantId: string, userId: string, groupId: string, actorId: string): Promise<void> {
        const users = await getTenantCollection('users', undefined);

        await users.updateOne(
            { _id: new ObjectId(userId), tenantId },
            { $pull: { permissionGroups: groupId } }
        );

        await logEvento({
            level: 'INFO',
            source: 'GUARDIAN',
            action: 'REMOVE_GROUP',
            message: `User ${userId} removed from Group ${groupId} by ${actorId}`,
            correlationId: userId,
            tenantId
        });
    }
}
