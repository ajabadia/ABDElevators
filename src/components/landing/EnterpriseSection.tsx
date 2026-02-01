"use client";

import { Shield, Lock, FileCheck, Building2, Server, Globe } from "lucide-react";
import { useTranslations } from 'next-intl';

export function EnterpriseSection() {
    const t = useTranslations('enterprise');

    const features = [
        {
            icon: <Building2 className="w-6 h-6 text-teal-400" />,
            title: t('f1_title'),
            desc: t('f1_desc')
        },
        {
            icon: <Lock className="w-6 h-6 text-teal-400" />,
            title: t('f2_title'),
            desc: t('f2_desc')
        },
        {
            icon: <FileCheck className="w-6 h-6 text-teal-400" />,
            title: t('f3_title'),
            desc: t('f3_desc')
        },
        {
            icon: <Globe className="w-6 h-6 text-teal-400" />,
            title: t('f4_title'),
            desc: t('f4_desc')
        }
    ];

    return (
        <section className="py-24 md:py-32 bg-slate-950 relative overflow-hidden">
            {/* Background patterns */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/10 via-slate-950 to-slate-950" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="max-w-3xl mx-auto text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-outfit">
                        {t('title')}
                    </h2>
                    <p className="text-xl text-slate-400">
                        {t('subtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, idx) => (
                        <div
                            key={idx}
                            className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-teal-500/30 transition-all hover:-translate-y-1 group"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center mb-6 group-hover:bg-teal-500/20 transition-colors">
                                {feature.icon}
                            </div>
                            <h3 className="text-lg font-bold text-white mb-3">
                                {feature.title}
                            </h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                {feature.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
