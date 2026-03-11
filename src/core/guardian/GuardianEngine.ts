import { PermissionPolicy, PermissionGroup, User, AccessLog } from '@/lib/schemas';
import { getTenantCollection } from '@/lib/db-tenant';
import { ObjectId } from 'mongodb';
import { UserRole } from '@/types/roles';
import { Redis } from '@upstash/redis';

function safeObjectId(id: string | undefined | null): ObjectId | null {
    if (!id || typeof id !== 'string') return null;
    try {
        // Only attempt conversion if it looks like a 24-char hex string
        if (id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
            return new ObjectId(id);
        }
        return null;
    } catch {
        return null;
    }
}

interface EvaluationContext {
    ip?: string;
    userAgent?: string;
    // ... other context
}

export interface EvaluationUser {
    role: UserRole;
    tenantId: string;
    permissionGroups?: string[];
    permissionOverrides?: string[];
}

export class GuardianEngine {
    private static instance: GuardianEngine;

    // Upstash Redis for distributed per-tenant/user permission caching (Phase 345)
    private redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL || "",
        token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
    });

    private constructor() { }

    public static getInstance(): GuardianEngine {
        if (!GuardianEngine.instance) {
            GuardianEngine.instance = new GuardianEngine();
        }
        return GuardianEngine.instance;
    }

    /**
     * Core Evaluation Logic (ABAC)
     */
    public async evaluate(
        user: EvaluationUser,
        resource: string, // e.g., 'workflow:create' or just 'workflow'
        action: string,   // e.g., 'write'
        context?: EvaluationContext
    ): Promise<{ allowed: boolean; reason: string }> {

        const tenantId = user.tenantId;

        // 0. Cache Check (Phase 345)
        const cacheKey = `guardian:perm:${tenantId}:${user.role}:${resource}:${action}:${JSON.stringify(user.permissionGroups)}`;
        try {
            const cachedDecision = await this.redis.get<{ allowed: boolean; reason: string }>(cacheKey);
            if (cachedDecision) return cachedDecision;
        } catch (e) {
            console.warn('[GuardianEngine] Redis cache unreachable, falling back to DB evaluation');
        }

        // 1. Super Admin Bypass (God Mode)
        if (user.role === UserRole.SUPER_ADMIN) {
            return { allowed: true, reason: 'SUPER_ADMIN bypass' };
        }

        // 2. Fetch Effective Policies for User
        // This involves: Direct Assignment (if any) + Group Inheritance
        const policies = await this.getUserEffectivePolicies(user, tenantId);

        if (policies.length === 0) {
            // No policies = Default Deny
            return { allowed: false, reason: 'Implicit Deny: No policies found for user' };
        }

        let explicitAllow = false;
        let explicitDeny = false;

        // 3. Evaluate Policies
        for (const policy of policies) {
            // Check Resource Match
            const resourceMatch = this.matchResource(policy.resources, resource);
            // Check Action Match
            const actionMatch = policy.actions.includes('*') || policy.actions.includes(action);

            if (resourceMatch && actionMatch) {
                // Check Conditions (ABAC)
                const conditionMatch = this.evaluateConditions(policy.conditions, context);

                if (conditionMatch) {
                    if (policy.effect === 'DENY') {
                        explicitDeny = true;
                        return { allowed: false, reason: `Explicit DENY in policy '${policy.name}'` };
                    } else {
                        explicitAllow = true;
                    }
                }
            }
        }

        const decision = explicitAllow ? { allowed: true, reason: 'Explicit ALLOW found' } : { allowed: false, reason: 'Implicit Deny: No matching ALLOW policy' };

        // 4. Audit decision (Phase 345)
        await this.auditDecision(user, resource, action, decision, context);

        // 5. Cache result (60s TTL)
        try {
            await this.redis.set(cacheKey, decision, { ex: 60 });
        } catch (e) { }

        return decision;
    }

    private async auditDecision(user: EvaluationUser, resource: string, action: string, decision: { allowed: boolean; reason: string }, context?: EvaluationContext) {
        try {
            const logsCollection = await getTenantCollection('access_logs');
            await logsCollection.insertOne({
                tenantId: user.tenantId,
                userId: (user as any).id || 'system',
                resource,
                action,
                decision: decision.allowed ? 'ALLOW' : 'DENY',
                reason: decision.reason,
                context: {
                    ip: context?.ip,
                    userAgent: context?.userAgent,
                    timestamp: new Date()
                },
                createdAt: new Date()
            } as AccessLog);
        } catch (e) {
            console.error('[GuardianEngine] Failed to audit access decision:', e);
        }
    }

    /**
     * Resolves all policies applicable to the user (Overrides + Groups + Hierarchy)
     */
    private async getUserEffectivePolicies(user: EvaluationUser, tenantId: string): Promise<PermissionPolicy[]> {
        const groupsCollection = await getTenantCollection('permission_groups');
        const policiesCollection = await getTenantCollection('policies');

        const policyIds = new Set<string>();

        // 1. Collect Direct User Overrides
        if (user.permissionOverrides && Array.isArray(user.permissionOverrides)) {
            user.permissionOverrides.forEach(id => policyIds.add(id));
        }

        // 2. Identify User Groups
        const userGroupIds = user.permissionGroups || [];

        // 3. Resolve Group Hierarchy (Recursive BFS)
        if (userGroupIds.length > 0) {
            const processedGroups = new Set<string>();
            const queue = [...userGroupIds];

            while (queue.length > 0) {
                const currentGroupId = queue.shift()!;
                if (!currentGroupId || processedGroups.has(currentGroupId)) continue;
                processedGroups.add(currentGroupId);

                const objId = safeObjectId(currentGroupId);
                if (!objId) {
                    console.warn(`[GuardianEngine] Skipping malformed groupId: ${currentGroupId}`);
                    continue;
                }

                // Fetch group
                const group = await groupsCollection.findOne({
                    _id: objId,
                    tenantId
                });

                if (group) {
                    // Collect Policies from Group
                    if (group.policies && Array.isArray(group.policies)) {
                        group.policies.forEach((pid: string) => policyIds.add(pid));
                    }

                    // Add Parent to queue for inheritance
                    if (group.parentId) {
                        queue.push(group.parentId);
                    }
                }
            }
        }

        if (policyIds.size === 0) return [];

        // 4. Fetch All Collected Policies
        const validObjectIds = Array.from(policyIds)
            .map(id => safeObjectId(id))
            .filter((id): id is ObjectId => id !== null);

        if (validObjectIds.length === 0) return [];

        const policiesCur = await policiesCollection.find({
            _id: { $in: validObjectIds },
            isActive: true
        });

        const policies: PermissionPolicy[] = [];
        await policiesCur.forEach(doc => {
            policies.push(doc as unknown as PermissionPolicy);
        });

        return policies;
    }

    private matchResource(patterns: string[], resource: string): boolean {
        // Simple Glob matching: 'workflow:*' matches 'workflow:create'
        return patterns.some(pattern => {
            if (pattern === '*' || pattern === resource) return true;
            if (pattern.endsWith(':*')) {
                const prefix = pattern.slice(0, -2);
                return resource.startsWith(prefix);
            }
            return false;
        });
    }

    private evaluateConditions(conditions: PermissionPolicy['conditions'], context?: EvaluationContext): boolean {
        if (!conditions) return true; // No conditions = Match

        // IP Check
        if (conditions.ipRange && context?.ip) {
            // TODO: Implement CIDR check. For now strict equality.
            if (!conditions.ipRange.includes(context.ip)) return false;
        }

        // Time Check
        if (conditions.timeWindow) {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMin = now.getMinutes();
            const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;

            if (currentTime < conditions.timeWindow.start || currentTime > conditions.timeWindow.end) {
                return false;
            }
            if (conditions.timeWindow.days && !conditions.timeWindow.days.includes(now.getDay())) {
                return false;
            }
        }

        return true;
    }
}
