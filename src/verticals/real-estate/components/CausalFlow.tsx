"use client";

import React, { useMemo } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    Node,
    Edge,
    MarkerType,
    NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Zap } from 'lucide-react';

interface CausalFlowProps {
    analysis: {
        chain: { level: number, effect: string, risk: string, description: string }[];
        mitigation: { action: string, urgency: string, estimated_cost_impact: string };
    };
    findingLabel: string;
}

const CausalNode = ({ data }: { data: any }) => {
    const isMitigation = data.type === 'mitigation';
    const isRoot = data.type === 'root';

    return (
        <div className={`px-4 py-3 rounded-xl border shadow-lg min-w-[200px] max-w-[250px] ${isRoot ? 'bg-blue-600 border-blue-400 text-white' :
                isMitigation ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-100' :
                    'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}>
            <div className="flex items-start gap-2">
                {isRoot && <Zap size={14} className="mt-1" />}
                {isMitigation && <CheckCircle2 size={14} className="mt-1 text-emerald-500" />}
                {!isRoot && !isMitigation && <AlertCircle size={14} className="mt-1 text-amber-500" />}

                <div className="flex-1">
                    <p className="text-[10px] uppercase font-black opacity-60 tracking-wider">
                        {data.category}
                    </p>
                    <p className="text-xs font-bold leading-tight mt-0.5">
                        {data.label}
                    </p>
                    {data.description && (
                        <p className="text-[10px] opacity-70 mt-1 italic line-clamp-2">
                            {data.description}
                        </p>
                    )}
                    {data.footer && (
                        <div className="mt-2 flex gap-1">
                            <Badge variant="outline" className="text-[8px] h-4 px-1 border-current">
                                {data.footer}
                            </Badge>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const nodeTypes: NodeTypes = {
    causal: CausalNode,
};

export function CausalFlow({ analysis, findingLabel }: CausalFlowProps) {
    const { nodes, edges } = useMemo(() => {
        const initialNodes: Node[] = [
            {
                id: 'root',
                type: 'causal',
                position: { x: 50, y: 50 },
                data: { label: findingLabel, category: 'Hallazgo Inicial', type: 'root' },
            },
        ];

        const initialEdges: Edge[] = [];
        let lastId = 'root';

        // Add chain nodes
        analysis.chain.forEach((step, index) => {
            const id = `step-${index}`;
            initialNodes.push({
                id,
                type: 'causal',
                position: { x: 50, y: 200 + (index * 150) },
                data: {
                    label: step.effect,
                    description: step.description,
                    category: `Impacto Nivel ${step.level}`,
                    footer: step.risk,
                    type: 'effect'
                },
            });

            initialEdges.push({
                id: `e-${lastId}-${id}`,
                source: lastId,
                target: id,
                animated: true,
                style: { stroke: '#3b82f6', strokeWidth: 2 },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
            });
            lastId = id;
        });

        // Add mitigation node
        const mitId = 'mitigation';
        initialNodes.push({
            id: mitId,
            type: 'causal',
            position: { x: 50, y: 200 + (analysis.chain.length * 150) },
            data: {
                label: analysis.mitigation.action,
                category: 'Plan de Mitigación',
                footer: analysis.mitigation.urgency,
                type: 'mitigation'
            },
        });

        initialEdges.push({
            id: `e-${lastId}-${mitId}`,
            source: lastId,
            target: mitId,
            animated: true,
            style: { stroke: '#10b981', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
        });

        return { nodes: initialNodes, edges: initialEdges };
    }, [analysis, findingLabel]);

    return (
        <div className="w-full h-[500px] border-y border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-black/10">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                panOnScroll
                selectionOnDrag
            >
                <Background color="#cbd5e1" gap={20} />
                <Controls />
            </ReactFlow>
        </div>
    );
}
