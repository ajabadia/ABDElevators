"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, CheckCircle, AlertTriangle, Activity, History, ListRestart } from 'lucide-react';
import { useApiItem } from '@/hooks/useApiItem';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * 🛡️ GovernanceWidget (Era 18)
 * Visualizes prompt health, parity and recent activity.
 */
export function GovernanceWidget() {
    const { data, isLoading } = useApiItem<any>({ 
        endpoint: '/api/admin/superadmin/governance/stats' 
    });

    if (isLoading) {
        return <Skeleton className="h-[400px] w-full rounded-3xl" />;
    }

    const { summary, details, recentChanges } = data || {};

    const getHealthColor = (score: number) => {
        if (score >= 95) return 'text-green-500';
        if (score >= 80) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <Card className="bg-background/50 backdrop-blur-xl border-sidebar-primary/10 rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-sidebar-primary/5 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-sidebar-primary/10 rounded-xl">
                            <Shield className="text-sidebar-primary" size={20} />
                        </div>
                        <CardTitle className="text-lg font-bold tracking-tight">Prompt Governance</CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-sidebar-primary/5 rounded-2xl space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                            <Activity size={14} />
                            Health Score
                        </div>
                        <div className={cn("text-2xl font-black", getHealthColor(summary?.health))}>
                            {summary?.health}%
                        </div>
                    </div>
                    <div className="p-4 bg-sidebar-primary/5 rounded-2xl space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                            <CheckCircle size={14} />
                            Parity Code-DB
                        </div>
                        <div className="text-2xl font-black text-foreground">
                            {summary?.parity}%
                        </div>
                    </div>
                </div>

                {/* Status Items */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm py-1">
                        <span className="text-muted-foreground">Total Master Prompts</span>
                        <span className="font-bold">{summary?.totalPrompts || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm py-1">
                        <span className="text-muted-foreground">Active Hub Versions</span>
                        <span className="font-bold">{summary?.dbActive || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm py-1">
                        <span className="text-muted-foreground">Recent Fallbacks (24h)</span>
                        <span className={cn("font-bold", details?.fallbacks24h > 0 ? "text-yellow-500" : "text-green-500")}>
                            {details?.fallbacks24h || 0}
                        </span>
                    </div>
                </div>

                {/* Warnings */}
                {details?.missingInDb?.length > 0 && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3 items-start animate-pulse">
                        <AlertTriangle className="text-red-500 shrink-0" size={18} />
                        <p className="text-xs text-red-500 leading-relaxed font-medium">
                            <span className="font-bold">Sync Required:</span> {details.missingInDb.length} prompts present in code are missing in the database orchestration layer.
                        </p>
                    </div>
                )}

                {/* Recent Changes */}
                <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        <History size={14} />
                        Recent Deployments
                    </div>
                    <div className="space-y-2">
                        {recentChanges?.length > 0 ? recentChanges.map((change: any) => (
                            <div key={change.key} className="flex items-center gap-3 p-2 hover:bg-sidebar-primary/5 rounded-lg transition-colors group">
                                <div className="p-1.5 bg-background border border-sidebar-primary/10 rounded-md group-hover:border-sidebar-primary/30">
                                    <ListRestart size={12} className="text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[13px] font-bold truncate">{change.key}</div>
                                    <div className="text-[10px] text-muted-foreground">
                                        v{change.version} • {formatDistanceToNow(new Date(change.updatedAt), { addSuffix: true, locale: es })}
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-4 text-xs text-muted-foreground italic">No recent sync events</div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
