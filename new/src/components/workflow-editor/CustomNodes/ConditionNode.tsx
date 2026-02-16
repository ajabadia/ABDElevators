
import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Split, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ConditionNode = memo(({ data }: { data: { label: string, analytics?: { count: number, avgDuration: number, errorRate: number } } }) => {
    const { analytics } = data;

    return (
        <div className={cn(
            "px-4 py-2 shadow-md rounded-md bg-white border-2 border-slate-400 min-w-[150px] relative transition-colors",
            analytics && analytics.count > 0 && "bg-slate-50"
        )}>
            {analytics && analytics.count > 0 && (
                <div className="absolute -top-3 -right-2 bg-slate-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm">
                    {analytics.count}
                </div>
            )}
            <Handle type="target" position={Position.Left} className="w-3 h-3 bg-slate-400" />
            <div className="flex items-center justify-center mb-2 border-b border-slate-100 pb-2">
                <Split size={16} className="text-slate-500 mr-2" />
                <div className="text-sm font-bold text-slate-900">{data.label}</div>
            </div>

            <div className="flex justify-between w-full relative h-4">
                <div className="absolute left-0 -bottom-3 text-[10px] text-emerald-600 font-bold">TRUE</div>
                <div className="absolute right-0 -bottom-3 text-[10px] text-red-600 font-bold">FALSE</div>
            </div>

            <Handle type="source" position={Position.Right} id="true" className="w-3 h-3 bg-emerald-500 !top-[70%]" style={{ top: 'auto', bottom: '10px' }} />
            <Handle type="source" position={Position.Bottom} id="false" className="w-3 h-3 bg-red-500" />
        </div>
    );
});

ConditionNode.displayName = 'ConditionNode';
