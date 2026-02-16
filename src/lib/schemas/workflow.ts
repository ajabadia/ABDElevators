import { z } from 'zod';
import { UserRole } from '../../types/roles';
import { IndustryTypeSchema, AppEnvironmentEnum } from './core';

/**
 * ⚡ FASE 7.2: Multi-Vertical Workflow Engine Schemas
 */

export const WorkflowLogSchema = z.object({
    from: z.string(),
    to: z.string(),
    role: z.string(),
    comment: z.string().optional(),
    signature: z.string().optional(),
    correlationId: z.string().optional(),
    timestamp: z.date().default(() => new Date()),
});
export type WorkflowLog = z.infer<typeof WorkflowLogSchema>;

export const WorkflowStateSchema = z.object({
    id: z.string(),                    // ej: 'draft', 'in_analysis', 'completed'
    label: z.string(),
    color: z.string().default('#64748b'),
    icon: z.string().optional(),       // nombre de icono de lucide
    is_initial: z.boolean().default(false),
    is_final: z.boolean().default(false),
    can_edit: z.boolean().default(true), // ¿Se pueden editar datos en este estado?
    requires_validation: z.boolean().default(false), // ¿Bloquea el flujo hasta validación humana?
    roles_allowed: z.array(z.string()).default(['ADMIN', 'TECHNICAL']),
    // ⚡ FASE 128: Checklist Integrada
    checklistConfigId: z.string().optional(), // ID de la configuración de checklist a usar en este estado
    // ⚡ FASE 127: LLM Node Configuration
    llmNode: z.object({
        promptKey: z.string().optional(),
        schemaKey: z.string().optional(),
        enabled: z.boolean().default(false),
        temperature: z.number().default(0.7),
        auto_transition: z.boolean().default(false),
    }).optional(),
});
export type WorkflowState = z.infer<typeof WorkflowStateSchema>;

export const WorkflowTransitionSchema = z.object({
    from: z.string(),
    to: z.string(),
    label: z.string(),
    action: z.string().optional(),      // ej: 'APPROVE', 'REJECT'
    required_role: z.array(z.string()).optional(),
    conditions: z.object({
        checklist_complete: z.boolean().default(false),
        min_documents: z.number().default(0),
        require_signature: z.boolean().default(false),
        require_comment: z.boolean().default(false),
    }).optional(),
    actions: z.array(z.string()).optional(), // ej: ['notify_admin', 'generate_pdf', 'webhook_call']
    // ⚡ FASE 127: LLM Decision Strategy (optional for backward compatibility)
    decisionStrategy: z.enum(['USER', 'LLM_DIRECT', 'LLM_SUGGEST_HUMAN_APPROVE', 'HUMAN_ONLY']).default('USER').optional(),
    llmRouting: z.object({
        promptKey: z.string(),           // Key for routing decision prompt
        branches: z.array(z.object({
            value: z.string(),           // LLM output value to match (e.g., 'HIGH_RISK')
            to: z.string(),              // Target state ID
            label: z.string(),           // Human-readable label
        })),
    }).optional(),
});
export type WorkflowTransition = z.infer<typeof WorkflowTransitionSchema>;

export const WorkflowDefinitionSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    industry: IndustryTypeSchema,
    name: z.string(),
    entityType: z.enum(['ENTITY', 'EQUIPMENT', 'USER']).default('ENTITY'),
    states: z.array(WorkflowStateSchema),
    transitions: z.array(WorkflowTransitionSchema),
    initial_state: z.string(),
    is_default: z.boolean().default(false),
    active: z.boolean().default(true),
    // ⚡ FASE 127: Workflow Status (draft/active/archived)
    status: z.enum(['draft', 'active', 'archived']).default('active'),
    environment: AppEnvironmentEnum.default('PRODUCTION'),
    version: z.number().default(1), // Optimistic Locking
    visual: z.object({
        nodes: z.array(z.any()),
        edges: z.array(z.any()),
    }).optional(),
    executable: z.any().optional(), // Compiled logic
    compilationError: z.string().optional(),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
});
export type WorkflowDefinition = z.infer<typeof WorkflowDefinitionSchema>;

/**
 * ⚡ FASE 97: Multi-Vertical Workflow Engine - Task Schema
 */
/**
 * ⚡ FASE 97: Multi-Vertical Workflow Engine - Task Schema
 * @deprecated Use src/lib/schemas/workflow-task.ts instead
 */
export { WorkflowTaskSchema } from './workflow-task';
export type { WorkflowTask } from './workflow-task';

