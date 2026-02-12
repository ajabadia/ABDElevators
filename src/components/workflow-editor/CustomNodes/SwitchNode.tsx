
import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';

export const SwitchNode = memo(({ data, selected }: { data: any, selected: boolean }) => {
    const cases = data.cases || ['Default', 'Case 1', 'Case 2'];

    return (
        <div className={cn(
            "px-4 py-3 shadow-xl rounded-lg border-2 bg-white min-w-[200px] transition-all relative",
            selected ? "border-indigo-500 ring-4 ring-indigo-500/20" : "border-slate-200",
            data.isOrphan && "border-amber-400 border-dashed"
        )}>
            {/* Orphan Warning */}
            {data.isOrphan && (
                <div className="absolute -top-7 right-0 bg-amber-500 text-[9px] text-white px-2 py-0.5 rounded-t-md font-black uppercase tracking-tighter">
                    ⚠️ Desconectado
                </div>
            )}
            {data.isCyclic && (
                <div className="absolute -bottom-6 left-0 bg-purple-600 text-[8px] text-white px-2 py-0.5 rounded-b-md font-bold uppercase tracking-wider">
                    🔄 Bucle Detectado
                </div>
            )}
            <Handle type="target" position={Position.Left} className="w-3 h-3 bg-slate-400" />

            <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-indigo-100/50 rounded-lg text-indigo-600">
                    <GitBranch size={20} />
                </div>
                <div className="flex-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Switch / Case</p>
                    <p className="text-sm font-semibold text-slate-800">{data.label || 'Routing Logic'}</p>
                </div>
            </div>

            <div className="space-y-2">
                {cases.map((caseLabel: string, index: number) => (
                    <div key={index} className="relative flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100 text-[11px] text-slate-600 group">
                        <span>{caseLabel}</span>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id={`case-${index}`}
                            style={{ top: '50%', right: '-12px', background: '#6366f1' }}
                            className="w-3 h-3 border-2 border-white"
                        />
                    </div>
                ))}
            </div>

            <p className="mt-3 text-[9px] text-slate-400 italic text-center">
                Routes execution based on variable evaluation
            </p>
        </div>
    );
});

SwitchNode.displayName = 'SwitchNode';
