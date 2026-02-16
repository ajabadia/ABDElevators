"use client";

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, AlertTriangle, Info, CheckCircle2, ArrowRight, BrainCircuit, Loader2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Insight } from '@/core/engine/InsightEngine';

export function InsightPanel() {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [learnedCount, setLearnedCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const fetchInsights = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/core/insights');
            const data = await res.json();
            if (data.success) {
                setInsights(data.insights);
                setLearnedCount(data.learnedCount || 0);
            }
        } catch (error) {
            console.error("Error fetching insights:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInsights();
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'warning': return <AlertTriangle className="text-amber-500" size={18} />;
            case 'critical': return <AlertTriangle className="text-red-500" size={18} />;
            case 'info': return <Info className="text-blue-500" size={18} />;
            case 'success': return <CheckCircle2 className="text-emerald-500" size={18} />;
            default: return <Sparkles className="text-teal-500" size={18} />;
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <Card key={i} className="animate-pulse">
                        <CardContent className="h-24" />
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <BrainCircuit size={16} className="text-teal-600" />
                    System Insights
                </h3>
                <div className="flex gap-2">
                    {learnedCount > 0 && (
                        <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 animate-pulse">
                            <Zap size={10} /> +{learnedCount} Conocimientos
                        </Badge>
                    )}
                    <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                        BETA
                    </Badge>
                </div>
            </div>

            {insights.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
                    <p className="text-slate-400 text-sm">No hay insights disponibles en este momento.</p>
                </div>
            ) : (
                insights.map((insight) => (
                    <Card
                        key={insight.id}
                        className={cn(
                            "group hover:shadow-md transition-all duration-300 border-l-4",
                            insight.type === 'warning' && "border-l-amber-500",
                            insight.type === 'critical' && "border-l-red-500",
                            insight.type === 'info' && "border-l-blue-500",
                            insight.type === 'success' && "border-l-emerald-500",
                            !insight.type && "border-l-teal-500"
                        )}
                    >
                        <CardContent className="p-4">
                            <div className="flex gap-4">
                                <div className="mt-1 shrink-0">
                                    {getIcon(insight.type)}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-slate-900 dark:text-white leading-none">
                                            {insight.title}
                                        </h4>
                                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4">
                                            Impacto: {insight.impact}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                        {insight.description}
                                    </p>
                                    <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-teal-600 dark:text-teal-400 group-hover:gap-3 transition-all cursor-pointer">
                                        {insight.suggestion}
                                        <ArrowRight size={12} />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    );
}
