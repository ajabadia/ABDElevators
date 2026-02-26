'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PLANS, PlanTier } from '@/lib/plans';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, Calculator, Sparkles, TrendingUp, Loader2 } from 'lucide-react';

export default function PriceSimulator() {
    const t = useTranslations('admin.billing');
    const [currentPlan, setCurrentPlan] = useState<PlanTier>('FREE');
    const [newPlan, setNewPlan] = useState<PlanTier>('PRO');
    const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [daysUsed, setDaysUsed] = useState<number>(15);
    const [daysInCycle, setDaysInCycle] = useState<number>(30);

    const [predictionData, setPredictionData] = useState<any>(null);
    const [isLoadingUsage, setIsLoadingUsage] = useState(false);

    const [simulation, setSimulation] = useState<{
        unusedValue: number;
        newPlanCost: number;
        totalDue: number;
        projectedOverage: number;
        action: 'CHARGE' | 'CREDIT' | 'NONE';
    } | null>(null);

    // Cargar datos de uso real al inicio
    useEffect(() => {
        const fetchUsage = async () => {
            setIsLoadingUsage(true);
            try {
                const res = await fetch('/api/admin/billing/prediction');
                const data = await res.json();
                if (data.success && data.prediction) {
                    setPredictionData(data.prediction);
                }
            } catch (error) {
                console.error('Error fetching usage prediction:', error);
            } finally {
                setIsLoadingUsage(false);
            }
        };
        fetchUsage();
    }, []);

    useEffect(() => {
        calculate()
    }, [currentPlan, newPlan, cycle, daysUsed, predictionData]);

    const calculate = () => {
        const currentPlanData = PLANS[currentPlan];
        const newPlanData = PLANS[newPlan];

        const currentPrice = cycle === 'monthly' ? currentPlanData.price_monthly : currentPlanData.price_yearly;
        const newPrice = cycle === 'monthly' ? newPlanData.price_monthly : newPlanData.price_yearly;

        // Credit for unused time on old plan
        const daysRemaining = Math.max(0, daysInCycle - daysUsed);
        const unusedRatio = daysRemaining / daysInCycle;
        const unusedValue = currentPrice * unusedRatio;

        const totalDue = newPrice - unusedValue;

        // Predict overage based on newPlan and real usage data
        const projectedOverage = predictionData?.comparisons?.[newPlan] || 0;

        setSimulation({
            unusedValue,
            newPlanCost: newPrice,
            totalDue,
            projectedOverage,
            action: totalDue > 0 ? 'CHARGE' : totalDue < 0 ? 'CREDIT' : 'NONE'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    {t('simulator.title')}
                </CardTitle>
                <CardDescription>
                    {t('simulator.description')}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Current State */}
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">{t('simulator.current_subscription')}</h4>

                        <div className="space-y-2">
                            <Label>{t('simulator.current_plan')}</Label>
                            <Select value={currentPlan} onValueChange={(v) => setCurrentPlan(v as PlanTier)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.values(PLANS).map(p => (
                                        <SelectItem key={p.tier} value={p.tier}>{p.name} ({p.price_monthly}€)</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>{t('simulator.days_used')}</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    min={0}
                                    max={365}
                                    value={daysUsed}
                                    onChange={(e) => setDaysUsed(parseInt(e.target.value) || 0)}
                                />
                                <span className="text-sm text-muted-foreground">{t('simulator.of_days', { total: daysInCycle })}</span>
                            </div>
                        </div>
                    </div>

                    {/* New State */}
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">{t('simulator.new_subscription')}</h4>

                        <div className="space-y-2">
                            <Label>{t('simulator.new_plan')}</Label>
                            <Select value={newPlan} onValueChange={(v) => setNewPlan(v as PlanTier)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.values(PLANS).map(p => (
                                        <SelectItem key={p.tier} value={p.tier}>{p.name} ({p.price_monthly}€)</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>{t('simulator.billing_cycle')}</Label>
                            <Select value={cycle} onValueChange={(v: 'monthly' | 'yearly') => {
                                setCycle(v);
                                setDaysInCycle(v === 'monthly' ? 30 : 365);
                            }}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="monthly">{t('simulator.monthly')}</SelectItem>
                                    <SelectItem value="yearly">{t('simulator.yearly')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Results with Predictive Data */}
                {simulation && (
                    <div className="mt-6 p-6 border rounded-xl bg-card shadow-sm space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{t('simulator.credit_unused', { plan: PLANS[currentPlan].name })}</span>
                            <span className="text-green-600 font-medium">-{formatCurrency(simulation.unusedValue)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{t('simulator.new_plan_cost', { plan: PLANS[newPlan].name })}</span>
                            <span className="font-medium">{formatCurrency(simulation.newPlanCost)}</span>
                        </div>

                        {/* Smart Usage Projection Overlay (Predictive Costing) */}
                        {predictionData && (
                            <div className="py-2.5 px-3.5 bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100/50 dark:border-indigo-800 rounded-2xl flex items-center justify-between transition-all hover:bg-indigo-50 dark:hover:bg-indigo-900/30">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-white dark:bg-indigo-950 shadow-sm">
                                        <Sparkles className="h-4 w-4 text-indigo-500 animate-pulse" />
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-tight">{t('simulator.usage_projection')}</div>
                                        <div className="text-[10px] text-indigo-600/70 dark:text-indigo-400/70">{t('simulator.based_on_tokens', { tokens: predictionData.usage.tokens.toLocaleString() })}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-indigo-700 dark:text-indigo-300">+{formatCurrency(simulation.projectedOverage)}</div>
                                    <div className="text-[9px] text-indigo-600/50 uppercase font-black">{t('simulator.estimated_ai')}</div>
                                </div>
                            </div>
                        )}

                        <Separator />

                        <div className="flex items-center justify-between pt-2">
                            <div>
                                <span className="font-bold text-lg">{t('simulator.total_now')}</span>
                                {simulation.projectedOverage > 0 && (
                                    <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight max-w-[220px]">
                                        {t('simulator.variable_note', { amount: formatCurrency(simulation.projectedOverage) })}
                                    </div>
                                )}
                            </div>
                            <div className="text-right">
                                <span className={`text-2xl font-bold ${simulation.totalDue > 0 ? '' : 'text-green-600'}`}>
                                    {formatCurrency(simulation.totalDue)}
                                </span>
                                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                                    {simulation.action === 'CHARGE' ? t('simulator.charge_immediate') : t('simulator.credit_account')}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {isLoadingUsage && (
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        {t('simulator.loading_usage')}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
