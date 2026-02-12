"use client";

import { useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { ReactFlowInstance } from "@xyflow/react";

interface UseWorkflowCRUDProps {
    environment: string;
    nodes: any[];
    edges: any[];
    workflowName: string;
    activeWorkflowId: string | null;
    currentIndustry: string;
    currentVersion: number;
    setWorkflows: (workflows: any[]) => void;
    setActiveWorkflowId: (id: string | null) => void;
    setWorkflowName: (name: string) => void;
    setNodes: (nodes: any[]) => void;
    setEdges: (edges: any[]) => void;
    setCurrentVersion: (version: number | ((v: number) => number)) => void;
    setCurrentIndustry: (industry: string) => void;
    reactFlowInstance: ReactFlowInstance | null;
}

export function useWorkflowCRUD({
    environment,
    nodes,
    edges,
    workflowName,
    activeWorkflowId,
    currentIndustry,
    currentVersion,
    setWorkflows,
    setActiveWorkflowId,
    setWorkflowName,
    setNodes,
    setEdges,
    setCurrentVersion,
    setCurrentIndustry,
    reactFlowInstance
}: UseWorkflowCRUDProps) {
    const { toast } = useToast();
    const t = useTranslations('admin.workflows.canvas');

    const refreshWorkflows = useCallback(async () => {
        try {
            const res = await fetch(`/api/admin/workflows?environment=${environment}`);
            const data = await res.json();
            if (data.success && data.items) {
                setWorkflows(data.items);

                // Auto-load if empty but items exist
                if (!activeWorkflowId && nodes.length === 0 && data.items.length > 0) {
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
    }, [environment, activeWorkflowId, nodes.length, setWorkflows, setActiveWorkflowId, setWorkflowName, setCurrentVersion, setCurrentIndustry, setNodes, setEdges]);

    const handleWorkflowChange = useCallback((id: string, workflows: any[]) => {
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
    }, [setActiveWorkflowId, setWorkflowName, setCurrentVersion, setCurrentIndustry, setNodes, setEdges]);

    const handleCreateNew = useCallback(() => {
        const name = prompt(`${t('title')}:`, t('new_name'));
        if (name) {
            setActiveWorkflowId(null);
            setWorkflowName(name);
            setNodes([]);
            setEdges([]);
            setCurrentVersion(1);
            toast({ title: t('create_title'), description: t('create_desc', { name }) });
        }
    }, [t, setActiveWorkflowId, setWorkflowName, setNodes, setEdges, setCurrentVersion, toast]);

    const handleDuplicate = useCallback(() => {
        if (nodes.length === 0) {
            toast({ title: t('duplicate_alert'), variant: "default" });
            return;
        }
        setWorkflowName(`${workflowName} (Copia)`);
        setActiveWorkflowId(null);
        setCurrentVersion(1);
        toast({ title: t('duplicate_title'), description: t('duplicate_desc') });
    }, [nodes.length, workflowName, t, setWorkflowName, setActiveWorkflowId, setCurrentVersion, toast]);

    const onSave = useCallback(async () => {
        if (!reactFlowInstance) return;

        const flow = reactFlowInstance.toObject();
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
                setCurrentVersion(v => v + 1);
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
    }, [reactFlowInstance, workflowName, environment, currentIndustry, currentVersion, activeWorkflowId, t, toast, setCurrentVersion, refreshWorkflows]);

    return {
        refreshWorkflows,
        handleWorkflowChange,
        handleCreateNew,
        handleDuplicate,
        onSave
    };
}
