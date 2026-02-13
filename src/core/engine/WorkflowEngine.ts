
import { AIWorkflowEngine } from './AIWorkflowEngine';
import { WorkflowTrigger } from '@/types/workflow';

/**
 * @deprecated This engine is monolithic and deprecated.
 * Use 'AIWorkflowEngine' for event-driven automation (triggers).
 * Use 'CaseWorkflowEngine' for state-driven transitions (cases).
 * 
 * This class now acts as a FACADE to maintain backward compatibility.
 * (Phase 129 Migration)
 */
export class WorkflowEngine {
    private static instance: WorkflowEngine;

    private constructor() { }

    public static getInstance(): WorkflowEngine {
        if (!WorkflowEngine.instance) {
            WorkflowEngine.instance = new WorkflowEngine();
        }
        return WorkflowEngine.instance;
    }

    /**
     * @deprecated Use AIWorkflowEngine.getInstance().processEvent()
     */
    public async processEvent(
        eventType: WorkflowTrigger['type'],
        data: any,
        tenantId: string,
        correlationId: string
    ) {
        // console.warn('[DEPRECATED] WorkflowEngine.processEvent called. Redirecting to AIWorkflowEngine.');
        // Redirect to new engine
        return await AIWorkflowEngine.getInstance().processEvent(eventType, data, tenantId, correlationId);
    }
}
