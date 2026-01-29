export interface WorkflowTrigger {
    type: 'on_insight' | 'on_prediction' | 'on_entity_change';
    condition: {
        field: string;
        operator: 'gt' | 'lt' | 'eq' | 'contains';
        value: any;
    };
}

export interface WorkflowAction {
    type: 'notify' | 'log' | 'update_entity' | 'external_webhook';
    params: Record<string, any>;
}

export interface AIWorkflow {
    id: string;
    name: string;
    trigger: WorkflowTrigger;
    actions: WorkflowAction[];
    active: boolean;
    tenantId: string;
}
