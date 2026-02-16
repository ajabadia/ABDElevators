"use client";

import { AlertTriangle, Activity, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ActivityRowProps {
    activity: any;
}

export function ActivityRow({ activity }: ActivityRowProps) {
    const isError = activity.nivel === 'ERROR';
    const isWarn = activity.nivel === 'WARN';

    return (
        <div className="flex items-center gap-6 p-5 hover:bg-muted/50 transition-all group cursor-default">
            <div className={`p-3 rounded-2xl shadow-sm ${isError ? 'bg-rose-500/10 text-rose-500' : isWarn ? 'bg-amber-500/10 text-amber-500' : 'bg-muted text-muted-foreground'}`}>
                {isError ? <AlertTriangle size={18} /> : <Activity size={18} />}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">{activity.origen}</p>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                    <p className="text-[10px] font-bold text-muted-foreground font-mono">{new Date(activity.timestamp).toLocaleTimeString()}</p>
                </div>
                <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                    {activity.mensaje}
                </p>
            </div>
            <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-[8px] font-black uppercase border-border text-muted-foreground bg-background">
                    {activity.tenantId?.substring(0, 8) || 'SYSTEM'}
                </Badge>
                <ArrowUpRight size={18} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 group-hover:-translate-y-1" />
            </div>
        </div>
    );
}
