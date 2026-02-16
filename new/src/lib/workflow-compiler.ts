
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
    let trigger: WorkflowTrigger = {
        type: 'on_entity_change',
        nodeId: triggerNode.id, // Tag with node ID
        condition: {
            field: 'riskScore',
            operator: 'gt',
            value: 0
        }
    };

    const actions: WorkflowAction[] = [];

    // 2. Traversal Helper
    const traverse = (currentNodeId: string) => {
        const outgoingEdges = edges.filter(e => e.source === currentNodeId);

        outgoingEdges.forEach(edge => {
            const targetNode = nodes.find(n => n.id === edge.target);
            if (!targetNode) return;

            // HANDLE CONDITION/SWITCH NODES (Branching)
            if (targetNode.type === 'condition' || targetNode.type === 'switch') {
                actions.push({
                    type: 'branch',
                    nodeId: targetNode.id,
                    params: {
                        label: targetNode.data.label,
                        // If it's a condition node, it might have internal criteria
                        criteria: targetNode.data.criteria || {}
                    }
                });
                traverse(targetNode.id);
            }

            // HANDLE WAIT NODES (Delay)
            if (targetNode.type === 'wait') {
                actions.push({
                    type: 'delay',
                    nodeId: targetNode.id,
                    params: {
                        duration: targetNode.data.duration || 1000,
                        unit: targetNode.data.unit || 'ms'
                    }
                });
                traverse(targetNode.id);
            }

            // HANDLE LOOP NODES (Iteration)
            if (targetNode.type === 'loop') {
                actions.push({
                    type: 'iterator',
                    nodeId: targetNode.id,
                    params: {
                        source: targetNode.data.source || 'items',
                        maxItems: targetNode.data.maxItems || 10
                    }
                });
                traverse(targetNode.id);
            }

            // HANDLE ACTION NODES
            if (targetNode.type === 'action') {
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
                } else if (label.includes('task') || label.includes('validar') || label.includes('human')) {
                    actionType = 'human_task';
                    params = {
                        title: targetNode.data.label,
                        taskType: 'TECHNICAL_VALIDATION',
                        assignedRole: 'REVIEWER',
                        priority: 'MEDIUM',
                        checklistConfigId: targetNode.data.checklistConfigId // New: support for dynamic checklists
                    };
                }

                actions.push({
                    type: actionType,
                    nodeId: targetNode.id, // Tag with node ID
                    params: params
                });

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
        id: crypto.randomUUID(),
    };
}
