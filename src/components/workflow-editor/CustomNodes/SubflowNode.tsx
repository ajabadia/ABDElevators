"use client";

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitFork, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function SubflowNode({ data, selected }: any) {
    return (
        <div className={cn(
            "px-4 py-3 rounded-xl border-2 shadow-lg transition-all min-w-[180px]",
            selected
                ? "bg-purple-50 border-purple-500 shadow-purple-100 ring-4 ring-purple-100/50"
                : "bg-white border-slate-200 hover:border-purple-300"
        )}>
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-purple-400 border-2 border-white" />

            <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                    <GitFork className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-grow">
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest leading-none mb-1">Sub-workflow</p>
                    <h4 className="text-sm font-bold text-slate-800 truncate max-w-[120px]">
                        {data.label || 'Select Flow...'}
                    </h4>
                </div>
            </div>

            {data.subflowId && (
                <div className="mt-2 pt-2 border-t border-purple-100 flex items-center justify-between">
                    <Badge variant="secondary" className="text-[9px] h-4 bg-purple-100 text-purple-700 hover:bg-purple-200">
                        ID: {data.subflowId.substring(0, 6)}...
                    </Badge>
                    <ExternalLink className="w-3 h-3 text-purple-400 cursor-pointer hover:text-purple-600" />
                </div>
            )}

            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-purple-600 border-2 border-white" />
        </div>
    );
}
