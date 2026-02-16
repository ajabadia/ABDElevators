'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PLANS, PlanTier, getPlanForTenant } from '@/lib/plans';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, Calculator } from 'lucide-react';

export default function PriceSimulator() {
    const t = useTranslations('admin.billing');
    const [currentPlan, setCurrentPlan] = useState<PlanTier>('FREE');
    const [newPlan, setNewPlan] = useState<PlanTier>('PRO');
    const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [daysUsed, setDaysUsed] = useState<number>(15);
    const [daysInCycle, setDaysInCycle] = useState<number>(30);

    const [simulation, setSimulation] = useState<{
        unusedValue: number;
        newPlanCost: number;
        totalDue: number;
        action: 'CHARGE' | 'CREDIT' | 'NONE';
    } | null>(null);

    useEffect(() => {
        calculate()
    }, [currentPlan, newPlan, cycle, daysUsed]);

    const calculate = () => {
        const currentPlanData = PLANS[currentPlan];
        const newPlanData = PLANS[newPlan];

        const currentPrice = cycle === 'monthly' ? currentPlanData.price_monthly : currentPlanData.price_yearly;
        const newPrice = cycle === 'monthly' ? newPlanData.price_monthly : newPlanData.price_yearly;

        // Credit for unused time on old plan
        const daysRemaining = Math.max(0, daysInCycle - daysUsed);
        const unusedRatio = daysRemaining / daysInCycle;
        const unusedValue = currentPrice * unusedRatio;

        // Charge for new plan (full cycle usually starts now, but stripes logic might differ. 
        // Simplified: We charge full new cycle minus credit)
        // OR: Pro-rata upgrade for remainder of cycle? 
        // Stripe default: Charge new plan immediately, subtract unused time credit.

        // Let's implement immediate switch logic:
        // Credit: Unused time on Old Plan
        // Debit: Full price of New Plan (starting today)
        // Total Due: Debit - Credit

        const totalDue = newPrice - unusedValue;

        setSimulation({
            unusedValue,
            newPlanCost: newPrice,
            totalDue,
            action: totalDue > 0 ? 'CHARGE' : totalDue < 0 ? 'CREDIT' : 'NONE'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    {t('simulator.title', { fallback: 'Upgrade/Downgrade Simulator' })}
                </CardTitle>
                <CardDescription>
                    {t('simulator.description', { fallback: 'Calculate pro-rata costs before changing subscription plans.' })}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Current State */}
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Current Subscription</h4>

                        <div className="space-y-2">
                            <Label>Current Plan</Label>
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
                            <Label>Days Used in Cycle</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    min={0}
                                    max={365}
                                    value={daysUsed}
                                    onChange={(e) => setDaysUsed(parseInt(e.target.value) || 0)}
                                />
                                <span className="text-sm text-muted-foreground">of {daysInCycle} days</span>
                            </div>
                        </div>
                    </div>

                    {/* New State */}
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Target Subscription</h4>

                        <div className="space-y-2">
                            <Label>New Plan</Label>
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
                            <Label>Billing Cycle</Label>
                            <Select value={cycle} onValueChange={(v: 'monthly' | 'yearly') => {
                                setCycle(v);
                                setDaysInCycle(v === 'monthly' ? 30 : 365);
                            }}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="yearly">Yearly (-17%)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Results */}
                {simulation && (
                    <div className="mt-6 p-6 border rounded-xl bg-card shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Unused Time Credit ({PLANS[currentPlan].name}):</span>
                            <span className="text-green-600 font-medium">-{formatCurrency(simulation.unusedValue)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">New Plan Cost ({PLANS[newPlan].name}):</span>
                            <span className="font-medium">{formatCurrency(simulation.newPlanCost)}</span>
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between pt-2">
                            <span className="font-bold text-lg">Total Due Now:</span>
                            <div className="text-right">
                                <span className={`text-2xl font-bold ${simulation.totalDue > 0 ? '' : 'text-green-600'}`}>
                                    {formatCurrency(simulation.totalDue)}
                                </span>
                                <div className="text-xs text-muted-foreground">
                                    {simulation.action === 'CHARGE' ? 'Immediate charge' : 'Account credit'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
