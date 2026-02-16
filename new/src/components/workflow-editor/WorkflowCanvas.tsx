
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
import { SwitchNode } from './CustomNodes/SwitchNode';
import { WaitNode } from './CustomNodes/WaitNode';
import { LoopNode } from './CustomNodes/LoopNode';
import { Save, Activity, AreaChart, Loader2, PlayCircle, Plus, ChevronDown, Rocket, Trash2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { NodePropertiesEditor } from './NodePropertiesEditor';
import { ExecutionLogsPanel } from './ExecutionLogsPanel';

import { useEnvironmentStore } from '@/store/environment-store';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

const nodeTypes = {
    trigger: TriggerNode,
    action: ActionNode,
    condition: ConditionNode,
    switch: SwitchNode,
    wait: WaitNode,
    loop: LoopNode,
};

const getId = () => `dndnode_${+new Date()}`;

const WorkflowCanvasContent = () => {
    const t = useTranslations('admin.workflows.canvas');
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
    const [isAnalysisMode, setIsAnalysisMode] = useState(false);
    const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
    const [showLogs, setShowLogs] = useState(false);

    const { toast } = useToast();
    const { environment } = useEnvironmentStore();

    // Workflow state management
    const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);

    const [workflowName, setWorkflowName] = useState<string>(t('new_name'));
    const [currentVersion, setCurrentVersion] = useState<number>(1);
    const [workflows, setWorkflows] = useState<any[]>([]);
    const [currentIndustry, setCurrentIndustry] = useState<string>("ELEVATORS");
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);

    // Load available workflows and set active
    const refreshWorkflows = useCallback(async () => {
        try {
            const res = await fetch(`/api/admin/workflows?environment=${environment}`);
            const data = await res.json();
            if (data.success && data.items) {
                setWorkflows(data.items);

                // If there's an active ID, sync it, else try to load the first one if canvas is empty
                if (activeWorkflowId) {
                    const active = data.items.find((w: any) => (w._id || w.id) === activeWorkflowId);
                    if (active) {
                        setWorkflowName(active.name);
                        setCurrentVersion(active.version || 1);
                        setCurrentIndustry(active.industry || "ELEVATORS");
                        if (active.visual) {
                            setNodes(active.visual.nodes || []);
                            setEdges(active.visual.edges || []);
                        }
                    }
                } else if (data.items.length > 0 && nodes.length === 0) {
                    const first = data.items[0];
                    setActiveWorkflowId(first._id || first.id);
                    setWorkflowName(first.name);
                    setCurrentVersion(first.version || 1);
                    setCurrentIndustry(first.industry || "ELEVATORS");
                    if (first.visual) {
                        setNodes(first.visual.nodes || []);
                        setEdges(first.visual.edges || []);
                    }
                }
            }
        } catch (err) {
            console.error("Error refreshing workflows:", err);
        }
    }, [environment, activeWorkflowId, nodes.length, setNodes, setEdges]);

    useEffect(() => {
        refreshWorkflows();
    }, [refreshWorkflows]);

    const handleWorkflowChange = (id: string) => {
        const selected = workflows.find(w => (w._id || w.id) === id);
        if (selected) {
            setActiveWorkflowId(id);
            setWorkflowName(selected.name);
            setCurrentVersion(selected.version || 1);
            setCurrentIndustry(selected.industry || "ELEVATORS");
            if (selected.visual) {
                setNodes(selected.visual.nodes || []);
                setEdges(selected.visual.edges || []);
            }
        }
    };

    const handleCreateNew = () => {
        const name = prompt(`${t('title')}:`, t('new_name'));
        if (name) {
            setActiveWorkflowId(null);
            setWorkflowName(name);
            setNodes([]);
            setEdges([]);
            setCurrentVersion(1);
            toast({ title: t('create_title'), description: t('create_desc', { name }) });
        }
    };

    const handleDuplicate = () => {
        if (nodes.length === 0) {
            toast({ title: t('duplicate_alert'), variant: "default" });
            return;
        }
        setWorkflowName(`${workflowName} (Copia)`);
        setActiveWorkflowId(null); // Forces new creation on save
        setCurrentVersion(1);
        toast({ title: t('duplicate_title'), description: t('duplicate_desc') });
    };

    const deleteSelection = useCallback(() => {
        const selectedNodes = nodes.filter(n => n.selected);
        const selectedEdges = edges.filter(e => e.selected);

        if (selectedNodes.length === 0 && selectedEdges.length === 0) {
            toast({ title: t('delete_alert'), variant: "default" });
            return;
        }

        setNodes(nds => nds.filter(n => !n.selected));
        setEdges(eds => eds.filter(e => !e.selected));
        setSelectedNode(null);
        toast({ title: t('delete_title'), description: t('delete_desc') });
    }, [nodes, edges, setNodes, setEdges, toast, t]);

    // Auto-validate workflow integrity (Orphan Detection)
    useEffect(() => {
        if (nodes.length === 0) return;

        const incomingNodeIds = new Set(edges.map(e => e.target));

        setNodes((nds) => nds.map((node: Node) => {
            const isOrphan = node.type !== 'trigger' && !incomingNodeIds.has(node.id);
            return {
                ...node,
                data: {
                    ...node.data,
                    isOrphan
                }
            };
        }));
    }, [edges, setNodes]);

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

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
    }, []);

    const updateNodeData = useCallback((nodeId: string, newData: any) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === nodeId) {
                    return { ...node, data: newData };
                }
                return node;
            })
        );
        setSelectedNode(null); // Close sidebar after update
        toast({ title: t('save_success_title'), description: t('save_success_desc', { count: 1 }) });
    }, [setNodes, toast, t]);

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
                    name: workflowName,
                    nodes: flow.nodes,
                    edges: flow.edges,
                    environment,
                    industry: currentIndustry,
                    version: currentVersion
                }),
            });

            if (response.status === 409) {
                toast({
                    title: t('save_conflict_title'),
                    description: t('save_conflict_desc'),
                    variant: "destructive"
                });
                return;
            }

            if (!response.ok) throw new Error('Failed to save');

            const data = await response.json();
            if (data.success) {
                setCurrentVersion(v => v + 1); // Increment local version on success
                // Refresh list if it was a new workflow
                if (!activeWorkflowId) {
                    refreshWorkflows();
                }
            }

            toast({
                title: t('save_success_title'),
                description: t('save_success_desc', { count: flow.nodes.length }),
            });
        } catch (e) {
            toast({
                title: t('save_failed_title'),
                description: t('save_failed_desc'),
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

            toast({ title: t('report_export_title'), description: t('report_export_desc') });
        } catch (err) {
            console.error("Export error:", err);
            toast({ title: t('report_export_failed'), description: t('report_export_failed_desc'), variant: "destructive" });
        } finally {
            setIsAnalyticsLoading(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-64px)] w-full text-slate-900">
            <NodeLibrary />
            <div className="flex-grow h-full relative" ref={reactFlowWrapper}>
                <div className="absolute top-4 left-4 z-10 flex items-center gap-3 bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-slate-200 shadow-lg">
                    <div className="flex items-center gap-2">
                        <Rocket className="w-5 h-5 text-teal-600" />
                        <div>
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-tighter leading-none">{workflowName}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px] font-bold h-4 border-teal-200 text-teal-700 bg-teal-50">v{currentVersion}</Badge>
                                <Badge variant="secondary" className="text-[10px] uppercase font-bold h-4 tracking-tighter">
                                    {t(`industries.${currentIndustry.toLowerCase()}` as any)}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="h-8 w-px bg-slate-200 mx-2" />

                    <div className="flex flex-col gap-1 mr-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{t('industry')}</Label>
                        <Select value={currentIndustry} onValueChange={setCurrentIndustry}>
                            <SelectTrigger suppressHydrationWarning className="w-[140px] h-8 text-[11px] font-bold bg-slate-50 border-slate-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ELEVATORS" className="text-[11px] font-bold">{t('industries.elevators')}</SelectItem>
                                <SelectItem value="LEGAL" className="text-[11px] font-bold">{t('industries.legal')}</SelectItem>
                                <SelectItem value="BANKING" className="text-[11px] font-bold">{t('industries.banking')}</SelectItem>
                                <SelectItem value="HEALTHCARE" className="text-[11px] font-bold">{t('industries.healthcare')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="h-8 w-px bg-slate-200 mx-2" />

                    <Select onValueChange={handleWorkflowChange} value={activeWorkflowId || undefined}>
                        <SelectTrigger suppressHydrationWarning className="w-[220px] h-9 text-xs font-semibold bg-white">
                            <SelectValue placeholder={t('select_process')} />
                        </SelectTrigger>
                        <SelectContent>
                            {workflows.map((w) => (
                                <SelectItem key={w._id || w.id} value={w._id || w.id} className="text-xs font-medium">
                                    {w.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <button
                        onClick={handleCreateNew}
                        className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                        title={t('create_new')}
                    >
                        <Plus size={18} />
                    </button>
                </div>

                <div className="absolute top-4 right-4 z-10 flex gap-2">
                    {isAnalysisMode && (
                        <button
                            onClick={exportReport}
                            className="bg-white text-teal-700 border border-teal-200 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-teal-50 transition-all shadow-sm font-bold text-xs uppercase tracking-wider"
                            disabled={isAnalyticsLoading}
                        >
                            <Save size={16} />
                            {t('export_report')}
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
                        {isAnalysisMode ? t('exit_analysis') : t('perf_analysis')}
                    </button>
                    {!isAnalysisMode && (
                        <button
                            onClick={() => setShowLogs(!showLogs)}
                            className={cn(
                                "px-4 py-2 rounded-md flex items-center gap-2 transition-all shadow-sm font-bold text-xs uppercase tracking-wider",
                                showLogs
                                    ? "bg-teal-600 text-white hover:bg-teal-700"
                                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                            )}
                        >
                            <Activity size={16} />
                            {showLogs ? t('hide_logs') : t('show_logs')}
                        </button>
                    )}
                    {!isAnalysisMode && (
                        <>
                            <button
                                onClick={handleDuplicate}
                                className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm font-bold text-xs uppercase tracking-wider"
                                title={t('duplicate')}
                            >
                                <Copy size={16} className="text-slate-400" />
                                {t('duplicate')}
                            </button>
                            <button
                                onClick={deleteSelection}
                                className="bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-red-100 transition-all shadow-sm font-bold text-xs uppercase tracking-wider"
                                title={t('delete')}
                            >
                                <Trash2 size={16} />
                                {t('delete')}
                            </button>
                        </>
                    )}
                    <button
                        onClick={onSave}
                        className="bg-slate-900 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-sm font-bold text-xs uppercase tracking-wider"
                    >
                        <Save size={16} />
                        {t('save')}
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
                    onNodeClick={onNodeClick}
                    fitView
                >
                    <Controls />
                    <MiniMap />
                    <Background gap={12} size={1} />
                </ReactFlow>

                {selectedNode && (
                    <NodePropertiesEditor
                        node={selectedNode}
                        onUpdate={updateNodeData}
                        onClose={() => setSelectedNode(null)}
                    />
                )}

                {showLogs && activeWorkflowId && (
                    <ExecutionLogsPanel
                        workflowId={activeWorkflowId}
                        onClose={() => setShowLogs(false)}
                    />
                )}
            </div>
        </div>
    );
};

export const WorkflowCanvas = () => (
    <ReactFlowProvider>
        <WorkflowCanvasContent />
    </ReactFlowProvider>
);
