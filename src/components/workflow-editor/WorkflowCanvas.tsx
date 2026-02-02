
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
import { Save, Activity, AreaChart, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
    const [isAnalysisMode, setIsAnalysisMode] = useState(false);
    const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
    const { toast } = useToast();
    const { environment } = useEnvironmentStore();

    // Workflow ID tracking for analytics
    const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);

    // Load workflow on environment change
    useEffect(() => {
        const fetchWorkflow = async () => {
            try {
                const res = await fetch(`/api/admin/workflows?environment=${environment}`);
                const data = await res.json();
                if (data.success && data.items?.length > 0) {
                    const latest = data.items[0];
                    setActiveWorkflowId(latest._id || latest.id);
                    if (latest.visual) {
                        setNodes(latest.visual.nodes || []);
                        setEdges(latest.visual.edges || []);
                    }
                } else {
                    setNodes([]);
                    setEdges([]);
                    setActiveWorkflowId(null);
                }
            } catch (err) {
                console.error("Error loading workflow:", err);
            }
        };
        fetchWorkflow();
    }, [environment, setNodes, setEdges]);

    // Handle Analytics Data Fetching
    const toggleAnalysisMode = async () => {
        if (!isAnalysisMode && activeWorkflowId) {
            setIsAnalyticsLoading(true);
            try {
                const res = await fetch(`/api/admin/workflows/analytics/${activeWorkflowId}?days=7`);
                const stats = await res.json();

                if (stats.nodes) {
                    const analyticsMap = stats.nodes.reduce((acc: any, curr: any) => {
                        acc[curr.nodeId] = curr;
                        return acc;
                    }, {});

                    // Inject analytics data into nodes
                    setNodes((nds) =>
                        nds.map((node) => ({
                            ...node,
                            data: {
                                ...node.data,
                                analytics: analyticsMap[node.id] || { count: 0, avgDuration: 0, errorRate: 0 }
                            }
                        }))
                    );
                }
                setIsAnalysisMode(true);
            } catch (err) {
                console.error("Error fetching analytics:", err);
                toast({ title: "Analytics Error", description: "Failed to fetch node metrics.", variant: "destructive" });
            } finally {
                setIsAnalyticsLoading(false);
            }
        } else {
            // Disable analysis mode and clean nodes
            setNodes((nds) =>
                nds.map((node) => {
                    const { analytics, ...cleanData } = node.data as any;
                    return { ...node, data: cleanData };
                })
            );
            setIsAnalysisMode(false);
        }
    };

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

    }, [reactFlowInstance, toast, environment]);

    const exportReport = async () => {
        if (!activeWorkflowId) return;

        setIsAnalyticsLoading(true);
        try {
            const response = await fetch(`/api/admin/workflows/analytics/${activeWorkflowId}/report?days=30`);
            if (!response.ok) throw new Error('Failed to generate report');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `workflow-report-${activeWorkflowId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast({ title: "Report Exported", description: "The technical performance report has been downloaded." });
        } catch (err) {
            console.error("Export error:", err);
            toast({ title: "Export Failed", description: "Failed to generate the PDF report.", variant: "destructive" });
        } finally {
            setIsAnalyticsLoading(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-64px)] w-full text-slate-900">
            <NodeLibrary />
            <div className="flex-grow h-full relative" ref={reactFlowWrapper}>
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                    {isAnalysisMode && (
                        <button
                            onClick={exportReport}
                            className="bg-white text-teal-700 border border-teal-200 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-teal-50 transition-all shadow-sm font-bold text-xs uppercase tracking-wider"
                            disabled={isAnalyticsLoading}
                        >
                            <Save size={16} />
                            Export Technical Report
                        </button>
                    )}
                    <button
                        onClick={toggleAnalysisMode}
                        className={cn(
                            "px-4 py-2 rounded-md flex items-center gap-2 transition-all shadow-sm font-bold text-xs uppercase tracking-wider",
                            isAnalysisMode
                                ? "bg-teal-600 text-white hover:bg-teal-700"
                                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                        )}
                        disabled={isAnalyticsLoading}
                    >
                        {isAnalyticsLoading ? <Loader2 className="animate-spin" size={16} /> : <AreaChart size={16} />}
                        {isAnalysisMode ? "Exit Analysis" : "Performance Analysis"}
                    </button>
                    <button
                        onClick={onSave}
                        className="bg-slate-900 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-sm font-bold text-xs uppercase tracking-wider"
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
