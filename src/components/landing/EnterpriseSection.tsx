"use client";

import { Shield, Lock, FileCheck, Building2, Server, Globe } from "lucide-react";
import { useTranslations } from 'next-intl';
import { useState } from "react";
import { FeatureDetailDialog } from "./FeatureDetailDialog";

export function EnterpriseSection() {
    const t = useTranslations('enterprise');
    const [detailKey, setDetailKey] = useState<string | null>(null);

    const features = [
        {
            id: 'privacy_security',
            icon: <Building2 className="w-6 h-6 text-teal-400" />,
            title: t('f1_title'),
            desc: t('f1_desc')
        },
        {
            id: 'privacy_security',
            icon: <Lock className="w-6 h-6 text-teal-400" />,
            title: t('f2_title'),
            desc: t('f2_desc')
        },
        {
            id: 'conversational_search', // Quality evaluation maps to RAG tech
            icon: <FileCheck className="w-6 h-6 text-teal-400" />,
            title: t('f3_title'),
            desc: t('f3_desc')
        },
        {
            id: 'privacy_security', // Compliance/GDPR maps to privacy
            icon: <Globe className="w-6 h-6 text-teal-400" />,
            title: t('f4_title'),
            desc: t('f4_desc')
        }
    ];

    return (
        <section id="seguridad" className="py-24 md:py-40 relative">
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
                            onClick={() => setDetailKey(feature.id)}
                            className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-teal-500/30 transition-all hover:-translate-y-1 group cursor-pointer"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center mb-6 group-hover:bg-teal-500/20 transition-colors">
                                {feature.icon}
                            </div>
                            <h3 className="text-lg font-bold text-white mb-3 tracking-tight">
                                {feature.title}
                            </h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                {feature.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <FeatureDetailDialog
                isOpen={!!detailKey}
                onOpenChange={(open) => !open && setDetailKey(null)}
                featureKey={detailKey || ""}
            />
        </section>
    );
}
