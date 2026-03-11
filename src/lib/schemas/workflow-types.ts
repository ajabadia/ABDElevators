import { z } from 'zod';
import { IndustryTypeSchema, AppEnvironmentEnum } from './core';
import { EntityIdSchema, TenantIdSchema, TenantScopedSchema } from './common';
import { WorkflowLogSchema } from './workflow-base';
import { RAGQueryLogSchema } from './rag-quality';

/**
 * ⚡ FASE 200: Workflow Core Schemas (Engine-Independent)
 */

export const WorkflowStateSchema = z.object({
    id: z.string(),
    label: z.string(),
    color: z.string().default('#64748b'),
    icon: z.string().optional(),
    is_initial: z.boolean().default(false),
    is_final: z.boolean().default(false),
    can_edit: z.boolean().default(true),
    requires_validation: z.boolean().default(false),
    roles_allowed: z.array(z.string()).default(['ADMIN', 'TECHNICAL']),
    checklistConfigId: EntityIdSchema.optional(),
    llmNode: z.object({
        promptKey: z.string().optional(),
        schemaKey: z.string().optional(),
        enabled: z.boolean().default(false),
        temperature: z.number().default(0.7),
        auto_transition: z.boolean().default(false),
    }).optional(),
    subflowId: EntityIdSchema.optional(),
    simulationData: z.object({
        cost_est: z.number().default(0),
        time_est: z.number().default(0),
    }).optional(),
});

export type WorkflowState = z.infer<typeof WorkflowStateSchema>;

export const WorkflowTransitionSchema = z.object({
    from: z.string(),
    to: z.string(),
    label: z.string(),
    action: z.string().optional(),
    required_role: z.array(z.string()).optional(),
    conditions: z.object({
        checklist_complete: z.boolean().default(false),
        min_documents: z.number().default(0),
        require_signature: z.boolean().default(false),
        require_comment: z.boolean().default(false),
    }).optional(),
    actions: z.array(z.string()).optional(),
    probability: z.number().min(0).max(1).default(1).optional(),
    decisionStrategy: z.enum(['USER', 'LLM_DIRECT', 'LLM_SUGGEST_HUMAN_APPROVE', 'HUMAN_ONLY']).default('USER').optional(),
    llmRouting: z.object({
        promptKey: z.string(),
        branches: z.array(z.object({
            value: z.string(),
            to: z.string(),
            label: z.string(),
        })),
    }).optional(),
});

export type WorkflowTransition = z.infer<typeof WorkflowTransitionSchema>;

export const WorkflowDefinitionSchema = TenantScopedSchema.extend({
    industry: IndustryTypeSchema,
    name: z.string(),
    entityType: z.enum(['ENTITY', 'EQUIPMENT', 'USER']).default('ENTITY'),
    states: z.array(WorkflowStateSchema),
    transitions: z.array(WorkflowTransitionSchema),
    initial_state: z.string(),
    is_default: z.boolean().default(false),
    active: z.boolean().default(true),
    status: z.enum(['draft', 'active', 'archived']).default('active'),
    environment: AppEnvironmentEnum.default('PRODUCTION'),
    version: z.number().default(1),
    visual: z.object({
        nodes: z.array(z.any()),
        edges: z.array(z.any()),
    }).optional(),
    executable: z.any().optional(),
    compilationError: z.string().optional(),
});

export type WorkflowDefinition = z.infer<typeof WorkflowDefinitionSchema>;

/**
 * 🚀 WORKFLOW EXECUTION SCHEMA
 * Track A: Procedural Visibility & Relational Hardening.
 */
export const WorkflowExecutionSchema = TenantScopedSchema.extend({
    workflowDefinitionId: EntityIdSchema,
    entityId: EntityIdSchema.optional(), // Document or Equipment being processed
    entityType: z.string().optional(),

    status: z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']).default('PENDING'),

    currentState: z.string(),
    history: z.array(z.object({
        fromState: z.string(),
        toState: z.string(),
        action: z.string().optional(),
        performedBy: EntityIdSchema.optional(),
        timestamp: z.date(),
        metadata: z.record(z.string(), z.unknown()).optional()
    })).default([]),

    nodes: z.array(z.object({
        nodeId: z.string(),
        type: z.string(),
        status: z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED']),
        startedAt: z.date().optional(),
        completedAt: z.date().optional(),
        durationMs: z.number().optional(),
        error: z.string().optional(),

        // RAG Quality Link (Isla 1)
        ragQueryLogId: EntityIdSchema.optional(),

        output: z.record(z.string(), z.unknown()).optional()
    })).default([]),

    triggeredByUserId: EntityIdSchema.optional(),
    correlationId: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).default({}),
});

export type WorkflowExecution = z.infer<typeof WorkflowExecutionSchema>;
