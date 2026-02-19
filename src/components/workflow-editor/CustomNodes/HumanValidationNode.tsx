
import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { UserCheck, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export const HumanValidationNode = memo(({ data, selected }: { data: any, selected: boolean }) => {
    const isPending = data.status === 'pending';

    return (
        <div className={cn(
            "px-4 py-3 shadow-xl rounded-lg border-2 bg-white min-w-[200px] transition-all relative",
            selected ? "border-amber-500 ring-4 ring-amber-500/20" : "border-slate-200",
            isPending && "bg-amber-50/30 ring-2 ring-amber-400 animate-pulse"
        )}>
            <div className="absolute -top-3 -right-3">
                <Badge className="bg-amber-500 border-amber-600 text-white font-bold h-6 flex items-center justify-center rounded-full shadow-lg">
                    HITL
                </Badge>
            </div>

            <Handle type="target" position={Position.Left} className="w-3 h-3 bg-slate-400" />

            <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100/50 rounded-lg text-amber-600">
                    <UserCheck size={20} />
                </div>
                <div className="flex-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Validación Humana</p>
                    <p className="text-sm font-semibold text-slate-800">{data.label || 'Esperando Revisión'}</p>
                </div>
            </div>

            {isPending && (
                <div className="mt-3 pt-2 border-t border-amber-100 flex items-center justify-between text-[10px] text-amber-700">
                    <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>SLA: 24h</span>
                    </div>
                    <span className="font-bold">PENDIENTE</span>
                </div>
            )}

            <Handle type="source" position={Position.Right} className="w-3 h-3 bg-slate-400" />
        </div>
    );
});

HumanValidationNode.displayName = 'HumanValidationNode';
