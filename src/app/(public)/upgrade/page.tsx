"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Zap, Rocket, Building2, ArrowRight, Loader2 } from 'lucide-react';
import { PLANS, PlanTier } from '@/lib/plans';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function UpgradePage() {
    const t = useTranslations('upgrade');
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
    const [loading, setLoading] = useState<string | null>(null);

    const router = useRouter();

    const handleUpgrade = async (tier: PlanTier) => {
        if (tier === 'FREE') {
            toast(t('toast_current'), {
                description: t('toast_current_desc'),
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
                throw new Error(t('error_price_missing'));
            }

            const res = await fetch('/api/billing/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId, billingPeriod }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || t('error_checkout'));
            }

            // Redirigir a Stripe Checkout
            window.location.href = data.checkoutUrl;
        } catch (error: any) {
            toast.error(t('error_title'), {
                description: error.message || t('error_checkout'),
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
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-20 px-4 font-outfit">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-black text-white mb-4 tracking-tight">
                        {t('title')} <span className="text-teal-500">{t('title_accent')}</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        {t('subtitle')}
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
                            {t('monthly')}
                        </button>
                        <button
                            onClick={() => setBillingPeriod('yearly')}
                            className={`px-6 py-2 rounded-lg font-semibold transition-all relative ${billingPeriod === 'yearly'
                                ? 'bg-teal-600 text-white shadow-lg'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            {t('yearly')}
                            <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                {t('discount')}
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
                                        {t('popular')}
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
                                        <div className="text-4xl font-black text-white">{t('free_plan')}</div>
                                    ) : (
                                        <>
                                            <div className="text-4xl font-black text-white">
                                                ${pricePerMonth.toFixed(0)}
                                                <span className="text-lg font-normal text-slate-400">{t('per_month')}</span>
                                            </div>
                                            {billingPeriod === 'yearly' && (
                                                <div className="text-sm text-slate-500 mt-1">
                                                    {t('billed_yearly', { price })}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Features */}
                                <ul className="space-y-3 mb-8">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-3 text-slate-300">
                                            <Check className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
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
                                            {t('tokens')}
                                        </div>
                                        <div>
                                            <strong className="text-white">
                                                {plan.limits.storage_bytes === Infinity
                                                    ? '∞'
                                                    : `${Math.round(plan.limits.storage_bytes / (1024 * 1024 * 1024))}GB`}
                                            </strong>{' '}
                                            {t('storage')}
                                        </div>
                                        <div>
                                            <strong className="text-white">
                                                {plan.limits.vector_searches_per_month === Infinity
                                                    ? '∞'
                                                    : plan.limits.vector_searches_per_month.toLocaleString()}
                                            </strong>{' '}
                                            {t('searches')}
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
                                            {t('updating')}
                                        </>
                                    ) : tier === 'FREE' ? (
                                        t('current_plan')
                                    ) : (
                                        <>
                                            {t('upgrade_btn', { name: plan.name })}
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
                    <h2 className="text-3xl font-bold text-white mb-4">{t('faq_title')}</h2>
                    <p className="text-slate-400 mb-8">
                        {t('faq_desc')}{' '}
                        <a href="mailto:support@abdrag.com" className="text-teal-500 hover:underline">
                            support@abdrag.com
                        </a>
                    </p>
                    <button
                        onClick={() => router.push('/admin/billing')}
                        className="text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto"
                    >
                        <ArrowRight className="w-4 h-4 rotate-180" />
                        {t('back_dashboard')}
                    </button>
                </div>
            </div>
        </div>
    );
}
