"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Brain,
    Zap,
    CheckCircle2,
    ArrowRight,
    Loader2,
    AlertCircle,
    ChevronRight,
    ShieldCheck,
    MessageSquare
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useApiMutation } from '@/hooks/useApiMutation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface CaseWorkflowControllerProps {
    caseId: string;
}

export function CaseWorkflowController({ caseId }: CaseWorkflowControllerProps) {
    const t = useTranslations('caseWorkflow');
    const { toast } = useToast();
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchStatus = async () => {
        try {
            const res = await fetch(`/api/admin/cases/${caseId}/workflow`);
            const json = await res.json();
            if (json.success) setData(json);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, [caseId]);

    const { mutate: runAnalysis, isLoading: isAnalyzing } = useApiMutation({
        endpoint: `/api/admin/cases/${caseId}/workflow`,
        method: 'PATCH',
        onSuccess: (res: any) => {
            toast({
                title: t('analysisComplete'),
                description: t('riskDetected', { level: res.analysis?.riskLevel || 'BAJO' }),
                variant: "default"
            });
            fetchStatus();
        }
    });

    const { mutate: executeTransition, isLoading: isTransitioning } = useApiMutation({
        endpoint: `/api/admin/cases/${caseId}/workflow`,
        method: 'POST',
        onSuccess: (res: any) => {
            toast({
                title: t('statusUpdated'),
                description: t('statusUpdatedDesc', { to: res.to }),
                variant: "default"
            });
            fetchStatus();
            // Optional: trigger a page refresh or parent update
            window.location.reload();
        }
    });

    if (isLoading) {
        return (
            <div className="h-20 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700" />
        );
    }

    if (!data?.workflow) return null;

    const { currentState, availableTransitions, lastAnalysis } = data;

    return (
        <Card className="border-2 border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none overflow-hidden rounded-2xl">
            <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className="w-3 h-3 rounded-full animate-pulse"
                        style={{ backgroundColor: currentState?.color || '#64748b' }}
                    />
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">{t('currentStatus')}</h4>
                </div>
                <Badge
                    style={{ backgroundColor: `${currentState?.color}15`, color: currentState?.color, borderColor: `${currentState?.color}30` }}
                    className="font-black uppercase tracking-tighter px-3 py-1 border"
                >
                    {currentState?.label || t('pending')}
                </Badge>
            </div>

            <CardContent className="p-6 space-y-6">
                {/* AI Analysis Section */}
                {currentState?.llmNode?.enabled && (
                    <div className="bg-teal-50/50 dark:bg-teal-950/20 rounded-2xl border border-teal-100 dark:border-teal-900/50 p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-teal-800 dark:text-teal-400">
                                <Brain size={18} />
                                <span className="text-sm font-black uppercase tracking-tight">{t('iaIntelligence')}</span>
                            </div>
                            {!lastAnalysis && (
                                <Badge className="bg-teal-500 text-white animate-bounce text-[10px]">{t('recommended')}</Badge>
                            )}
                        </div>

                        {lastAnalysis ? (
                            <div className="space-y-3 animate-in fade-in duration-500">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className={cn(
                                        "w-5 h-5",
                                        lastAnalysis.riskLevel === 'HIGH' || lastAnalysis.riskLevel === 'CRITICAL' ? "text-red-500" : "text-emerald-500"
                                    )} />
                                    <span className="text-sm font-bold">{t('risk', { level: lastAnalysis.riskLevel || 'BAJO' })}</span>
                                    <Badge variant="outline" className="ml-auto font-mono text-[10px]">{t('confidence', { value: Math.round(lastAnalysis.confidence * 100) })}</Badge>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
                                    "{lastAnalysis.reason}"
                                </p>
                                {lastAnalysis.recommendations && (
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {lastAnalysis.recommendations.map((r: string, i: number) => (
                                            <Badge key={i} className="bg-white dark:bg-slate-800 text-slate-600 border-slate-200 text-[9px] font-bold">
                                                {r}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-4 space-y-4">
                                <p className="text-xs text-slate-500">{t('iaDescription')}</p>
                                <Button
                                    onClick={() => runAnalysis({})}
                                    disabled={isAnalyzing}
                                    variant="outline"
                                    className="border-teal-200 text-teal-700 hover:bg-teal-50 w-full gap-2 font-black uppercase text-[10px] tracking-widest"
                                >
                                    {isAnalyzing ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} />}
                                    {t('runAnalysis')}
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Transitions Section */}
                <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">{t('availableActions')}</Label>
                    <div className="grid grid-cols-1 gap-2">
                        {availableTransitions.map((t: any, idx: number) => (
                            <Button
                                key={idx}
                                onClick={() => executeTransition({ toState: t.to })}
                                disabled={isTransitioning}
                                className={cn(
                                    "justify-between h-12 font-bold px-4 rounded-xl transition-all border-2",
                                    t.action === 'REJECT'
                                        ? "bg-white border-red-100 text-red-600 hover:bg-red-50"
                                        : "bg-slate-900 text-white hover:bg-black border-slate-900"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    {t.decisionStrategy === 'LLM_SUGGEST_HUMAN_APPROVE' && <Brain size={14} className="text-teal-400" />}
                                    {t.label}
                                </div>
                                <ChevronRight size={16} className="opacity-50" />
                            </Button>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
