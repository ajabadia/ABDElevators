
import { logEvento } from '@/lib/logger';
import { getTenantCollection } from '@/lib/db-tenant';
import { WorkflowDefinition, WorkflowTransition } from '@/lib/schemas/workflow'; // Using existing schemas
import { ObjectId } from 'mongodb';

/**
 * CaseWorkflowEngine: Gestiona el ciclo de vida (Estados y Transiciones) de un Caso.
 * (Phase 129 - New Engine)
 * 
 * Responsabilidad:
 * - Validar transiciones de estado
 * - Verificar permisos (Roles) for transitions
 * - Ejecutar side-effects de transición (hooks)
 */
export class CaseWorkflowEngine {
    private static instance: CaseWorkflowEngine;

    private constructor() { }

    public static getInstance(): CaseWorkflowEngine {
        if (!CaseWorkflowEngine.instance) {
            CaseWorkflowEngine.instance = new CaseWorkflowEngine();
        }
        return CaseWorkflowEngine.instance;
    }

    /**
     * Ejecuta una transición de estado en un caso.
     */
    public async executeTransition(
        caseId: string,
        transitionId: string, // Or targetState? Usually transitions have IDs or we derive from (from->to)
        tenantId: string,
        userId: string,
        userRoles: string[],
        correlationId: string
    ): Promise<{ success: boolean; newState?: string; error?: string }> {
        try {
            // 1. Get Case
            const casesCollection = await getTenantCollection('cases', { user: { tenantId } });
            const caseData = await casesCollection.findOne({ _id: new ObjectId(caseId) });

            if (!caseData) {
                throw new Error(`Case ${caseId} not found`);
            }

            // 2. Get Workflow Definition
            // Assuming case has a workflowDefinitionId or we use a default
            // For now, let's assume we fetch the default one if not present
            const workflowsCollection = await getTenantCollection('workflows', { user: { tenantId } });
            // Simplified: Fetch active workflow for this entity type. Real impl needs specific mapping.
            const workflowDef = await workflowsCollection.findOne({ active: true, entityType: 'ENTITY' }) as unknown as WorkflowDefinition;

            if (!workflowDef) {
                throw new Error('No active workflow definition found for Cases');
            }

            // 3. Find Transition
            const currentState = caseData.status || workflowDef.initial_state;
            const transition = workflowDef.transitions.find(t => t.from === currentState && t.to === transitionId); // transitionId here treated as target state for simplicity, or we need a real transition ID

            // If we are passing "targetState" as transitionId
            const targetState = transitionId;
            const validTransition = workflowDef.transitions.find(t => t.from === currentState && t.to === targetState);

            if (!validTransition) {
                return { success: false, error: `Invalid transition from ${currentState} to ${targetState}` };
            }

            // 4. Validate Roles
            if (validTransition.required_role && validTransition.required_role.length > 0) {
                const hasRole = validTransition.required_role.some(r => userRoles.includes(r));
                if (!hasRole) {
                    return { success: false, error: `User does not have required role: ${validTransition.required_role.join(', ')}` };
                }
            }

            // 5. Update State
            await casesCollection.updateOne(
                { _id: new ObjectId(caseId) },
                {
                    $set: {
                        status: targetState,
                        updatedAt: new Date(),
                        lastTransitionBy: userId
                    },
                    $push: {
                        workflowHistory: {
                            from: currentState,
                            to: targetState,
                            by: userId,
                            at: new Date(),
                            correlationId
                        }
                    }
                } as any
            );

            await logEvento({
                level: 'INFO',
                source: 'CASE_WORKFLOW_ENGINE',
                action: 'STATE_TRANSITION',
                message: `Case ${caseId} transitioned from ${currentState} to ${targetState}`,
                correlationId,
                details: { caseId, from: currentState, to: targetState, userId }
            });

            return { success: true, newState: targetState };

        } catch (error: any) {
            console.error('[CaseWorkflowEngine] Transition error:', error);
            await logEvento({
                level: 'ERROR',
                source: 'CASE_WORKFLOW_ENGINE',
                action: 'TRANSITION_ERROR',
                message: error.message,
                correlationId,
                details: { stack: error.stack }
            });
            return { success: false, error: error.message };
        }
    }
}
