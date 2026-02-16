
import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Cog, Zap } from 'lucide-react'; // Added Zap, Cog might be removed later if not used
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge'; // Assuming Badge is from a UI library

// I18N Labels (Ideally move to a translation file)
const LABELS = {
    LATENCY: "Avg. Latency:",
    ERROR_RATE: "Error Rate:",
    EXECUTIONS: "executions"
};

export const ActionNode = memo(({ data, selected }: { data: any, selected: boolean }) => {
    const analytics = data.analytics || { count: 0, avgDuration: 0, errorRate: 0 };
    const hasData = analytics.count > 0;
    const isHighError = analytics.errorRate > 0.15; // Phase 54 Threshold

    return (
        <div className={cn(
            "px-4 py-3 shadow-xl rounded-lg border-2 bg-white min-w-[200px] transition-all relative",
            selected ? "border-teal-500 ring-4 ring-teal-500/20" : "border-slate-200",
            hasData && "bg-teal-50/30",
            isHighError && "ring-4 ring-red-500/30 animate-pulse border-red-500", // Anomaly Pulse
            data.isOrphan && "border-amber-400 border-dashed"
        )}>
            {/* Orphan Warning */}
            {data.isOrphan && (
                <div className="absolute -top-7 right-0 bg-amber-500 text-[9px] text-white px-2 py-0.5 rounded-t-md font-black uppercase tracking-tighter">
                    ⚠️ Desconectado
                </div>
            )}
            {/* Anomaly Label (Critical) */}
            {isHighError && (
                <div className="absolute -top-7 left-0 bg-red-600 text-[9px] text-white px-2 py-0.5 rounded-t-md font-black uppercase tracking-tighter">
                    ⚠️ ANOMALÍA DETECTADA
                </div>
            )}

            {/* Analytics Badge */}
            {hasData && (
                <div className="absolute -top-3 -right-3 flex gap-1">
                    <Badge className="bg-teal-600 border-teal-700 text-white font-bold p-1 h-6 min-w-6 flex items-center justify-center rounded-full shadow-lg">
                        {analytics.count}
                    </Badge>
                    {isHighError && (
                        <Badge className="bg-red-500 border-red-600 text-white p-1 h-6 min-w-6 flex items-center justify-center rounded-full">
                            !
                        </Badge>
                    )}
                </div>
            )}
            <Handle type="target" position={Position.Left} className="w-3 h-3 bg-slate-400" />
            <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100/50 rounded-lg text-teal-600">
                    <Zap size={20} className={cn(hasData && "animate-pulse")} />
                </div>
                <div className="flex-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Acción</p>
                    <p className="text-sm font-semibold text-slate-800">{data.label}</p>
                </div>
            </div>

            {/* Performance Footer */}
            {hasData && (
                <div className="mt-3 pt-2 border-t border-teal-100/50 space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500">
                        <span>{LABELS.LATENCY}</span>
                        <span className="font-bold text-slate-700">{Math.round(analytics.avgDuration)}ms</span>
                    </div>
                    {analytics.errorRate > 0 && (
                        <div className="flex justify-between text-[10px]">
                            <span className="text-slate-500">{LABELS.ERROR_RATE}</span>
                            <span className={cn("font-bold", isHighError ? "text-red-600" : "text-amber-600")}>
                                {(analytics.errorRate * 100).toFixed(1)}%
                            </span>
                        </div>
                    )}
                </div>
            )}
            <Handle type="source" position={Position.Right} className="w-3 h-3 bg-slate-400" />
        </div>
    );
});

ActionNode.displayName = 'ActionNode';
