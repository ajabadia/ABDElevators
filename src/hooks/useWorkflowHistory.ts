"use client";

import { useState, useCallback, useRef } from "react";
import { Node, Edge } from "@xyflow/react";

interface WorkflowState {
    nodes: Node[];
    edges: Edge[];
}

export function useWorkflowHistory() {
    const [history, setHistory] = useState<WorkflowState[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const isUndoingRedoing = useRef(false);

    const takeSnapshot = useCallback((nodes: Node[], edges: Edge[]) => {
        if (isUndoingRedoing.current) return;

        const newState = {
            nodes: JSON.parse(JSON.stringify(nodes)),
            edges: JSON.parse(JSON.stringify(edges))
        };

        setHistory(prev => {
            const nextHistory = prev.slice(0, currentIndex + 1);
            // Only add if different from current
            if (nextHistory.length > 0) {
                const current = nextHistory[nextHistory.length - 1];
                if (JSON.stringify(current.nodes) === JSON.stringify(newState.nodes) &&
                    JSON.stringify(current.edges) === JSON.stringify(newState.edges)) {
                    return prev;
                }
            }
            const updated = [...nextHistory, newState].slice(-50); // Limit to 50 steps
            setCurrentIndex(updated.length - 1);
            return updated;
        });
    }, [currentIndex]);

    const undo = useCallback((setNodes: any, setEdges: any) => {
        if (currentIndex <= 0) return;

        isUndoingRedoing.current = true;
        const prevIndex = currentIndex - 1;
        const prevState = history[prevIndex];

        setNodes(JSON.parse(JSON.stringify(prevState.nodes)));
        setEdges(JSON.parse(JSON.stringify(prevState.edges)));
        setCurrentIndex(prevIndex);

        setTimeout(() => { isUndoingRedoing.current = false; }, 10);
    }, [currentIndex, history]);

    const redo = useCallback((setNodes: any, setEdges: any) => {
        if (currentIndex >= history.length - 1) return;

        isUndoingRedoing.current = true;
        const nextIndex = currentIndex + 1;
        const nextState = history[nextIndex];

        setNodes(JSON.parse(JSON.stringify(nextState.nodes)));
        setEdges(JSON.parse(JSON.stringify(nextState.edges)));
        setCurrentIndex(nextIndex);

        setTimeout(() => { isUndoingRedoing.current = false; }, 10);
    }, [currentIndex, history]);

    return {
        takeSnapshot,
        undo,
        redo,
        canUndo: currentIndex > 0,
        canRedo: currentIndex < history.length - 1
    };
}
