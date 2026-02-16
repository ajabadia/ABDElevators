import { WorkflowDefinition, WorkflowState, WorkflowTransition } from './schemas/workflow';
import { logEvento } from './logger';

export interface WorkflowValidationError {
    code: string;
    message: string;
    path: string[];
}

export interface WorkflowValidationWarning {
    code: string;
    message: string;
    path: string[];
}

export interface WorkflowValidationResult {
    valid: boolean;
    errors: WorkflowValidationError[];
    warnings: WorkflowValidationWarning[];
}

/**
 * Validates a workflow definition proposed by LLM for coherence and security.
 * Fulfills Phase 165.4.
 */
export function validateWorkflowDefinition(
    definition: Partial<WorkflowDefinition>,
    context: { industry: string; environment: string; tenantId: string; correlationId: string }
): WorkflowValidationResult {
    const errors: WorkflowValidationError[] = [];
    const warnings: WorkflowValidationWarning[] = [];

    const { states = [], transitions = [], initial_state } = definition;

    // 1. State Coherence
    const stateIds = new Set(states.map(s => s.id));

    if (!initial_state) {
        errors.push({ code: 'MISSING_INITIAL_STATE', message: 'Initial state is not defined', path: ['initial_state'] });
    } else if (!stateIds.has(initial_state)) {
        errors.push({ code: 'INVALID_INITIAL_STATE', message: `Initial state "${initial_state}" does not exist in states array`, path: ['initial_state'] });
    }

    // 2. Transition Validity
    transitions.forEach((t, index) => {
        if (!stateIds.has(t.from)) {
            errors.push({ code: 'INVALID_TRANSITION_FROM', message: `Transition at index ${index} references non-existent "from" state: "${t.from}"`, path: ['transitions', index.toString(), 'from'] });
        }
        if (!stateIds.has(t.to)) {
            errors.push({ code: 'INVALID_TRANSITION_TO', message: `Transition at index ${index} references non-existent "to" state: "${t.to}"`, path: ['transitions', index.toString(), 'to'] });
        }
    });

    // 3. Orphan States Detection
    const statesWithInbound = new Set<string>();
    const statesWithOutbound = new Set<string>();

    // Initial state has implicit inbound
    if (initial_state) statesWithInbound.add(initial_state);

    transitions.forEach(t => {
        statesWithOutbound.add(t.from);
        statesWithInbound.add(t.to);
    });

    states.forEach(s => {
        if (!statesWithInbound.has(s.id)) {
            warnings.push({ code: 'UNREACHABLE_STATE', message: `State "${s.id}" is unreachable (no inbound transitions)`, path: ['states', s.id] });
        }
        if (!statesWithOutbound.has(s.id) && !s.is_final) {
            warnings.push({ code: 'DEAD_END_STATE', message: `State "${s.id}" has no outbound transitions but is not marked as final`, path: ['states', s.id] });
        }
    });

    // 4. Role Permission Audit (Security)
    states.forEach(s => {
        if (s.roles_allowed?.includes('SUPER_ADMIN')) {
            warnings.push({ code: 'SUPER_ADMIN_ASSIGNED', message: `State "${s.id}" allows SUPER_ADMIN role. This is discouraged for standard workflows.`, path: ['states', s.id, 'roles_allowed'] });
        }
        if (!s.roles_allowed || s.roles_allowed.length === 0) {
            errors.push({ code: 'NO_ROLES_ALLOWED', message: `State "${s.id}" has no roles allowed (stuck state)`, path: ['states', s.id, 'roles_allowed'] });
        }
    });

    // 5. Cycle Detection (Simple check for self-loops without action)
    transitions.forEach((t, index) => {
        if (t.from === t.to && !t.action) {
            warnings.push({ code: 'POTENTIAL_INFINITE_LOOP', message: `Transition at index ${index} is a self-loop without an action or clear exit condition`, path: ['transitions', index.toString()] });
        }
    });

    const isValid = errors.length === 0;

    if (!isValid) {
        logEvento({
            level: 'ERROR',
            source: 'WORKFLOW_VALIDATOR',
            action: 'VALIDATION_FAILED',
            message: `Workflow validation failed for ${definition.name}`,
            tenantId: context.tenantId,
            correlationId: context.correlationId,
            details: { errors, warnings }
        });
    } else if (warnings.length > 0) {
        logEvento({
            level: 'WARN',
            source: 'WORKFLOW_VALIDATOR',
            action: 'VALIDATION_WARNINGS',
            message: `Workflow validation completed with warnings for ${definition.name}`,
            tenantId: context.tenantId,
            correlationId: context.correlationId,
            details: { warnings }
        });
    }

    return {
        valid: isValid,
        errors,
        warnings
    };
}
