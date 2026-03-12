"use client";

import { useState, useCallback } from "react";
import { useNodesState, useEdgesState, Node, Edge } from "@xyflow/react";
import { useTranslations } from "next-intl";
import { WorkflowNode, WorkflowInstance } from "@/components/workflow-editor/types";

export function useWorkflowState(initialWorkflows: WorkflowInstance[] = []) {
    const t = useTranslations('admin.workflows.canvas');

    // ReactFlow States
    const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNode>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

    // Workflow List State
    const [workflows, setWorkflows] = useState<WorkflowInstance[]>(initialWorkflows);

    // Metadata States
    const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(() => {
        if (!initialWorkflows || initialWorkflows.length === 0) return null;
        const first = initialWorkflows[0];
        return (first._id || first.id || null) as string | null;
    });
    const [workflowName, setWorkflowName] = useState<string>(() => {
        if (!initialWorkflows || initialWorkflows.length === 0) return t('new_name');
        return initialWorkflows[0].name;
    });
    const [currentVersion, setCurrentVersion] = useState<number>(() => {
        if (!initialWorkflows || initialWorkflows.length === 0) return 1;
        return initialWorkflows[0].version || 1;
    });
    const [currentIndustry, setCurrentIndustry] = useState<string>(() => {
        if (!initialWorkflows || initialWorkflows.length === 0) return "ELEVATORS";
        return initialWorkflows[0].industry || "ELEVATORS";
    });

    // Effect to load visual data for the auto-selected workflow
    useState(() => {
        if (initialWorkflows.length > 0 && initialWorkflows[0].visual) {
            setNodes(initialWorkflows[0].visual.nodes || []);
            setEdges(initialWorkflows[0].visual.edges || []);
        }
    });

    const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);

    // UI Global States
    const [showLogs, setShowLogs] = useState(false);
    const [isAnalysisMode, setIsAnalysisMode] = useState(false);
    const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
    const [snapToGrid, setSnapToGrid] = useState(true);

    const resetState = useCallback(() => {
        setNodes([]);
        setEdges([]);
        setActiveWorkflowId(null);
        setWorkflowName(t('new_name'));
        setCurrentVersion(1);
        setCurrentIndustry("ELEVATORS");
        setSelectedNode(null);
        setIsAnalysisMode(false);
    }, [setNodes, setEdges, t]);

    return {
        // State
        nodes, setNodes, onNodesChange,
        edges, setEdges, onEdgesChange,
        workflows, setWorkflows,
        activeWorkflowId, setActiveWorkflowId,
        workflowName, setWorkflowName,
        currentVersion, setCurrentVersion,
        currentIndustry, setCurrentIndustry,
        selectedNode, setSelectedNode,
        showLogs, setShowLogs,
        isAnalysisMode, setIsAnalysisMode,
        isAnalyticsLoading, setIsAnalyticsLoading,
        snapToGrid, setSnapToGrid,

        // Utils
        resetState
    };
}
