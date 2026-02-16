
import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export const TriggerNode = memo(({ data }: { data: { label: string, isCyclic?: boolean, analytics?: { count: number, avgDuration: number, errorRate: number } } }) => {
    const { analytics } = data;

    return (
        <div className={cn(
            "px-4 py-2 shadow-md rounded-md bg-white border-2 border-amber-400 min-w-[150px] transition-colors relative",
            analytics && analytics.count > 0 && "bg-amber-50"
        )}>
            {analytics && analytics.count > 0 && (
                <div className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 text-[8px] text-white items-center justify-center font-bold">
                        {analytics.count}
                    </span>
                </div>
            )}
            {data.isCyclic && (
                <div className="absolute -bottom-6 left-0 bg-purple-600 text-[8px] text-white px-2 py-0.5 rounded-b-md font-bold uppercase tracking-wider">
                    🔄 Bucle Detectado
                </div>
            )}
            <div className="flex items-center">
                <div className="rounded-full w-8 h-8 flex items-center justify-center bg-amber-100 text-amber-600 mr-2">
                    <Zap size={16} />
                </div>
                <div className="ml-1">
                    <div className="text-xs font-bold text-slate-500 uppercase">Trigger</div>
                    <div className="text-sm font-bold text-slate-900">{data.label}</div>
                    {analytics && (
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5 italic">
                            Evaluado {analytics.count} veces
                        </div>
                    )}
                </div>
            </div>
            <Handle type="source" position={Position.Right} className="w-3 h-3 bg-slate-400" />
        </div>
    );
});

TriggerNode.displayName = 'TriggerNode';
