"use client";

import { useState, useCallback } from "react";
import { useNodesState, useEdgesState, Node, Edge } from "@xyflow/react";
import { useTranslations } from "next-intl";

export function useWorkflowState() {
    const t = useTranslations('admin.workflows.canvas');

    // ReactFlow States
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

    // Workflow List State
    const [workflows, setWorkflows] = useState<any[]>([]);

    // Metadata States
    const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
    const [workflowName, setWorkflowName] = useState<string>(t('new_name'));
    const [currentVersion, setCurrentVersion] = useState<number>(1);
    const [currentIndustry, setCurrentIndustry] = useState<string>("ELEVATORS");
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);

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
