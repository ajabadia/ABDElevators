'use client';

import React, { useEffect, useState } from 'react';
import { Activity, ShieldCheck, Zap, AlertTriangle, ChevronRight, Binary, Database, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useHealthStore } from '@/store/health-store';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetDescription
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';

interface HealthData {
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    ingestSuccessRate: number;
    avgRagLatency: number;
    securityAnomaliesCount: number;
    activeUsers24h: number;
    timestamp: string;
}

/**
 * 🛰️ The Pulse Widget
 * ERA 10: Phase 265 - Real-Time Activity Center
 * Provides a global health indicator and detailed diagnostic side panel.
 */
export function ThePulseWidget() {
    const t = useTranslations('admin_analytics');
    const { health, loading, fetchHealth } = useHealthStore();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        fetchHealth();
        const interval = setInterval(() => fetchHealth(), 30000); // 30s pulse
        return () => clearInterval(interval);
    }, [fetchHealth]);

    const isProcessing = (health?.activeProcessingCount || 0) > 0;

    const statusColor = health?.status === 'CRITICAL'
        ? 'text-destructive'
        : health?.status === 'WARNING'
            ? 'text-amber-500'
            : isProcessing
                ? 'text-primary'
                : 'text-emerald-500';

    const statusBg = health?.status === 'CRITICAL'
        ? 'bg-destructive/10'
        : health?.status === 'WARNING'
            ? 'bg-amber-500/10'
            : isProcessing
                ? 'bg-primary/10'
                : 'bg-emerald-500/10';

    const statusLabel = health?.status === 'CRITICAL'
        ? 'SYSTEM ALERT'
        : health?.status === 'WARNING'
            ? 'ATTENTION REQ'
            : isProcessing
                ? `PROCESSING ${health?.activeProcessingCount}`
                : 'SYSTEM VITAL';

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <button
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-500 hover:ring-1 hover:ring-primary/20",
                        statusBg
                    )}
                >
                    <div className="relative flex h-2 w-2">
                        <span className={cn(
                            "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                            statusColor.replace('text-', 'bg-')
                        )} />
                        <span className={cn(
                            "relative inline-flex rounded-full h-2 w-2",
                            statusColor.replace('text-', 'bg-')
                        )} />
                    </div>
                    <span className={cn(
                        "text-[10px] font-black tracking-widest uppercase hidden md:inline-block",
                        statusColor,
                        isProcessing && "animate-pulse"
                    )}>
                        {statusLabel}
                    </span>
                    <Activity className={cn("h-3.5 w-3.5", statusColor)} />
                </button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] border-l bg-background/95 backdrop-blur-xl">
                <SheetHeader className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-[10px] font-bold border-primary/20 bg-primary/5 text-primary">
                            ERA 10 OPERATIONS
                        </Badge>
                    </div>
                    <SheetTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
                        <Activity className="h-6 w-6 text-primary" />
                        SYSTEM PULSE
                    </SheetTitle>
                    <SheetDescription className="text-xs uppercase tracking-widest font-bold text-muted-foreground/60">
                        Real-Time Infrastructure Health & Security
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-8 space-y-6">
                    {/* Operational Health Summary */}
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="bg-emerald-500/[0.02] border-emerald-500/10 shadow-none">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-1">
                                <Zap className="h-5 w-5 text-emerald-500 mb-1" />
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">{t('commandCenter.pulse.ingest')}</span>
                                <span className="text-2xl font-black text-emerald-600">{health?.ingestSuccessRate || 0}%</span>
                            </CardContent>
                        </Card>
                        <Card className="bg-primary/[0.02] border-primary/10 shadow-none">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-1">
                                <Binary className="h-5 w-5 text-primary mb-1" />
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">{t('commandCenter.pulse.latency')}</span>
                                <span className="text-2xl font-black text-primary">{health?.avgRagLatency || 0}ms</span>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Vitals Feed */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Detailed Vitals</h4>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <div className="flex items-center gap-2">
                                        <Database className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-bold">Ingestion Stability</span>
                                    </div>
                                    <span className="font-mono">{health?.ingestSuccessRate}%</span>
                                </div>
                                <Progress value={health?.ingestSuccessRate} className="h-1" color="emerald" />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-bold">Security Integrity</span>
                                    </div>
                                    <span className="font-mono text-emerald-500">SECURE</span>
                                </div>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5, 6, 7].map(i => (
                                        <div key={i} className="h-1 flex-1 rounded-full bg-emerald-500" />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ingest Queue Section */}
                    <div className="pt-6 border-t border-dashed">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ingest Queue</h4>
                            <Badge variant="outline" className="text-[9px]">{health?.activeProcessingCount || 0} ACTIVE</Badge>
                        </div>

                        {(health?.activeJobs || []).length > 0 ? (
                            <div className="space-y-3">
                                {health?.activeJobs.map((job) => (
                                    <div key={job.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border border-border/50 group transition-colors hover:bg-muted/50">
                                        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                                            <Database className="h-4 w-4 animate-pulse" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold truncate">{job.name}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black text-primary animate-pulse">{job.status}</span>
                                                <span className="text-[9px] text-muted-foreground">•</span>
                                                <span className="text-[9px] text-muted-foreground">
                                                    {new Date(job.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-6 bg-muted/10 rounded-lg border border-dashed text-center gap-2 opacity-60">
                                <Database className="h-6 w-6 text-muted-foreground" />
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Queue is empty</p>
                            </div>
                        )}
                    </div>

                    <div className="pt-6 border-t border-dashed">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Security Anomalies (7d)</h4>
                        {health?.securityAnomaliesCount === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 bg-muted/20 rounded-lg border border-dashed text-center gap-2">
                                <ShieldCheck className="h-8 w-8 text-emerald-500/50" />
                                <p className="text-xs font-bold text-muted-foreground">NO ANOMALIES DETECTED</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                                <span className="text-xl font-black text-amber-600">{health?.securityAnomaliesCount} Warnings</span>
                                <Button variant="outline" size="sm" className="w-full justify-between">
                                    Review Audit Logs
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="pt-6 border-t">
                        <Button className="w-full gap-2 shadow-lg" onClick={() => window.location.href = '/admin/audit'}>
                            <Zap className="h-4 w-4" />
                            OPEN FULL DIAGNOSTICS
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
