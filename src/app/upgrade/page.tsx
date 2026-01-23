"use client";

import { useState } from 'react';
import { Check, Zap, Rocket, Building2, ArrowRight, Loader2 } from 'lucide-react';
import { PLANS, PlanTier } from '@/lib/plans';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function UpgradePage() {
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
    const [loading, setLoading] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    const handleUpgrade = async (tier: PlanTier) => {
        if (tier === 'FREE') {
            toast({
                title: 'Ya estás en el plan Free',
                description: 'Selecciona Pro o Enterprise para actualizar.',
                variant: 'default',
            });
            return;
        }

        setLoading(tier);

        try {
            // Obtener el price_id según el tier y periodo
            const priceId = billingPeriod === 'monthly'
                ? tier === 'PRO'
                    ? process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY
                    : process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY
                : tier === 'PRO'
                    ? process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY
                    : process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_YEARLY;

            if (!priceId) {
                throw new Error('Price ID not configured');
            }

            const res = await fetch('/api/billing/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId, billingPeriod }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Error al crear sesión de pago');
            }

            // Redirigir a Stripe Checkout
            window.location.href = data.checkoutUrl;
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'No se pudo iniciar el proceso de pago.',
                variant: 'destructive',
            });
            setLoading(null);
        }
    };

    const getPlanIcon = (tier: PlanTier) => {
        switch (tier) {
            case 'FREE':
                return <Zap className="w-8 h-8" />;
            case 'PRO':
                return <Rocket className="w-8 h-8" />;
            case 'ENTERPRISE':
                return <Building2 className="w-8 h-8" />;
        }
    };

    const getPlanColor = (tier: PlanTier) => {
        switch (tier) {
            case 'FREE':
                return 'from-slate-500 to-slate-700';
            case 'PRO':
                return 'from-teal-500 to-teal-700';
            case 'ENTERPRISE':
                return 'from-purple-500 to-purple-700';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-20 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-black text-white mb-4 tracking-tight">
                        Elige tu <span className="text-teal-500">Plan</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        Escala tu plataforma RAG con los recursos que necesitas. Sin compromisos, cancela cuando quieras.
                    </p>

                    {/* Billing Period Toggle */}
                    <div className="mt-8 inline-flex items-center gap-4 bg-slate-800/50 p-2 rounded-xl border border-slate-700">
                        <button
                            onClick={() => setBillingPeriod('monthly')}
                            className={`px-6 py-2 rounded-lg font-semibold transition-all ${billingPeriod === 'monthly'
                                    ? 'bg-teal-600 text-white shadow-lg'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Mensual
                        </button>
                        <button
                            onClick={() => setBillingPeriod('yearly')}
                            className={`px-6 py-2 rounded-lg font-semibold transition-all relative ${billingPeriod === 'yearly'
                                    ? 'bg-teal-600 text-white shadow-lg'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Anual
                            <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                -17%
                            </span>
                        </button>
                    </div>
                </div>

                {/* Plans Grid */}
                <div className="grid md:grid-cols-3 gap-8">
                    {(Object.keys(PLANS) as PlanTier[]).map((tier) => {
                        const plan = PLANS[tier];
                        const price = billingPeriod === 'monthly' ? plan.price_monthly : plan.price_yearly;
                        const pricePerMonth = billingPeriod === 'yearly' ? price / 12 : price;
                        const isPopular = tier === 'PRO';

                        return (
                            <div
                                key={tier}
                                className={`relative bg-slate-900/50 backdrop-blur-xl rounded-2xl border ${isPopular ? 'border-teal-500 shadow-2xl shadow-teal-500/20' : 'border-slate-800'
                                    } p-8 hover:scale-105 transition-all duration-300`}
                            >
                                {isPopular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-teal-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                                        Más Popular
                                    </div>
                                )}

                                {/* Plan Icon */}
                                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${getPlanColor(tier)} text-white mb-6`}>
                                    {getPlanIcon(tier)}
                                </div>

                                {/* Plan Name */}
                                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>

                                {/* Price */}
                                <div className="mb-6">
                                    {price === 0 ? (
                                        <div className="text-4xl font-black text-white">Gratis</div>
                                    ) : (
                                        <>
                                            <div className="text-4xl font-black text-white">
                                                ${pricePerMonth.toFixed(0)}
                                                <span className="text-lg font-normal text-slate-400">/mes</span>
                                            </div>
                                            {billingPeriod === 'yearly' && (
                                                <div className="text-sm text-slate-500 mt-1">
                                                    Facturado ${price}/año
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Features */}
                                <ul className="space-y-3 mb-8">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-3 text-slate-300">
                                            <Check className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                                            <span className="text-sm">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* Limits Summary */}
                                <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                                    <div className="text-xs text-slate-400 space-y-1">
                                        <div>
                                            <strong className="text-white">
                                                {plan.limits.llm_tokens_per_month === Infinity
                                                    ? '∞'
                                                    : `${(plan.limits.llm_tokens_per_month / 1000).toLocaleString()}k`}
                                            </strong>{' '}
                                            tokens/mes
                                        </div>
                                        <div>
                                            <strong className="text-white">
                                                {plan.limits.storage_bytes === Infinity
                                                    ? '∞'
                                                    : `${Math.round(plan.limits.storage_bytes / (1024 * 1024 * 1024))}GB`}
                                            </strong>{' '}
                                            storage
                                        </div>
                                        <div>
                                            <strong className="text-white">
                                                {plan.limits.vector_searches_per_month === Infinity
                                                    ? '∞'
                                                    : plan.limits.vector_searches_per_month.toLocaleString()}
                                            </strong>{' '}
                                            búsquedas/mes
                                        </div>
                                    </div>
                                </div>

                                {/* CTA Button */}
                                <button
                                    onClick={() => handleUpgrade(tier)}
                                    disabled={loading === tier || tier === 'FREE'}
                                    className={`w-full py-3 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${tier === 'FREE'
                                            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                            : isPopular
                                                ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:shadow-lg hover:shadow-teal-500/50'
                                                : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700'
                                        }`}
                                >
                                    {loading === tier ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Procesando...
                                        </>
                                    ) : tier === 'FREE' ? (
                                        'Plan Actual'
                                    ) : (
                                        <>
                                            Actualizar a {plan.name}
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* FAQ Section */}
                <div className="mt-20 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">¿Tienes preguntas?</h2>
                    <p className="text-slate-400 mb-8">
                        Contáctanos en{' '}
                        <a href="mailto:support@abdrag.com" className="text-teal-500 hover:underline">
                            support@abdrag.com
                        </a>
                    </p>
                    <button
                        onClick={() => router.push('/admin/billing')}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        ← Volver al Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
