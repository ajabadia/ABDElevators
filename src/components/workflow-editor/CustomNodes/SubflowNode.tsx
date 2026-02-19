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
                ? "bg-purple-50 dark:bg-purple-900/10 border-purple-500 dark:border-purple-400 shadow-purple-100 dark:shadow-purple-900/20 ring-4 ring-purple-100/50 dark:ring-purple-900/20"
                : "bg-card border-border hover:border-purple-300 dark:hover:border-purple-700"
        )}>
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-purple-400 border-2 border-card" />

            <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <GitFork className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-grow">
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest leading-none mb-1">Sub-workflow</p>
                    <h4 className="text-sm font-bold text-foreground truncate max-w-[120px]">
                        {data.label || 'Select Flow...'}
                    </h4>
                </div>
            </div>

            {data.subflowId && (
                <div className="mt-2 pt-2 border-t border-purple-100 dark:border-purple-900/30 flex items-center justify-between">
                    <Badge variant="secondary" className="text-[9px] h-4 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/40">
                        ID: {data.subflowId.substring(0, 6)}...
                    </Badge>
                    <ExternalLink className="w-3 h-3 text-purple-400 cursor-pointer hover:text-purple-600 dark:hover:text-purple-300" />
                </div>
            )}

            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-purple-600 border-2 border-card" />
        </div>
    );
}
