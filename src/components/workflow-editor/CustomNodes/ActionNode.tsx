
import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Cog } from 'lucide-react';

export const ActionNode = memo(({ data }: { data: { label: string } }) => {
    return (
        <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-blue-400 min-w-[150px]">
            <Handle type="target" position={Position.Left} className="w-3 h-3 bg-slate-400" />
            <div className="flex items-center">
                <div className="rounded-full w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 mr-2">
                    <Cog size={16} />
                </div>
                <div className="ml-1">
                    <div className="text-xs font-bold text-slate-500 uppercase">Action</div>
                    <div className="text-sm font-bold text-slate-900">{data.label}</div>
                </div>
            </div>
            <Handle type="source" position={Position.Right} className="w-3 h-3 bg-slate-400" />
        </div>
    );
});

ActionNode.displayName = 'ActionNode';
