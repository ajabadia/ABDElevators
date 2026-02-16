"use client";

import React, { createContext, useContext, useRef, useMemo, useEffect } from "react";
import { ReactFlowInstance } from "@xyflow/react";
import { useWorkflowState } from "@/hooks/useWorkflowState";
import { useNodeOperations } from "@/hooks/useNodeOperations";
import { useWorkflowCRUD } from "@/hooks/useWorkflowCRUD";
import { useWorkflowAnalytics } from "@/hooks/useWorkflowAnalytics";
import { useWorkflowHistory } from "@/hooks/useWorkflowHistory";
import { useWorkflowShortcuts } from "@/hooks/useWorkflowShortcuts";
import { useWorkflowValidation } from "@/hooks/useWorkflowValidation";
import { useEnvironmentStore } from "@/store/environment-store";
import { runWorkflowSimulation, SimulationResult } from "@/lib/simulation-engine";

const WorkflowContext = createContext<any>(null);

export function useWorkflow() {
    const context = useContext(WorkflowContext);
    if (!context) throw new Error("useWorkflow must be used within a WorkflowProvider");
    return context;
}

export function WorkflowProvider({ children }: { children: React.ReactNode }) {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [reactFlowInstance, setReactFlowInstance] = React.useState<ReactFlowInstance | null>(null);
    const { environment } = useEnvironmentStore();

    // Core States
    const state = useWorkflowState();

    // Node Operations
    const nodeOps = useNodeOperations({
        setNodes: state.setNodes,
        setEdges: state.setEdges,
        setSelectedNode: state.setSelectedNode,
        reactFlowInstance,
        reactFlowWrapper,
        edges: state.edges // Added edges for auto-layout
    });

    // History (Undo/Redo)
    const history = useWorkflowHistory();

    // Take snapshots on node/edge changes (simplistic approach for now)
    useEffect(() => {
        if (state.nodes.length > 0) {
            history.takeSnapshot(state.nodes, state.edges);
        }
    }, [state.nodes, state.edges]); // Caution: this might trigger too often, will refine later

    // CRUD
    const crud = useWorkflowCRUD({
        environment,
        nodes: state.nodes,
        edges: state.edges,
        workflowName: state.workflowName,
        activeWorkflowId: state.activeWorkflowId,
        currentIndustry: state.currentIndustry,
        currentVersion: state.currentVersion,
        setWorkflows: state.setWorkflows,
        setActiveWorkflowId: state.setActiveWorkflowId,
        setWorkflowName: state.setWorkflowName,
        setNodes: state.setNodes,
        setEdges: state.setEdges,
        setCurrentVersion: state.setCurrentVersion,
        setCurrentIndustry: state.setCurrentIndustry,
        reactFlowInstance
    });

    // Analytics
    const analytics = useWorkflowAnalytics({
        activeWorkflowId: state.activeWorkflowId,
        isAnalysisMode: state.isAnalysisMode,
        setIsAnalysisMode: state.setIsAnalysisMode,
        setIsAnalyticsLoading: state.setIsAnalyticsLoading,
        setNodes: state.setNodes
    });

    // Shortcuts
    useWorkflowShortcuts({
        onUndo: () => history.undo(state.setNodes, state.setEdges),
        onRedo: () => history.redo(state.setNodes, state.setEdges),
        onSave: crud.onSave,
        onDelete: () => nodeOps.deleteSelection(state.nodes, state.edges),
        onDuplicate: crud.handleDuplicate
    });

    // Validation
    useWorkflowValidation({
        nodes: state.nodes,
        edges: state.edges,
        setNodes: state.setNodes,
        detectCycles: nodeOps.detectCycles
    });

    // Simulation State
    const [isSimulating, setIsSimulating] = React.useState(false);
    const [simResults, setSimResults] = React.useState<SimulationResult | null>(null);
    const [showSimulation, setShowSimulation] = React.useState(false);

    const handleRunSimulation = React.useCallback(() => {
        setIsSimulating(true);
        setShowSimulation(true);
        setTimeout(() => {
            try {
                const results = runWorkflowSimulation(state.nodes, state.edges);
                setSimResults(results);
            } catch (error) {
                console.error("Simulation failed:", error);
            } finally {
                setIsSimulating(false);
            }
        }, 800);
    }, [state.nodes, state.edges]);

    // Initial Load
    useEffect(() => {
        crud.refreshWorkflows();
    }, [environment]); // Refresh on env change

    const value = useMemo(() => ({
        ...state,
        ...nodeOps,
        ...history,
        ...crud,
        ...analytics,
        // Simulation
        isSimulating,
        simResults,
        showSimulation,
        setShowSimulation,
        handleRunSimulation,
        reactFlowWrapper,
        setReactFlowInstance
    }), [state, nodeOps, history, crud, analytics]);

    return (
        <WorkflowContext.Provider value={value}>
            {children}
        </WorkflowContext.Provider>
    );
}
