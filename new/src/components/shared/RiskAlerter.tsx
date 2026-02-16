"use client";

import { AlertTriangle, AlertCircle, Info, ShieldAlert, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RiskFinding {
    id: string;
    type: 'SECURITY' | 'COMPATIBILITY' | 'LEGAL' | 'REGULATORY' | 'GENERAL';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    ragReference?: string;
    suggestion?: string;
}

interface RiskAlerterProps {
    risks: RiskFinding[];
    className?: string;
}

export function RiskAlerter({ risks, className }: RiskAlerterProps) {
    if (!risks || risks.length === 0) {
        return (
            <div className={cn("bg-teal-50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-900/30 p-4 rounded-xl flex items-center gap-3", className)}>
                <div className="bg-teal-500 text-white p-2 rounded-lg">
                    <Info size={18} />
                </div>
                <div>
                    <p className="text-sm font-bold text-teal-900 dark:text-teal-400">Intelligence Verification Completed</p>
                    <p className="text-xs text-teal-600 dark:text-teal-500/70">No critical risks or incompatibilities detected in the current analysis.</p>
                </div>
            </div>
        );
    }

    const getSeverityStyles = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return 'bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400';
            case 'HIGH': return 'bg-orange-50 border-orange-200 text-orange-900 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400';
            case 'MEDIUM': return 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400';
            default: return 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400';
        }
    };

    const getIcon = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return <ShieldAlert className="text-red-500" />;
            case 'HIGH': return <AlertTriangle className="text-orange-500" />;
            case 'MEDIUM': return <AlertCircle className="text-amber-500" />;
            default: return <Info className="text-blue-500" />;
        }
    };

    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-tight">
                    <ShieldAlert className="text-red-500" size={20} /> Intelligence Alerts ({risks.length})
                </h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
                {risks.map((risk) => (
                    <div
                        key={risk.id}
                        className={cn(
                            "border-l-4 p-4 rounded-r-xl transition-all hover:translate-x-1 duration-200 shadow-sm",
                            getSeverityStyles(risk.severity)
                        )}
                    >
                        <div className="flex items-start gap-4">
                            <div className="mt-1">
                                {getIcon(risk.severity)}
                            </div>
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
                                        {risk.type}
                                    </span>
                                    <span className={cn(
                                        "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                                        risk.severity === 'CRITICAL' ? "border-red-400 bg-red-100" : "border-amber-400 bg-amber-100"
                                    )}>
                                        {risk.severity}
                                    </span>
                                </div>
                                <p className="text-sm font-bold leading-tight">{risk.message}</p>

                                {risk.ragReference && (
                                    <div className="flex items-center gap-2 text-[11px] opacity-80 italic">
                                        <ArrowRight size={12} />
                                        <span>RAG Source: {risk.ragReference}</span>
                                    </div>
                                )}

                                {risk.suggestion && (
                                    <div className="mt-3 bg-white/50 dark:bg-black/20 p-3 rounded-lg border border-current/10">
                                        <p className="text-xs font-bold uppercase tracking-tighter mb-1">Recommended Action:</p>
                                        <p className="text-xs opacity-90">{risk.suggestion}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
