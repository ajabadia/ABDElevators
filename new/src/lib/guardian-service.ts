import {
    PermissionPolicySchema,
    PermissionGroupSchema,
    PermissionPolicy,
    PermissionGroup
} from './schemas';
import { getTenantCollection } from './db-tenant';
import { ObjectId } from 'mongodb';
import { AppError } from './errors';
import { logEvento } from './logger';

export class GuardianService {

    // --- POLICIES ---

    static async listPolicies(tenantId: string): Promise<PermissionPolicy[]> {
        const collection = await getTenantCollection('policies');
        const docs = await collection.find({ tenantId });
        // Validation could be added here but keeping it lean for list
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

        // Zod Validation done by caller usually, but safely parsing here too is good practice
        // Let's assume validated input for Service

        const result = await collection.insertOne(newPolicy);

        await logEvento({
            level: 'INFO',
            source: 'GUARDIAN',
            action: 'CREATE_POLICY',
            message: `Policy '${data.name}' created by ${userId}`,
            correlationId: result.insertedId.toString(),
            tenantId
        });

        return result.insertedId.toString();
    }

    static async updatePolicy(tenantId: string, policyId: string, updates: Partial<PermissionPolicy>, userId: string): Promise<void> {
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

        await logEvento({
            level: 'INFO',
            source: 'GUARDIAN',
            action: 'UPDATE_POLICY',
            message: `Policy '${policyId}' updated by ${userId}`,
            correlationId: policyId,
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

    // Additional helpers: Add User to Group, Remove User from Group would ideally modify the User document
    // We can add those helpers here.

    static async addUserToGroup(tenantId: string, userId: string, groupId: string, actorId: string): Promise<void> {
        const users = await getTenantCollection('users', undefined);

        await users.updateOne(
            { _id: new ObjectId(userId), tenantId },
            { $addToSet: { permissionGroups: groupId } }
        );

        await logEvento({
            level: 'INFO',
            source: 'GUARDIAN',
            action: 'ASSIGN_GROUP',
            message: `User ${userId} added to Group ${groupId} by ${actorId}`,
            correlationId: userId,
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
