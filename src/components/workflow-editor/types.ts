import { Node, Edge, ReactFlowInstance } from "@xyflow/react";
import { SimulationResult } from "@/lib/simulation-engine";

export interface WorkflowNodeData extends Record<string, any> {
    label?: string;
    analytics?: {
        avgTime?: number;
        avgCost?: number;
        failureRate?: number;
        count?: number;
        avgDuration?: number;
        errorRate?: number;
    };
    isOrphan?: boolean;
    duration?: number;
    unit?: 'ms' | 's' | 'm' | 'h';
    paths?: Array<{
        id: string;
        condition: string;
        label: string;
    }>;
    source?: string;
    maxIterations?: number;
    subflowId?: string;
    simulationData?: {
        time_est?: number;
        cost_est?: number;
    };
}

export type WorkflowNode = Node<WorkflowNodeData>;

export interface WorkflowInstance {
    id?: string;
    _id?: string;
    name: string;
    industry: string;
    version: number;
    visual?: {
        nodes: WorkflowNode[];
        edges: Edge[];
    };
}

export interface WorkflowContextValue {
    // State
    workflowName: string;
    currentVersion: number;
    currentIndustry: string;
    setCurrentIndustry: (industry: string) => void;
    workflows: WorkflowInstance[];
    activeWorkflowId: string | null;
    nodes: WorkflowNode[];
    edges: Edge[];
    selectedNode: WorkflowNode | null;
    isAnalysisMode: boolean;
    isAnalyticsLoading: boolean;
    isSimulating: boolean;
    simResults: SimulationResult | null;
    showSimulation: boolean;
    showLogs: boolean;

    // Setters
    setNodes: (nodes: WorkflowNode[]) => void;
    setEdges: (edges: Edge[]) => void;
    setWorkflowName: (name: string) => void;
    setActiveWorkflowId: (id: string | null) => void;
    setCurrentVersion: (version: number) => void;
    setShowSimulation: (show: boolean) => void;
    setShowLogs: (show: boolean) => void;
    setIsAnalysisMode: (mode: boolean) => void;
    setIsAnalyticsLoading: (loading: boolean) => void;
    setReactFlowInstance: (instance: ReactFlowInstance | null) => void;

    // Callbacks & Operations
    onNodesChange: (changes: any) => void;
    onEdgesChange: (changes: any) => void;
    onConnect: (connection: any) => void;
    onDrop: (event: React.DragEvent) => void;
    onDragOver: (event: React.DragEvent) => void;
    onNodeClick: (event: React.MouseEvent, node: Node) => void;
    updateNodeData: (nodeId: string, newData: WorkflowNodeData) => void;
    setSelectedNode: (node: WorkflowNode | null) => void;

    // Operations
    handleWorkflowChange: (id: string, allWorkflows: WorkflowInstance[]) => void;
    handleCreateNew: () => void;
    handleDuplicate: () => void;
    deleteSelection: (nodes: Node[], edges: Edge[]) => void;
    onSave: () => void;
    toggleAnalysisMode: () => void;
    exportReport: () => void;
    undo: (setNodes: any, setEdges: any) => void;
    redo: (setNodes: any, setEdges: any) => void;
    canUndo: boolean;
    canRedo: boolean;
    alignNodes: (direction: 'horizontal' | 'vertical') => void;
    autoLayout: (direction: 'TB' | 'LR') => void;
    snapToGrid: boolean;
    setSnapToGrid: (snap: boolean) => void;
    handleRunSimulation: () => void;
    refreshWorkflows: () => void;

    // Refs & Misc
    reactFlowInstance: ReactFlowInstance | null;
    reactFlowWrapper: React.RefObject<HTMLDivElement | null>;
}
