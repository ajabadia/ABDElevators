import { z } from 'zod';

/**
 * 🛡️ FASE 58: Guardian V2 - Access Control Schemas
 */

export const PermissionActionSchema = z.enum([
    'read', 'write', 'delete', 'approve', 'reject', 'export', 'impersonate', 'manage'
]);
export type PermissionAction = z.infer<typeof PermissionActionSchema>;

export const PermissionResourceSchema = z.enum([
    'knowledge-asset', 'workflow', 'user', 'settings', 'billing', 'reports', 'developer-tools', 'workflow-task', 'compliance-audit'
]);
export type PermissionResource = z.infer<typeof PermissionResourceSchema>;

/**
 * Granular Permission Policy
 * Defines a specific rule: "Allow/Deny [Action] on [Resource] with [Conditions]"
 */
export const PermissionPolicySchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    name: z.string(),
    description: z.string().optional(),

    effect: z.enum(['ALLOW', 'DENY']).default('ALLOW'),
    resources: z.array(z.string()), // ['workflow:*', 'settings:billing'] (Glob patterns)
    actions: z.array(z.string()), // ['read', 'write']

    // ABAC Conditions
    conditions: z.object({
        ipRange: z.array(z.string()).optional(), // CIDR blocks
        timeWindow: z.object({
            start: z.string(), // "09:00"
            end: z.string(),   // "17:00"
            days: z.array(z.number()).optional() // [1,2,3,4,5] (Mon-Fri)
        }).optional(),
        attributes: z.record(z.string(), z.any()).optional() // { "department": "HR" }
    }).optional(),

    isActive: z.boolean().default(true),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
});
export type PermissionPolicy = z.infer<typeof PermissionPolicySchema>;

/**
 * Permission Group (Hierarchical)
 * Groups contain Users and have attached Policies.
 */
export const PermissionGroupSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    name: z.string(),
    slug: z.string(), // normalized name
    description: z.string().optional(),

    parentId: z.string().nullable().optional(), // For hierarchy
    policies: z.array(z.string()), // Array of Policy IDs

    // Virtual field for UI (computed)
    memberCount: z.number().default(0).optional(),

    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
});
export type PermissionGroup = z.infer<typeof PermissionGroupSchema>;

/**
 * Access Evaluation Log (Audit)
 * Records every "Guardian.evaluate()" outcome.
 */
export const AccessLogSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    userId: z.string(),
    resource: z.string(),
    action: z.string(),

    decision: z.enum(['ALLOW', 'DENY']),
    reason: z.string(), // "Matched policy X", "Implicit deny", "IP restriction"

    policyId: z.string().optional(), // Which policy triggered the decision

    context: z.object({
        ip: z.string().optional(),
        userAgent: z.string().optional(),
        timestamp: z.date()
    }),

    createdAt: z.date().default(() => new Date()),
});
export type AccessLog = z.infer<typeof AccessLogSchema>;
