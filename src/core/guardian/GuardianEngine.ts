import { PermissionPolicy, PermissionGroup, User } from '@/lib/schemas';
import { getTenantCollection } from '@/lib/db-tenant'; // Assuming this exists or similar db util
import { ObjectId } from 'mongodb';

interface EvaluationContext {
    ip?: string;
    userAgent?: string;
    // ... other context
}

export class GuardianEngine {
    private static instance: GuardianEngine;

    // Simple in-memory cache for Policies (TTL 60s)
    private policyCache: Map<string, { policy: PermissionPolicy; expires: number }> = new Map();

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
        user: User,
        resource: string, // e.g., 'workflow:create' or just 'workflow'
        action: string,   // e.g., 'write'
        context?: EvaluationContext
    ): Promise<{ allowed: boolean; reason: string }> {

        // 1. Super Admin Bypass (God Mode)
        if (user.role === 'SUPER_ADMIN') {
            return { allowed: true, reason: 'SUPER_ADMIN bypass' };
        }

        const tenantId = user.tenantId;

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

        if (explicitAllow) {
            return { allowed: true, reason: 'Explicit ALLOW found' };
        }

        return { allowed: false, reason: 'Implicit Deny: No matching ALLOW policy' };
    }

    /**
     * Resolves all policies applicable to the user (Groups + Hierarchy)
     */
    private async getUserEffectivePolicies(user: User, tenantId: string): Promise<PermissionPolicy[]> {
        const groupsCollection = await getTenantCollection('permission_groups');
        const policiesCollection = await getTenantCollection('policies');

        // 1. Identify User Groups
        const userGroupIds = user.permissionGroups || [];
        if (userGroupIds.length === 0) {
            return [];
        }

        // 2. Resolve Group Hierarchy (Recursive)
        const allGroupIds = new Set<string>(userGroupIds);
        const processedGroups = new Set<string>();
        const policyIds = new Set<string>();

        // Breadth-First Search for hierarchy
        const queue = [...userGroupIds];

        while (queue.length > 0) {
            const currentGroupId = queue.shift()!;
            if (processedGroups.has(currentGroupId)) continue;
            processedGroups.add(currentGroupId);

            // Fetch group
            const group = await groupsCollection.findOne({
                _id: new ObjectId(currentGroupId),
                tenantId
            });

            if (group) {
                // Collect Policies
                if (group.policies && Array.isArray(group.policies)) {
                    group.policies.forEach((pid: string) => policyIds.add(pid));
                }

                // Add Parent to queue
                if (group.parentId) {
                    queue.push(group.parentId);
                    allGroupIds.add(group.parentId);
                }
            }
        }

        if (policyIds.size === 0) return [];

        // 3. Fetch Policies
        const policiesCur = await policiesCollection.find({
            _id: { $in: Array.from(policyIds).map(id => new ObjectId(id)) },
            active: true // active field match with schema? schema says isActive. 
            // Let's assume database field name is 'isActive' to match schema default
        });

        const policies: PermissionPolicy[] = [];
        await policiesCur.forEach(doc => {
            // Mapping DB doc to Schema
            policies.push(doc as unknown as PermissionPolicy);
        });

        // Ensure we filter by isActive in case query didn't catch it 
        // (if DB field differs from query)
        return policies.filter(p => p.isActive !== false);
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
