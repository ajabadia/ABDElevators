import {
    PermissionPolicy,
    PermissionGroup,
    PermissionPolicySchema,
    PermissionGroupSchema
} from '@/lib/schemas';
import { z } from 'zod';
import { getTenantCollection } from '@/lib/db-tenant';
import { ObjectId } from 'mongodb';
import { logEvento } from '@/lib/logger';
import { AuditTrailService } from '@/services/observability/AuditTrailService';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { EntityIdSchema, TenantIdSchema } from '@abd/platform-core';

/**
 * 🛡️ GuardianService: Gestión de políticas y grupos de permisos (Phase 120.2)
 * Parte del sistema central de seguridad Guardian V3.
 */
export class GuardianService {

    // --- POLICIES ---

    static async listPolicies(tenantId: string): Promise<PermissionPolicy[]> {
        const collection = await getTenantCollection('policies');
        const docs = await collection.find({ tenantId });
        return z.array(PermissionPolicySchema).parse(docs);
    }

    static async createPolicy(tenantId: string, data: Omit<PermissionPolicy, '_id' | 'tenantId' | 'createdAt' | 'updatedAt'>, userId: string): Promise<string> {
        return await withCorrelation(
            { level: 'INFO', source: 'GUARDIAN', action: 'CREATE_POLICY', tenantId, userId },
            async ({ log, correlationId }) => {
                const collection = await getTenantCollection('policies');

                const newPolicy = {
                    ...data,
                    tenantId: TenantIdSchema.parse(tenantId),
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                const result = await collection.insertOne(newPolicy as unknown as PermissionPolicy);


                await AuditTrailService.logSecurityEvent({
                    actorType: 'USER',
                    actorId: userId,
                    tenantId,
                    action: 'CREATE_POLICY',
                    entityType: 'SECURITY',
                    entityId: result.insertedId.toString(),
                    changes: { before: null, after: data },
                    reason: `Policy created: ${data.name}`,
                    correlationId
                });

                await log({
                    message: `Policy '${data.name}' created by ${userId}`,
                    details: { policyId: result.insertedId.toString() }
                });

                return result.insertedId.toString();
            }
        );
    }

    static async updatePolicy(tenantId: string, policyId: string, updates: Partial<PermissionPolicy>, userId: string): Promise<void> {
        return await withCorrelation(
            { level: 'INFO', source: 'GUARDIAN', action: 'UPDATE_POLICY', tenantId, userId },
            async ({ log, correlationId }) => {
                const collection = await getTenantCollection('policies');

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
                    entityType: 'SECURITY',
                    entityId: policyId,
                    changes: { before: null, after: updates },
                    reason: `Policy updated: ${policyId}`,
                    correlationId
                });

                await log({
                    message: `Policy '${policyId}' updated by ${userId}`
                });
            }
        );
    }

    static async deletePolicy(tenantId: string, policyId: string, userId: string): Promise<void> {
        return await withCorrelation(
            { level: 'WARN', source: 'GUARDIAN', action: 'DELETE_POLICY', tenantId, userId },
            async ({ log }) => {
                const collection = await getTenantCollection('policies');
                await collection.deleteOne({ _id: new ObjectId(policyId), tenantId });

                await log({
                    message: `Policy '${policyId}' deleted by ${userId}`
                });
            }
        );
    }

    // --- GROUPS ---

    static async listGroups(tenantId: string): Promise<PermissionGroup[]> {
        const collection = await getTenantCollection('permission_groups', undefined, 'AUTH');
        const docs = await collection.find({ tenantId });
        return z.array(PermissionGroupSchema).parse(docs);
    }

    static async createGroup(tenantId: string, data: Omit<PermissionGroup, '_id' | 'tenantId' | 'createdAt' | 'updatedAt'>, userId: string): Promise<string> {
        return await withCorrelation(
            { level: 'INFO', source: 'GUARDIAN', action: 'CREATE_GROUP', tenantId, userId },
            async ({ log }) => {
                const collection = await getTenantCollection('permission_groups', undefined, 'AUTH');

                const newGroup = {
                    ...data,
                    tenantId: TenantIdSchema.parse(tenantId),
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                const result = await collection.insertOne(newGroup as unknown as PermissionGroup);


                await log({
                    message: `Group '${data.name}' created by ${userId}`,
                    details: { groupId: result.insertedId.toString() }
                });

                return result.insertedId.toString();
            }
        );
    }

    static async updateGroup(tenantId: string, groupId: string, updates: Partial<PermissionGroup>, userId: string): Promise<void> {
        return await withCorrelation(
            { level: 'INFO', source: 'GUARDIAN', action: 'UPDATE_GROUP', tenantId, userId },
            async ({ log }) => {
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

                await log({
                    message: `Group '${groupId}' updated by ${userId}`
                });
            }
        );
    }

    static async addUserToGroup(tenantId: string, userId: string, groupId: string, actorId: string): Promise<void> {
        return await withCorrelation(
            { level: 'INFO', source: 'GUARDIAN', action: 'ASSIGN_GROUP', tenantId, userId: actorId },
            async ({ log, correlationId }) => {
                const users = await getTenantCollection<any>('users', undefined); // TODO: Import User type to remove any

                await users.updateOne(
                    { _id: new ObjectId(userId), tenantId },
                    { $addToSet: { permissionGroups: groupId } } as any
                );


                await AuditTrailService.logSecurityEvent({
                    actorType: 'USER',
                    actorId,
                    tenantId,
                    action: 'ASSIGN_GROUP',
                    entityType: 'SECURITY',
                    entityId: userId,
                    changes: { before: null, after: { addedGroup: groupId } },
                    reason: `User assigned to permission group: ${groupId}`,
                    correlationId
                });

                await log({
                    message: `User ${userId} added to Group ${groupId} by ${actorId}`
                });
            }
        );
    }

    static async removeUserFromGroup(tenantId: string, userId: string, groupId: string, actorId: string): Promise<void> {
        return await withCorrelation(
            { level: 'INFO', source: 'GUARDIAN', action: 'REMOVE_GROUP', tenantId, userId: actorId },
            async ({ log }) => {
                const users = await getTenantCollection<any>('users', undefined); // TODO: Import User type

                await users.updateOne(
                    { _id: new ObjectId(userId), tenantId },
                    { $pull: { permissionGroups: groupId } } as any
                );


                await log({
                    message: `User ${userId} removed from Group ${groupId} by ${actorId}`
                });
            }
        );
    }
}
