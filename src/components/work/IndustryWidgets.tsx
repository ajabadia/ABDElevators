"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { ContentCard } from '@/components/ui/content-card';
import { Badge } from '@/components/ui/badge';
import { 
    AlertTriangle, 
    CheckCircle2, 
    ClipboardCheck, 
    ShieldAlert, 
    TrendingUp,
    Clock,
    Gavel
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ChecklistStatusWidget (Elevators Industry)
 * Shows a summary of pending inspections and status.
 */
export function ChecklistStatusWidget() {
    const t = useTranslations("work");
    
    // Mock data for phase 501
    const stats = [
        { label: t("widgets.pending"), value: 12, color: "text-amber-600", icon: Clock },
        { label: t("widgets.completed"), value: 45, color: "text-emerald-600", icon: CheckCircle2 },
        { label: t("widgets.critical"), value: 3, color: "text-red-600", icon: AlertTriangle },
    ];

    return (
        <ContentCard title={t("widgets.elevator_checklists")} icon={<ClipboardCheck className="text-primary w-5 h-5" />}>
            <div className="grid grid-cols-3 gap-2 mt-2">
                {stats.map((stat, i) => (
                    <div key={i} className="flex flex-col items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                        <stat.icon className={cn("w-5 h-5 mb-1", stat.color)} />
                        <span className="text-xl font-bold">{stat.value}</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-medium">{stat.label}</span>
                    </div>
                ))}
            </div>
            <div className="mt-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
                <p className="text-[11px] text-blue-700 dark:text-blue-300 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    {t("widgets.next_inspection")}: **Comunidad Montes** (Mañana, 09:00)
                </p>
            </div>
        </ContentCard>
    );
}

/**
 * RiskHeatmapWidget (Legal Industry)
 * Visualizes contract risks and compliance issues.
 */
export function RiskHeatmapWidget() {
    const t = useTranslations("work");

    // Mock risk data for phase 501
    const risks = [
        { id: '1', name: "Cláusulas Abusivas", severity: 0.8, count: 5 },
        { id: '2', name: "RGPD Compliance", severity: 0.4, count: 12 },
        { id: '3', name: "Jurisdicción Foral", severity: 0.2, count: 8 },
        { id: '4', name: "Responsabilidad Civil", severity: 0.9, count: 2 },
    ];

    return (
        <ContentCard title={t("widgets.legal_risks")} icon={<Gavel className="text-primary w-5 h-5" />}>
            <div className="space-y-3 mt-2">
                {risks.map((risk) => (
                    <div key={risk.id} className="space-y-1">
                        <div className="flex justify-between items-center text-[11px]">
                            <span className="font-bold">{risk.name}</span>
                            <Badge variant="outline" className={cn(
                                "text-[9px] px-1 py-0 h-4",
                                risk.severity > 0.7 ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700"
                            )}>
                                {risk.severity > 0.7 ? "ALTO" : "MEDIO"}
                            </Badge>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                                className={cn(
                                    "h-full transition-all duration-1000",
                                    risk.severity > 0.7 ? "bg-red-500" : "bg-amber-500"
                                )}
                                style={{ width: `${risk.severity * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-red-500" /> +15% vs mes anterior</span>
                <span className="font-mono">27 {t("widgets.findings_total")}</span>
            </div>
        </ContentCard>
    );
}
