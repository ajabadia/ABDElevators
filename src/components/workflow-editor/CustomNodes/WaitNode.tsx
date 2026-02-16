
import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export const WaitNode = memo(({ data, selected }: { data: any, selected: boolean }) => {
    const delay = data.delay || '5s';

    return (
        <div className={cn(
            "px-6 py-4 shadow-lg rounded-full border-2 bg-white flex items-center gap-4 transition-all",
            selected ? "border-amber-500 ring-4 ring-amber-500/20" : "border-slate-200",
            data.isOrphan && "border-amber-400 border-dashed"
        )}>
            {/* Orphan Warning */}
            {data.isOrphan && (
                <div className="absolute -top-5 right-4 bg-amber-500 text-[9px] text-white px-2 py-0.5 rounded-t-md font-black uppercase tracking-tighter">
                    ⚠️
                </div>
            )}
            {data.isCyclic && (
                <div className="absolute -bottom-6 left-0 bg-purple-600 text-[8px] text-white px-2 py-0.5 rounded-b-md font-bold uppercase tracking-wider">
                    🔄 Bucle Detectado
                </div>
            )}
            <Handle type="target" position={Position.Left} className="w-3 h-3 bg-slate-400" />

            <div className="p-2 bg-amber-100/50 rounded-full text-amber-600">
                <Clock size={20} />
            </div>

            <div className="flex flex-col">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider leading-none mb-1">Wait</p>
                <p className="text-sm font-black text-slate-800 leading-none">{delay}</p>
            </div>

            <Handle type="source" position={Position.Right} className="w-3 h-3 bg-slate-400" />
        </div>
    );
});

WaitNode.displayName = 'WaitNode';
