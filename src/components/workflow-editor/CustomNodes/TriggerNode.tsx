
import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Zap } from 'lucide-react';

export const TriggerNode = memo(({ data }: { data: { label: string } }) => {
    return (
        <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-amber-400 min-w-[150px]">
            <div className="flex items-center">
                <div className="rounded-full w-8 h-8 flex items-center justify-center bg-amber-100 text-amber-600 mr-2">
                    <Zap size={16} />
                </div>
                <div className="ml-1">
                    <div className="text-xs font-bold text-slate-500 uppercase">Trigger</div>
                    <div className="text-sm font-bold text-slate-900">{data.label}</div>
                </div>
            </div>
            <Handle type="source" position={Position.Right} className="w-3 h-3 bg-slate-400" />
        </div>
    );
});

TriggerNode.displayName = 'TriggerNode';
