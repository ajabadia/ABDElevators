"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from 'next-intl';
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";

interface Plan {
    id: string;
    name: string;
    price: number;
    currency: string;
    features: string[];
    popular?: boolean;
    description?: string;
}

export function PricingSection() {
    const t = useTranslations('pricing');
    const [isAnnual, setIsAnnual] = useState(false);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);

    // Simulación de fetch a /api/pricing/plans
    // En producción esto haría fetch real. Simulamos planes por defecto si falla o para mostrar UI.
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                // Fake data for demo purposes if API not ready
                const demoPlans: Plan[] = [
                    {
                        id: "starter",
                        name: "Standard", // T keys: plan_starter
                        price: 49,
                        currency: "€",
                        features: ["1,000 queries/mo", "5 GB Storage", "Basic Support"],
                        description: "Para pequeños equipos"
                    },
                    {
                        id: "pro",
                        name: "Pro", // T keys: plan_pro
                        price: 99,
                        currency: "€",
                        features: ["10,000 queries/mo", "50 GB Storage", "Priority Support", "API Access"],
                        popular: true,
                        description: "Para empresas en crecimiento"
                    },
                    {
                        id: "enterprise",
                        name: "Enterprise",
                        price: 299,
                        currency: "€",
                        features: ["Unlimited queries", "1 TB Storage", "Dedicated Success Manager", "SLA 99.9%"],
                        description: "Para grandes corporaciones"
                    }
                ];

                // Try fetch
                // const res = await fetch('/api/pricing/plans');
                // if (res.ok) { const data = await res.json(); setPlans(data); } else { setPlans(demoPlans); }
                setPlans(demoPlans);
            } catch (e) {
                console.error("Failed to fetch plans", e);
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    return (
        <section id="pricing" className="py-24 md:py-32 relative">
            {/* Background subtle */}
            <div className="absolute inset-0 bg-slate-950" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold font-outfit text-white mb-6">
                        {t('title')}
                    </h2>
                    <p className="text-lg text-slate-400">
                        {t('subtitle')}
                    </p>

                    <div className="flex items-center justify-center gap-4 mt-8">
                        <span className={`text-sm font-medium ${!isAnnual ? 'text-white' : 'text-slate-500'}`}>{t('monthly')}</span>
                        <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
                        <span className={`text-sm font-medium ${isAnnual ? 'text-white' : 'text-slate-500'}`}>
                            {t('annually')}
                            <span className="ml-2 text-teal-400 text-xs">({t('save')})</span>
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <Card
                            key={plan.id}
                            className={`relative p-8 rounded-3xl bg-white/5 border-white/10 backdrop-blur-sm transition-all hover:translate-y-[-4px] flex flex-col ${plan.popular ? 'border-teal-500/50 shadow-2xl shadow-teal-900/20' : ''}`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <Badge className="bg-teal-500 text-white border-0 px-4 py-1 rounded-full uppercase text-[10px] tracking-widest font-bold">
                                        {t('popular')}
                                    </Badge>
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                                <p className="text-sm text-slate-400 h-10">{plan.description}</p>
                            </div>

                            <div className="mb-8 p-4 bg-slate-950/30 rounded-2xl text-center border border-white/5">
                                <span className="text-4xl font-bold text-white">
                                    {plan.currency}{isAnnual ? Math.floor(plan.price * 0.8) : plan.price}
                                </span>
                                <span className="text-slate-500 text-sm">{t('per_month')}</span>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{t('features_title')}</li>
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-300 text-sm">
                                        <Check className="w-5 h-5 text-teal-400 shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <Button className={`w-full h-12 rounded-xl font-bold ${plan.popular ? 'bg-teal-600 hover:bg-teal-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
                                {plan.popular ? t('cta_trial') : t('cta_contact')}
                            </Button>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
