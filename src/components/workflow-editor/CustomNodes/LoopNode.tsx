
import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export const LoopNode = memo(({ data, selected }: { data: any, selected: boolean }) => {
    const iterator = data.iterator || 'items';

    return (
        <div className={cn(
            "px-4 py-3 shadow-xl rounded-lg border-2 border-dashed bg-white min-w-[180px] transition-all relative overflow-hidden",
            selected ? "border-sky-500 ring-4 ring-sky-500/20" : "border-slate-300",
            data.isOrphan && "border-amber-400"
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
            {/* Background Decorative Icon */}
            <RefreshCw size={80} className="absolute -bottom-4 -right-4 text-slate-50 opacity-10" />

            <Handle type="target" position={Position.Left} className="w-3 h-3 bg-slate-400" />

            <div className="flex items-center gap-3 relative z-10">
                <div className="p-2 bg-sky-100/50 rounded-lg text-sky-600">
                    <RefreshCw size={20} className="animate-spin-slow" />
                </div>
                <div className="flex-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Iterador</p>
                    <p className="text-sm font-semibold text-slate-800">ForEach {iterator}</p>
                </div>
            </div>

            <div className="mt-2 text-[10px] text-slate-500 bg-slate-50 p-2 rounded relative z-10">
                <p>Output: <code>item</code> context</p>
            </div>

            <Handle type="source" position={Position.Right} id="body" style={{ top: '30%' }} className="w-3 h-3 bg-sky-500" />
            <Handle type="source" position={Position.Right} id="complete" style={{ top: '70%' }} className="w-3 h-3 bg-slate-400" />

            <div className="flex flex-col items-end gap-1 mt-1">
                <span className="text-[8px] font-bold text-sky-600 mr-2 uppercase">Cuerpo</span>
                <span className="text-[8px] font-bold text-slate-400 mr-2 uppercase">Al terminar</span>
            </div>
        </div>
    );
});

LoopNode.displayName = 'LoopNode';
