"use client";

import { useEffect, useCallback } from "react";
import { Node, Edge } from "@xyflow/react";

interface UseWorkflowValidationProps {
    nodes: Node[];
    edges: Edge[];
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
    detectCycles: (nodes: Node[], edges: Edge[]) => string[];
}

export function useWorkflowValidation({
    nodes,
    edges,
    setNodes,
    detectCycles
}: UseWorkflowValidationProps) {

    const validateIntegrity = useCallback(() => {
        if (nodes.length === 0) return;

        // 1. Orphan Detection
        const incomingNodeIds = new Set(edges.map(e => e.target));

        // 2. Cycle Detection
        const cyclicNodeIds = new Set(detectCycles(nodes, edges));

        setNodes((nds) => nds.map((node) => {
            const isOrphan = node.type !== 'trigger' && !incomingNodeIds.has(node.id);
            const isCyclic = cyclicNodeIds.has(node.id);

            // Only update if changes detected to avoid infinite loops
            if (node.data.isOrphan === isOrphan && node.data.isCyclic === isCyclic) {
                return node;
            }

            return {
                ...node,
                data: {
                    ...node.data,
                    isOrphan,
                    isCyclic
                }
            };
        }));
    }, [nodes.length, edges, detectCycles, setNodes]);

    useEffect(() => {
        const timer = setTimeout(validateIntegrity, 500); // Debounce validation
        return () => clearTimeout(timer);
    }, [edges, validateIntegrity]);
}
