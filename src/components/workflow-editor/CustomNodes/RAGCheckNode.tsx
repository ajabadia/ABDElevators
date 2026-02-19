
import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ShieldCheck, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export const RAGCheckNode = memo(({ data, selected }: { data: any, selected: boolean }) => {
    const accuracy = data.accuracy || 1.0;

    return (
        <div className={cn(
            "px-4 py-3 shadow-xl rounded-lg border-2 bg-white min-w-[200px] transition-all relative",
            selected ? "border-emerald-500 ring-4 ring-emerald-500/20" : "border-slate-200"
        )}>
            <div className="absolute -top-3 -right-3">
                <Badge className="bg-emerald-600 border-emerald-700 text-white font-bold h-6 flex items-center justify-center rounded-full shadow-lg">
                    RAG
                </Badge>
            </div>

            <Handle type="target" position={Position.Left} className="w-3 h-3 bg-slate-400" />

            <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100/50 rounded-lg text-emerald-600">
                    <ShieldCheck size={20} />
                </div>
                <div className="flex-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Verificación RAG</p>
                    <p className="text-sm font-semibold text-slate-800">{data.label || 'Validar Contexto'}</p>
                </div>
            </div>

            <div className="mt-3 pt-2 border-t border-emerald-100 space-y-1">
                <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Confianza Min:</span>
                    <span className="font-bold text-emerald-600">{(accuracy * 100).toFixed(0)}%</span>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-slate-400">
                    <Database className="w-3 h-3" />
                    <span>Vector: MongoDB-Atlas</span>
                </div>
            </div>

            <Handle type="source" position={Position.Right} className="w-3 h-3 bg-slate-400" />
        </div>
    );
});

RAGCheckNode.displayName = 'RAGCheckNode';
