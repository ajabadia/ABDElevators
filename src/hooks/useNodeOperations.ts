"use client";

import { useCallback } from "react";
import { addEdge, Connection, Node, Edge, ReactFlowInstance } from "@xyflow/react";
import dagre from 'dagre';
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface UseNodeOperationsProps {
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
    setSelectedNode: (node: Node | null) => void;
    reactFlowInstance: ReactFlowInstance | null;
    reactFlowWrapper: React.RefObject<HTMLDivElement | null>;
    edges: Edge[]; // Added for auto-layout
}

export function useNodeOperations({
    setNodes,
    setEdges,
    setSelectedNode,
    reactFlowInstance,
    reactFlowWrapper,
    edges
}: UseNodeOperationsProps) {

    const t = useTranslations('admin.workflows.canvas');

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
    }, [setSelectedNode]);

    const updateNodeData = useCallback((nodeId: string, newData: any) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === nodeId) {
                    return { ...node, data: newData };
                }
                return node;
            })
        );
        setSelectedNode(null);
        toast.success(t('save_success_title'), { description: t('save_success_desc', { count: 1 }) });
    }, [setNodes, setSelectedNode, toast, t]);

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
                id: `dndnode_${+new Date()}`,
                type,
                position,
                data: { label: label || `${type} node` },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, reactFlowWrapper, setNodes]
    );

    const deleteSelection = useCallback((nodes: Node[], edges: Edge[]) => {
        const selectedNodes = nodes.filter(n => n.selected);
        const selectedEdges = edges.filter(e => e.selected);

        if (selectedNodes.length === 0 && selectedEdges.length === 0) {
            toast.info(t('delete_alert'));
            return;
        }

        setNodes(nds => nds.filter(n => !n.selected));
        setEdges(eds => eds.filter(e => !e.selected));
        setSelectedNode(null);
        toast.success(t('delete_title'), { description: t('delete_desc') });
    }, [setNodes, setEdges, setSelectedNode, toast, t]);

    const alignNodes = useCallback((direction: 'horizontal' | 'vertical') => {
        setNodes((nds) => {
            const selected = nds.filter(n => n.selected);
            if (selected.length < 2) return nds;

            if (direction === 'horizontal') {
                const avgY = selected.reduce((sum, n) => sum + n.position.y, 0) / selected.length;
                return nds.map(n => n.selected ? { ...n, position: { ...n.position, y: avgY } } : n);
            } else {
                const avgX = selected.reduce((sum, n) => sum + n.position.x, 0) / selected.length;
                return nds.map(n => n.selected ? { ...n, position: { ...n.position, x: avgX } } : n);
            }
        });
        toast.success(t('align_success' as any, { defaultValue: 'Nodes Aligned' }));
    }, [setNodes, toast, t]);

    const detectCycles = useCallback((nodes: Node[], edges: Edge[]) => {
        const adj = new Map<string, string[]>();
        edges.forEach(e => {
            if (!adj.has(e.source)) adj.set(e.source, []);
            adj.get(e.source)!.push(e.target);
        });

        const visited = new Set<string>();
        const recStack = new Set<string>();
        const cycles = new Set<string>();

        function hasCycle(v: string) {
            visited.add(v);
            recStack.add(v);

            const neighbors = adj.get(v) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    if (hasCycle(neighbor)) return true;
                } else if (recStack.has(neighbor)) {
                    cycles.add(v);
                    cycles.add(neighbor);
                    return true;
                }
            }

            recStack.delete(v);
            return false;
        }

        nodes.forEach(n => {
            if (!visited.has(n.id)) hasCycle(n.id);
        });

        return Array.from(cycles);
    }, []);

    const autoLayout = useCallback((direction: 'TB' | 'LR' = 'TB') => {
        setNodes((nds) => {
            const eds = edges; // We need edges to calculate layout

            const dagreGraph = new dagre.graphlib.Graph();
            dagreGraph.setDefaultEdgeLabel(() => ({}));
            dagreGraph.setGraph({ rankdir: direction });

            const nodeWidth = 200;
            const nodeHeight = 80;

            nds.forEach((node) => {
                dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
            });

            eds.forEach((edge: Edge) => {
                dagreGraph.setEdge(edge.source, edge.target);
            });

            dagre.layout(dagreGraph);

            return nds.map((node) => {
                const nodeWithPosition = dagreGraph.node(node.id);
                return {
                    ...node,
                    position: {
                        x: nodeWithPosition.x - nodeWidth / 2,
                        y: nodeWithPosition.y - nodeHeight / 2,
                    },
                };
            });
        });
        toast.success(t('align_success' as any), { description: "Auto-layout complete" });
    }, [setNodes, edges, toast, t]);

    return {
        onConnect,
        onNodeClick,
        updateNodeData,
        onDragOver,
        onDrop,
        deleteSelection,
        alignNodes,
        autoLayout,
        detectCycles
    };
}
