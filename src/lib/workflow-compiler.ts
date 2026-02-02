
import { Edge, Node } from '@xyflow/react';
import { AIWorkflow, WorkflowTrigger, WorkflowAction } from '@/types/workflow';

/**
 * Compiles a visual React Flow graph into an executable AIWorkflow definition.
 * 
 * Strategy:
 * 1. Identify the Trigger Node (Source).
 * 2. Traverse edges to find connected nodes.
 * 3. Map Condition Nodes to trigger conditions.
 * 4. Map Action Nodes to workflow actions.
 */
export function compileGraphToLogic(
    nodes: Node[],
    edges: Edge[],
    workflowName: string = 'Untitled Workflow',
    tenantId: string
): Partial<AIWorkflow> {

    // 1. Find Trigger Node (Must start with 'trigger')
    const triggerNode = nodes.find(n => n.type === 'trigger');

    if (!triggerNode) {
        throw new Error('Compilation Failed: No Trigger node found.');
    }

    // Default trigger structure based on label
    // In a real app, the node.data would contain specific config (events, thresholds)
    let trigger: WorkflowTrigger = {
        type: 'on_entity_change', // Valid type
        condition: {
            field: 'riskScore',
            operator: 'gt',
            value: 0
        }
    };

    const actions: WorkflowAction[] = [];

    // 2. Traversal Helper
    // We follow the graph from Trigger -> Downstream
    const traverse = (currentNodeId: string) => {
        const outgoingEdges = edges.filter(e => e.source === currentNodeId);

        outgoingEdges.forEach(edge => {
            const targetNode = nodes.find(n => n.id === edge.target);
            if (!targetNode) return;

            // HANDLE CONDITION NODES (Refine the Trigger)
            if (targetNode.type === 'condition') {
                // Parse label like "Score < 50" or "High Risk"
                // For MVP, we assume the node data has this info.
                // Here we just mock parsing "If Score < 50"
                if (targetNode.data.label && typeof targetNode.data.label === 'string') {
                    if (targetNode.data.label.includes('<')) {
                        trigger.condition.operator = 'lt';
                        trigger.condition.value = 50; // Mock parsing
                    } else {
                        trigger.condition.operator = 'gt';
                        trigger.condition.value = 50; // Default
                    }
                }

                // Continue traversal from this Condition
                // Note: Conditions usually have 'true'/'false' outputs. 
                // We'd need to check edge.sourceHandle to know which path.
                // MVP: We assume linear "If True" path for simplicity.
                traverse(targetNode.id);
            }

            // HANDLE ACTION NODES
            if (targetNode.type === 'action') {
                // Map visual label to logical action type
                let actionType: WorkflowAction['type'] = 'log';
                let params: any = { message: `Executed ${targetNode.data.label}` };

                const label = String(targetNode.data.label).toLowerCase();

                if (label.includes('email')) {
                    actionType = 'notify';
                    params = { method: 'email', template: 'alert_default' };
                } else if (label.includes('db') || label.includes('log')) {
                    actionType = 'log';
                } else if (label.includes('update')) {
                    actionType = 'update_entity';
                }

                actions.push({
                    type: actionType,
                    params: params
                });

                // Continue traversal (chaining actions)
                traverse(targetNode.id);
            }
        });
    };

    // Start traversal from Trigger
    traverse(triggerNode.id);

    return {
        name: workflowName,
        active: true,
        trigger: trigger,
        actions: actions,
        tenantId: tenantId,
        id: crypto.randomUUID(), // Temp ID
    };
}
