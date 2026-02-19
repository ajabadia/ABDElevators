
import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { UserCheck, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export const HumanValidationNode = memo(({ data, selected }: { data: any, selected: boolean }) => {
    const isPending = data.status === 'pending';

    return (
        <div className={cn(
            "px-4 py-3 shadow-xl rounded-lg border-2 bg-card min-w-[200px] transition-all relative",
            selected ? "border-amber-500 dark:border-amber-400 ring-4 ring-amber-500/20" : "border-border",
            isPending && "bg-amber-50/30 dark:bg-amber-900/10 ring-2 ring-amber-400 animate-pulse"
        )}>
            <div className="absolute -top-3 -right-3">
                <Badge className="bg-amber-500 border-amber-600 text-white font-bold h-6 flex items-center justify-center rounded-full shadow-lg">
                    HITL
                </Badge>
            </div>

            <Handle type="target" position={Position.Left} className="w-3 h-3 bg-muted-foreground" />

            <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100/50 dark:bg-amber-900/20 rounded-lg text-amber-600 dark:text-amber-400">
                    <UserCheck size={20} />
                </div>
                <div className="flex-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Validación Humana</p>
                    <p className="text-sm font-semibold text-foreground">{data.label || 'Esperando Revisión'}</p>
                </div>
            </div>

            {
                isPending && (
                    <div className="mt-3 pt-2 border-t border-amber-100 dark:border-amber-900/30 flex items-center justify-between text-[10px] text-amber-700 dark:text-amber-300">
                        <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>SLA: 24h</span>
                        </div>
                        <span className="font-bold">PENDIENTE</span>
                    </div>
                )
            }

            <Handle type="source" position={Position.Right} className="w-3 h-3 bg-muted-foreground" />
        </div >
    );
});

HumanValidationNode.displayName = 'HumanValidationNode';
