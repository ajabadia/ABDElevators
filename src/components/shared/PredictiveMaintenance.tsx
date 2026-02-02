"use client";

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap, AlertCircle, ShieldCheck, Activity, ChevronRight, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MaintenancePrediction } from '@/core/engine/PredictiveEngine';

export function PredictiveMaintenance() {
    const [predictions, setPredictions] = useState<MaintenancePrediction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPredictions = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/core/predictive/maintenance');
            const data = await res.json();
            if (data.success) {
                setPredictions(data.predictions);
            }
        } catch (error) {
            console.error("Error fetching predictions:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInsights();
    }, []);

    // Placeholder until real integration
    const fetchInsights = fetchPredictions;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <Activity className="animate-pulse text-teal-600" size={40} />
                <p className="text-sm font-medium text-slate-500">Calculando probabilidades de fallo...</p>
            </div>
        );
    }

    if (predictions.length === 0) {
        return (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                <ShieldCheck className="mx-auto text-emerald-500 mb-2" size={32} />
                <h4 className="font-bold text-slate-900">Sistema Estable</h4>
                <p className="text-slate-500 text-xs">No se han detectado señales de riesgo inminente.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Zap size={18} className="text-amber-500 fill-amber-500" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Preview: Mantenimiento Preventivo</h3>
            </div>

            {predictions.map((pred) => (
                <Card key={pred.id} className="overflow-hidden border-none shadow-lg bg-white dark:bg-slate-950 transition-all hover:scale-[1.01]">
                    <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <Badge className={cn(
                                    "mb-2 uppercase text-[10px]",
                                    pred.urgency === 'critical' ? "bg-red-500" :
                                        pred.urgency === 'high' ? "bg-orange-500" :
                                            pred.urgency === 'medium' ? "bg-blue-500" : "bg-slate-500"
                                )}>
                                    {pred.urgency}
                                </Badge>
                                <h4 className="text-md font-extrabold text-slate-900 dark:text-white">
                                    {pred.component}
                                </h4>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-black text-slate-900 dark:text-white">
                                    {pred.riskScore}%
                                </span>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Prob. Fallo</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Progress value={pred.riskScore} className={cn(
                                "h-2",
                                pred.riskScore > 80 ? "[&>div]:bg-red-500" :
                                    pred.riskScore > 50 ? "[&>div]:bg-orange-500" : "[&>div]:bg-teal-500"
                            )} />

                            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                <p className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                                    <AlertCircle size={12} /> Predicción AI
                                </p>
                                <p className="text-sm text-slate-700 dark:text-slate-300 italic">
                                    "{pred.prediction}"
                                </p>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center gap-2 text-xs font-semibold text-teal-600">
                                    <Wrench size={14} />
                                    {pred.nextAction}
                                </div>
                                <ChevronRight size={16} className="text-slate-300" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
