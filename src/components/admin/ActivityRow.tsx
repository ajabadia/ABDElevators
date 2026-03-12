"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Activity, AlertTriangle, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ActivityRowProps {
    activity: any;
}

export function ActivityRow({ activity }: ActivityRowProps) {
    const t = useTranslations('admin_analytics');
    const isError = activity.level === 'ERROR';
    const isWarn = activity.level === 'WARN';

    return (
        <div className="flex items-center gap-6 p-5 hover:bg-muted/50 transition-all group cursor-default">
            <div className={`p-3 rounded-xl shadow-sm ${isError ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : isWarn ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground border border-slate-200 dark:border-slate-700'}`}>
                {isError ? <AlertTriangle size={18} /> : <Activity size={18} />}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <p className="text-[10px] font-bold text-slate-500">{activity.source}</p>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                    <p className="text-[10px] font-bold text-muted-foreground font-mono">{new Date(activity.timestamp).toLocaleTimeString()}</p>
                </div>
                <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    {activity.action?.replace(/_/g, ' ') || activity.message}
                </p>
                {activity.message && activity.message !== activity.action && (
                    <p className="text-xs text-muted-foreground line-clamp-1 opacity-70">
                        {activity.message}
                    </p>
                )}
            </div>
            <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-[8px] font-bold border-border text-muted-foreground bg-background">
                    {activity.tenantId?.substring(0, 8) || t('commandCenter.identity.superadmin_view')}
                </Badge>
                <ArrowUpRight size={18} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 group-hover:-translate-y-1" />
            </div>
        </div>
    );
}
