
'use client';

import React, { useCallback, useRef, useState } from 'react';
import {
    ReactFlow,
    ReactFlowProvider,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    Connection,
    Edge,
    Node,
    MiniMap,
    ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { NodeLibrary } from './NodeLibrary';
import { TriggerNode } from './CustomNodes/TriggerNode';
import { ActionNode } from './CustomNodes/ActionNode';
import { ConditionNode } from './CustomNodes/ConditionNode';
import { Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { useEnvironmentStore } from '@/store/environment-store';
import { useEffect } from 'react';

const nodeTypes = {
    trigger: TriggerNode,
    action: ActionNode,
    condition: ConditionNode,
};

const getId = () => `dndnode_${+new Date()}`;

const WorkflowCanvasContent = () => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
    const { toast } = useToast();
    const { environment } = useEnvironmentStore();

    // Load workflow on environment change
    useEffect(() => {
        const fetchWorkflow = async () => {
            try {
                // For MVP, we fetch the first one or a hardcoded one for this demo view
                const res = await fetch(`/api/admin/workflows?environment=${environment}`);
                const data = await res.json();
                if (data.success && data.items?.length > 0) {
                    const latest = data.items[0];
                    if (latest.visual) {
                        setNodes(latest.visual.nodes || []);
                        setEdges(latest.visual.edges || []);
                    }
                } else {
                    setNodes([]);
                    setEdges([]);
                }
            } catch (err) {
                console.error("Error loading workflow:", err);
            }
        };
        fetchWorkflow();
    }, [environment, setNodes, setEdges]);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            if (!reactFlowWrapper.current || !reactFlowInstance) {
                return;
            }

            const type = event.dataTransfer.getData('application/reactflow');
            const label = event.dataTransfer.getData('application/reactflow-label');

            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode: Node = {
                id: getId(),
                type,
                position,
                data: { label: label || `${type} node` },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, setNodes],
    );

    const onSave = useCallback(async () => {
        if (!reactFlowInstance) return;

        const flow = reactFlowInstance.toObject();
        console.log('Saving Flow:', flow);


        try {
            const response = await fetch('/api/admin/workflows', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: "Elevator Incident Flow", // Hardcoded for Demo
                    nodes: flow.nodes,
                    edges: flow.edges,
                    environment
                }),
            });

            if (!response.ok) throw new Error('Failed to save');

            toast({
                title: "Workflow Saved",
                description: `Successfully saved ${flow.nodes.length} nodes to database.`,
            });
        } catch (e) {
            toast({
                title: "Save Failed",
                description: "Could not persist workflow.",
                variant: "destructive"
            });
        }

    }, [reactFlowInstance, toast]);

    return (
        <div className="flex h-[calc(100vh-64px)] w-full">
            <NodeLibrary />
            <div className="flex-grow h-full relative" ref={reactFlowWrapper}>
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <button
                        onClick={onSave}
                        className="bg-slate-900 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-sm"
                    >
                        <Save size={16} />
                        Save Workflow
                    </button>
                </div>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onInit={setReactFlowInstance}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    nodeTypes={nodeTypes}
                    fitView
                >
                    <Controls />
                    <MiniMap />
                    <Background gap={12} size={1} />
                </ReactFlow>
            </div>
        </div>
    );
};

export const WorkflowCanvas = () => (
    <ReactFlowProvider>
        <WorkflowCanvasContent />
    </ReactFlowProvider>
);
