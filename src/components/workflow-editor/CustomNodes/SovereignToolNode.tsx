
import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Terminal, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export const SovereignToolNode = memo(({ data, selected }: { data: any, selected: boolean }) => {
    return (
        <div className={cn(
            "px-4 py-3 shadow-xl rounded-lg border-2 bg-card min-w-[200px] transition-all relative",
            selected ? "border-indigo-500 dark:border-indigo-400 ring-4 ring-indigo-500/20" : "border-border"
        )}>
            <div className="absolute -top-3 -right-3">
                <Badge className="bg-indigo-600 border-indigo-700 text-white font-bold h-6 flex items-center justify-center rounded-full shadow-lg">
                    AGENT
                </Badge>
            </div>

            <Handle type="target" position={Position.Left} className="w-3 h-3 bg-muted-foreground" />

            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100/50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <Terminal size={20} />
                </div>
                <div className="flex-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Sovereign Tool</p>
                    <p className="text-sm font-semibold text-foreground">{data.label || 'Ejecutar Función'}</p>
                </div>
            </div>

            <div className="mt-3 pt-2 border-t border-indigo-100 dark:border-indigo-900/30">
                <div className="flex items-center gap-1.5 p-1.5 bg-muted/30 rounded-md border border-border">
                    <Cpu className="w-3 h-3 text-indigo-400" />
                    <span className="text-[10px] font-mono text-muted-foreground truncate">{data.toolId || 'unassigned_tool'}</span>
                </div>
            </div>

            <Handle type="source" position={Position.Right} className="w-3 h-3 bg-muted-foreground" />
        </div>
    );
});

SovereignToolNode.displayName = 'SovereignToolNode';
